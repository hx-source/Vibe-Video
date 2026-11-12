import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {envelopeGain} from '../src/audio/content.mjs';
import {compileAudioPlan,musicDuckGain} from '../src/audio/plan.mjs';
import {inside,sha,writeJson} from './files.mjs';
import {pcmWave} from './pcm.mjs';

export function buildArrangement(project,ffmpeg,options={}) {
  const {config,dir}=project;
  const plan=compileAudioPlan(project.audioPlan,config),rate=plan.sampleRate,n=Math.round(plan.duration*rate);
  const mix=new Float64Array(n*2),inputs=[],output=options.directory?path.join(options.directory,'mix.wav'):inside(dir,config.audio.mix);
  const roleMixes=new Map();
  function roleMix(role){if(!roleMixes.has(role))roleMixes.set(role,new Float64Array(n*2));return roleMixes.get(role);}
  for(const p of plan.clips) {
    const input=inside(dir,p.source);if(input.toLowerCase()===output.toLowerCase())throw Error('Mix cannot overwrite its source');
    const length=Math.round(p.duration*rate),offset=Math.round(p.at*rate);
    const decode=['-v','error','-i',input,'-af',`aresample=${rate},atrim=start_sample=${Math.round(p.sourceIn*rate)}:end_sample=${Math.round(p.sourceOut*rate)},asetpts=PTS-STARTPTS`,'-ar',String(rate),'-ac','2','-f','f32le','pipe:1'];
    const src=spawnSync(ffmpeg,decode,{maxBuffer:Math.ceil((p.sourceOut-p.sourceIn+1)*rate*8),windowsHide:true});
    if(src.status!==0)throw Error(src.error?.message||src.stderr.toString());
    const missing=Math.max(0,(p.sourceOut-p.sourceIn)-src.stdout.length/(rate*8));
    if(missing>p.maxTailPadding+1/rate)throw Error(`Clip ${p.id}: source is ${missing.toFixed(6)}s short; choose another range or explicit maxTailPadding`);
    // Local musical tempo belongs to the clip, never to the picture timeline.
    // New plans at speed 1 keep exact transients; old plans retain their previous filter.
    const tempoFilter=plan.schemaVersion===2&&p.speed===1?'':`atempo=${p.speed},`;
    const tempo=spawnSync(ffmpeg,['-v','error','-f','f32le','-ar',String(rate),'-ac','2','-i','pipe:0','-af',`${tempoFilter}apad,atrim=end_sample=${length}`,'-f','f32le','pipe:1'],{input:src.stdout,maxBuffer:(length+rate)*8,windowsHide:true});
    if(tempo.status!==0)throw Error(tempo.error?.message||tempo.stderr.toString());
    const bus=plan.schemaVersion===2?roleMix(p.role):null;
    for(let i=0;i<length&&offset+i<n;i++){
      const t=i/rate,fade=Math.min(1,p.fadeIn?t/p.fadeIn:1,p.fadeOut?(p.duration-t)/p.fadeOut:1);
      let gain=p.gain*fade*envelopeGain(p.envelope,t);
      if(bus)gain*=plan.buses[p.role]*(p.role==='music'?musicDuckGain(plan.ducking,(offset+i)/rate):1);
      for(let ch=0;ch<2;ch++){const j=(i*2+ch)*4,index=(offset+i)*2+ch,value=(j+4<=tempo.stdout.length?tempo.stdout.readFloatLE(j):0)*gain;mix[index]+=value;if(bus)bus[index]+=value;}
    }
    inputs.push({id:p.id,source:p.source,sha256:sha(input),sourceIn:p.sourceIn,sourceOut:p.sourceOut,at:p.at,duration:p.duration,speed:p.speed,sourceTailPadding:missing,...(p.role?{role:p.role,purpose:p.purpose,musicFit:p.musicFit}:{})});
  }
  for(const cue of plan.cues) {
    const offset=Math.round(cue.at*rate),length=Math.round(cue.duration*rate);
    const bus=plan.schemaVersion===2?roleMix(cue.role):null;
    for(let i=0;i<length&&offset+i<n;i++){
      const t=i/rate,attack=Math.min(1,t/.005),release=Math.min(1,(cue.duration-t)/.02);
      // Integrated exponential pitch sweep makes a short, deterministic downbeat.
      const phase=cue.kind==='kick'?2*Math.PI*cue.frequency*(t+3*.035*(1-Math.exp(-t/.035))):2*Math.PI*cue.frequency*t;
      let value=cue.gain*Math.sin(phase)*attack*release*Math.exp(-t/(cue.duration/(cue.kind==='kick'?5:3)));
      if(bus)value*=plan.buses[cue.role]*(cue.role==='music'?musicDuckGain(plan.ducking,(offset+i)/rate):1);
      mix[(offset+i)*2]+=value;mix[(offset+i)*2+1]+=value;
      if(bus){bus[(offset+i)*2]+=value;bus[(offset+i)*2+1]+=value;}
    }
  }
  const encoded=pcmWave(mix,rate,plan.masterGain);
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,encoded.buffer);
  const out=options.directory||path.join(dir,'output');fs.mkdirSync(out,{recursive:true});
  const roles={},stems={};
  if(plan.schemaVersion===2){
    const effects=new Float64Array(n*2);
    for(const [role,samples] of roleMixes){
      const data=pcmWave(samples,rate,plan.masterGain);
      roles[role]={peakDb:data.peakDb,rmsDb:data.rmsDb,gain:plan.buses[role]};
      if(role!=='music')for(let i=0;i<samples.length;i++)effects[i]+=samples[i];
      if(options.stems){const file=`${role}.wav`;fs.writeFileSync(path.join(out,file),data.buffer);stems[role]=file;}
    }
    if(options.stems){
      if(!stems.music){fs.writeFileSync(path.join(out,'music.wav'),pcmWave(new Float64Array(n*2),rate).buffer);stems.music='music.wav';}
      fs.writeFileSync(path.join(out,'effects.wav'),pcmWave(effects,rate,plan.masterGain).buffer);stems.effects='effects.wav';
    }
  }
  const warnings=[...(plan.warnings||[])];
  if(encoded.peakDb!==null&&encoded.peakDb>-1)warnings.push({code:'low-headroom',message:'Peak is above -1 dBFS; review encoder headroom.'});
  const report={mode:'content-arrangement',contentDuration:plan.duration,samples:n,sampleRate:rate,peakDb:encoded.peakDb,clippedSamples:0,inputs,plan,mixSha256:sha(output),...(plan.schemaVersion===2?{rmsDb:encoded.rmsDb,roles,stems,warnings,reviewStatus:'needs-listening'}:{})};
  writeJson(path.join(out,'audio-report.json'),report);return report;
}

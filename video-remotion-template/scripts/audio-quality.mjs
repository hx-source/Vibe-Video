import {spawnSync} from 'node:child_process';
export function measureLoudness(file,ffmpeg){
  const result=spawnSync(ffmpeg,['-hide_banner','-nostats','-i',file,'-af','loudnorm=I=-16:TP=-1:LRA=11:print_format=json','-f','null','-'],{encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});
  if(result.status!==0)throw Error(result.error?.message||result.stderr||'Loudness measurement failed');
  const blocks=[...result.stderr.matchAll(/\{[\s\S]*?"input_i"[\s\S]*?\}/g)];if(!blocks.length)throw Error('FFmpeg did not return loudness measurements');
  const d=JSON.parse(blocks.at(-1)[0]),number=v=>Number.isFinite(Number(v))?Number(v):null;
  return {integratedLufs:number(d.input_i),truePeakDb:number(d.input_tp),loudnessRangeLu:number(d.input_lra),thresholdLufs:number(d.input_thresh),method:'ffmpeg-loudnorm-input',silent:d.input_i==='-inf'};
}
export function relativeEffectLevels(plan,music,effects,rate){
  const rms=(samples,from,to)=>{let sum=0,n=0;for(let i=Math.max(0,Math.floor(from*rate)*2);i<Math.min(samples.length,Math.ceil(to*rate)*2);i++){sum+=samples[i]**2;n++;}return sum&&n?10*Math.log10(sum/n):null;};
  return [...plan.clips,...plan.cues].filter(c=>c.role!=='music').map(c=>{const from=c.at,to=Math.min(plan.duration,c.at+c.duration,.6+c.at),musicDb=rms(music,from,to),effectsDb=rms(effects,from,to);return {id:c.id,from,to,filmDuration:plan.duration,musicRmsDb:musicDb,effectsRmsDb:effectsDb,relativeDb:musicDb!==null&&effectsDb!==null?effectsDb-musicDb:null,measurement:'combined-effects-in-event-window'};});
}
export function qualityAssessment(measurements,levels,policy={}){
  const p={targetLufs:-16,lufsTolerance:3,maxTruePeakDb:-1,minEffectRelativeDb:-18,maxEffectRelativeDb:6,duckGain:.65,...policy};
  if(!Object.values(p).every(Number.isFinite)||p.lufsTolerance<0||p.duckGain<0||p.duckGain>1||p.minEffectRelativeDb>p.maxEffectRelativeDb)throw Error('Invalid audio quality policy');
  const warnings=[];
  if(measurements.integratedLufs!==null&&Math.abs(measurements.integratedLufs-p.targetLufs)>p.lufsTolerance)warnings.push({code:'loudness-target',actual:measurements.integratedLufs,target:p.targetLufs});
  if(measurements.truePeakDb!==null&&measurements.truePeakDb>p.maxTruePeakDb)warnings.push({code:'true-peak-headroom',actual:measurements.truePeakDb,limit:p.maxTruePeakDb});
  for(const e of levels){if(e.effectsRmsDb===null)warnings.push({code:'silent-effect-window',id:e.id});if(e.relativeDb!==null&&e.relativeDb<p.minEffectRelativeDb)warnings.push({code:'effect-masking-candidate',id:e.id,relativeDb:e.relativeDb});if(e.relativeDb!==null&&e.relativeDb>p.maxEffectRelativeDb)warnings.push({code:'effect-dominance-candidate',id:e.id,relativeDb:e.relativeDb});}
  const duckingCandidates=levels.filter(e=>e.relativeDb!==null&&e.relativeDb<p.minEffectRelativeDb).map(e=>{const remaining=(e.filmDuration??e.to+.15)-e.from,release=Math.max(.001,Math.min(.15,remaining/2)),hold=Math.max(0,Math.min(e.to-e.from,remaining-release));return {id:`suggested-duck-${e.id.replace(/[^a-z0-9-]/gi,'-')}`,at:e.from,attack:.05,hold,release,gain:p.duckGain,status:'candidate-not-applied'};});
  return {policy:p,measurements,eventLevels:levels,warnings,duckingCandidates,reviewStatus:'needs-listening'};
}

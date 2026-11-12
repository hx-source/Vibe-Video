import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {compileAudioPlan,musicDuckGain} from '../src/audio/plan.mjs';
import {buildArrangement} from '../scripts/arrange-audio.mjs';
import {waveSlice} from '../scripts/pcm.mjs';
import {loadProject} from '../scripts/project.mjs';
const config={video:{duration:3},timeline:{events:{land:1}},audio:{mix:'mix.wav'}};
const plan=()=>({schemaVersion:2,sampleRate:44100,masterGain:.8,clips:[],cues:[],ducking:[]});
const cue=(id,role,at,duration=.3)=>({id,role,at,duration,kind:'tone',frequency:440,gain:.1,purpose:'Represent content change',musicFit:'Technical candidate'});
test('process sounds are opt-in and enabled effects require purpose',()=>{
 const a=plan();a.cues=[cue('motion','process',0),cue('end','end',1)];assert.equal(compileAudioPlan(a,config).cues.length,1);
 a.cues[0].enabled=true;a.cues[0].purpose='';assert.throws(()=>compileAudioPlan(a,config),/purpose/);
});
test('ducking overlaps use the strongest reduction, with smooth attack and release',()=>{
 const a=plan();a.ducking=[{id:'a',at:1,attack:.5,hold:.2,release:.5,gain:.6},{id:'b',at:1,attack:.5,hold:.2,release:.5,gain:.7}];
 const d=compileAudioPlan(a,config).ducking;assert.equal(musicDuckGain(d,1),.6);assert.ok(Math.abs(musicDuckGain(d,.75)-.8)<1e-9);assert.equal(musicDuckGain(d,2),1);
});
test('same role can use different sounds; warnings do not imply aesthetic approval',()=>{
 const a=plan();a.reviewPolicy={maxConcurrentEffects:1,maxProcessSeconds:1};a.cues=[cue('a','end',1,.9),{...cue('b','end',1,.5),frequency:660,musicFit:''}];
 const result=compileAudioPlan(a,config);assert.notEqual(result.cues[0].frequency,result.cues[1].frequency);
 assert.ok(result.warnings.some(w=>w.code==='music-fit-unreviewed'));assert.ok(result.warnings.some(w=>w.code==='dense-effects'));
});
test('only enabled audio items contribute referenced assets',()=>{
 const p=loadProject('audio-demo');assert.equal(p.used.size,1);assert.ok(p.compiledAudio.disabled.some(c=>c.id==='optional-process'));
});
test('real PCM stems sum to mix and a slice retains a cue tail crossing its start',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'knowledge-audio-'));
 try{
  const a=plan();a.cues=[cue('bed','music',0,3),cue('tail','end',.8,.5)];
  const report=buildArrangement({dir,config,audioPlan:a},'unused-no-clips',{directory:dir,stems:true});
  const mix=fs.readFileSync(path.join(dir,'mix.wav')),music=fs.readFileSync(path.join(dir,'music.wav')),effects=fs.readFileSync(path.join(dir,'effects.wav'));
  assert.equal(mix.length,44+3*44100*4);assert.equal(report.reviewStatus,'needs-listening');
  for(let i=44;i<mix.length;i+=2)assert.ok(Math.abs(mix.readInt16LE(i)-music.readInt16LE(i)-effects.readInt16LE(i))<=1);
  const slice=waveSlice(effects,1,1.4);assert.ok(slice.subarray(44,44+44100*.2*4).some(x=>x!==0));assert.ok(slice.subarray(44+Math.round(44100*.3)*4).every(x=>x===0));
 }finally{assert.equal(path.dirname(fs.realpathSync(dir)),fs.realpathSync(os.tmpdir()));assert.ok(path.basename(dir).startsWith('knowledge-audio-'));fs.rmSync(dir,{recursive:true,force:true});}
});

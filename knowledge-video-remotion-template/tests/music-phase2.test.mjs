import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeSamples,beatGrid} from '../scripts/music.mjs';
import {rhythmFeatures,tonalFeatures,soundFeatures} from '../scripts/music-features.mjs';
import {editBeats,editorImpact} from '../scripts/music-edit.mjs';
import {impactReport,proposeSnapshot,segmentFingerprints,resolveSnapshot,reviewStates} from '../scripts/music-impact.mjs';
import {validateSoundMetadata,recommendSounds} from '../scripts/music-sounds.mjs';
import {qualityAssessment,relativeEffectLevels} from '../scripts/audio-quality.mjs';
import {loadProject} from '../scripts/project.mjs';

function pulseTrack(times,duration=18,weak=false){const rate=8000,samples=new Float32Array(duration*rate);for(let n=0;n<times.length;n++)for(let j=0;j<180;j++){const index=Math.round(times[n]*rate)+j;if(index<samples.length)samples[index]+=(weak?.015:.4)*(n%3===0?1:.5)*Math.exp(-j/30)*Math.cos(j*.4);}return samples;}
test('local tracking covers ramped tempo, pause/re-entry, weak pulses and meter candidates',()=>{
 const times=[];for(let t=.2;t<18;){if(t<7||t>9)times.push(t);t+=60/(100+t*3);}
 const samples=pulseTrack(times),base=analyzeSamples(samples),features=rhythmFeatures(samples,8000,base);
 assert.equal(features.localTempo.length,6);assert.ok(features.pauses.some(p=>p.from<8&&p.to>8));assert.ok(features.adaptiveBeats.every((t,i,a)=>!i||t>a[i-1]));
 assert.ok(features.drift.some(w=>w.requiresReview));assert.deepEqual(features.meterCandidates.map(c=>c.beatsPerBar).sort(),[3,4]);
 const errors=features.adaptiveBeats.filter(t=>t<7||t>9).map(t=>Math.min(...times.map(x=>Math.abs(x-t))));assert.ok(errors.reduce((a,b)=>a+b,0)/errors.length<.02);assert.ok(!features.adaptiveBeats.some(t=>t>7.2&&t<9));
 const weak=pulseTrack(Array.from({length:30},(_,i)=>.2+i*.55),18,true);assert.ok(rhythmFeatures(weak,8000,analyzeSamples(weak)).localTempo.length);
 const triple=pulseTrack(Array.from({length:23},(_,i)=>.2+i*.5),12);assert.equal(rhythmFeatures(triple,8000,analyzeSamples(triple)).meterCandidates[0].beatsPerBar,3);
});
test('tonality can return uncertain; tonal windows and sound attack are explicit candidates',()=>{
 const silence=new Float32Array(8000*4);assert.equal(tonalFeatures(silence,8000).overall.status,'uncertain');
 const tonal=Float32Array.from({length:8000*10},(_,i)=>.1*Math.sin(2*Math.PI*261.625*i/8000)+.07*Math.sin(2*Math.PI*329.628*i/8000)+.05*Math.sin(2*Math.PI*391.995*i/8000));
 const result=tonalFeatures(tonal,8000);assert.equal(result.windows.length,2);assert.equal(result.overall.candidates.length,3);assert.ok(result.overall.candidates.some(k=>k.tonic==='C'));
 const hit=new Float32Array(8000);for(let i=800;i<3000;i++)hit[i]=.3*Math.sin(2*Math.PI*440*i/8000)*Math.exp(-(i-800)/400);const sound=soundFeatures(hit,8000);assert.ok(sound.attackSeconds>=.1&&sound.attackSeconds<.12);assert.equal(sound.instrument.status,'requires-label');
});
test('local edit preserves earlier beats and rejects overlap/boundary mistakes',()=>{
 const original=[.2,.7,1.2,1.7,2.2,2.7];assert.deepEqual(editBeats(original,{type:'shift-range',from:1,to:2,offset:.05},3).slice(0,2),original.slice(0,2));
 const region=editBeats(original,{type:'tempo-range',from:1,to:2,bpm:120},3);assert.deepEqual(region,[.2,.7,1,1.5,2.2,2.7]);
 assert.throws(()=>beatGrid({duration:3,bpm:120,beats:original,beatsPerBar:4,downbeatPhase:0},{sections:[{label:'bad',from:2,to:1}]}),/sections/);
 assert.throws(()=>editBeats(original,{type:'move',index:1,time:.2},3),/overlap/);assert.throws(()=>editBeats(original,{type:'add',time:3},3),/outside/);
 assert.equal(editBeats(original,{type:'move',index:0,time:.218,snap:true},3,30)[0],7/30);
 const impact=editorImpact(original,region,[{event:'second.hit',beat:2}],{at:0,sourceIn:0,sourceOut:3,speed:1},30);assert.equal(impact[0].segment,'second');
});
function fixture(){
 const loaded=loadProject('starter-demo'),project=structuredClone(loaded.project);project.id='phase-two';
 const analysis={source:{assetId:'bed',sha256:'abc'},duration:12,bpm:120,beats:Array.from({length:24},(_,i)=>i*.5),beatsPerBar:4,downbeatPhase:0};const grid=beatGrid(analysis);
 const storyboard={segments:[{id:'first',durationSeconds:6,sceneType:'cards',events:{hit:1,end:6},props:{title:'First',cards:[{title:'a',body:'b',event:'hit'}]}},{id:'second',durationSeconds:6,sceneType:'cards',events:{hit:1,end:6},props:{title:'Second',cards:[{title:'c',body:'d',event:'hit'}]}}]};
 const captions={items:[{id:'cap',segmentId:'second',start:{event:'hit'},end:4,text:'一段需要足够阅读时间的字幕'}]};
 const audioPlan={schemaVersion:2,sampleRate:44100,masterGain:.7,clips:[{id:'bed',role:'music',source:'asset:bed',sourceIn:0,sourceOut:12,at:0,speed:1,gain:.3}],cues:[{id:'ding',role:'accent',at:{event:'second.hit'},duration:.2,frequency:784,kind:'tone',gain:.1,purpose:'hit',musicFit:'fixture'}],rhythms:[],ducking:[]};
 const sync={schemaVersion:1,music:{clipId:'bed',sourceIn:0,sourceOut:12,at:0,speed:1},actions:[{event:'second.hit',beat:14,landmark:'impact',soundId:'ding',revision:grid.revision}]};
 return {schemaVersion:1,project,storyboard,captions,audioPlan,sync,analysis,overrides:{},assets:{bed:{sha256:'abc'}},theme:loaded.theme,sceneSources:{}};
}
test('impact identifies affected segment, caption and effect while preserving approved earlier segment',()=>{
 const before=fixture(),grid=before.analysis.beats,after=proposeSnapshot(before,{overrides:{beats:grid.map((t,i)=>i===14?t+.1:t)}});
 const fps=segmentFingerprints(before),ledger={records:fps.map(s=>({segmentId:s.id,state:'approved',fingerprint:s.fingerprint}))};
 const report=impactReport(before,after,ledger);assert.equal(report.canApply,true);assert.equal(report.segments[0].changed,false);assert.equal(report.segments[0].requiresReopen,false);assert.equal(report.segments[1].requiresReopen,true);assert.equal(report.captions.length,1);assert.equal(report.effects.length,1);
 assert.deepEqual(reviewStates(after,ledger).map(s=>s.state),['approved','needs-review']);
 const trimmed=proposeSnapshot(before,{music:{sourceIn:.5,sourceOut:11.5}});assert.ok(impactReport(before,trimmed).events.some(e=>e.delta===-.5));
 const removed=proposeSnapshot(before,{captions:{items:[]},audioPlan:{...before.audioPlan,cues:[]},actions:[{...before.sync.actions[0],key:false}]});const deletion=impactReport(before,removed);assert.equal(deletion.captions[0].removed,true);assert.equal(deletion.effects[0].removed,true);
 const invalid=proposeSnapshot(before,{overrides:{beats:[0,.5]}});assert.equal(impactReport(before,invalid).canApply,false);
 const wrongSource=proposeSnapshot(before,{analysis:{...before.analysis,source:{assetId:'bed',sha256:'changed'}}});assert.equal(impactReport(before,wrongSource).canApply,false);
 const louder=proposeSnapshot(before,{audioPlan:{...before.audioPlan,cues:before.audioPlan.cues.map(c=>({...c,gain:.2}))}});assert.equal(impactReport(before,louder).effects.length,1);
 const missing=proposeSnapshot(before,{audioPlan:{...before.audioPlan,clips:[...before.audioPlan.clips,{id:'missing-effect',role:'accent',source:'asset:missing',sourceIn:0,sourceOut:.2,at:7,gain:.1,purpose:'test',musicFit:'test'}]}});assert.equal(impactReport(before,missing).canApply,false);
 const reopenedLedger={records:[...ledger.records,{segmentId:'second',fingerprint:segmentFingerprints(after)[1].fingerprint,state:'pending',reopened:true}]};
 const again=proposeSnapshot(after,{overrides:{beats:grid.map((t,i)=>i===14?t+.2:t)}}),second=impactReport(after,again,reopenedLedger).segments[1];assert.equal(second.reviewState,'needs-review');assert.equal(second.requiresReopen,false);
});
test('sound recommendation uses registered metadata, role and uncertain-key fallback',()=>{
 const assets=[{id:'chime',type:'audio',source:'fixture',license:'own',sound:{instrument:'glockenspiel',pitches:[72,76,79],roles:['accent'],tags:['light'],attackSeconds:.01}}];
 validateSoundMetadata(assets[0].sound);assert.throws(()=>validateSoundMetadata({pitches:['C4']}),/MIDI/);
 const known=recommendSounds(assets,{status:'candidate',root:0,mode:'major'},{role:'accent',instrument:'glockenspiel'});assert.equal(known.length,1);assert.ok(known[0].reasons.some(s=>s.includes('音阶')));
 assert.equal(recommendSounds(assets,{status:'uncertain'})[0].status,'candidate');assert.equal(recommendSounds(assets,null,{instrument:'woodblock'}).length,0);
});
test('mix policy checks true peak, masking and opt-in ducking suggestions',()=>{
 const report=qualityAssessment({integratedLufs:-24,truePeakDb:.2},[{id:'hit',from:1,to:1.2,relativeDb:-25}]);assert.deepEqual(report.warnings.map(w=>w.code),['loudness-target','true-peak-headroom','effect-masking-candidate']);assert.equal(report.duckingCandidates[0].status,'candidate-not-applied');
 assert.throws(()=>qualityAssessment({},[],{duckGain:2}),/policy/);
 const levels=relativeEffectLevels({duration:1,clips:[],cues:[{id:'hit',role:'accent',at:0,duration:1}]},new Float64Array(200).fill(.1),new Float64Array(200).fill(.01),100);assert.ok(Math.abs(levels[0].relativeDb+20)<.001);
});
export {fixture};

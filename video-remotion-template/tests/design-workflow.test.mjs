import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {ROOT,json,writeJson,sha} from '../scripts/files.mjs';
import {loadProject} from '../scripts/project.mjs';
import {defaultCandidates,validateCandidates,representativeRange,designFingerprint} from '../scripts/design-plan.mjs';
import {initializeDesign,selectDesign,reviseDesign,proposeDesign,sampleStatus,recordSampleReview,requireFullFilmApproval,comparisonHtml,renderSample} from '../scripts/design-workflow.mjs';
import {visualStyle,styleCapability} from '../src/visual/styles.mjs';

function fixture(t){
  const id=`design-test-${randomUUID()}`,dir=path.resolve(ROOT,'projects',id),out=path.resolve(ROOT,'outputs',id);
  fs.cpSync(path.join(ROOT,'templates/starter'),dir,{recursive:true});
  const p=json(path.join(dir,'project.json'));p.id=id;writeJson(path.join(dir,'project.json'),p);
  t.after(()=>{for(const [file,base] of [[dir,path.join(ROOT,'projects')],[out,path.join(ROOT,'outputs')]]){const rel=path.relative(base,file);assert.ok(rel===id&&!path.isAbsolute(rel));fs.rmSync(file,{recursive:true,force:true});}});
  return {id,dir,out,load:()=>loadProject(id)};
}
test('representative selection prefers mechanism after introduction and accepts explicit middle range',()=>{
  const timeline={fps:30,durationInFrames:900,events:{intro:1,a:10,b:12,c:16,d:19},segments:[{sceneType:'cards',startFrame:0,endFrame:240,startSeconds:0,events:{intro:1}},{sceneType:'sequence',startFrame:240,endFrame:900,startSeconds:8,events:{a:2,b:4,c:8,d:11}}]};
  const chosen=representativeRange(timeline);assert.ok(chosen.from>0);assert.equal(chosen.to-chosen.from,10);
  assert.equal(representativeRange(timeline,{from:12,to:22,stillTime:17,reason:'验证状态变化'}).from,12);
  assert.throws(()=>representativeRange(timeline,{from:0,to:8,reason:'short'}),/ten-second/);
  assert.throws(()=>representativeRange(timeline,{from:0,to:10,stillTime:11,reason:'outside'}),/Comparison frame/);
});
test('three actual skins have distinct visual forms; unsupported scene capabilities stay explicit',()=>{
  const c=defaultCandidates('配对如何改变');assert.equal(new Set(c.map(x=>visualStyle(x).illustration)).size,3);
  assert.equal(styleCapability('moon-match',visualStyle(c[0])).state,'ready');
  assert.equal(styleCapability('sequence',visualStyle(c[0])).state,'partial');
  assert.throws(()=>validateCandidates([c[0],{...c[0],id:'duplicate-look'},c[2]]),/different visual/);
  assert.throws(()=>visualStyle({...c[0],overrides:{fontScale:3}}),/fontScale/);
  assert.throws(()=>visualStyle({...c[0],overrides:{colors:{text:'javascript:bad'}}}),/color/);
  assert.throws(()=>visualStyle({...c[0],overrides:{colors:{text:'#080e1d'}}}),/contrast/);
});
test('select, partial revision and replacement rounds preserve past decisions',t=>{
  const f=fixture(t);initializeDesign(f.load());selectDesign(f.load(),'night');
  const before=f.load(),oldColors={...before.visual.colors};
  reviseDesign(before,'night',{colors:{accent:'#bb3344'},background:'paper'},'保留人物，换纸底');
  const after=f.load();assert.equal(after.visual.colors.accent,'#bb3344');assert.equal(after.visual.colors.text,oldColors.text);
  assert.equal(after.visual.illustration,'portrait');assert.equal(after.visualPlan.decisions.at(-1).before.overrides,undefined);
  assert.notEqual(designFingerprint(before),designFingerprint(after));
  proposeDesign(after,defaultCandidates('同一问题的新方案'));assert.equal(f.load().visualPlan.selectedId,null);
  assert.equal(f.load().visualPlan.rounds.length,2);assert.throws(()=>selectDesign(f.load(),'night',1),/old round/);
});
test('sample approval requires actual flags, exact range, current fingerprint and unchanged media',t=>{
  const f=fixture(t);initializeDesign(f.load());selectDesign(f.load(),'clear');let p=f.load();
  assert.throws(()=>requireFullFilmApproval(p,{from:0,to:p.timeline.durationInFrames}),/needs current user approval/);
  assert.doesNotThrow(()=>requireFullFilmApproval(p,{from:30,to:90}));
  const dir=path.join(f.out,'sample');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'video.mp4'),'fixture media');
  const r=p.production.representative,manifest={project:p.id,status:'rendered-and-decoded',range:{from:r.from*30,to:r.to*30,durationInFrames:300},design:{kind:'sample',fingerprint:designFingerprint(p)},videoOutput:{sha256:sha(path.join(dir,'video.mp4'))},audio:[{silent:false}]};
  const file=path.join(dir,'manifest.json'),relative=`outputs/${p.id}/sample/manifest.json`;writeJson(file,manifest);
  assert.throws(()=>recordSampleReview(p,relative,{state:'approved',viewed:true}),/actual viewing and listening/);
  manifest.range.to-=1;writeJson(file,manifest);assert.throws(()=>recordSampleReview(p,relative,{state:'approved',viewed:true,listened:true}),/complete ten-second/);
  manifest.range.to+=1;writeJson(file,manifest);recordSampleReview(p,relative,{state:'approved',viewed:true,listened:true,note:'synthetic test only'});
  assert.equal(sampleStatus(p).state,'approved');assert.doesNotThrow(()=>requireFullFilmApproval(p,{from:0,to:p.timeline.durationInFrames}));
  reviseDesign(p,'night',{fontScale:1.1});p=f.load();assert.equal(sampleStatus(p).state,'approved');
  fs.appendFileSync(path.join(dir,'video.mp4'),'changed');assert.equal(sampleStatus(p).state,'needs-review');
  reviseDesign(p,'clear',{fontScale:1.15});p=f.load();assert.equal(sampleStatus(p).state,'needs-review');
});
test('comparison escapes untrusted text and keeps three cards in the same frame',()=>{
  const h=comparisonHtml({title:'<script>bad</script>',round:1,stillTime:5,width:1280,height:720,fingerprint:'abc',candidates:defaultCandidates('demo').map(c=>({...c,image:'x.png',description:'实际渲染',capabilities:[]}))});
  assert.ok(!h.includes('<script>bad</script>'));assert.equal((h.match(/<article>/g)||[]).length,3);assert.ok(h.includes('5 秒'));
});
test('music elsewhere in the film cannot pass a silent representative window',async t=>{
  const f=fixture(t);initializeDesign(f.load());selectDesign(f.load(),'night');const p=f.load();
  p.compiledAudio.clips=[{role:'music',at:0,duration:1},{role:'accent',at:p.production.representative.from,duration:.2}];
  await assert.rejects(()=>renderSample(p),/entire representative sample/);
});

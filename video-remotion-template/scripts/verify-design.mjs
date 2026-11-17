import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {ROOT,json,writeJson,sha} from './files.mjs';
import {loadProject} from './project.mjs';
import {initializeDesign,selectDesign,previewDesign,renderSample,recordSampleReview,requireFullFilmApproval,reviseDesign,sampleStatus} from './design-workflow.mjs';
import {probe} from './runtime.mjs';

const id=`design-check-${randomUUID()}`,dir=path.resolve(ROOT,'projects',id),stamp=Date.now();
const result={status:'running',humanApproval:'not-performed',checks:[]};
try{
  // Render public examples without choosing a visual direction for the user.
  let demo=loadProject('moon-match-sample');
  if(!demo.production){initializeDesign(demo,{from:0,to:10,stillTime:5,reason:'验证暂留、替换和继续邀请'});demo=loadProject(demo.id);}
  const comparison=await previewDesign(demo,{name:`style-compare-${stamp}`});
  const report=json(path.join(comparison,'comparison.json'));
  assert.equal(new Set(report.candidates.map(c=>sha(path.join(comparison,c.image)))).size,3);
  assert.equal(new Set(report.candidates.map(c=>c.visual.illustration)).size,3);
  result.comparison=path.relative(ROOT,comparison).split(path.sep).join('/');
  result.checks.push('Three distinct actual-rendered styles share the same content and frame');
  fs.cpSync(demo.dir,dir,{recursive:true});
  const project=json(path.join(dir,'project.json'));project.id=id;delete project.files.visualPlan;delete project.files.productionPlan;
  for(const name of ['visual-plan.json','production-plan.json','design-reviews.json'])fs.rmSync(path.join(dir,name),{force:true});
  writeJson(path.join(dir,'project.json'),project);
  const board=json(path.join(dir,project.files.storyboard));
  board.segments.unshift({id:'intro',durationSeconds:3,intent:'介绍问题',sceneType:'cards',events:{intro:.2},props:{title:'介绍问题',cards:[{title:'示例',body:'测试中段抽取',event:'intro'}]}});
  writeJson(path.join(dir,project.files.storyboard),board);
  const audio=json(path.join(dir,project.files.audioPlan));audio.clips.find(c=>c.role==='music').at=3;writeJson(path.join(dir,project.files.audioPlan),audio);
  const sync=json(path.join(dir,project.files.musicSync));sync.music.at=3;writeJson(path.join(dir,project.files.musicSync),sync);
  initializeDesign(loadProject(id),{from:3,to:13,stillTime:8,reason:'测试片头之后的完整机制片段，不重置动作或配乐时钟'});
  selectDesign(loadProject(id),'clear');let p=loadProject(id);
  const output=await renderSample(p,{name:`middle-sample-${stamp}`,concurrency:2});
  const m=json(path.join(output,'manifest.json')),info=probe(path.join(output,'video.mp4'));
  assert.equal(m.range.from,90);assert.equal(m.range.to,390);assert.equal(m.videoOutput.frames,300);
  assert.equal(m.videoOutput.width,1280);assert.equal(m.videoOutput.duration,10);
  assert.ok(info.streams.some(s=>s.codec_type==='audio'));assert.equal(m.encodedAudioQuality.measurements.silent,false);
  assert.equal(m.manualReview.audio,'needs-listening');
  result.checks.push('Real 10-second middle excerpt: 720p, 300 frames, AAC, complete decode, original global time');
  const relative=path.relative(ROOT,path.join(output,'manifest.json')).split(path.sep).join('/');
  assert.throws(()=>recordSampleReview(p,relative,{state:'approved',viewed:true}),/actual viewing and listening/);
  recordSampleReview(p,relative,{state:'pending',viewed:false,listened:false,note:'Automated validation; no human approval'});
  assert.throws(()=>requireFullFilmApproval(p,{from:0,to:390}),/needs current user approval/);
  reviseDesign(p,'clear',{colors:{accent:'#aa3344'}},'Automated revision of fixture only');p=loadProject(id);
  assert.equal(sampleStatus(p).state,'needs-review');
  assert.throws(()=>recordSampleReview(p,relative,{state:'pending'}),/current complete/);
  result.checks.push('Full film remains blocked; visual edits invalidate sample; no listened/approved record fabricated');
  result.sample=path.relative(ROOT,output).split(path.sep).join('/');result.status='passed';
}catch(e){result.status='failed';result.error=e.stack;process.exitCode=1;}
finally{
  const relative=path.relative(path.join(ROOT,'projects'),dir);assert.equal(relative,id);assert.ok(!path.isAbsolute(relative));fs.rmSync(dir,{recursive:true,force:true});
  writeJson(path.join(ROOT,'.cache','design-verification.json'),result);console.log(JSON.stringify(result,null,2));
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {compileTimeline,selectRange,captionsSrt,frameAt} from '../src/timeline/compile.mjs';
import {loadProject} from '../scripts/project.mjs';
import {inside,ROOT,json} from '../scripts/files.mjs';
const fixture=()=>({project:{contract:'knowledge-video-remotion',contractVersion:1,templateVersion:'0.1.0',id:'fixture',video:{width:1920,height:1080,fps:30},timelineBasis:'final-seconds'},storyboard:{segments:[{id:'first',durationSeconds:1.01,events:{intro:0,end:1.01}},{id:'second',durationSeconds:1.01,events:{intro:0,end:1.01}}]},captions:{items:[]}});
test('fractional scene boundaries are contiguous and retain the final partial frame',()=>{
 const f=fixture(),t=compileTimeline(f.project,f.storyboard,f.captions);
 assert.equal(t.segments[0].endFrame,t.segments[1].startFrame);assert.equal(t.durationInFrames,61);
 assert.equal(t.segments[1].endFrame-t.segments[1].startFrame,30);
 assert.equal(loadProject('tcp-handshake').timeline.durationInFrames,2197);
});
test('invalid versions, speed, duplicate segments and dangling events fail',()=>{
 const f=fixture();f.project.video.speed=1.25;assert.throws(()=>compileTimeline(f.project,f.storyboard,f.captions),/global speed/);delete f.project.video.speed;
 f.storyboard.segments[1].id='first';assert.throws(()=>compileTimeline(f.project,f.storyboard,f.captions),/duplicate/);f.storyboard.segments[1].id='second';
 f.captions.items=[{id:'a',segmentId:'first',start:{event:'missing'},end:1,text:'test'}];assert.throws(()=>compileTimeline(f.project,f.storyboard,f.captions),/Unknown event/);
});
test('overlapping captions fail while intentional reading gaps are preserved',()=>{
 const f=fixture();f.captions.items=[{id:'a',segmentId:'first',start:0,end:.5,text:'A'},{id:'b',segmentId:'first',start:.4,end:.8,text:'B'}];
 assert.throws(()=>compileTimeline(f.project,f.storyboard,f.captions),/Overlapping/);f.captions.items[1].start=.6;
 const t=compileTimeline(f.project,f.storyboard,f.captions);assert.equal(t.captions[1].startFrame,18);
});
test('segment/event ranges reject ambiguity and SRT crops and rebases to clip zero',()=>{
 const p=loadProject('starter-demo'),t=p.timeline;
 assert.throws(()=>selectRange(t,{event:'opening.reveal',from:0}),/not both/);
 assert.throws(()=>selectRange(t,{from:5,to:4}),/Invalid/);
 assert.throws(()=>selectRange(t,{event:'missing'}),/Unknown/);
 const range=selectRange(t,{from:3,to:5}),srt=captionsSrt(t,range);
 assert.match(srt,/00:00:00,000 --> 00:00:01,000/);assert.match(srt,/00:00:01,000 --> 00:00:02,000/);
 assert.equal(selectRange(t,{segment:'opening'}).durationInFrames,360);
});
test('path resolution rejects absolute paths and traversal',()=>{
 for(const name of ['../outside','C:/private','.\\secret'])assert.throws(()=>inside(ROOT,name));
});
test('every migrated caption preserves its old final-time boundary and text',()=>{
 const p=loadProject('tcp-handshake'),migration=json(`${p.dir}/migration.json`);
 assert.equal(p.timeline.captions.length,migration.originalCaptions.length);
 for(let i=0;i<migration.originalCaptions.length;i++){
  const old=migration.originalCaptions[i],current=p.timeline.captions[i];
  assert.equal(current.startFrame,frameAt(old.start/1.25,30));assert.equal(current.endFrame,frameAt(old.end/1.25,30));assert.equal(current.text,old.zh);
 }
});

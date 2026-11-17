import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ROOT,inside,json,writeJson,reserveOutput} from './files.mjs';
import {newProject,loadProject} from './project.mjs';
import {prepare} from './prepare.mjs';
import {renderPrepared} from './render.mjs';
import {comparePng} from './pixels.mjs';
import {binaries,run,probe} from './runtime.mjs';

const stamp=Date.now(),id=`reuse-check-${stamp}`,output=reserveOutput('validation',`integration-${stamp}`),report={status:'running',checks:[],humanListening:'not-performed'};
let owned;
try{
 const located=JSON.parse(run('python',['-X','utf8',path.join(ROOT,'../skills/knowledge-video/scripts/locate_engine.py'),'--root',ROOT]));assert.equal(located.engineKind,'remotion');
 assert.throws(()=>run('python',['-X','utf8',path.join(ROOT,'../skills/knowledge-video/scripts/locate_engine.py'),'--root',path.join(ROOT,'not-an-engine')]),/error|No such file/i);
 const created=newProject(id,'复用检查 · 深色主题与图片素材');owned=created.dir;
 const config=created.project;config.themeId='midnight';config.video={width:960,height:540,fps:24};writeJson(path.join(owned,'project.json'),config);
 const board=json(path.join(owned,config.files.storyboard));board.segments[0].props.imageAsset='diagram';writeJson(path.join(owned,config.files.storyboard),board);
 fs.writeFileSync(path.join(owned,'assets/diagram.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160"><circle cx="80" cy="80" r="45" fill="#60c8df"/><path d="M140 80h100m-20-20 20 20-20 20" fill="none" stroke="#f0af75" stroke-width="8"/><rect x="270" y="35" width="90" height="90" rx="18" fill="#82ccb0"/></svg>');
 writeJson(path.join(owned,'assets/index.json'),{schemaVersion:1,items:[{id:'diagram',path:'diagram.svg',type:'image',source:'Generated integration diagram',license:'Project-generated technical sample'}]});
 const bad=json(path.join(owned,'audio-plan.json'));bad.clips=[{id:'missing',role:'music',source:'asset:missing',sourceIn:0,sourceOut:1,at:0}];writeJson(path.join(owned,'missing-audio.json'),bad);
 assert.throws(()=>loadProject(id,{audioPlan:'missing-audio.json'}),/Missing audio asset/);
 assert.throws(()=>newProject(id,'should not overwrite'),/already exists/);
 const ready=prepare(loadProject(id),reserveOutput(id,'full'));
 await renderPrepared(ready);await renderPrepared(ready,{stills:[10]});
 assert.equal(ready.manifest.videoOutput.frames,288);assert.equal(ready.manifest.videoOutput.width,960);
 fs.cpSync(owned,path.join(ready.output,'source-fixture'),{recursive:true});
 report.checks.push({name:'skill-discovery-new-project-dark-theme-image-960x540-24fps',passed:true,output:path.relative(ROOT,ready.output),negativeChecks:['wrong-engine','missing-audio-asset','duplicate-project']});
 const full=prepare(loadProject('audio-demo'),reserveOutput('audio-demo',`full-still-${stamp}`));await renderPrepared(full,{stills:[9.5]});
 const clip=prepare(loadProject('audio-demo'),reserveOutput('audio-demo',`clip-${stamp}`),{from:8,to:10.5,compare:'audio-alternative.json'});
 await renderPrepared(clip);await renderPrepared(clip,{stills:[9.5]});
 const pixels=comparePng(fs.readFileSync(path.join(full.output,'frame-285.png')),fs.readFileSync(path.join(clip.output,'frame-285.png')));assert.ok(pixels.passed,JSON.stringify(pixels));
 assert.equal(clip.manifest.videoOutput.frames,75);
 const wav=fs.readFileSync(path.join(clip.output,'A-mix.wav'));assert.equal(wav.length,44+2.5*44100*4);
 const decoded=run(binaries().ffmpeg,['-v','error','-i',path.join(clip.output,'video.mp4'),'-vn','-ar','44100','-ac','1','-f','f32le','pipe:1'],{encoding:null});
 const count=Math.min(decoded.length/4,(wav.length-44)/4);let xy=0,xx=0,yy=0;
 for(let i=2205;i<count-2205;i++){const x=decoded.readFloatLE(i*4),y=wav.readInt16LE(44+i*4)/32767;xy+=x*y;xx+=x*x;yy+=y*y;}
 const correlation=xy/Math.sqrt(xx*yy);assert.ok(correlation>.98,`Rendered audio is not aligned with selected mix: ${correlation}`);
 const audioDuration=Number(probe(path.join(clip.output,'video.mp4')).streams.find(s=>s.codec_type==='audio').duration);assert.ok(Math.abs(audioDuration-2.5)<.05);
 report.checks.push({name:'full-versus-clip-picture-and-sound',passed:true,pixels,correlation,frames:75,output:path.relative(ROOT,clip.output)});
 report.status='passed';console.log(JSON.stringify({output,...report},null,2));
}catch(error){report.status='failed';report.error=error.stack;throw error;}
finally{
 writeJson(path.join(output,'integration-report.json'),report);
 if(owned){
  const expected=inside(ROOT,`projects/${id}`);assert.equal(fs.realpathSync(owned),fs.realpathSync(expected));assert.equal(path.dirname(expected),path.join(ROOT,'projects'));
  fs.rmSync(expected,{recursive:true,force:false});
  const catalog=json(path.join(ROOT,'projects/catalog.json'));catalog.projects=catalog.projects.filter(p=>p.id!==id);writeJson(path.join(ROOT,'projects/catalog.json'),catalog);
 }
}

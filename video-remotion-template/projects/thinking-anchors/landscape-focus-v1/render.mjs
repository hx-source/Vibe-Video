import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {PNG} from 'pngjs';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
import {sceneBrowser} from './browser.mjs';
const source=path.join(ROOT,'projects/thinking-anchors/landscape-focus-v1');
const out=reserveOutput('thinking-anchors','landscape-focus-v1'),audio=path.join(ROOT,json(path.join(source,'board.json')).soundSource),oldHash=sha(audio);
const movie=path.join(out,'video.mp4'),ff=binaries().ffmpeg;
const child=spawn(ff,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','copy','-t','14','-avoid_negative_ts','disabled','-movflags','+faststart',movie],{windowsHide:true,stdio:['pipe','ignore','pipe']});
let error='';child.stderr.on('data',b=>error=(error+b).slice(-5000));child.stdin.on('error',()=>{});const done=once(child,'exit');
const {browser,page,frame}=await sceneBrowser();
const samples=new Set([0,9,45,71,72,86,100,137,138,155,177,190,200,201,215,230,248,249,260,276,293,294,309,322,344,345,360,390,419]),checks=[],textFrames=[];
try{
 for(let f=0;f<420;f++){
  await frame(f);
  const visible=await page.evaluate(()=>{
   const isVisible=e=>{let opacity=1;for(let a=e;a;a=a.parentElement){const s=getComputedStyle(a);if(s.display==='none'||s.visibility==='hidden')return false;opacity*=Number(s.opacity);}return opacity>.08;};
   const texts=[...document.querySelectorAll('svg text')].filter(isVisible).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height};});
   return {stage:document.querySelector('[data-landscape-scene]').getAttribute('data-stage'),texts};
  });
  if(visible.texts.some(r=>r.x<0||r.y<0||r.x+r.w>1921||r.y+r.h>1081))throw Error('Text outside the landscape frame at '+f);
  textFrames.push({frame:f,stage:visible.stage,textCount:visible.texts.length,characterCount:visible.texts.reduce((n,t)=>n+t.text.length,0)});
  if(samples.has(f)){checks.push({frame:f,time:f/30+24,...visible});await page.screenshot({path:path.join(out,'frame-'+f+'.png')});}
  const bytes=await page.screenshot({type:'jpeg',quality:94});if(!child.stdin.write(bytes))await Promise.race([once(child.stdin,'drain'),done.then(()=>{throw Error(error);})]);
  if(f%140===0)console.log('Landscape '+Math.round(f/4.2)+'%');
 }
 child.stdin.end();const [code]=await done;if(code!==0)throw Error(error);
}catch(e){if(child.exitCode===null)child.kill();throw e;}finally{await browser.close();}
decode(movie);const p=probe(movie),v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');
if(v.width!==1920||v.height!==1080||v.avg_frame_rate!=='30/1'||Number(v.nb_frames)!==420||Math.abs(Number(p.format.duration)-14)>.01||Math.abs(Number(v.start_time))>1e-6||Math.abs(Number(a.start_time))>1e-6)throw Error('Unexpected output specification');
const audioHash=f=>run(ff,['-v','error','-i',f,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-']).trim();
const oldAudio=audioHash(audio),newAudio=audioHash(movie);if(oldAudio!==newAudio||sha(audio)!==oldHash)throw Error('Existing sound or output changed');
writeJson(path.join(out,'probe.json'),p);writeJson(path.join(out,'frame-review.json'),{all420FramesTextInsideCanvas:true,frames:textFrames,keyframes:checks});
const dst=new PNG({width:1280,height:1080});
[100,190,230,276,322,390].forEach((f,i)=>{const s=PNG.sync.read(fs.readFileSync(path.join(out,'frame-'+f+'.png')));for(let y=0;y<360;y++)for(let x=0;x<640;x++){const a=(y*3*s.width+x*3)*4,b=((Math.floor(i/2)*360+y)*1280+(i%2)*640+x)*4;s.data.copy(dst.data,b,a,a+4);}});fs.writeFileSync(path.join(out,'storyboard.png'),PNG.sync.write(dst));
fs.copyFileSync(path.join(out,'frame-190.png'),path.join(out,'poster.png'));
fs.copyFileSync(path.join(ROOT,'outputs/thinking-anchors/portrait-character-motion-v1/captions.srt'),path.join(out,'captions.srt'));
const sources=Object.fromEntries(['Actor.tsx','Decision.tsx','entry.tsx','Root.tsx','board.json','browser.mjs','render.mjs'].map(f=>[f,sha(path.join(source,f))]));
writeJson(path.join(out,'manifest.json'),{revision:'landscape-focus-v1',status:'rendered-and-decoded',rangeSeconds:[24,38],durationSeconds:14,video:{width:1920,height:1080,fps:30,frames:420},sha256:sha(movie),audio:{source:path.relative(ROOT,audio).replaceAll('\\','/'),sourceFileSha256:oldHash,audioPacketsUnchanged:true,audioHash:newAudio,music:'02_情感话题_故事讲述.m4a',assistantListening:'not-performed'},layout:'native landscape re-layout; no portrait crop, padding or nonuniform scaling',all420FramesTextInsideCanvas:true,sources,userApproved:false});
console.log(JSON.stringify({output:out,video:'1920x1080',frames:420,audioPacketsUnchanged:true}));

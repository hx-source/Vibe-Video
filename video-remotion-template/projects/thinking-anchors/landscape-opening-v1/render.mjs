import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {PNG} from 'pngjs';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
import {measureLoudness} from '../../../scripts/audio-quality.mjs';
import {sceneBrowser} from './browser.mjs';
import {makeAudio} from './audio.mjs';
const local=path.join(ROOT,'projects/thinking-anchors/landscape-opening-v1'),previous=path.join(ROOT,'outputs/thinking-anchors/landscape-focus-v1'),out=reserveOutput('thinking-anchors','landscape-opening-v1'),ff=binaries().ffmpeg;
const oldManifest=json(path.join(previous,'manifest.json')),acceptedVideo=path.join(previous,'video.mp4'),oldHash=sha(acceptedVideo);
for(const [f,h] of Object.entries(oldManifest.sources))if(sha(path.join(ROOT,'projects/thinking-anchors/landscape-focus-v1',f))!==h)throw Error('Previous source changed: '+f);
const sound=makeAudio(out);
const picture=path.join(out,'opening-picture.mp4');
const child=spawn(ff,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-t','24','-avoid_negative_ts','disabled','-movflags','+faststart',picture],{windowsHide:true,stdio:['pipe','ignore','pipe']});
let error='';child.stderr.on('data',b=>error=(error+b).slice(-5000));child.stdin.on('error',()=>{});const done=once(child,'exit');
const {browser,page,frame}=await sceneBrowser();
const samples=new Set([0,18,60,119,120,138,165,239,240,255,285,359,360,375,435,509,510,525,555,599,600,615,629,630,645,675,704,705,719]),checks=[],textFrames=[];
let seam;
try{
 for(let f=0;f<720;f++){
  await frame(f);
  const visible=await page.evaluate(()=>{const isVisible=e=>{let opacity=1;for(let a=e;a;a=a.parentElement){const s=getComputedStyle(a);if(s.display==='none'||s.visibility==='hidden')return false;opacity*=Number(s.opacity);}return opacity>.08;};const texts=[...document.querySelectorAll('svg text')].filter(isVisible).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height};});return {stage:document.querySelector('[data-landscape-scene]').getAttribute('data-stage'),texts};});
  if(visible.texts.some(r=>r.x<0||r.y<0||r.x+r.w>1921||r.y+r.h>1081))throw Error('Text outside canvas at '+f);
  textFrames.push({frame:f,stage:visible.stage,textCount:visible.texts.length,characterCount:visible.texts.reduce((n,t)=>n+t.text.length,0)});
  if(samples.has(f)){checks.push({frame:f,time:f/30,...visible});await page.screenshot({path:path.join(out,'frame-'+f+'.png')});}
  if(f===719)seam=await page.locator('svg').first().evaluate(e=>e.outerHTML);
  const bytes=await page.screenshot({type:'jpeg',quality:94});if(!child.stdin.write(bytes))await Promise.race([once(child.stdin,'drain'),done.then(()=>{throw Error(error);})]);
  if(f%180===0)console.log('Opening '+Math.round(f/7.2)+'%');
 }
 await frame(720);const next=await page.locator('svg').first().evaluate(e=>e.outerHTML);if(seam!==next)throw Error('24 second layout mismatch');await page.screenshot({path:path.join(out,'frame-720.png')});
 child.stdin.end();const [code]=await done;if(code!==0)throw Error(error);
}catch(e){if(child.exitCode===null)child.kill();throw e;}finally{await browser.close();}
const concat=path.join(out,'picture-concat.txt');fs.writeFileSync(concat,[picture,acceptedVideo].map(f=>"file '"+f.replaceAll('\\','/').replaceAll("'","'\\''")+"'").join('\n')+'\n');
const fullPicture=path.join(out,'continuity-picture.mp4');run(ff,['-v','error','-n','-f','concat','-safe','0','-i',concat,'-map','0:v:0','-an','-c:v','copy','-avoid_negative_ts','disabled','-movflags','+faststart',fullPicture]);
for(const [input,audio,file,seconds] of [[picture,path.join(out,'opening-mix.wav'),'video.mp4',24],[fullPicture,path.join(out,'audio/mix.wav'),'continuity-0-38.mp4',38]])run(ff,['-v','error','-n','-i',input,'-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(seconds),'-avoid_negative_ts','disabled','-movflags','+faststart',path.join(out,file)]);
const files=[];for(const [file,seconds,frames] of [['video.mp4',24,720],['continuity-0-38.mp4',38,1140]]){
 const movie=path.join(out,file);decode(movie);const p=probe(movie),v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');
 if(v.width!==1920||v.height!==1080||v.avg_frame_rate!=='30/1'||Number(v.nb_frames)!==frames||Math.abs(Number(p.format.duration)-seconds)>.01||Math.abs(Number(v.start_time))>1e-6||Math.abs(Number(a.start_time))>1e-6)throw Error('Invalid movie '+file);
 const audioQuality=measureLoudness(movie,ff);if(audioQuality.silent||audioQuality.truePeakDb>-1||Math.abs(audioQuality.integratedLufs+18)>3)throw Error('Audio headroom or loudness problem');
 writeJson(path.join(out,file==='video.mp4'?'probe.json':'continuity-probe.json'),p);files.push({file,durationSeconds:seconds,frames,sha256:sha(movie),encodedAudioQuality:audioQuality});
}
const hashPixels=(file,trim)=>run(ff,['-v','error','-i',file,'-map','0:v:0',...(trim?['-vf',trim]:[]),'-pix_fmt','yuv420p','-f','hash','-hash','sha256','-']).trim();
const acceptedPixelHash=hashPixels(acceptedVideo),followingPixelHash=hashPixels(path.join(out,'continuity-0-38.mp4'),'trim=start_frame=720:end_frame=1140,setpts=PTS-STARTPTS');
if(acceptedPixelHash!==followingPixelHash||sha(acceptedVideo)!==oldHash)throw Error('Following accepted picture changed');
const timestamps=JSON.parse(run(binaries().ffprobe,['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',path.join(out,'continuity-0-38.mp4')])).frames;
const timestampError=Math.max(...timestamps.map((f,i)=>Math.abs(Number(f.best_effort_timestamp_time)-i/30)));if(timestamps.length!==1140||timestampError>1e-5)throw Error('Video timestamp discontinuity');
writeJson(path.join(out,'visual-checks.json'),{all720FramesTextInsideCanvas:true,frames:textFrames,keyframes:checks,lastOpeningSvgEqualsFirstDecisionSvg:true,decision420DecodedFramesIdentical:true,decisionPixelHash:acceptedPixelHash,maxFrameTimestampError:timestampError});
const sheet=new PNG({width:1280,height:1080});[60,165,285,435,555,645].forEach((f,i)=>{const s=PNG.sync.read(fs.readFileSync(path.join(out,'frame-'+f+'.png')));for(let y=0;y<360;y++)for(let x=0;x<640;x++){const a=(y*3*s.width+x*3)*4,b=((Math.floor(i/2)*360+y)*1280+(i%2)*640+x)*4;s.data.copy(sheet.data,b,a,a+4);}});fs.writeFileSync(path.join(out,'storyboard.png'),PNG.sync.write(sheet));fs.copyFileSync(path.join(out,'frame-60.png'),path.join(out,'poster.png'));
const board=json(path.join(local,'board.json')),decision=json(path.join(ROOT,'projects/thinking-anchors/portrait-decision-v1/storyboard.json'));
const stamp=t=>{const ms=Math.round(t*1000);return '00:'+String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0')+','+String(ms%1000).padStart(3,'0');};const srt=caps=>caps.map((c,i)=>[i+1,stamp(c.from)+' --> '+stamp(c.to),c.text,''].join('\n')).join('\n');
fs.writeFileSync(path.join(out,'captions.srt'),srt(board.captions));fs.writeFileSync(path.join(out,'full-captions.srt'),srt([...board.captions,...decision.captions.map(c=>({...c,from:c.from+24,to:c.to+24}))]));
const sources=Object.fromEntries(['Actor.tsx','Opening.tsx','Shapes.tsx','board.json','entry.tsx','Root.tsx','browser.mjs','render.mjs','audio.mjs'].map(f=>[f,sha(path.join(local,f))]));
writeJson(path.join(out,'manifest.json'),{revision:'landscape-opening-v1',status:'rendered-and-decoded',rangeSeconds:[0,24],video:{width:1920,height:1080,fps:30},files,sources,retained:{revision:'landscape-focus-v1',rangeSeconds:[24,38],sourceHashes:oldManifest.sources,videoSha256:oldHash,decoded420FramesIdentical:true,pixelHash:acceptedPixelHash,audioPcmBeforeEncodingUnchanged:true},audio:sound.checks,lastOpeningSvgEqualsFirstDecisionSvg:true,maxFrameTimestampError:timestampError,contentApproved:true,userApproved:false,assistantListening:'not-performed'});
console.log(JSON.stringify({output:out,files,decisionDecodedPixelsUnchanged:true,audio:sound.checks.musicPcmUnchangedAcross0to38}));

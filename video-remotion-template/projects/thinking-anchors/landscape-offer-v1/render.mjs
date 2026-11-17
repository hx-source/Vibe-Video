import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {PNG} from 'pngjs';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
import {measureLoudness} from '../../../scripts/audio-quality.mjs';
import {sceneBrowser} from './browser.mjs';
import {makeOfferAudio} from './audio.mjs';
const revision='landscape-offer-v1',local=path.join(ROOT,'projects/thinking-anchors',revision),previous=path.join(ROOT,'outputs/thinking-anchors/landscape-used-v1'),out=reserveOutput('thinking-anchors',revision),ff=binaries().ffmpeg;
const prior=json(path.join(previous,'manifest.json')),prefix=path.join(previous,'continuity-0-52.mp4'),prefixHash=sha(prefix);
for(const [folder,sources] of [['landscape-used-v1',prior.sources],['landscape-opening-v2',prior.retained.sources],['landscape-focus-v1',json(path.join(ROOT,'outputs/thinking-anchors/landscape-focus-v1/manifest.json')).sources]])for(const [f,h] of Object.entries(sources))if(sha(path.join(ROOT,'projects/thinking-anchors',folder,f))!==h)throw Error('Accepted source changed: '+folder+'/'+f);
const sound=makeOfferAudio(out),picture=path.join(out,'segment-picture.mp4');
const child=spawn(ff,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-t','12','-avoid_negative_ts','disabled','-movflags','+faststart',picture],{windowsHide:true,stdio:['pipe','ignore','pipe']});
let error='';child.stderr.on('data',b=>error=(error+b).slice(-5000));child.stdin.on('error',()=>{});const done=once(child,'exit');
const sheetFrames=[63,114,180,234,285,330],posterFrame=114;
const {browser,page,frame}=await sceneBrowser(),samples=new Set([0,9,18,39,54,78,84,99,138,158,159,174,204,218,219,246,257,258,270,294,300,359,...sheetFrames,posterFrame]),checks=[],textFrames=[];
try{
 await frame(1559);const before=await page.locator('svg').first().evaluate(e=>e.outerHTML);await frame(1560);if(before!==await page.locator('svg').first().evaluate(e=>e.outerHTML))throw Error('52 second layout mismatch');
 for(let f=0;f<360;f++){
  await frame(1560+f);
  const visible=await page.evaluate(()=>{const isVisible=e=>{let opacity=1;for(let a=e;a;a=a.parentElement){const s=getComputedStyle(a);if(s.display==='none'||s.visibility==='hidden')return false;opacity*=Number(s.opacity);}return opacity>.08;};const texts=[...document.querySelectorAll('svg text')].filter(isVisible).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height};});return {stage:document.querySelector('[data-landscape-scene]').getAttribute('data-stage'),texts};});
  if(visible.texts.some(r=>r.x<0||r.y<0||r.x+r.w>1921||r.y+r.h>1081))throw Error('Text outside canvas '+f);
  if(f>=30&&!visible.texts.some(t=>t.text==='二手相机'))throw Error('Item label missing '+f);
  if(f>=105&&f<159&&!visible.texts.some(t=>t.text==='630'))throw Error('Example offer not shown');
  if(f>=174&&f<219&&!visible.texts.some(t=>t.text==='这个价不卖'))throw Error('Seller response not shown');
  if(f>=300&&visible.texts.some(t=>t.text==='630'))throw Error('Quote was not withdrawn');
  textFrames.push({frame:f,time:52+f/30,stage:visible.stage,textCount:visible.texts.length,characterCount:visible.texts.reduce((n,t)=>n+t.text.length,0)});
  if(samples.has(f)){checks.push({frame:f,time:52+f/30,...visible});await page.screenshot({path:path.join(out,'frame-'+f+'.png')});}
  const bytes=await page.screenshot({type:'jpeg',quality:94});if(!child.stdin.write(bytes))await Promise.race([once(child.stdin,'drain'),done.then(()=>{throw Error(error);})]);
  if(f%90===0)console.log('Offer '+Math.round(f/3.6)+'%');
 }
 child.stdin.end();const [code]=await done;if(code!==0)throw Error(error);
}catch(e){if(child.exitCode===null)child.kill();throw e;}finally{await browser.close();}
const concat=path.join(out,'picture-concat.txt');fs.writeFileSync(concat,[prefix,picture].map(f=>"file '"+f.replaceAll('\\','/').replaceAll("'","'\\''")+"'").join('\n')+'\n');
const fullPicture=path.join(out,'continuity-picture.mp4');run(ff,['-v','error','-n','-f','concat','-safe','0','-i',concat,'-map','0:v:0','-an','-c:v','copy','-avoid_negative_ts','disabled','-movflags','+faststart',fullPicture]);
for(const [input,audio,file,seconds] of [[picture,path.join(out,'segment-mix.wav'),'video.mp4',12],[fullPicture,path.join(out,'audio/mix.wav'),'continuity-0-64.mp4',64]])run(ff,['-v','error','-n','-i',input,'-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(seconds),'-avoid_negative_ts','disabled','-movflags','+faststart',path.join(out,file)]);
const files=[];for(const [file,seconds,frames] of [['video.mp4',12,360],['continuity-0-64.mp4',64,1920]]){
 const movie=path.join(out,file);decode(movie);const p=probe(movie),v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');
 if(v.width!==1920||v.height!==1080||v.avg_frame_rate!=='30/1'||Number(v.nb_frames)!==frames||Math.abs(Number(p.format.duration)-seconds)>.01||Math.abs(Number(v.start_time))>1e-6||Math.abs(Number(a.start_time))>1e-6)throw Error('Invalid exported movie '+file);
 const quality=measureLoudness(movie,ff);if(quality.silent||quality.truePeakDb>-1||Math.abs(quality.integratedLufs+18)>3)throw Error('Audio headroom or loudness needs revision');
 writeJson(path.join(out,file==='video.mp4'?'probe.json':'continuity-probe.json'),p);files.push({file,durationSeconds:seconds,frames,sha256:sha(movie),encodedAudioQuality:quality});
}
const pixels=(file,frames)=>run(ff,['-v','error','-i',file,'-map','0:v:0','-frames:v',String(frames),'-pix_fmt','yuv420p','-f','hash','-hash','sha256','-']).trim();
const pixelHash=pixels(prefix,1560);if(pixelHash!==pixels(path.join(out,'continuity-0-64.mp4'),1560)||sha(prefix)!==prefixHash)throw Error('Original 52 second picture changed');
const timestamps=JSON.parse(run(binaries().ffprobe,['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',path.join(out,'continuity-0-64.mp4')])).frames;
const timestampError=Math.max(...timestamps.map((f,i)=>Math.abs(Number(f.best_effort_timestamp_time)-i/30)));if(timestamps.length!==1920||timestampError>1e-5)throw Error('Noncontinuous frame times');
writeJson(path.join(out,'visual-checks.json'),{all360NewFramesTextInsideCanvas:true,itemLabelPresent:true,offerSellerReplyAndWithdrawalChecked:true,lastPriorSvgEqualsFirstOfferSvg:true,prior1560DecodedFramesIdentical:true,priorPictureHash:pixelHash,maxFrameTimestampError:timestampError,frames:textFrames,keyframes:checks});
const sheet=new PNG({width:1280,height:1080});sheetFrames.forEach((f,i)=>{const s=PNG.sync.read(fs.readFileSync(path.join(out,'frame-'+f+'.png')));for(let y=0;y<360;y++)for(let x=0;x<640;x++){const a=(y*3*s.width+x*3)*4,b=((Math.floor(i/2)*360+y)*1280+(i%2)*640+x)*4;s.data.copy(sheet.data,b,a,a+4);}});
fs.writeFileSync(path.join(out,'storyboard.png'),PNG.sync.write(sheet));fs.copyFileSync(path.join(out,'frame-'+posterFrame+'.png'),path.join(out,'poster.png'));fs.copyFileSync(path.join(previous,'poster-opening.png'),path.join(out,'poster-opening.png'));
const board=json(path.join(local,'board.json')),opening=json(path.join(ROOT,'projects/thinking-anchors/landscape-opening-v2/board.json')),decision=json(path.join(ROOT,'projects/thinking-anchors/portrait-decision-v1/storyboard.json')),used=json(path.join(ROOT,'projects/thinking-anchors/landscape-used-v1/board.json'));
const stamp=t=>{const ms=Math.round(t*1000);return '00:'+String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0')+','+String(ms%1000).padStart(3,'0');};const srt=caps=>caps.map((c,i)=>[i+1,stamp(c.from)+' --> '+stamp(c.to),c.text,''].join('\n')).join('\n');
fs.writeFileSync(path.join(out,'captions.srt'),srt(board.captions));fs.writeFileSync(path.join(out,'full-captions.srt'),srt([...opening.captions,...decision.captions.map(c=>({...c,from:c.from+24,to:c.to+24})),...used.captions.map(c=>({...c,from:c.from+38,to:c.to+38})),...board.captions.map(c=>({...c,from:c.from+52,to:c.to+52}))]));
const sources=Object.fromEntries(['Offer.tsx','Actor.tsx','Props.tsx','board.json','entry.tsx','Root.tsx','browser.mjs','render.mjs','audio.mjs'].map(f=>[f,sha(path.join(local,f))]));
writeJson(path.join(out,'manifest.json'),{revision,status:'rendered-and-decoded',rangeSeconds:[52,64],video:{width:1920,height:1080,fps:30},files,sources,retained:{revision:'landscape-used-v1',rangeSeconds:[0,52],sources:prior.sources,videoSha256:prefixHash,decoded1560FramesIdentical:true,pixelHash},audio:sound.checks,lastPriorSvgEqualsFirstOfferSvg:true,maxFrameTimestampError:timestampError,userApproved:false,assistantListening:'not-performed'});
console.log(JSON.stringify({output:out,files,prior52SecondsPictureUnchanged:true,audioPrefixUnchangedUntil:51.82}));

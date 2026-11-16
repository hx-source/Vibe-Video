import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {ROOT,json,sha,writeJson} from '../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const name=process.argv[2]??'ending-v1',render=process.argv.includes('--render');
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid revision');
const dir=path.join(ROOT,'projects/thinking-anchors'),out=path.join(ROOT,'outputs/thinking-anchors',name);
const manifest=json(path.join(out,'manifest.json')),{data}=json(path.join(out,'input-props.json'));
const previous=path.join(ROOT,'outputs/thinking-anchors/used-offer-v1'),previousManifest=json(path.join(previous,'manifest.json'));
if(data.range.from!==1740||data.range.to!==2100||data.audio.silent)throw Error('Expected audible 58–70s range');
for(const f of ['scenes/AnchorLiveOpening.tsx','scenes/AnchorLiveMechanism.tsx','scenes/AnchorLiveDecision.tsx','scenes/OpeningActors.tsx','scenes/AnchorUsedEvidence.tsx','scenes/UsedEvidenceRegroup.tsx','scenes/RegroupStage.tsx','scenes/AnchorEvidenceMotion.tsx','scenes/AnchorUsedOffer.tsx'])if(sha(path.join(dir,f))!==previousManifest.rendererSources[f])throw Error('Accepted opening source changed');
if(fs.existsSync(path.join(out,'video.mp4')))throw Error('Completed output exists; choose a new revision');
const result=await build({entryPoints:['projects/thinking-anchors/style-entry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
let css='body{margin:0}';
for(const weight of [400,700]){const fontDir=path.join(ROOT,'node_modules/@fontsource/noto-sans-sc');css+=fs.readFileSync(path.join(fontDir,`${weight}.css`),'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join(fontDir,f)).toString('base64')})`);}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const checks=[],preservedFrames=[];let encoder;
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 await page.setContent(`<style>${css}</style><div id="root"></div>`);await page.addScriptTag({content:result.outputFiles[0].text});
 const frame=async f=>{await page.evaluate(({data,f})=>window.renderFrame(data,f),{data,f});await page.evaluate(()=>document.fonts.ready);};
 const hash=b=>createHash('sha256').update(b).digest('hex');
 for(const f of [1380,1500,1590,1680,1739]){
  await frame(f);const bytes=await page.screenshot(),priorBytes=fs.readFileSync(path.join(previous,`frame-${f}.png`));
  let changedPixels=0,maxChannelDelta=0;
  if(hash(bytes)!==hash(priorBytes)){
   const a=PNG.sync.read(priorBytes),b=PNG.sync.read(bytes);
   for(let i=0;i<a.data.length;i+=4){let delta=0;for(let ch=0;ch<4;ch++)delta=Math.max(delta,Math.abs(a.data[i+ch]-b.data[i+ch]));if(delta){changedPixels++;maxChannelDelta=Math.max(maxChannelDelta,delta);}}
   if(changedPixels>32||maxChannelDelta>1){fs.writeFileSync(path.join(out,`preservation-mismatch-${f}.png`),bytes);throw Error('Accepted picture changed at '+f);}
  }
  // Tiny 8-bit compositing roundoff is separately logged; the joined video's
  // entire accepted prefix must still pass exact decoded-pixel hashing below.
  preservedFrames.push({frame:f,changedPixels,maxChannelDelta});
 }
 await frame(1739);const lastOpening=hash(await page.screenshot());await frame(1740);if(hash(await page.screenshot())!==lastOpening)throw Error('The boundary does not carry the opening terminal frame');
 const saved=new Set([1739,1740,1749,1755,1770,1785,1800,1815,1830,1845,1860,1875,1890,1905,1920,1935,1950,1965,1980,1995,2010,2040,2070,2099]);
 const frames=new Set([...saved,...Array.from({length:120},(_,i)=>1740+3*i)]);
 for(const f of [...frames].sort((a,b)=>a-b)){
  await frame(f);
  const layout=await page.evaluate(()=>{
   const visible=e=>{let p=1;for(let el=e;el;el=el.parentElement)p*=Number(getComputedStyle(el).opacity);return p>.05;};
   const boxes=[...document.querySelectorAll('svg text')].filter(visible).map(e=>{
    const b=e.getBoundingClientRect().toJSON();
    if(e.closest('[data-context-copy]')){b.x=Math.max(0,b.x);b.y=Math.max(250,b.y);b.right=Math.min(1130,b.right);b.bottom=Math.min(1030,b.bottom);if(b.right<=b.x||b.bottom<=b.y)return null;}
    return {text:e.textContent,b};
   }).filter(Boolean);
   const outside=boxes.filter(({b})=>b.x<80||b.y<45||b.right>1840||b.bottom>1025).map(x=>x.text),collisions=[];
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(Math.min(a.b.right,b.b.right)-Math.max(a.b.x,b.b.x)>3&&Math.min(a.b.bottom,b.b.bottom)-Math.max(a.b.y,b.b.y)>3)collisions.push([a.text,b.text]);}
   return {outside,collisions,bottomCaptions:document.querySelectorAll('[data-caption]').length,visibleText:boxes.map(x=>x.text)};
  });
  checks.push({frame:f,globalSeconds:f/30,...layout});
  if(layout.outside.length||layout.collisions.length||layout.bottomCaptions){writeJson(path.join(out,'draft-layout-issues.json'),checks);throw Error(`Layout ${f/30}s: ${JSON.stringify(layout)}`);}
  if(saved.has(f))await page.screenshot({path:path.join(out,`frame-${f}.png`)});
 }
 await frame(1980);const a=await page.screenshot();await frame(1740);await frame(1980);const b=await page.screenshot();if(hash(a)!==hash(b))throw Error('Rewinding changes the frame');fs.writeFileSync(path.join(out,'poster.png'),b);
 writeJson(path.join(out,'visual-checks.json'),{checks,preservedOpeningFrames:preservedFrames,openingLastFrameCarriedExactly:true,rewindDeterministic:true,method:'Actual Chromium SVG text bounds, with the inherited livestream clipped to its visible context'});
 if(render){
  const movie=path.join(out,'video.mp4'),ff=binaries().ffmpeg;
  encoder=spawn(ff,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',path.join(out,'A-mix.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','12','-movflags','+faststart',movie],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let errors='';encoder.stderr.on('data',b=>errors=(errors+b).slice(-6000));encoder.stdin.on('error',()=>{});const done=once(encoder,'exit');
  for(let f=1740;f<2100;f++){await frame(f);const bytes=await page.screenshot({type:'jpeg',quality:94});if(!encoder.stdin.write(bytes))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error(errors);})]);if((f-1740)%90===0)console.log(`Ending ${Math.round((f-1740)/3.6)}%`);}
  encoder.stdin.end();const [code]=await done;if(code!==0)throw Error(errors);
  decode(movie);const info=probe(movie),v=info.streams.find(s=>s.codec_type==='video');if(v.width!==1920||v.height!==1080||Number(v.nb_frames)!==360||v.avg_frame_rate!=='30/1'||!info.streams.some(s=>s.codec_type==='audio'))throw Error('Invalid new segment format');
  writeJson(path.join(out,'probe.json'),info);const quality=measureLoudness(movie,ff);if(quality.silent||quality.truePeakDb>-1||Math.abs(quality.integratedLufs+18)>3)throw Error('Encoded segment audio outside policy');writeJson(path.join(out,'encoded-audio-quality.json'),quality);
  const concatFile=path.join(out,'concat-pictures.txt');
  fs.writeFileSync(concatFile,[path.join(previous,'continuity-0-58.mp4'),movie].map(f=>`file '${f.replaceAll('\\','/').replaceAll("'","'\\''")}'`).join('\n')+'\n');
  fs.writeFileSync(path.join(out,'mix-0-70.wav'),waveSlice(fs.readFileSync(path.join(out,'A/mix.wav')),0,70));
  const joined=path.join(out,'full-preview-70s.mp4');
  run(ff,['-v','error','-n','-f','concat','-safe','0','-i',concatFile,'-i',path.join(out,'mix-0-70.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','70','-movflags','+faststart',joined]);
  const videoStart=Number(probe(joined).streams.find(s=>s.codec_type==='video').start_time??0);
  if(videoStart>1e-6){
   const aligned=path.join(out,'full-preview-70s-aligned.mp4');
   run(ff,['-v','error','-n','-itsoffset',String(-videoStart),'-i',joined,'-i',path.join(out,'mix-0-70.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','70','-avoid_negative_ts','disabled','-movflags','+faststart',aligned]);
   const checked=probe(aligned),cv=checked.streams.find(s=>s.codec_type==='video');
   if(Number(cv.nb_frames)!==2100||Math.abs(Number(cv.start_time))>1e-6||Math.abs(Number(checked.format.duration)-70)>.01)throw Error('Timestamp normalization failed');
   fs.renameSync(joined,path.join(out,'full-preview-before-timestamp-normalization.mp4'));fs.renameSync(aligned,joined);
  }
  decode(joined);const joinedInfo=probe(joined),jv=joinedInfo.streams.find(s=>s.codec_type==='video');if(Number(jv.nb_frames)!==2100||Math.abs(Number(joinedInfo.format.duration)-70)>.05)throw Error('Invalid continuity video');
  const pixels=f=>run(ff,['-v','error','-i',f,'-map','0:v:0','-frames:v','1740','-pix_fmt','yuv420p','-f','hash','-hash','sha256','-']).trim();
  const originalPixels=pixels(path.join(previous,'continuity-0-58.mp4')),joinedPixels=pixels(joined);if(originalPixels!==joinedPixels)throw Error('Joining changed the accepted opening pixels');
  writeJson(path.join(out,'continuity-probe.json'),joinedInfo);writeJson(path.join(out,'continuity-encoded-audio.json'),measureLoudness(joined,ff));
  manifest.status='rendered-and-decoded';manifest.videoOutput={file:'video.mp4',sha256:sha(movie),frames:360,duration:12,width:1920,height:1080,fps:30};
  manifest.continuityOutput={file:'full-preview-70s.mp4',sha256:sha(joined),frames:2100,duration:70,acceptedOpeningDecodedPixelsUnchanged:true,openingPixelHash:originalPixels};
  manifest.encodedAudioQuality=quality;manifest.manualReview={visual:'keyframes-inspected-separately',audio:'needs-user-listening'};manifest.renderMethod='Prepared engine timeline and audio; project React/SVG via offline Chromium and FFmpeg';writeJson(path.join(out,'manifest.json'),manifest);
 }
}catch(error){if(encoder?.exitCode===null)encoder.kill();throw error;}finally{await browser.close();}
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>70秒完整试看片 · 思考快与慢的锚定效应</title><style>body{max-width:1100px;margin:30px auto;padding:0 22px;background:#fff8e9;color:#25252b;font:17px/1.7 system-ui}video{width:100%;border:3px solid #25252b;border-radius:12px}button{font:inherit;padding:9px 15px;margin:6px 8px 6px 0;background:#e3f4ec;border:2px solid #25252b;border-radius:8px;cursor:pointer}a{color:#206c63}p{color:#666258}</style><h1>收尾58–70秒：先找依据，再做决定</h1><p>并排回看直播间与二手砍价，把方法归纳为问依据、找反证、比可比价、按需决定。最后保留需要、预算和可以不买的判断，02音乐自然淡出。</p><video id="film" controls playsinline preload="metadata" poster="poster.png" src="video.mp4"></video><p id="clock">本播放器0秒，对应成片第58秒。</p><button data-mode="segment">只看新增58–70秒</button><button data-mode="joined">完整70秒试看</button><button id="beginning">从头看完整视频</button><button id="boundary">从第56秒看衔接</button><button id="loop">循环播放</button><p>当前完整结构70秒：直播间降价与查价 → 二手检查、成交核查和出价/退出 → 两个案例的方法总结。原88秒草稿的重复尾段已归档，前58秒画面内容保留。完整试看片尚待用户观看、试听与认可。</p><p><a href="video.mp4">收尾12秒视频</a> · <a href="full-preview-70s.mp4">完整70秒试看片</a> · <a href="mix-0-70.wav">全片混音</a> · <a href="A-music.wav">收尾配乐</a> · <a href="A-effects.wav">收尾音效</a> · <a href="captions.srt">收尾可选字幕</a></p><p>所有金额、商品情况与对话为虚构案例。生活化方法改编自《思考，快与慢》锚定相关讨论，结语为原创概括，不是书中引文；方法帮助减少影响，不保证完全消除。</p><script>const film=document.getElementById('film');let mode='segment';function choose(next,time,play){mode=next;film.src=mode==='segment'?'video.mp4':'full-preview-70s.mp4';document.getElementById('clock').textContent=mode==='segment'?'本播放器0秒，对应成片第58秒。':'本播放器与完整70秒成片使用相同时间。';film.addEventListener('loadedmetadata',()=>{film.currentTime=mode==='segment'?Math.max(0,Math.min(11.9,time-58)):Math.max(0,Math.min(69.9,time));if(play)film.play();},{once:true});}document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{const time=film.currentTime+(mode==='segment'?58:0);choose(b.dataset.mode,time,!film.paused);});document.getElementById('beginning').onclick=()=>choose('joined',0,true);document.getElementById('boundary').onclick=()=>choose('joined',56,true);document.getElementById('loop').onclick=e=>{film.loop=!film.loop;e.target.textContent=film.loop?'关闭循环':'循环播放';};</script></html>`);
console.log(JSON.stringify({out,rendered:render}));

import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {ROOT,json,sha,writeJson} from '../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const name=process.argv[2]??'live-mechanism-v1',render=process.argv.includes('--render');
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid revision');
const dir=path.join(ROOT,'projects/thinking-anchors'),out=path.join(ROOT,'outputs/thinking-anchors',name);
const manifest=json(path.join(out,'manifest.json')),{data}=json(path.join(out,'input-props.json'));
const previous=path.join(ROOT,'outputs/thinking-anchors/opening-live-v2'),previousManifest=json(path.join(previous,'manifest.json'));
if(data.range.from!==420||data.range.to!==720||data.audio.silent)throw Error('Expected audible 14–24s range');
for(const f of ['scenes/AnchorLiveOpening.tsx','scenes/OpeningActors.tsx'])if(sha(path.join(dir,f))!==previousManifest.rendererSources[f])throw Error('Accepted opening source changed');
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
 for(const f of [0,90,255,345,419]){await frame(f);const bytes=await page.screenshot();if(hash(bytes)!==sha(path.join(previous,`frame-${f}.png`)))throw Error('Accepted opening picture changed at '+f);preservedFrames.push(f);}
 await frame(419);const lastOpening=hash(await page.screenshot());await frame(420);if(hash(await page.screenshot())!==lastOpening)throw Error('The boundary does not carry the opening terminal frame');
 const saved=new Set([419,420,429,435,450,456,465,480,507,516,525,555,585,606,615,639,657,690,719]);
 const frames=new Set([...saved,...Array.from({length:100},(_,i)=>420+3*i)]);
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
 await frame(639);const a=await page.screenshot();await frame(420);await frame(639);const b=await page.screenshot();if(hash(a)!==hash(b))throw Error('Rewinding changes the frame');fs.writeFileSync(path.join(out,'poster.png'),b);
 writeJson(path.join(out,'visual-checks.json'),{checks,preservedOpeningFrames:preservedFrames,openingLastFrameCarriedExactly:true,rewindDeterministic:true,method:'Actual Chromium SVG text bounds, with the inherited livestream clipped to its visible context'});
 if(render){
  const movie=path.join(out,'video.mp4'),ff=binaries().ffmpeg;
  encoder=spawn(ff,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',path.join(out,'A-mix.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','10','-movflags','+faststart',movie],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let errors='';encoder.stderr.on('data',b=>errors=(errors+b).slice(-6000));encoder.stdin.on('error',()=>{});const done=once(encoder,'exit');
  for(let f=420;f<720;f++){await frame(f);const bytes=await page.screenshot({type:'jpeg',quality:94});if(!encoder.stdin.write(bytes))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error(errors);})]);if((f-420)%75===0)console.log(`Mechanism ${Math.round((f-420)/3)}%`);}
  encoder.stdin.end();const [code]=await done;if(code!==0)throw Error(errors);
  decode(movie);const info=probe(movie),v=info.streams.find(s=>s.codec_type==='video');if(v.width!==1920||v.height!==1080||Number(v.nb_frames)!==300||v.avg_frame_rate!=='30/1'||!info.streams.some(s=>s.codec_type==='audio'))throw Error('Invalid new segment format');
  writeJson(path.join(out,'probe.json'),info);const quality=measureLoudness(movie,ff);if(quality.silent||quality.truePeakDb>-1||Math.abs(quality.integratedLufs+18)>3)throw Error('Encoded segment audio outside policy');writeJson(path.join(out,'encoded-audio-quality.json'),quality);
  const concatFile=path.join(out,'concat-pictures.txt');
  fs.writeFileSync(concatFile,[path.join(previous,'video.mp4'),movie].map(f=>`file '${f.replaceAll('\\','/').replaceAll("'","'\\''")}'`).join('\n')+'\n');
  fs.writeFileSync(path.join(out,'mix-0-24.wav'),waveSlice(fs.readFileSync(path.join(out,'A/mix.wav')),0,24));
  const joined=path.join(out,'continuity-0-24.mp4');
  run(ff,['-v','error','-n','-f','concat','-safe','0','-i',concatFile,'-i',path.join(out,'mix-0-24.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','24','-movflags','+faststart',joined]);
  decode(joined);const joinedInfo=probe(joined),jv=joinedInfo.streams.find(s=>s.codec_type==='video');if(Number(jv.nb_frames)!==720||Math.abs(Number(joinedInfo.format.duration)-24)>.05)throw Error('Invalid continuity video');
  const pixels=f=>run(ff,['-v','error','-i',f,'-map','0:v:0','-frames:v','420','-pix_fmt','yuv420p','-f','hash','-hash','sha256','-']).trim();
  const originalPixels=pixels(path.join(previous,'video.mp4')),joinedPixels=pixels(joined);if(originalPixels!==joinedPixels)throw Error('Joining changed the accepted opening pixels');
  writeJson(path.join(out,'continuity-probe.json'),joinedInfo);writeJson(path.join(out,'continuity-encoded-audio.json'),measureLoudness(joined,ff));
  manifest.status='rendered-and-decoded';manifest.videoOutput={file:'video.mp4',sha256:sha(movie),frames:300,duration:10,width:1920,height:1080,fps:30};
  manifest.continuityOutput={file:'continuity-0-24.mp4',sha256:sha(joined),frames:720,duration:24,acceptedOpeningDecodedPixelsUnchanged:true,openingPixelHash:originalPixels};
  manifest.encodedAudioQuality=quality;manifest.manualReview={visual:'keyframes-inspected-separately',audio:'needs-user-listening'};manifest.renderMethod='Prepared engine timeline and audio; project React/SVG via offline Chromium and FFmpeg';writeJson(path.join(out,'manifest.json'),manifest);
 }
}catch(error){if(encoder?.exitCode===null)encoder.kill();throw error;}finally{await browser.close();}
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>14–24秒：直播间里的锚定效应</title><style>body{max-width:1100px;margin:30px auto;padding:0 22px;background:#fff8e9;color:#25252b;font:17px/1.7 system-ui}video{width:100%;border:3px solid #25252b;border-radius:12px}button{font:inherit;padding:9px 15px;margin:6px 8px 6px 0;background:#e3f4ec;border:2px solid #25252b;border-radius:8px;cursor:pointer}a{color:#206c63}p{color:#666258}</style><h1>14–24秒：199便宜吗，你在和谁比较？</h1><p>承接同一直播间、衣服和人物。199元保持不变；999作为脑中参照浮现，比较差价后命名“锚定效应”，再追问判断依据。</p><video id="film" controls playsinline preload="metadata" poster="poster.png" src="video.mp4"></video><p id="clock">本播放器0秒，对应成片第14秒。</p><button data-mode="segment">只看新增14–24秒</button><button data-mode="joined">连看0–24秒</button><button id="boundary">从第12秒看衔接</button><button id="loop">循环播放</button><p>已认可开头保留；02背景音乐使用原全片时钟，没有重新从音乐开头播放。当前仅完成到第24秒，其余章节仍待逐段制作。</p><p><a href="video.mp4">新增10秒视频</a> · <a href="continuity-0-24.mp4">0–24秒连看片</a> · <a href="A-mix.wav">本段完整混音</a> · <a href="A-music.wav">配乐</a> · <a href="A-effects.wav">音效</a> · <a href="captions.srt">可选解释字幕</a></p><p>金额为虚构示例；800只代表算术差，不证明真实节省。“脑中的参照”为机制示意，不是对真实观众心理的测量。本段待用户观看试听。</p><script>const film=document.getElementById('film');let mode='segment';function choose(next,time,play){mode=next;film.src=mode==='segment'?'video.mp4':'continuity-0-24.mp4';document.getElementById('clock').textContent=mode==='segment'?'本播放器0秒，对应成片第14秒。':'本播放器与成片0–24秒使用相同时间。';film.addEventListener('loadedmetadata',()=>{film.currentTime=mode==='segment'?Math.max(0,Math.min(9.9,time-14)):Math.max(0,Math.min(23.9,time));if(play)film.play();},{once:true});}document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{const time=film.currentTime+(mode==='segment'?14:0);choose(b.dataset.mode,time,!film.paused);});document.getElementById('boundary').onclick=()=>choose('joined',12,true);document.getElementById('loop').onclick=e=>{film.loop=!film.loop;e.target.textContent=film.loop?'关闭循环':'循环播放';};</script></html>`);
console.log(JSON.stringify({out,rendered:render}));

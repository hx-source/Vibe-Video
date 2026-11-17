import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {ROOT,json,sha,writeJson} from '../../scripts/files.mjs';
import {binaries,decode,probe} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const name=process.argv[2]??'opening-v1',render=process.argv.includes('--render');
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid revision name');
const out=path.join(ROOT,'outputs/thinking-anchors',name),manifest=json(path.join(out,'manifest.json')),{data}=json(path.join(out,'input-props.json'));
if(data.range.from!==0||data.range.to!==420||data.timeline.fps!==30||data.audio.silent)throw Error('Expected audible 0–14s at 30fps');
if(fs.existsSync(path.join(out,'video.mp4')))throw Error('Completed output exists; prepare a new revision');
const result=await build({entryPoints:['projects/thinking-anchors/style-entry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
let css='body{margin:0}';
for(const weight of [400,700]){const dir=path.join(ROOT,'node_modules/@fontsource/noto-sans-sc');css+=fs.readFileSync(path.join(dir,`${weight}.css`),'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join(dir,f)).toString('base64')})`);}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),checks=[];
let encoder;
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 await page.setContent(`<style>${css}</style><div id="root"></div>`);await page.addScriptTag({content:result.outputFiles[0].text});
 const frame=async f=>{await page.evaluate(({data,f})=>window.renderFrame(data,f),{data,f});await page.evaluate(()=>document.fonts.ready);};
 const saved=new Set([0,15,45,90,150,165,195,210,240,255,285,315,330,345,360,390,419,435]);
 const inspect=new Set([...saved,...Array.from({length:140},(_,i)=>i*3)]);
 for(const f of [...inspect].sort((a,b)=>a-b)){
  await frame(f);
  const layout=await page.evaluate(()=>{
   const visible=e=>{let p=1;for(let el=e;el;el=el.parentElement)p*=Number(getComputedStyle(el).opacity);return p>.05;};
   const boxes=[...document.querySelectorAll('svg text')].filter(visible).map(e=>({text:e.textContent,b:e.getBoundingClientRect().toJSON()}));
   const outside=boxes.filter(({b})=>b.x<80||b.y<45||b.right>1840||b.bottom>1025).map(x=>x.text),collisions=[];
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(Math.min(a.b.right,b.b.right)-Math.max(a.b.x,b.b.x)>3&&Math.min(a.b.bottom,b.b.bottom)-Math.max(a.b.y,b.b.y)>3)collisions.push([a.text,b.text]);}
   const captions=document.querySelectorAll('[data-caption]').length;
   const hand=document.querySelector('[data-payment-hand]'),button=document.querySelector('[data-payment-button]');
   return {outside,collisions,captions,hand:hand?.getBoundingClientRect().toJSON(),button:button?.getBoundingClientRect().toJSON()};
  });
  checks.push({frame:f,time:f/30,...layout});
  if(layout.outside.length||layout.collisions.length||layout.captions){writeJson(path.join(out,'draft-layout-issues.json'),checks);throw Error(`Layout at ${f/30}: ${JSON.stringify(layout)}`);}
  if(saved.has(f))await page.screenshot({path:path.join(out,`frame-${f}.png`)});
 }
 const hash=b=>createHash('sha256').update(b).digest('hex');
 await frame(345);const a=await page.screenshot();await frame(0);await frame(345);const b=await page.screenshot();if(hash(a)!==hash(b))throw Error('Rewind changes frame');
 fs.writeFileSync(path.join(out,'poster.png'),b);
 writeJson(path.join(out,'visual-checks.json'),{checks,rewindDeterministic:true,layoutSamplingSeconds:.1,source:'Actual SVG rendered in Chromium; adjacent next-chapter still included',humanAudioListening:'not-performed'});
 if(render){
  const movie=path.join(out,'video.mp4');encoder=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',path.join(out,'A-mix.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',movie],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let errors='';encoder.stderr.on('data',b=>errors=(errors+b).slice(-6000));encoder.stdin.on('error',()=>{});const done=once(encoder,'exit');
  for(let f=0;f<420;f++){await frame(f);const bytes=await page.screenshot({type:'jpeg',quality:94});if(!encoder.stdin.write(bytes))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error(errors);})]);if(f%90===0)console.log(`Opening ${Math.round(f/4.2)}%`);}
  encoder.stdin.end();const [code]=await done;if(code!==0)throw Error(errors);
  decode(movie);const info=probe(movie),v=info.streams.find(s=>s.codec_type==='video');if(v.width!==1920||v.height!==1080||Number(v.nb_frames)!==420||v.avg_frame_rate!=='30/1'||!info.streams.some(s=>s.codec_type==='audio')||Math.abs(Number(info.format.duration)-14)>.04)throw Error('Encoded format invalid');
  const quality=measureLoudness(movie,binaries().ffmpeg);if(quality.silent||quality.truePeakDb>-1||Math.abs(quality.integratedLufs+18)>3)throw Error('Encoded audio outside policy');
  writeJson(path.join(out,'encoded-audio-quality.json'),quality);writeJson(path.join(out,'probe.json'),info);
  manifest.status='rendered-and-decoded';manifest.videoOutput={file:'video.mp4',sha256:sha(movie),width:1920,height:1080,frames:420,duration:14,fps:30};manifest.encodedAudioQuality=quality;
  manifest.manualReview={visuals:'keyframes-inspected-separately',audio:'needs-user-listening'};
  manifest.renderMethod='Project React/SVG via offline Chromium and FFmpeg, same timeline and prepared audio as Remotion; established local fallback';
  manifest.openingScope={from:0,to:14,otherChaptersChanged:false,previousRegroupPreserved:true};
  writeJson(path.join(out,'manifest.json'),manifest);
 }
}catch(error){if(encoder?.exitCode===null)encoder.kill();throw error;}finally{await browser.close();}
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>开头0–14秒 · 二手砍价</title><style>body{max-width:1100px;margin:30px auto;padding:0 22px;background:#fff8e9;color:#25252b;font:17px/1.7 system-ui}video{width:100%;border:3px solid #25252b;border-radius:12px}button{font:inherit;padding:9px 15px;margin:6px 8px 6px 0;background:#e3f4ec;border:2px solid #25252b;border-radius:8px;cursor:pointer}a{color:#206c63}p{color:#666258}</style><h1>开头0–14秒：砍掉400，真的省了吗？</h1><p>报价2000 → 还价1600 → 觉得省了400、准备付款 → 付款前停下来想想。漫画实验室风格，02故事讲述配乐，无旁白。</p><video id="film" controls playsinline preload="metadata" poster="poster.png" src="video.mp4"></video><p><button data-seek="0">从头播放</button><button data-seek="4.5">看还价与同意</button><button data-seek="7.5">看准备付款与停顿</button><button id="loop">循环本段</button></p><p>大字解释改为场内对话、价格标签和付款动作；五个短声音分别对应报价、还价、标签落定、拿出手机和付款暂停。手指没有点击付款。</p><p><a href="A-mix.wav">完整混音</a> · <a href="A-music.wav">配乐分轨</a> · <a href="A-effects.wav">音效分轨</a> · <a href="captions.srt">可选说明字幕</a></p><p>金额与商品均为原创剧情设定，不是实际行情。已完成技术检查；尚未记录用户对本段的观看、试听或认可。</p><script>const film=document.getElementById('film');document.querySelectorAll('[data-seek]').forEach(b=>b.onclick=()=>{film.currentTime=Number(b.dataset.seek);film.play();});document.getElementById('loop').onclick=e=>{film.loop=!film.loop;e.target.textContent=film.loop?'关闭循环':'循环本段';};</script></html>`);
console.log(JSON.stringify({out,rendered:render}));

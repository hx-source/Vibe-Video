import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
const local=path.join(ROOT,'projects/thinking-anchors/portrait-character-motion-v1'),parent=path.dirname(local),out=reserveOutput('thinking-anchors','portrait-character-motion-v1'),previous=path.join(ROOT,'outputs/thinking-anchors/portrait-edge-cleanup-v1');
const windowPath='M-95 439 H65 V1066 H-95 M-95 725 H65 M-15 439 V1066';
const originals=['portrait-edge-cleanup-v1/Opening.tsx','portrait-edge-cleanup-v1/Mechanism.tsx','portrait-edge-cleanup-v1/Decision.tsx','portrait-mechanism-v1/SceneParts.tsx'];
const originalHashes=Object.fromEntries(originals.map(f=>[f,sha(path.join(parent,f))]));
const current=fs.readFileSync(path.join(local,'Decision.tsx'),'utf8').replace("\nimport {AnimatedShopper} from './Actor';",'').replace('import {Txt,Tag}','import {Txt,Tag,Shopper}').replace("from '../portrait-edge-cleanup-v1/Mechanism'","from './Mechanism'").replace('<AnimatedShopper time={time} clock={clock}/>','<Shopper happy={0} check={1} surprise={.306*(1-form)} time={clock} opacity={1}/>');
if(current!==fs.readFileSync(path.join(parent,'portrait-edge-cleanup-v1/Decision.tsx'),'utf8'))throw Error('Non-actor scene content changed');
const bundle=entry=>build({entryPoints:[entry],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
const builds=await Promise.all([bundle('projects/thinking-anchors/portrait-character-motion-v1/entry.tsx'),bundle('projects/thinking-anchors/portrait-edge-cleanup-v1/entry.tsx')]);
let css='body{margin:0}';for(const weight of [400,700]){const d=path.join(ROOT,'node_modules/@fontsource/noto-sans-sc');css+=fs.readFileSync(path.join(d,weight+'.css'),'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join(d,f)).toString('base64')})`);}
const encoders=[];
function encoder(file,audio,duration){
 const child=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','copy','-t',String(duration),'-avoid_negative_ts','disabled','-movflags','+faststart',file],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 let error='';child.stderr.on('data',b=>error=(error+b).slice(-6000));child.stdin.on('error',()=>{});const done=once(child,'exit');const e={child,done,error:()=>error};encoders.push(e);return e;
}
const full=encoder(path.join(out,'continuity-0-38.mp4'),path.join(previous,'continuity-0-38.mp4'),38);let segment;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const samples=new Set([0,75,359,360,615,719,720,735,780,810,840,869,885,915,945,969,996,1020,1044,1086,1110,1139]),checks=[],poses=[];
try{
 const pages=[];for(let i=0;i<2;i++){const p=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});await p.setContent(`<style>${css}</style><div id="root"></div>`);await p.addScriptTag({content:builds[i].outputFiles[0].text});pages.push(p);}
 const frame=async(p,f)=>{await p.evaluate(f=>window.renderPortrait(f),f);await p.evaluate(()=>document.fonts.ready);};
 for(let f=0;f<1140;f++){
  await frame(pages[0],f);
  const absent=await pages[0].evaluate(d=>![...document.querySelectorAll('path')].some(p=>p.getAttribute('d')===d),windowPath);if(!absent)throw Error('Window remains at '+f);
  if(samples.has(f)){
   await frame(pages[1],f);
   const markup=async p=>p.evaluate(({removeActor})=>{const e=document.querySelector('[data-portrait-scene]').cloneNode(true);if(removeActor)for(const n of e.querySelectorAll('[data-character]'))n.remove();return e.outerHTML;},{removeActor:f>=720});
   const oldSvg=await markup(pages[1]),newSvg=await markup(pages[0]);
   if(oldSvg!==newSvg){writeJson(path.join(out,'svg-mismatch.json'),{frame:f,oldSvg,newSvg});throw Error('Content outside the actor changed at '+f);}
   checks.push({frame:f,time:f/30,remainingWindowPaths:0,nonActorSvgExactlyEqual:true});await pages[0].screenshot({path:path.join(out,`frame-${f}.png`)});
  }
  if(f>=720){const pose=await pages[0].evaluate(()=>{const visible=e=>{for(let a=e;a;a=a.parentElement){const s=getComputedStyle(a);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}return true;};const a=[...document.querySelectorAll('[data-character]')].filter(visible).at(-1);const hand=a?.querySelector('[data-acting-hand]');const m=hand?.getScreenCTM();const p=m?new DOMPoint(0,0).matrixTransform(m):null;return {action:a?.getAttribute('data-action')??'carry',gaze:a?.getAttribute('data-gaze'),hand:p?{x:p.x,y:p.y}:null};});poses.push({frame:f,time:f/30,...pose});}
  if(f===720)segment=encoder(path.join(out,'video.mp4'),path.join(previous,'video.mp4'),14);
  const bytes=await pages[0].screenshot({type:'jpeg',quality:94});for(const e of [full,...(segment?[segment]:[])])if(!e.child.stdin.write(bytes))await Promise.race([once(e.child.stdin,'drain'),e.done.then(()=>{throw Error(e.error());})]);
  if(f%285===0)console.log(`Actor ${f/11.4}%`);
 }
 for(const e of encoders)e.child.stdin.end();for(const e of encoders){const [code]=await e.done;if(code!==0)throw Error(e.error());}
}catch(e){for(const enc of encoders)if(enc.child.exitCode===null)enc.child.kill();throw e;}finally{await browser.close();}
const audioHash=file=>run(binaries().ffmpeg,['-v','error','-i',file,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-']).trim();
const files=[];for(const [file,duration,frames] of [['continuity-0-38.mp4',38,1140],['video.mp4',14,420]]){
 const movie=path.join(out,file);decode(movie);const p=probe(movie),v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');if(v.width!==1080||v.height!==1920||v.avg_frame_rate!=='30/1'||Number(v.nb_frames)!==frames||Math.abs(Number(p.format.duration)-duration)>.01||Math.abs(Number(v.start_time))>1e-6||Math.abs(Number(a.start_time))>1e-6)throw Error('Invalid corrected movie '+file);
 const hash=audioHash(movie);if(hash!==audioHash(path.join(previous,file)))throw Error('Audio packets changed '+file);writeJson(path.join(out,file==='video.mp4'?'probe.json':'continuity-probe.json'),p);files.push({file,duration,frames,sha256:sha(movie),audioPacketsUnchanged:true,audioHash:hash});
}
for(const [file,hash] of Object.entries(originalHashes))if(sha(path.join(parent,file))!==hash)throw Error('Historical source changed');
for(const f of ['captions.srt','full-captions.srt'])fs.copyFileSync(path.join(previous,f),path.join(out,f));fs.copyFileSync(path.join(out,'frame-945.png'),path.join(out,'poster.png'));fs.copyFileSync(path.join(out,'frame-75.png'),path.join(out,'poster-opening.png'));
let review=fs.readFileSync(path.join(previous,'review.html'),'utf8').replace('<h1>左侧窗框已移除 · 前38秒修正版</h1>','<h1>24–38秒 · 人物动作增强版</h1>').replace('统一移除了0–38秒左侧露出的背景窗框，其他内容、节奏和声音沿用上一版。','人物会探身看价格、抬手指向记录和条件、托腮思考，再收手退开；文字、节奏和声音沿用。');fs.writeFileSync(path.join(out,'review.html'),review);
const sources=Object.fromEntries(['Actor.tsx','Decision.tsx','entry.tsx','Root.tsx','render.mjs','change.json'].map(f=>[f,sha(path.join(local,f))]));
writeJson(path.join(out,'manifest.json'),{status:'rendered-and-decoded',revision:'portrait-character-motion-v1',scopeSeconds:[24,38],change:'event-driven character acting with gaze, pointing, chin thinking and withdrawal',files,sources,originalHashes,all1140FramesWindowAbsent:true,nonActorSvgEqualitySamples:checks,poseFrames:poses,audio:'existing encoded AAC copied without re-encoding; packet hash identical',userApproved:false,assistantListening:'not-performed'});
console.log(JSON.stringify({output:out,files,svgSamples:checks.length,windowAbsentFrames:1140}));

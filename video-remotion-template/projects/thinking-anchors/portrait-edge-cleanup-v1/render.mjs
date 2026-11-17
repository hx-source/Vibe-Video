import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
const local=path.join(ROOT,'projects/thinking-anchors/portrait-edge-cleanup-v1'),parent=path.dirname(local),out=reserveOutput('thinking-anchors','portrait-edge-cleanup-v1'),previous=path.join(ROOT,'outputs/thinking-anchors/portrait-decision-v1');
const windowPath=json(path.join(local,'change.json')).removedPath;
const originals=['portrait-opening-v2/Opening.tsx','portrait-mechanism-v1/Mechanism.tsx','portrait-decision-v1/Decision.tsx'];
const originalHashes=Object.fromEntries(originals.map(f=>[f,sha(path.join(parent,f))]));
// Confirm the frozen variant only changes the window path and import locations.
const originalOpening=fs.readFileSync(path.join(parent,originals[0]),'utf8');
const target='  <path d="'+windowPath+'" fill={mint} stroke={ink} strokeWidth="7" opacity=".4"/>';
if(originalOpening.split(target).length!==2)throw Error('Expected one original decoration');
const normalizedOpening=fs.readFileSync(path.join(local,'Opening.tsx'),'utf8').replace("from '../portrait-opening-v2/storyboard.json'","from './storyboard.json'");
if(originalOpening.replace(target,'')!==normalizedOpening)throw Error('Unexpected opening content changes');
const normalize=(s,kind)=>kind==='mechanism'?s.replace("from './Opening'","from '../portrait-opening-v2/Opening'").replace("from '../portrait-mechanism-v1/SceneParts'","from './SceneParts'").replace("from '../portrait-mechanism-v1/storyboard.json'","from './storyboard.json'"):s.replace("from './Mechanism'","from '../portrait-mechanism-v1/Mechanism'").replace("from '../portrait-decision-v1/storyboard.json'","from './storyboard.json'");
for(const [file,kind,original] of [['Mechanism.tsx','mechanism',originals[1]],['Decision.tsx','decision',originals[2]]])if(normalize(fs.readFileSync(path.join(local,file),'utf8'),kind)!==fs.readFileSync(path.join(parent,original),'utf8'))throw Error('Unexpected scene changes');
const bundle=entry=>build({entryPoints:[entry],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
const builds=await Promise.all([bundle('projects/thinking-anchors/portrait-edge-cleanup-v1/entry.tsx'),bundle('projects/thinking-anchors/portrait-decision-v1/entry.tsx')]);
let css='body{margin:0}';for(const weight of [400,700]){const d=path.join(ROOT,'node_modules/@fontsource/noto-sans-sc');css+=fs.readFileSync(path.join(d,weight+'.css'),'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join(d,f)).toString('base64')})`);}
const encoders=[];
function encoder(file,audio,duration){
 const child=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','copy','-t',String(duration),'-avoid_negative_ts','disabled','-movflags','+faststart',file],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 let error='';child.stderr.on('data',b=>error=(error+b).slice(-6000));child.stdin.on('error',()=>{});const done=once(child,'exit');const e={child,done,error:()=>error};encoders.push(e);return e;
}
const full=encoder(path.join(out,'continuity-0-38.mp4'),path.join(previous,'continuity-0-38.mp4'),38);let segment;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const samples=new Set([0,75,130,218,300,359,360,480,615,719,720,792,858,930,1005,1125,1139]),checks=[];
try{
 const pages=[];for(let i=0;i<2;i++){const p=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});await p.setContent(`<style>${css}</style><div id="root"></div>`);await p.addScriptTag({content:builds[i].outputFiles[0].text});pages.push(p);}
 const frame=async(p,f)=>{await p.evaluate(f=>window.renderPortrait(f),f);await p.evaluate(()=>document.fonts.ready);};
 for(let f=0;f<1140;f++){
  await frame(pages[0],f);
  const absent=await pages[0].evaluate(d=>![...document.querySelectorAll('path')].some(p=>p.getAttribute('d')===d),windowPath);if(!absent)throw Error('Window remains at '+f);
  if(samples.has(f)){
   await frame(pages[1],f);
   const oldSvg=await pages[1].evaluate(d=>{const e=document.querySelector('[data-portrait-scene]').cloneNode(true);for(const p of e.querySelectorAll('path'))if(p.getAttribute('d')===d)p.remove();return e.outerHTML;},windowPath);
   const newSvg=await pages[0].locator('[data-portrait-scene]').first().evaluate(e=>e.outerHTML);
   if(oldSvg!==newSvg){writeJson(path.join(out,'svg-mismatch.json'),{frame:f,oldSvg,newSvg});throw Error('A change beyond the window was found at '+f);}
   checks.push({frame:f,time:f/30,remainingWindowPaths:0,otherSvgContentExactlyEqual:true});await pages[0].screenshot({path:path.join(out,`frame-${f}.png`)});
  }
  if(f===720)segment=encoder(path.join(out,'video.mp4'),path.join(previous,'video.mp4'),14);
  const bytes=await pages[0].screenshot({type:'jpeg',quality:94});for(const e of [full,...(segment?[segment]:[])])if(!e.child.stdin.write(bytes))await Promise.race([once(e.child.stdin,'drain'),e.done.then(()=>{throw Error(e.error());})]);
  if(f%285===0)console.log(`Clean edge ${f/11.4}%`);
 }
 for(const e of encoders)e.child.stdin.end();for(const e of encoders){const [code]=await e.done;if(code!==0)throw Error(e.error());}
}catch(e){for(const enc of encoders)if(enc.child.exitCode===null)enc.child.kill();throw e;}finally{await browser.close();}
const audioHash=file=>run(binaries().ffmpeg,['-v','error','-i',file,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-']).trim();
const files=[];for(const [file,duration,frames] of [['continuity-0-38.mp4',38,1140],['video.mp4',14,420]]){
 const movie=path.join(out,file);decode(movie);const p=probe(movie),v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');if(v.width!==1080||v.height!==1920||v.avg_frame_rate!=='30/1'||Number(v.nb_frames)!==frames||Math.abs(Number(p.format.duration)-duration)>.01||Math.abs(Number(v.start_time))>1e-6||Math.abs(Number(a.start_time))>1e-6)throw Error('Invalid corrected movie '+file);
 const hash=audioHash(movie);if(hash!==audioHash(path.join(previous,file)))throw Error('Audio packets changed '+file);writeJson(path.join(out,file==='video.mp4'?'probe.json':'continuity-probe.json'),p);files.push({file,duration,frames,sha256:sha(movie),audioPacketsUnchanged:true,audioHash:hash});
}
for(const [file,hash] of Object.entries(originalHashes))if(sha(path.join(parent,file))!==hash)throw Error('Historical source changed');
for(const f of ['captions.srt','full-captions.srt'])fs.copyFileSync(path.join(previous,f),path.join(out,f));fs.copyFileSync(path.join(out,'frame-930.png'),path.join(out,'poster.png'));fs.copyFileSync(path.join(out,'frame-75.png'),path.join(out,'poster-opening.png'));
let review=fs.readFileSync(path.join(previous,'review.html'),'utf8').replaceAll('../portrait-opening-v2/poster.png','poster-opening.png').replace('<h1>24–38秒：该拿什么比？</h1>','<h1>左侧窗框已移除 · 前38秒修正版</h1><p>统一移除了0–38秒左侧露出的背景窗框，其他内容、节奏和声音沿用上一版。</p>');fs.writeFileSync(path.join(out,'review.html'),review);
const sources=Object.fromEntries(['Opening.tsx','Mechanism.tsx','Decision.tsx','entry.tsx','Root.tsx','render.mjs','change.json'].map(f=>[f,sha(path.join(local,f))]));
writeJson(path.join(out,'manifest.json'),{status:'rendered-and-decoded',revision:'portrait-edge-cleanup-v1',scopeSeconds:[0,38],change:'removed one cropped left window decoration',files,sources,originalHashes,all1140FramesWindowAbsent:true,otherSvgEqualitySamples:checks,audio:'existing encoded AAC copied without re-encoding; packet hash identical',userApproved:false,assistantListening:'not-performed'});
console.log(JSON.stringify({output:out,files,svgSamples:checks.length,windowAbsentFrames:1140}));

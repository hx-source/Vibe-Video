import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {loadProject} from '../../scripts/project.mjs';
import {prepare} from '../../scripts/prepare.mjs';
import {reserveOutput,writeJson,sha} from '../../scripts/files.mjs';
import {binaries,probe,decode} from '../../scripts/runtime.mjs';
const output=reserveOutput('anchoring-effect',process.argv[2]||'full-offline-v1');
const ready=prepare(loadProject('anchoring-effect'),output,{}),data=ready.data;
const result=await build({entryPoints:['projects/anchoring-effect/offline-entry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
let css='body{margin:0}';
for(const weight of [400,700]){const dir='node_modules/@fontsource/noto-sans-sc';css+=fs.readFileSync(`${dir}/${weight}.css`,'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(`${dir}/${f}`).toString('base64')})`);}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
await page.setContent(`<html><head><style>${css}</style></head><body><div id="root"></div></body></html>`);
await page.addScriptTag({content:result.outputFiles[0].text});
await page.evaluate(d=>(window).renderFrame(d,270),data);await page.evaluate(()=>document.fonts.ready);
const inspections=[];
for(const f of [0,1,120,270,360,630,720,1050,1200,1530,1620,1770,1859]){
 await page.evaluate(({d,f})=>window.renderFrame(d,f),{d:data,f});
 await page.evaluate(()=>document.fonts.ready);
 const failures=await page.locator('[data-fit]').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2).map(e=>e.textContent));
 if(failures.length)throw Error('Text overflow '+JSON.stringify(failures));
 if([270,630,1050,1530,1770].includes(f))await page.screenshot({path:path.join(output,`frame-${f}.png`)});
 inspections.push({frame:f,overflow:failures});
}
const video=path.join(output,'video.mp4');
const ff=spawn(binaries().ffmpeg,['-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',path.join(output,'A','mix.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','62','-movflags','+faststart',video],{windowsHide:true,stdio:['pipe','ignore','pipe']});
let errors='';ff.stderr.on('data',b=>{errors=(errors+b).slice(-6000)});ff.stdin.on('error',()=>{});
try{
 for(let f=0;f<data.timeline.durationInFrames;f++){
  await page.evaluate(({d,f})=>window.renderFrame(d,f),{d:data,f});
  const bytes=await page.screenshot({type:'jpeg',quality:94});
  if(!ff.stdin.write(bytes))await once(ff.stdin,'drain');
  if(f%186===0)console.log(`Rendered ${Math.round(f/18.6)}%`);
 }
 ff.stdin.end();const [code]=await once(ff,'exit');if(code!==0)throw Error(errors);
}finally{await browser.close();}
decode(video);const info=probe(video),v=info.streams.find(s=>s.codec_type==='video');
if(v.width!==1920||v.height!==1080||Number(v.nb_frames)!==1860||!info.streams.some(s=>s.codec_type==='audio'))throw Error('Video validation failed');
writeJson(path.join(output,'probe.json'),info);
ready.manifest.status='rendered-and-decoded';ready.manifest.renderMethod='Offline React scenes via Playwright pipe and FFmpeg; localhost renderer unavailable';ready.manifest.videoOutput={file:'video.mp4',sha256:sha(video),frames:1860,width:1920,height:1080,duration:62};
writeJson(path.join(output,'manifest.json'),ready.manifest);
writeJson(path.join(output,'visual-checks.json'),{inspections,humanListening:'not-performed'});
console.log(output);

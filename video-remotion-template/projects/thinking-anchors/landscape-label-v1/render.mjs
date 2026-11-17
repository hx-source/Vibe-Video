import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {PNG} from 'pngjs';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries} from '../../../scripts/runtime.mjs';
import {sceneBrowser} from './browser.mjs';
const out=path.join(ROOT,'outputs/thinking-anchors/landscape-label-v1'),old=path.join(ROOT,'outputs/thinking-anchors/landscape-decision-v1'),prior=json(path.join(old,'manifest.json'));
for(const [f,h] of Object.entries(prior.sources))if(sha(path.join(ROOT,'projects/thinking-anchors/landscape-decision-v1',f))!==h)throw Error('Previous approved source changed');
const {browser,page,frame}=await sceneBrowser(),samples=[659,665,670,674,680,686,695,705],checks=[];
try{
 for(const f of samples){await frame(f);await page.screenshot({path:path.join(out,'audit/source-'+f+'.png')});}
 const sheet=new PNG({width:1280,height:1440});samples.forEach((f,i)=>{const s=PNG.sync.read(fs.readFileSync(path.join(out,'audit/source-'+f+'.png')));for(let y=0;y<360;y++)for(let x=0;x<640;x++){const a=(y*3*s.width+x*3)*4,b=((Math.floor(i/2)*360+y)*1280+(i%2)*640+x)*4;s.data.copy(sheet.data,b,a,a+4);}});fs.writeFileSync(path.join(out,'label-storyboard.png'),PNG.sync.write(sheet));
 if(!process.argv.includes('--stills')){
  if(fs.existsSync(path.join(out,'reason-picture.mp4')))throw Error('Picture exists');const child=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-t','14','-avoid_negative_ts','disabled','-movflags','+faststart',path.join(out,'reason-picture.mp4')],{windowsHide:true,stdio:['pipe','ignore','pipe']});let error='';child.stderr.on('data',b=>error=(error+b).slice(-4000));child.stdin.on('error',()=>{});const done=once(child,'exit');let matched=0;
  try{for(let f=600;f<1020;f++){
   await frame(f);const svg=await page.locator('svg').first().evaluate(e=>e.outerHTML),state=await page.evaluate(()=>{const alpha=e=>{let a=1;for(let p=e;p;p=p.parentElement)a*=Number(getComputedStyle(p).opacity);return a;};return {texts:[...document.querySelectorAll('svg text')].map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height,a:alpha(e)};}).filter(t=>t.a>.08&&t.h>.1),actual:document.querySelector('[data-price="199"] text:last-child')?.textContent,anchor:[...document.querySelectorAll('[data-anchor-price] text')].find(e=>e.textContent==='999')?.outerHTML};});
   if(!state.texts.length||state.texts.some(t=>t.x<-.5||t.y<-.5||t.x+t.w>1920.5||t.y+t.h>1080.5))throw Error('Text bounds at '+f);
   if(f<660||f>=705){await page.evaluate(f=>(window).renderLandscape(f,true),f);await page.evaluate(()=>document.fonts.ready);if(svg!==await page.locator('svg').first().evaluate(e=>e.outerHTML))throw Error('Source change outside22–23.5 at '+f);matched++;await frame(f);}
   else{await page.evaluate(f=>(window).renderLandscape(f,true),f);if(state.actual!=='199'||state.anchor!==await page.locator('[data-anchor-price] text').filter({hasText:'999'}).evaluate(e=>e.outerHTML))throw Error('Prices changed');await frame(f);}
   checks.push({frame:f,time:f/30,inEdit:f>=660&&f<705,visibleTexts:state.texts.map(t=>t.text)});const bytes=await page.screenshot({type:'jpeg',quality:94});if(!child.stdin.write(bytes))await Promise.race([once(child.stdin,'drain'),done.then(()=>{throw Error(error);})]);if((f-600)%105===0)console.log('Reason '+Math.round((f-600)/4.2)+'%');
  }child.stdin.end();const [code]=await done;if(code!==0)throw Error(error);}catch(e){if(child.exitCode===null)child.kill();throw e;}
  writeJson(path.join(out,'visual-checks.json'),{framesChecked:420,editFrames:[660,705],editRangeSeconds:[22,23.5],unchangedReasonSourceFrames:matched,allTextInsideCanvas:true,price199And999Unchanged:true,otherSourceFramesUnchanged:true,checks});fs.copyFileSync(path.join(out,'audit/source-686.png'),path.join(out,'poster.png'));console.log(JSON.stringify({frames:420,edited:45,unchangedSourceFrames:matched}));
 }
}finally{await browser.close();}

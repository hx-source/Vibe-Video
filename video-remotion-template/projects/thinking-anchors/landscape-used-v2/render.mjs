import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {PNG} from 'pngjs';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries} from '../../../scripts/runtime.mjs';
import {sceneBrowser} from './browser.mjs';
const out=path.join(ROOT,'outputs/thinking-anchors/landscape-used-v2'),old=path.join(ROOT,'outputs/thinking-anchors/landscape-decision-v1'),prior=json(path.join(old,'manifest.json'));
for(const [f,h] of Object.entries(prior.sources))if(sha(path.join(ROOT,'projects/thinking-anchors/landscape-decision-v1',f))!==h)throw Error('Approved reason source changed');
for(const f of prior.files)if(sha(path.join(old,f.file))!==f.sha256)throw Error('Approved preview changed');
const {browser,page,frame}=await sceneBrowser();
const selected=new Set(['二手砍价，也先找依据','先试基本功能','能开机 ✓','能拍照 ✓','再看磨损和配件','外壳有磨损','缺充电器','查已成交，别只看挂牌','同款','成色相近','配件相近','620','650','680','成交记录，给出参照','示例成交参考','620—680','结合实物，再判断开价','还要结合磨损、配件']);
const sampleFrames=[1560,1569,1610,1650,1695,1720,1780,1824,1866,1908,1950,2010,2050,2099],readings=new Map(),frames=[];
try{
 await frame(1559);const a=await page.locator('svg').first().evaluate(e=>e.outerHTML);await frame(1560);if(a!==await page.locator('svg').first().evaluate(e=>e.outerHTML))throw Error('52second seam mismatch');
 for(const f of sampleFrames){await frame(f);await page.screenshot({path:path.join(out,'audit/source-'+f+'.png')});}
 const sheet=new PNG({width:1280,height:1440});[1610,1650,1720,1780,1824,1866,1950,2050].forEach((f,i)=>{const s=PNG.sync.read(fs.readFileSync(path.join(out,'audit/source-'+f+'.png')));for(let y=0;y<360;y++)for(let x=0;x<640;x++){const a=(y*3*s.width+x*3)*4,b=((Math.floor(i/2)*360+y)*1280+(i%2)*640+x)*4;s.data.copy(sheet.data,b,a,a+4);}});fs.writeFileSync(path.join(out,'storyboard.png'),PNG.sync.write(sheet));
 if(process.argv.includes('--stills')){console.log('Stills ready');process.exitCode=0;}
 else{
  const picture=path.join(out,'used-picture.mp4');if(fs.existsSync(picture))throw Error('Picture exists');
  const child=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-t','18','-avoid_negative_ts','disabled','-movflags','+faststart',picture],{windowsHide:true,stdio:['pipe','ignore','pipe']});let error='';child.stderr.on('data',b=>error=(error+b).slice(-4000));child.stdin.on('error',()=>{});const done=once(child,'exit');
  try{for(let f=1560;f<2100;f++){
   await frame(f);const state=await page.evaluate(()=>{const alpha=e=>{let a=1;for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.visibility==='hidden'||s.display==='none')return 0;a*=Number(s.opacity);}return a;};const texts=[...document.querySelectorAll('svg text')].map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height,a:alpha(e)};}).filter(t=>t.a>.08&&t.h>.1);return {stage:document.querySelector('[data-landscape-scene]').getAttribute('data-stage'),texts,price:document.querySelector('[data-price]')?.getAttribute('data-price'),action:document.querySelector('[data-character]')?.getAttribute('data-action')??document.querySelector('[data-character]')?.getAttribute('data-acting')??'initial-shopper'};});
   if(!state.texts.length||state.texts.some(t=>t.x<-.5||t.y<-.5||t.x+t.w>1920.5||t.y+t.h>1080.5))throw Error('Blank or text outside canvas at '+f);
   const inkBounds=await page.evaluate(()=>{const ctx=document.createElement('canvas').getContext('2d');return [...document.querySelectorAll('svg text')].map(e=>{let opacity=1;for(let p=e;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);const s=getComputedStyle(e);ctx.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;const m=ctx.measureText(e.textContent),anchor=s.textAnchor==='middle'?m.width/2:s.textAnchor==='end'?m.width:0,x=Number(e.getAttribute('x'))-anchor,y=Number(e.getAttribute('y')),matrix=e.getScreenCTM(),corners=[[x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent],[x+m.actualBoundingBoxRight,y-m.actualBoundingBoxAscent],[x-m.actualBoundingBoxLeft,y+m.actualBoundingBoxDescent],[x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix)),xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);return {text:e.textContent,a:opacity,x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}).filter(t=>t.a>=.9);});
   const stable=state.texts.filter(t=>t.a>=.9);for(let i=0;i<inkBounds.length;i++)for(let j=i+1;j<inkBounds.length;j++){const a=inkBounds[i],b=inkBounds[j],w=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),h=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);if(w>3&&h>3)throw Error('Text ink collision at '+f+': '+a.text+' / '+b.text);}
   if(f>=1569&&state.stage==='seller-quote'&&state.price!=='800')throw Error('Seller quote changed');
   for(const text of stable)if(selected.has(text.text)){const hits=readings.get(text.text)??[];hits.push(f);readings.set(text.text,hits);}
   frames.push({frame:f,time:f/30,stage:state.stage,action:state.action,textCount:state.texts.length});
   const bytes=await page.screenshot({type:'jpeg',quality:94});if(!child.stdin.write(bytes))await Promise.race([once(child.stdin,'drain'),done.then(()=>{throw Error(error);})]);
   if((f-1560)%135===0)console.log('Used '+Math.round((f-1560)/5.4)+'%');
  }child.stdin.end();const [code]=await done;if(code!==0)throw Error(error);}catch(e){if(child.exitCode===null)child.kill();throw e;}
  const intervals=[];for(const [text,hits] of readings){let start=hits[0],last=start;for(const n of hits.slice(1)){if(n!==last+1){intervals.push({text,from:start/30,to:(last+1)/30,stableSeconds:(last-start+1)/30});start=n;}last=n;}intervals.push({text,from:start/30,to:(last+1)/30,stableSeconds:(last-start+1)/30});}
  writeJson(path.join(out,'visual-checks.json'),{rangeSeconds:[52,70],framesChecked:540,allTextInsideCanvas:true,noStableTextCollisions:true,sellerQuote800Correct:true,noBlankFrames:true,seams:{at52ExactPreviousSvg:true},readingIntervalsAt90PercentOpacity:intervals,actorActions:[...new Set(frames.map(f=>f.action))],frames});
  fs.copyFileSync(path.join(out,'audit/source-1866.png'),path.join(out,'poster.png'));console.log(JSON.stringify({frames:540,seamPassed:true,actorActions:[...new Set(frames.map(f=>f.action))],readings:intervals}));
 }
}finally{await browser.close();}

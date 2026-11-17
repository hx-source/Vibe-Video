import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {PNG} from 'pngjs';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries} from '../../../scripts/runtime.mjs';
import {sceneBrowser} from './browser.mjs';
const out=path.join(ROOT,'outputs/thinking-anchors/landscape-reason-v1'),old=path.join(ROOT,'outputs/thinking-anchors/landscape-opening-v9'),prior=json(path.join(old,'manifest.json'));
for(const [file,hash] of Object.entries(prior.sources))if(sha(path.join(ROOT,'projects/thinking-anchors/landscape-opening-v9',file))!==hash)throw Error('Approved source changed');
for(const f of prior.files)if(sha(path.join(old,f.file))!==f.sha256)throw Error('Approved preview changed');
const picture=path.join(out,'reason-picture.mp4');if(fs.existsSync(picture))throw Error('Picture exists');
const child=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-t','14','-avoid_negative_ts','disabled','-movflags','+faststart',picture],{windowsHide:true,stdio:['pipe','ignore','pipe']});let error='';child.stderr.on('data',b=>error=(error+b).slice(-5000));child.stdin.on('error',()=>{});const done=once(child,'exit');
const samples=new Set([600,609,625,660,690,720,726,753,810,846,885,930,948,978,1005,1019]),frames=[],readings=new Map(),selected=new Set(['值多少还没查，先拿999比','值不值199？','现成参照','关注的问题，悄悄换了','比999便宜多少？','比999便宜，就显得划算','好像挺划算','该拿什么比？','它到底值多少？','便宜 ≠ 值得买']);
const {browser,page,frame}=await sceneBrowser();let lastSvg;
try{
 await frame(599);const before=await page.locator('svg').first().evaluate(e=>e.outerHTML);await frame(600);if(before!==await page.locator('svg').first().evaluate(e=>e.outerHTML))throw Error('20second handoff mismatch');
 let firstPrice;
 for(let f=600;f<1020;f++){
  await frame(f);const state=await page.evaluate(()=>{const alpha=e=>{let a=1;for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.visibility==='hidden'||s.display==='none')return 0;a*=Number(s.opacity);}return a;};const texts=[...document.querySelectorAll('svg text')].map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height,a:alpha(e)};}).filter(t=>t.a>.08&&t.h>.1);const p=document.querySelector('[data-price="199"] text:last-child'),r=p?.getBoundingClientRect();return {stage:document.querySelector('[data-landscape-scene]').getAttribute('data-stage'),texts,price:p?{text:p.textContent,x:r.x,y:r.y,w:r.width,h:r.height}:null,itemCount:document.querySelectorAll('[data-same-item]').length};});
  if(!state.texts.length||state.texts.some(t=>t.x<-.1||t.y<-.1||t.x+t.w>1920.5||t.y+t.h>1080.5))throw Error('Blank or text outside canvas at '+f);
  if(f>=609){if(!state.price||state.price.text!=='199')throw Error('Actual price missing');firstPrice??=state.price;for(const key of ['x','y','w','h'])if(Math.abs(firstPrice[key]-state.price[key])>1e-4)throw Error('199geometry changed');}
  if(f>=609&&f<1005&&state.itemCount!==1)throw Error('Not one unchanged item');
  for(const t of state.texts.filter(t=>t.a>=.9))if(selected.has(t.text)){const hits=readings.get(t.text)??[];hits.push(f);readings.set(t.text,hits);}
  frames.push({frame:f,time:f/30,stage:state.stage,textCount:state.texts.length});if(samples.has(f))await page.screenshot({path:path.join(out,'audit/source-'+f+'.png')});
  if(f===1019)lastSvg=await page.locator('svg').first().evaluate(e=>e.outerHTML);
  const bytes=await page.screenshot({type:'jpeg',quality:94});if(!child.stdin.write(bytes))await Promise.race([once(child.stdin,'drain'),done.then(()=>{throw Error(error);})]);
  if((f-600)%105===0)console.log('Reason '+Math.round((f-600)/4.2)+'%');
 }
 await frame(1020);if(lastSvg!==await page.locator('svg').first().evaluate(e=>e.outerHTML))throw Error('34second method handoff mismatch');child.stdin.end();const [code]=await done;if(code!==0)throw Error(error);
}catch(e){if(child.exitCode===null)child.kill();throw e;}finally{await browser.close();}
const intervals=[];for(const [text,hits] of readings){let start=hits[0],last=start;for(const n of hits.slice(1)){if(n!==last+1){intervals.push({text,from:start/30,to:(last+1)/30,stableSeconds:(last-start+1)/30});start=n;}last=n;}intervals.push({text,from:start/30,to:(last+1)/30,stableSeconds:(last-start+1)/30});}
writeJson(path.join(out,'visual-checks.json'),{rangeSeconds:[20,34],framesChecked:420,allTextInsideCanvas:true,price199NumberAndGeometryFixed:true,oneItemThroughoutExplanation:true,noBlankFrames:true,seams:{at20ExactPreviousSvg:true,at34ExactNextMethodSvg:true},readingIntervalsAt90PercentOpacity:intervals,frames});
const sheet=new PNG({width:1280,height:1080});[625,690,753,885,978,1019].forEach((f,i)=>{const s=PNG.sync.read(fs.readFileSync(path.join(out,'audit/source-'+f+'.png')));for(let y=0;y<360;y++)for(let x=0;x<640;x++){const a=(y*3*s.width+x*3)*4,b=((Math.floor(i/2)*360+y)*1280+(i%2)*640+x)*4;s.data.copy(sheet.data,b,a,a+4);}});fs.writeFileSync(path.join(out,'storyboard.png'),PNG.sync.write(sheet));fs.copyFileSync(path.join(out,'audit/source-753.png'),path.join(out,'poster.png'));
console.log(JSON.stringify({framesChecked:420,rangeSeconds:[20,34],seamsPassed:true,price199Fixed:true,shortestReading:intervals.reduce((a,b)=>a.stableSeconds<b.stableSeconds?a:b)}));

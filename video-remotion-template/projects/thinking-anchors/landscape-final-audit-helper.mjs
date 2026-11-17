// Full-film layout and pacing audit, invoked by the final revision below.
import fs from 'node:fs';
import path from 'node:path';
import {PNG} from 'pngjs';
import {build} from 'esbuild';
import {ROOT,sha,writeJson} from '../../scripts/files.mjs';
import {sceneBrowser} from './landscape-label-v1/browser.mjs';
export async function auditFinal(){
 const local=path.join(ROOT,'projects/thinking-anchors/landscape-live-final-v1'),out=path.join(ROOT,'outputs/thinking-anchors/landscape-live-final-v1'),audit=path.join(out,'audit'),{browser,page,frame}=await sceneBrowser(),frames=[],reading=new Map(),titleEntryFramesWithoutText=[];
 const samples=[48,201,381,522,576,682,735,861,1041,1203,1392,1551],seamSamples=[508,510,519,598,600,609,1018,1020,1029];
 try{for(let f=0;f<1560;f++){
  await frame(f);const state=await page.evaluate(()=>{const alpha=e=>{let a=1;for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.visibility==='hidden'||s.display==='none')return 0;a*=Number(s.opacity);}return a;};return {stage:document.querySelector('[data-landscape-scene]')?.getAttribute('data-stage')??'concept-title',texts:[...document.querySelectorAll('svg text')].map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height,a:alpha(e)};}).filter(t=>t.a>.08&&t.w>.1&&t.h>.1),actor:document.querySelector('[data-character]')?.getAttribute('data-action')??document.querySelector('[data-character]')?.getAttribute('data-acting')??null};});
  if(!state.texts.length){const titleCardVisible=state.stage==='concept-title'&&f>=510&&f<518&&await page.locator('[data-concept-title] rect[x="250"]').isVisible();if(!titleCardVisible)throw Error('Empty scene at '+f);titleEntryFramesWithoutText.push(f);}
  if(state.texts.some(t=>t.x<-.6||t.y<-.6||t.x+t.w>1920.6||t.y+t.h>1080.6))throw Error('Text outside canvas at '+f);
  for(const t of state.texts.filter(t=>t.a>=.9)){const key=t.text,hits=reading.get(key)??[];hits.push(f);reading.set(key,hits);}frames.push({frame:f,time:f/30,stage:state.stage,actor:state.actor,textCount:state.texts.length});
  if(samples.includes(f)||seamSamples.includes(f))await page.screenshot({path:path.join(audit,'source-'+f+'.png')});
  if(f%390===0)console.log('Full-film visual audit '+Math.round(f/15.6)+'%');
 }
 await frame(599);const before20=await page.locator('svg').first().evaluate(e=>e.outerHTML);await frame(600);const same20=before20===await page.locator('svg').first().evaluate(e=>e.outerHTML);await frame(1019);const before34=await page.locator('svg').first().evaluate(e=>e.outerHTML);await frame(1020);const same34=before34===await page.locator('svg').first().evaluate(e=>e.outerHTML);if(!same20||!same34)throw Error('Chapter seam mismatch');
 const intervals=[];for(const [text,hits] of reading){let start=hits[0],last=start;for(const n of hits.slice(1)){if(n!==last+1){intervals.push({text,from:start/30,to:(last+1)/30,stableSeconds:(last-start+1)/30});start=n;}last=n;}intervals.push({text,from:start/30,to:(last+1)/30,stableSeconds:(last-start+1)/30});}
 const sheet=new PNG({width:1280,height:2160});samples.forEach((f,i)=>{const s=PNG.sync.read(fs.readFileSync(path.join(audit,'source-'+f+'.png')));for(let y=0;y<360;y++)for(let x=0;x<640;x++){const a=(y*3*s.width+x*3)*4,b=((Math.floor(i/2)*360+y)*1280+(i%2)*640+x)*4;s.data.copy(sheet.data,b,a,a+4);}});fs.writeFileSync(path.join(out,'source-storyboard.png'),PNG.sync.write(sheet));
 writeJson(path.join(out,'visual-audit.json'),{framesChecked:1560,allTextInsideCanvas:true,noEmptySceneFrames:true,titleEntryFramesWithoutText,titleEntryExplanation:'概念卡片已可见，文字从透明开始渐显，保留已认可的17秒转场',chapterSeams:{at20ExactSvg:same20,at34ExactSvg:same34},readingIntervalsAt90PercentOpacity:intervals,stages:[...new Set(frames.map(f=>f.stage))],frames});
 }finally{await browser.close();}
 const bundle=await build({entryPoints:['projects/thinking-anchors/landscape-label-v1/entry.tsx'],bundle:true,write:false,metafile:true,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});const sources=Object.fromEntries(Object.keys(bundle.metafile.inputs).filter(f=>!f.startsWith('node_modules/')).map(f=>[f,sha(path.join(ROOT,f))]));for(const f of ['package.json','package-lock.json','projects/thinking-anchors/assets/index.json'])sources[f]=sha(path.join(ROOT,f));writeJson(path.join(local,'visual-source-fingerprints.json'),sources);console.log(JSON.stringify({fullFilmFramesChecked:1560,allTextInsideCanvas:true,seamsPassed:true,referencedSourceCount:Object.keys(sources).length}));
}

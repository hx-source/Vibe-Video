import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries,run} from '../../../scripts/runtime.mjs';
import {sceneBrowser} from './browser.mjs';
const local=path.join(ROOT,'projects/thinking-anchors/landscape-final-v1'),out=path.join(ROOT,'outputs/thinking-anchors/landscape-final-v1'),previous=path.join(ROOT,'outputs/thinking-anchors/landscape-ending-v1');
const snapshot={};for(const folder of ['landscape-opening-v2','landscape-focus-v1','landscape-used-v1','landscape-offer-v1','landscape-ending-v1']){const m=json(path.join(ROOT,'outputs/thinking-anchors',folder,'manifest.json'));for(const [f,h] of Object.entries(m.sources)){const relative='projects/thinking-anchors/'+folder+'/'+f;if(sha(path.join(ROOT,relative))!==h)throw Error('Approved source changed: '+relative);snapshot[relative]=h;}}
const originalDecision=fs.readFileSync(path.join(ROOT,'projects/thinking-anchors/landscape-focus-v1/Decision.tsx'),'utf8');
if(fs.readFileSync(path.join(local,'Decision.tsx'),'utf8').replace("from '../landscape-focus-v1/board.json'","from './board.json'")!==originalDecision)throw Error('Decision layout changed beyond actor reference');
let normalized=fs.readFileSync(path.join(local,'Actor.tsx'),'utf8').replace("from '../landscape-focus-v1/board.json'","from './board.json'").replace(/\n const handRadians=p\.handAngle[\s\S]*?attachment\);/,'').replace('${wristX} ${wristY}','${hx+18} ${hy+70}');
if(normalized!==fs.readFileSync(path.join(ROOT,'projects/thinking-anchors/landscape-focus-v1/Actor.tsx'),'utf8'))throw Error('Character changed beyond wrist connection');
const report=json(path.join(previous,'audio/audio-report.json')),plan=json(path.join(previous,'audio-plan.json'));
const folders={opening:'landscape-opening-v2',decision:'landscape-focus-v1',used:'landscape-used-v1',offer:'landscape-offer-v1',ending:'landscape-ending-v1'},offsets={opening:0,decision:24,used:38,offer:52,ending:64},ends={opening:24,decision:38,used:52,offer:64,ending:74};
const boards=Object.fromEntries(Object.entries(folders).map(([key,f])=>[key,json(path.join(ROOT,'projects/thinking-anchors',f,'board.json'))]));
const timing=[];for(const clip of plan.clips.filter(c=>c.role!=='music')){if(!clip.at?.event)throw Error('Effect without scene event');const [segment,event]=clip.at.event.split('.'),eventTime=offsets[segment]+boards[segment].events[event],at=eventTime+(clip.at.offset??0),compiled=report.plan.clips.find(c=>c.id===clip.id);if(!compiled||Math.abs(compiled.at-at)>1e-7||compiled.at+compiled.duration>ends[segment]+1e-7||compiled.speed!==1)throw Error('Sound outside its picture event '+clip.id);timing.push({id:clip.id,event:clip.at.event,eventTime,at,offset:clip.at.offset??0,duration:compiled.duration,purpose:clip.purpose});}
const music=report.inputs.filter(c=>c.role==='music');if(music.length!==1||music[0].speed!==1||music[0].sourceIn!==0||music[0].sourceOut!==74)throw Error('Music specification changed');
const userMusic='D:/Documents/dy/音频/02_情感话题_故事讲述.m4a';if(sha(userMusic)!==music[0].sha256||sha(path.join(ROOT,'projects/thinking-anchors/assets/storytelling.m4a'))!==music[0].sha256)throw Error('Music is not the selected 02 file');
writeJson(path.join(out,'audit/audio-event-review.json'),{musicSource:userMusic,musicSha256:music[0].sha256,speed:1,sourceRange:[0,74],effectCount:timing.length,maxConcurrentEffects:report.plan.maxConcurrentEffects,allEffectsBoundToPictureEvents:true,allEffectsInsideTheirSegments:true,events:timing,warningDisposition:report.warnings.map(w=>({...w,review:'Original opening cue falls against nearly silent music; relative ratio is not an absolute overload. Keep the accepted cue; final encoded peak is measured separately.'})),assistantListening:'not-performed'});
const picture=path.join(out,'audit/corrected-38-74-picture.mp4');if(fs.existsSync(picture))throw Error('Corrected picture already exists');
const child=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-t','36','-avoid_negative_ts','disabled','-movflags','+faststart',picture],{windowsHide:true,stdio:['pipe','ignore','pipe']});
let error='';child.stderr.on('data',b=>error=(error+b).slice(-5000));child.stdin.on('error',()=>{});const done=once(child,'exit');
const keyFrames=new Set([45,165,285,435,615,714,720,807,894,942,1041,1139,1140,1230,1269,1374,1494,1559,1560,1674,1740,1806,1875,1919,1920,1965,2070,2205]);
const selected=new Set(['199没变，怎么突然就想买了？','一件衣服','有点贵','好像挺划算','价格没变，判断变了','“原价”成了参照','锚定效应','该拿什么比？','先查真实到手价','同款，还要同条件','真的需要？','预算合适？','先不急着买','外壳有磨损','缺充电器','成色相近','配件相近','620—680','出价，先把依据说清楚','这个价不卖','那我再看看','再看看，也可以','直播间：查同款到手价','二手：验商品，查成交','已成交记录','据此谈价','先找依据，再决定','需要吗？','预算合适吗？','也可以不买']);
const hitFrames=new Map(),frameMetrics=[],boundarySvg=new Map(),seams=[];
const {browser,page,frame}=await sceneBrowser();
try{
 for(let f=0;f<2220;f++){
  await frame(f);
  const s=await page.evaluate(()=>{const alpha=e=>{let opacity=1;for(let a=e;a;a=a.parentElement){const p=getComputedStyle(a);if(p.display==='none'||p.visibility==='hidden')return 0;opacity*=Number(p.opacity);}return opacity;};const texts=[...document.querySelectorAll('svg text')].map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height,opacity:alpha(e)};}).filter(t=>t.opacity>.08);return {stage:document.querySelector('[data-landscape-scene]').getAttribute('data-stage'),texts,windowPaths:[...document.querySelectorAll('path')].filter(p=>p.getAttribute('d')==='M-95 439 H65 V1066 H-95 M-95 725 H65 M-15 439 V1066').length};});
  if(s.windowPaths||s.texts.length===0||s.texts.some(t=>t.x<-.01||t.y<-.01||t.x+t.w>1920.5||t.y+t.h>1080.5))throw Error('Visual bounds or blank frame at '+f);
  for(const text of new Set(s.texts.filter(t=>t.opacity>=.9).map(t=>t.text)))if(selected.has(text)){if(!hitFrames.has(text))hitFrames.set(text,[]);hitFrames.get(text).push(f);}
  for(const pair of [['决定权，留给自己','二手砍价，也一样'],['带着依据，再谈价','出价，先把依据说清楚'],['不合适，可以不成交','直播间：查同款到手价']])if(pair.every(text=>s.texts.some(t=>t.text===text)))throw Error('Overlapping primary chapter headings at '+f);
  frameMetrics.push({frame:f,time:f/30,stage:s.stage,visibleTextCount:s.texts.length,visibleCharacterCount:s.texts.reduce((n,t)=>n+t.text.length,0)});
  for(const b of [720,1140,1560,1920]){if(f===b-1)boundarySvg.set(b,await page.locator('svg').first().evaluate(e=>e.outerHTML));if(f===b){const equal=boundarySvg.get(b)===await page.locator('svg').first().evaluate(e=>e.outerHTML);if(!equal)throw Error('Boundary not continuous at '+b/30);seams.push({seconds:b/30,previousAndNextSvgExactlyEqual:true});}}
  if(keyFrames.has(f))await page.screenshot({path:path.join(out,'audit/source-frame-'+f+'.png')});
  if(f>=1140){const bytes=await page.screenshot({type:'jpeg',quality:94});if(!child.stdin.write(bytes))await Promise.race([once(child.stdin,'drain'),done.then(()=>{throw Error(error);})]);}
  if(f%555===0)console.log('Visual review '+Math.round(f/22.2)+'%');
 }
 child.stdin.end();const [code]=await done;if(code!==0)throw Error(error);
}catch(e){if(child.exitCode===null)child.kill();throw e;}finally{await browser.close();}
const reading=[];for(const [text,hits] of hitFrames){let start=hits[0],last=start;for(const f of hits.slice(1)){if(f!==last+1){reading.push({text,from:start/30,to:(last+1)/30,stableSeconds:(last-start+1)/30});start=f;}last=f;}reading.push({text,from:start/30,to:(last+1)/30,stableSeconds:(last-start+1)/30});}
writeJson(path.join(out,'audit/source-visual-review.json'),{framesChecked:2220,noOverlappingPrimaryChapterHeadings:true,allTextInside1920x1080:true,noBlankSourceFrames:true,noOldLeftWindow:true,seams,readingIntervalsAt90PercentOpacity:reading,frameMetrics,correction:{scope:[24,38],change:'wrist attachment follows hand rotation, blended out at original segment endpoints',characterDesignTextAndTimingUnchanged:true,cleanChapterCutsAtSeconds:[38.3,52.3,64.3]},manualVisualReview:'keyframes and transition contact sheets only; full playback is tested separately'});
writeJson(path.join(out,'source-map.json'),{originalSources:snapshot,finalEntry:'projects/thinking-anchors/landscape-final-v1/entry.tsx',finalComposition:'projects/thinking-anchors/landscape-final-v1/Root.tsx',sourceVideo:'outputs/thinking-anchors/landscape-ending-v1/continuity-0-74.mp4',sourceVideoSha256:sha(path.join(previous,'continuity-0-74.mp4')),musicSha256:music[0].sha256});
console.log(JSON.stringify({framesChecked:2220,seams,shortestSelectedStableReading:reading.reduce((a,b)=>a.stableSeconds<b.stableSeconds?a:b),correctedSection:[24,38]}));

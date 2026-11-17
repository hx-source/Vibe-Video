import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../../scripts/files.mjs';
import {loadProject} from '../../../scripts/project.mjs';
import {buildArrangement} from '../../../scripts/arrange-audio.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
import {waveSlice} from '../../../scripts/pcm.mjs';
import {measureLoudness} from '../../../scripts/audio-quality.mjs';
import {validatePortrait} from './contract.mjs';

const local=path.join(ROOT,'projects/thinking-anchors/portrait-decision-v1'),parent=path.dirname(local),name=process.argv.find(a=>a.startsWith('--name='))?.slice(7)??'portrait-decision-v1';
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid revision');
const out=path.join(ROOT,'outputs/thinking-anchors',name),old=path.join(ROOT,'outputs/thinking-anchors/portrait-mechanism-v1'),previous=json(path.join(old,'manifest.json')),data=json(path.join(local,'storyboard.json')),config=validatePortrait(data),render=process.argv.includes('--render');
for(const [f,hash] of Object.entries(previous.sources))if(sha(path.join(parent,'portrait-mechanism-v1',f))!==hash)throw Error('Approved mechanism source changed: '+f);
for(const [f,hash] of Object.entries(previous.opening.sources))if(sha(path.join(parent,'portrait-opening-v2',f))!==hash)throw Error('Approved opening source changed: '+f);
if(sha(path.join(old,'continuity-0-24.mp4'))!==previous.continuityOutput.sha256)throw Error('Approved first 24 seconds changed');
const openingBoard=json(path.join(parent,'portrait-opening-v2/storyboard.json')),mechanismBoard=json(path.join(parent,'portrait-mechanism-v1/storyboard.json'));
Object.assign(config.timeline.events,Object.fromEntries(Object.entries(openingBoard.events).map(([k,t])=>['opening.'+k,t])),Object.fromEntries(Object.entries(mechanismBoard.events).map(([k,t])=>['mechanism.'+k,12+t])));
if(!fs.existsSync(out)){
 reserveOutput('thinking-anchors',name);
 const history=path.join(parent,'history/before-'+name);fs.mkdirSync(history,{recursive:true});for(const f of ['portrait-production.json','delivery-status.json','segment-production.json','README.md'])fs.copyFileSync(path.join(parent,f),path.join(history,f));
 const approval={revision:'portrait-mechanism-v1',rangeSeconds:[12,24],status:'user-approved',feedback:'这部分可以，接下来继续制作24秒之后的内容，衔接“该拿什么比”的问题，讲清楚生活中怎么减少锚定效应的影响，继续保持现在的竖屏漫画风格和动态效果。',video:'outputs/thinking-anchors/portrait-mechanism-v1/video.mp4',sha256:previous.segmentOutput.sha256,userApproved:true,viewingAndListeningNotSeparatelyRecorded:true,scope:'仅认可12–24秒机制段，授权继续制作生活化方法段；不推断新片段已获认可'};writeJson(path.join(parent,'portrait-mechanism-v1-acceptance.json'),approval);
 const p=loadProject('thinking-anchors'),plan=json(path.join(old,'audio-plan.json')),bed=plan.clips.find(c=>c.role==='music');bed.sourceOut=38;
 const fit='沿用02原素材0–38秒原速与音量，前24秒动作声保留；短界面、纸张、铅笔和物件声配合核查与选择动作，无持续扫动和额外旋律；实际听感待反馈';
 const cues=[
  {id:'decision-search',asset:'opening-ui-contact-v1',event:'search',offset:.30,duration:.095,gain:1.6,role:'accent',purpose:'进入查同款价格的搜索界面'},
  {id:'decision-history',asset:'record-paper-1-v1',event:'history',offset:.10,duration:.20,gain:1.15,role:'accent',purpose:'近期常态价219记录出现'},
  {id:'decision-other',asset:'record-paper-2-v1',event:'other',offset:.08,duration:.18034013605442178,gain:1.3,role:'accent',purpose:'其他店到手价189记录接替进入'},
  {id:'decision-compare',asset:'pencil-underline-recorded-v1',event:'compare',offset:.15,duration:.235,gain:.9,role:'accent',purpose:'圈定可比报价并形成比较线'},
  {id:'decision-conditions',asset:'palette-cloth-two',event:'conditions',offset:.08,duration:.4150793650793651,gain:.5,role:'transition',purpose:'同款、运费、售后作为一组核对条件进入'},
  {id:'decision-need',asset:'palette-paper-long',event:'need',offset:.10,duration:.43045351473922905,gain:.7,role:'accent',purpose:'价格记录收起，需求问题进入'},
  {id:'decision-budget',asset:'palette-paper-short',event:'budget',offset:.08,duration:.23061224489795917,gain:.65,role:'accent',purpose:'预算问题随后出现'},
  {id:'decision-choice',asset:'regroup-contact-v2',event:'choice',offset:.20,duration:.11,gain:2.1,role:'end',purpose:'先不急着买的选择落定，人物收手'}
 ];
 for(const c of cues)plan.clips.push({id:c.id,source:'asset:'+c.asset,role:c.role,at:{event:'decision.'+c.event,offset:c.offset},sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,fadeOut:.012,purpose:c.purpose,musicFit:fit});
 writeJson(path.join(out,'audio-plan.json'),plan);writeJson(path.join(out,'input-props.json'),data);
 const impact=structuredClone(p.audioPlan);impact.clips=impact.clips.filter(c=>c.role==='music'||(p.compiledAudio.clips.find(x=>x.id===c.id)?.at??0)>=38);impact.clips.push(...plan.clips.filter(c=>c.role!=='music').map(c=>({...c,at:config.timeline.events[c.at.event]+c.at.offset})));
 writeJson(path.join(local,'audio-impact-proposal.json'),{audioPlan:impact});run(process.execPath,['scripts/music-cli.mjs','impact','--project','thinking-anchors','--proposal','portrait-decision-v1/audio-impact-proposal.json','--name',name+'-impact'],{cwd:ROOT});
 const ir=json(path.join(ROOT,'outputs/thinking-anchors',name+'-impact/impact.json'));if(!ir.canApply||ir.segments.filter(s=>s.changed).some(s=>!['deal','trap','rewind','evidence'].includes(s.id)))throw Error('Unexpected audio impact');
 const resolved={...plan,clips:plan.clips.map(c=>({...c,source:p.assets.get(c.source.slice(6)).path}))};const report=buildArrangement({dir:path.join(parent,'assets'),config,audioPlan:resolved},binaries().ffmpeg,{directory:path.join(out,'audio'),stems:true,quality:true});
 fs.writeFileSync(path.join(out,'segment-mix.wav'),waveSlice(fs.readFileSync(path.join(out,'audio/mix.wav')),24,38));
 if(!waveSlice(fs.readFileSync(path.join(out,'audio/mix.wav')),0,23.82).equals(waveSlice(fs.readFileSync(path.join(old,'audio/mix.wav')),0,23.82)))throw Error('Accepted prefix PCM changed before preview fade');
 const stamp=t=>{const ms=Math.round(t*1000);return '00:'+String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0')+','+String(ms%1000).padStart(3,'0');};
 const srt=caps=>caps.map((c,i)=>[i+1,stamp(c.from)+' --> '+stamp(c.to),c.text,''].join('\n')).join('\n');
 fs.writeFileSync(path.join(out,'captions.srt'),srt(data.captions));fs.writeFileSync(path.join(out,'full-captions.srt'),srt([...openingBoard.captions,...mechanismBoard.captions.map(c=>({...c,from:c.from+12,to:c.to+12})),...data.captions.map(c=>({...c,from:c.from+24,to:c.to+24}))]));
 const analysis=json(path.join(ROOT,'outputs/thinking-anchors/music-portrait-reference-v1/music-analysis.json'));writeJson(path.join(out,'music-reference.json'),{source:analysis.source,beats:analysis.beats.filter(t=>t>=24&&t<38),status:'automatic candidate only, no human listening calibration',musicSourceRange:[0,38],speed:1});
 writeJson(path.join(out,'manifest.json'),{status:'prepared',createdAt:new Date().toISOString(),revision:name,rangeSeconds:[24,38],video:{...data.video,frames:420,duration:14},retained:{approval:'portrait-mechanism-v1-acceptance.json',videoSha256:previous.continuityOutput.sha256,sources:previous.sources,mixUnchangedUntil:23.82,removedPreviewFade:[23.82,24],reason:'让02音乐连续播放，保留原前24秒独立预览'},audio:{mixSha256:report.mixSha256,quality:report.quality,newCues:cues},nativePortrait:true,userApproved:false,assistantListening:'not-performed',impactReport:'outputs/thinking-anchors/'+name+'-impact/impact.json'});
}
const manifest=json(path.join(out,'manifest.json'));if(fs.existsSync(path.join(out,'video.mp4')))throw Error('Completed output exists');
const compiled=await build({entryPoints:['projects/thinking-anchors/portrait-decision-v1/entry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
let css='body{margin:0}';for(const weight of [400,700]){const d=path.join(ROOT,'node_modules/@fontsource/noto-sans-sc');css+=fs.readFileSync(path.join(d,weight+'.css'),'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join(d,f)).toString('base64')})`);}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});let encoder;
try{
 const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});await page.setContent(`<style>${css}</style><div id="root"></div>`);await page.addScriptTag({content:compiled.outputFiles[0].text});
 const frame=async f=>{await page.evaluate(f=>window.renderPortrait(f),f);await page.evaluate(()=>document.fonts.ready);};
 const preserved=[];
 for(const f of [360,405,480,550,615,690,719]){
  await frame(f);const bytes=await page.screenshot(),prior=fs.readFileSync(path.join(old,`frame-${f}.png`));let changedPixels=0,maxChannelDelta=0;
  if(!bytes.equals(prior)){const a=PNG.sync.read(prior),b=PNG.sync.read(bytes);for(let i=0;i<a.data.length;i+=4){let delta=0;for(let c=0;c<4;c++)delta=Math.max(delta,Math.abs(a.data[i+c]-b.data[i+c]));if(delta){changedPixels++;maxChannelDelta=Math.max(maxChannelDelta,delta);}}}
  preserved.push({frame:f,changedPixels,maxChannelDelta});
  // Raster differences are diagnostic: Chromium can vary edge compositing by
  // a few levels after different frame traversal. The delivered opening uses
  // the accepted bitstream and must pass strict decoded-pixel hashing below.
 }
 await frame(719);const last=await page.screenshot();await frame(720);const carried=await page.screenshot();let boundaryPixels=0,boundaryMaxDelta=0;
 if(!last.equals(carried)){const a=PNG.sync.read(last),b=PNG.sync.read(carried);for(let i=0;i<a.data.length;i+=4){let d=0;for(let c=0;c<4;c++)d=Math.max(d,Math.abs(a.data[i+c]-b.data[i+c]));if(d){boundaryPixels++;boundaryMaxDelta=Math.max(boundaryMaxDelta,d);}}}
 writeJson(path.join(out,'boundary-check.json'),{boundaryPixels,boundaryMaxDelta});if(boundaryPixels>128||boundaryMaxDelta>2){fs.writeFileSync(path.join(out,'boundary-mismatch.png'),carried);throw Error('24s carry differs: '+boundaryPixels+'px, '+boundaryMaxDelta+' levels');}
 const checks=[],saved=new Set([719,720,728,729,750,780,792,810,840,858,885,900,921,930,945,969,990,1005,1014,1035,1065,1100,1125,1139]);
 for(let f=720;f<1140;f++){
  await frame(f);
  const c=await page.evaluate(()=>{
   const visible=e=>{let p=1;for(let a=e;a;a=a.parentElement){const s=getComputedStyle(a);if(s.display==='none'||s.visibility==='hidden')return false;p*=Number(s.opacity);}return p>.1;};
   const ctx=document.createElement('canvas').getContext('2d');
   const texts=[...document.querySelectorAll('svg text')].filter(visible).map(e=>{const s=getComputedStyle(e);ctx.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;ctx.textAlign=s.textAnchor==='middle'?'center':s.textAnchor==='end'?'right':'left';ctx.textBaseline='alphabetic';const m=ctx.measureText(e.textContent),x=Number(e.getAttribute('x')??0),y=Number(e.getAttribute('y')??0),matrix=e.getScreenCTM(),corners=[[x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent],[x+m.actualBoundingBoxRight,y-m.actualBoundingBoxAscent],[x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent],[x-m.actualBoundingBoxLeft,y+m.actualBoundingBoxDescent]].map(([a,b])=>new DOMPoint(a,b).matrixTransform(matrix));return {text:e.textContent,b:{x:Math.min(...corners.map(p=>p.x)),y:Math.min(...corners.map(p=>p.y)),right:Math.max(...corners.map(p=>p.x)),bottom:Math.max(...corners.map(p=>p.y))}};});
   const collisions=[];for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i],b=texts[j];if(Math.min(a.b.right,b.b.right)-Math.max(a.b.x,b.b.x)>3&&Math.min(a.b.bottom,b.b.bottom)-Math.max(a.b.y,b.b.y)>3)collisions.push([a.text,b.text]);}
   return {stage:document.querySelector('[data-stage]').dataset.stage,texts,collisions,outside:texts.filter(t=>t.b.x<72||t.b.right>930||t.b.y<160||t.b.bottom>1560).map(t=>t.text)};
  });checks.push({frame:f,time:f/30,...c});if(saved.has(f))await page.screenshot({path:path.join(out,`frame-${f}.png`)});
 }
 fs.writeFileSync(path.join(out,'frame-719.png'),last);const issues=checks.filter(c=>c.outside.length||c.collisions.length);writeJson(path.join(out,'visual-checks.json'),{sampleCount:420,everyFrame:true,openingFrames:preserved,openingFrameComparison:'diagnostic only; source hashes and delivered decoded prefix checked strictly',boundaryCarry:{changedPixels:boundaryPixels,maxChannelDelta:boundaryMaxDelta,method:'Same terminal source frame; at most 128 pixels, at most 2 levels of Chromium edge roundoff'},checks,issues});
 const png=new PNG({width:1080,height:1280});png.data.fill(255);[720,792,858,930,1005,1125].forEach((f,k)=>{const p=PNG.sync.read(fs.readFileSync(path.join(out,`frame-${f}.png`)));for(let y=0;y<640;y++)for(let x=0;x<360;x++)p.data.copy(png.data,((Math.floor(k/3)*640+y)*1080+k%3*360+x)*4,(y*3*1080+x*3)*4,(y*3*1080+x*3)*4+4);});fs.writeFileSync(path.join(out,'storyboard.png'),PNG.sync.write(png));fs.copyFileSync(path.join(out,'frame-930.png'),path.join(out,'poster.png'));
 if(issues.length)throw Error('Layout issues: '+JSON.stringify(issues.map(c=>({time:c.time,outside:c.outside,collisions:c.collisions})).slice(0,10)));
 await frame(930);const deterministic=await page.screenshot(),firstMarkup=await page.locator('[data-portrait-scene]').first().evaluate(e=>e.outerHTML);await frame(1139);await frame(0);await frame(930);const afterRewind=await page.screenshot(),secondMarkup=await page.locator('[data-portrait-scene]').first().evaluate(e=>e.outerHTML);
 if(firstMarkup!==secondMarkup)throw Error('Rewinding changed the SVG scene');
 let rewindPixels=0,rewindMaxDelta=0;if(!deterministic.equals(afterRewind)){const a=PNG.sync.read(deterministic),b=PNG.sync.read(afterRewind);for(let i=0;i<a.data.length;i+=4){let d=0;for(let c=0;c<4;c++)d=Math.max(d,Math.abs(a.data[i+c]-b.data[i+c]));if(d){rewindPixels++;rewindMaxDelta=Math.max(rewindMaxDelta,d);}}}
 manifest.sources=Object.fromEntries(['Decision.tsx','entry.tsx','Root.tsx','storyboard.json','contract.mjs','render.mjs'].map(f=>[f,sha(path.join(local,f))]));manifest.visualChecks={all420Frames:true,openingFrames:preserved,boundaryCarry:{changedPixels:boundaryPixels,maxChannelDelta:boundaryMaxDelta},rewindSvgIdentical:true,rewindRaster:{changedPixels:rewindPixels,maxChannelDelta:rewindMaxDelta}};writeJson(path.join(out,'manifest.json'),manifest);
 if(render){
  const movie=path.join(out,'video.mp4');encoder=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',path.join(out,'segment-mix.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',movie],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let errors='';encoder.stderr.on('data',b=>errors=(errors+b).slice(-6000));encoder.stdin.on('error',()=>{});const done=once(encoder,'exit');for(let f=720;f<1140;f++){await frame(f);const bytes=await page.screenshot({type:'jpeg',quality:94});if(!encoder.stdin.write(bytes))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error(errors);})]);if((f-720)%105===0)console.log(`Decision ${(f-720)/4.2}%`);}encoder.stdin.end();const [code]=await done;if(code!==0)throw Error(errors);
  decode(movie);writeJson(path.join(out,'probe.json'),probe(movie));const encoded=measureLoudness(movie,binaries().ffmpeg);if(encoded.silent||encoded.truePeakDb>-1||Math.abs(encoded.integratedLufs+18)>3)throw Error('Encoded mechanism audio outside policy');writeJson(path.join(out,'encoded-audio-quality.json'),encoded);
  const concat=path.join(out,'concat.txt');fs.writeFileSync(concat,[path.join(old,'continuity-0-24.mp4'),movie].map(f=>`file '${f.replaceAll('\\','/')}'`).join('\n')+'\n');const joined=path.join(out,'continuity-0-38.mp4');run(binaries().ffmpeg,['-v','error','-n','-f','concat','-safe','0','-i',concat,'-i',path.join(out,'audio/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','38','-movflags','+faststart',joined]);
  const offset=Number(probe(joined).streams.find(s=>s.codec_type==='video').start_time??0);if(offset>1e-6){const aligned=path.join(out,'continuity-aligned.mp4');run(binaries().ffmpeg,['-v','error','-n','-itsoffset',String(-offset),'-i',joined,'-i',path.join(out,'audio/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','38','-avoid_negative_ts','disabled','-movflags','+faststart',aligned]);fs.renameSync(joined,path.join(out,'continuity-before-timestamp-normalization.mp4'));fs.renameSync(aligned,joined);}
  decode(joined);const p=probe(joined),v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');if(v.width!==1080||v.height!==1920||Number(v.nb_frames)!==1140||v.avg_frame_rate!=='30/1'||!a||Math.abs(Number(v.start_time))>1e-6||Math.abs(Number(a.start_time))>1e-6||Math.abs(Number(p.format.duration)-38)>.01)throw Error('Invalid joined portrait');
  const pixels=f=>run(binaries().ffmpeg,['-v','error','-i',f,'-map','0:v:0','-frames:v','720','-pix_fmt','yuv420p','-f','hash','-hash','sha256','-']).trim();const prefix=pixels(path.join(old,'continuity-0-24.mp4'));if(pixels(joined)!==prefix)throw Error('Accepted opening decoded pixels changed');
  const fullQuality=measureLoudness(joined,binaries().ffmpeg);if(fullQuality.silent||fullQuality.truePeakDb>-1)throw Error('Invalid joined sound');writeJson(path.join(out,'continuity-probe.json'),p);writeJson(path.join(out,'continuity-encoded-audio.json'),fullQuality);
  manifest.status='rendered-and-decoded';manifest.segmentOutput={file:'video.mp4',sha256:sha(movie),frames:420,duration:14};manifest.continuityOutput={file:'continuity-0-38.mp4',sha256:sha(joined),frames:1140,duration:38,openingPixelHash:prefix,acceptedOpeningDecodedPixelsUnchanged:true};manifest.encodedAudioQuality=encoded;writeJson(path.join(out,'manifest.json'),manifest);console.log(JSON.stringify({out,newRange:[24,38],joinedDuration:38,quality:fullQuality}));
 }
}catch(e){if(encoder?.exitCode===null)encoder.kill();throw e;}finally{await browser.close();}
console.log('Portrait mechanism QA prepared');

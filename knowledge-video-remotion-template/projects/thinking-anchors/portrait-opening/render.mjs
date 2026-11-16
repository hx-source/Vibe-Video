import fs from 'node:fs';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../../scripts/files.mjs';
import {loadProject} from '../../../scripts/project.mjs';
import {buildArrangement} from '../../../scripts/arrange-audio.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
import {measureLoudness} from '../../../scripts/audio-quality.mjs';
import {validatePortrait} from './contract.mjs';

const local=path.join(ROOT,'projects/thinking-anchors/portrait-opening'),parent=path.dirname(local);
const revision=process.argv.find(v=>v.startsWith('--name='))?.slice(7)??'portrait-opening-v1';
if(!/^[a-z0-9-]+$/.test(revision))throw Error('Invalid revision');
const out=path.join(ROOT,'outputs/thinking-anchors',revision),data=json(path.join(local,'storyboard.json')),config=validatePortrait(data),render=process.argv.includes('--render');
const baseline=loadProject('thinking-anchors'),formal=['project.json','storyboard.json','captions.json','audio-ending-v1.json','scenes/AnchorLiveOpening.tsx','scenes/OpeningActors.tsx'];
const protectedHashes=Object.fromEntries(formal.map(f=>[f,sha(path.join(parent,f))]));
const musicFit='保留02原素材0–12秒、原速、gain0.64；四个短声音只对应价格揭示、心动、另一家报价和比较线，无持续扫动或额外旋律；候选听感需用户看片确认';
const clips=[
 {id:'continuous-bed',role:'music',source:'asset:anchors-bed',at:0,sourceIn:0,sourceOut:12,speed:1,gain:.64,fadeIn:.45,fadeOut:.18},
 {id:'portrait-sale',role:'accent',source:'asset:palette-paper-short',at:{event:'opening.drop',offset:.23},sourceIn:0,sourceOut:.23061224489795917,speed:1,gain:.75,fadeOut:.012,purpose:'199在999缩小后进入，一次短纸张声跟随主价格展开',musicFit},
 {id:'portrait-delight',role:'accent',source:'asset:opening-ui-contact-v1',at:{event:'opening.happy',offset:.12},sourceIn:0,sourceOut:.095,speed:1,gain:1.4,fadeOut:.012,purpose:'省了800的想法膨胀，轻短提示对应心动',musicFit},
 {id:'portrait-other',role:'accent',source:'asset:palette-paper-long',at:{event:'opening.other',offset:.08},sourceIn:0,sourceOut:.43045351473922905,speed:1,gain:.7,fadeOut:.012,purpose:'同款同条件189进入，一次纸张声强调新证据',musicFit},
 {id:'portrait-compare',role:'accent',source:'asset:pencil-underline-recorded-v1',at:{event:'opening.compare',offset:.12},sourceIn:0,sourceOut:.235,speed:1,gain:.9,fadeOut:.012,purpose:'199与189下方比较线画出，短铅笔声跟随绘线',musicFit}
];
const plan={schemaVersion:2,sampleRate:44100,masterGain:.9,buses:{music:1,accent:1},reviewPolicy:{maxConcurrentEffects:1,maxProcessSeconds:1},qualityPolicy:{targetLufs:-18,lufsTolerance:3,maxTruePeakDb:-1,minEffectRelativeDb:-12,maxEffectRelativeDb:8},clips,cues:[],rhythms:[],ducking:[]};
if(!fs.existsSync(out)){
 reserveOutput('thinking-anchors',revision);writeJson(path.join(out,'input-props.json'),data);writeJson(path.join(out,'audio-plan.json'),plan);
 const resolve=c=>typeof c.at==='number'?c.at:config.timeline.events[c.at.event]+(c.at.offset??0);
 const impact=structuredClone(baseline.audioPlan);impact.clips=impact.clips.filter(c=>c.role==='music'||(baseline.compiledAudio.clips.find(x=>x.id===c.id)?.at??0)>=14);impact.clips.push(...clips.filter(c=>c.role!=='music').map(c=>({...c,at:resolve(c)})));
 writeJson(path.join(local,'audio-impact-proposal.json'),{audioPlan:impact});
 const impactName=revision+'-impact';
 run(process.execPath,['scripts/music-cli.mjs','impact','--project','thinking-anchors','--proposal','portrait-opening/audio-impact-proposal.json','--name',impactName],{cwd:ROOT});
 const impactReport=json(path.join(ROOT,'outputs/thinking-anchors',impactName,'impact.json'));if(!impactReport.canApply||impactReport.segments.filter(s=>s.changed).some(s=>s.id!=='deal'))throw Error('Unexpected audio impact outside opening');
 writeJson(path.join(out,'impact-summary.json'),{scope:'isolated native-portrait candidate; no apply to approved landscape project',audioImpact:'outputs/thinking-anchors/'+impactName+'/impact.json',affected:impactReport.segments.filter(s=>s.changed).map(s=>s.id),baseline:impactReport.baselineFingerprint,candidate:impactReport.candidateFingerprint,mainProjectUnchanged:true,portraitCompositionSeparatelyValidated:true});
 const resolved={...plan,clips:clips.map(c=>({...c,source:baseline.assets.get(c.source.slice(6)).path}))};
 const report=buildArrangement({dir:path.join(parent,'assets'),config,audioPlan:resolved},binaries().ffmpeg,{directory:path.join(out,'audio'),stems:true,quality:true});
 const analysis=json(path.join(ROOT,'outputs/thinking-anchors/music-portrait-reference-v1/music-analysis.json'));
 writeJson(path.join(out,'music-reference.json'),{source:analysis.source,algorithm:analysis.algorithm,bpmCandidate:analysis.bpm,confidence:analysis.confidence,sourceBeats:analysis.beats.filter(t=>t<12),localTempoCandidates:analysis.localTempo.filter(w=>w.from<12),mappedStarts:['drop','happy','check','other','compare'].map(event=>{const time=data.events[event],near=analysis.beats.reduce((a,b)=>Math.abs(a-time)<Math.abs(b-time)?a:b);return {event:'opening.'+event,time,nearestCandidateBeat:near,offset:time-near,landmark:'start'};}),reviewStatus:'automatic candidate only; half/double tempo, meter and local drift not verified by listening',manualListening:false,sourceSpeed:1});
 const sources=Object.fromEntries(['Opening.tsx','entry.tsx','Root.tsx','storyboard.json','contract.mjs','render.mjs'].map(f=>[f,sha(path.join(local,f))]));
 writeJson(path.join(out,'manifest.json'),{createdAt:new Date().toISOString(),status:'prepared',scope:'12-second native portrait opening prototype',video:{...data.video,frames:360,duration:12},nativePortrait:true,adapter:'project-scoped React/SVG portrait registry, props validator and Remotion Composition; shared 16:9 contract unchanged',sources,protectedHashes,audioSourceAssets:clips.map(c=>baseline.assets.get(c.source.slice(6))).map(a=>({id:a.id,path:a.path,source:a.source,license:a.license,sha256:sha(a.diskPath)})),audio:{plan:'audio-plan.json',mixSha256:report.mixSha256,quality:report.quality},noNarration:true,userApproval:false,assistantListening:'not-performed'});
 const stamp=s=>{const ms=Math.round(s*1000),h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,sec=Math.floor(ms/1000)%60;return [h,m,sec].map(v=>String(v).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');};
 fs.writeFileSync(path.join(out,'captions.srt'),data.captions.map((c,i)=>`${i+1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.text}\n`).join('\n'));
}
const manifest=json(path.join(out,'manifest.json'));if(fs.existsSync(path.join(out,'video.mp4')))throw Error('Do not overwrite a completed prototype');
const result=await build({entryPoints:['projects/thinking-anchors/portrait-opening/entry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
let css='body{margin:0}';for(const weight of [400,700]){const dir=path.join(ROOT,'node_modules/@fontsource/noto-sans-sc');css+=fs.readFileSync(path.join(dir,weight+'.css'),'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join(dir,f)).toString('base64')})`);}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});let encoder;
try{
 const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});await page.setContent(`<style>${css}</style><div id="root"></div>`);await page.addScriptTag({content:result.outputFiles[0].text});
 const frame=async f=>{await page.evaluate(f=>window.renderPortrait(f),f);await page.evaluate(()=>document.fonts.ready);};
 const checks=[],saved=new Set([0,35,47,61,75,94,106,130,160,174,189,201,218,245,275,285,300,330,359]);
 for(let f=0;f<360;f++){
  await frame(f);
  const c=await page.evaluate(()=>{
   const opacity=e=>{let p=1;for(let a=e;a;a=a.parentElement)p*=Number(getComputedStyle(a).opacity);return p;};
   // Noto Sans SC's line boxes include large empty ascender/descender space.
   // Use measured glyph ink transformed into screen coordinates for collisions.
   const ctx=document.createElement('canvas').getContext('2d');
   const texts=[...document.querySelectorAll('svg text')].filter(e=>opacity(e)>.1).map(e=>{
    const s=getComputedStyle(e);ctx.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;ctx.textAlign=s.textAnchor==='middle'?'center':s.textAnchor==='end'?'right':'left';ctx.textBaseline='alphabetic';
    const m=ctx.measureText(e.textContent),x=Number(e.getAttribute('x')??0),y=Number(e.getAttribute('y')??0),matrix=e.getScreenCTM();
    const corners=[[x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent],[x+m.actualBoundingBoxRight,y-m.actualBoundingBoxAscent],[x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent],[x-m.actualBoundingBoxLeft,y+m.actualBoundingBoxDescent]].map(([a,b])=>new DOMPoint(a,b).matrixTransform(matrix));
    const b={x:Math.min(...corners.map(p=>p.x)),y:Math.min(...corners.map(p=>p.y)),right:Math.max(...corners.map(p=>p.x)),bottom:Math.max(...corners.map(p=>p.y))};
    return {text:e.textContent,b,lineBox:e.getBoundingClientRect().toJSON()};
   });
   const collisions=[];for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i],b=texts[j];if(Math.min(a.b.right,b.b.right)-Math.max(a.b.x,b.b.x)>3&&Math.min(a.b.bottom,b.b.bottom)-Math.max(a.b.y,b.b.y)>3)collisions.push([a.text,b.text]);}
   return {stage:document.querySelector('[data-stage]').dataset.stage,texts,outside:texts.filter(x=>x.b.x<72||x.b.right>930||x.b.y<160||x.b.bottom>1560).map(x=>x.text),collisions};
  });checks.push({frame:f,time:f/30,...c});
  if(saved.has(f))await page.screenshot({path:path.join(out,`frame-${f}.png`)});
 }
 const issues=checks.filter(c=>c.outside.length||c.collisions.length);writeJson(path.join(out,'visual-checks.json'),{sampleCount:360,everyFrame:true,safeArea:data.safeArea,checks,issues});
 function sheet(){const frames=[0,75,130,218,300,359],w=360,h=640,png=new PNG({width:w*3,height:h*2});png.data.fill(255);frames.forEach((f,k)=>{const p=PNG.sync.read(fs.readFileSync(path.join(out,`frame-${f}.png`)));for(let y=0;y<h;y++)for(let x=0;x<w;x++){const source=(y*3*1080+x*3)*4,target=((Math.floor(k/3)*h+y)*png.width+(k%3)*w+x)*4;p.data.copy(png.data,target,source,source+4);}});fs.writeFileSync(path.join(out,'storyboard.png'),PNG.sync.write(png));}
 sheet();fs.copyFileSync(path.join(out,'frame-75.png'),path.join(out,'poster.png'));
 if(issues.length)throw Error('Portrait layout issues: '+JSON.stringify(issues.map(x=>({frame:x.frame,outside:x.outside,collisions:x.collisions})).slice(0,12)));
 await frame(130);const a=await page.screenshot();await frame(359);await frame(0);await frame(130);if(!a.equals(await page.screenshot()))throw Error('Portrait rewind is not deterministic');
 for(const [f,hash] of Object.entries(protectedHashes))if(sha(path.join(parent,f))!==hash)throw Error('Formal project changed: '+f);
 manifest.sources=Object.fromEntries(['Opening.tsx','entry.tsx','Root.tsx','storyboard.json','contract.mjs','render.mjs'].map(f=>[f,sha(path.join(local,f))]));manifest.visualChecks={everyFrame:true,samples:360,textCollisions:0,safeAreaViolations:0,rewindDeterministic:true};
 writeJson(path.join(out,'manifest.json'),manifest);
 if(render){
  const movie=path.join(out,'video.mp4');encoder=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',path.join(out,'audio/mix.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','12','-movflags','+faststart',movie],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let errors='';encoder.stderr.on('data',b=>errors=(errors+b).slice(-5000));encoder.stdin.on('error',()=>{});const done=once(encoder,'exit');
  for(let f=0;f<360;f++){await frame(f);const bytes=await page.screenshot({type:'jpeg',quality:94});if(!encoder.stdin.write(bytes))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error(errors);})]);if(f%90===0)console.log(`Portrait ${f/3.6}%`);}
  encoder.stdin.end();const [code]=await done;if(code!==0)throw Error(errors);decode(movie);const p=probe(movie),v=p.streams.find(s=>s.codec_type==='video'),au=p.streams.find(s=>s.codec_type==='audio');
  if(v.width!==1080||v.height!==1920||Number(v.nb_frames)!==360||v.avg_frame_rate!=='30/1'||!au||Math.abs(Number(p.format.duration)-12)>.01||Math.abs(Number(v.start_time))>1e-6||Math.abs(Number(au.start_time))>1e-6)throw Error('Invalid portrait movie');
  const quality=measureLoudness(movie,binaries().ffmpeg);if(quality.silent||quality.truePeakDb>-1||Math.abs(quality.integratedLufs+18)>3)throw Error('Encoded sound requires review');writeJson(path.join(out,'probe.json'),p);writeJson(path.join(out,'encoded-audio-quality.json'),quality);
  manifest.status='portrait-prototype-rendered-and-decoded';manifest.output={file:'video.mp4',sha256:sha(movie),...manifest.video};manifest.encodedAudioQuality=quality;writeJson(path.join(out,'manifest.json'),manifest);
  console.log(JSON.stringify({out,video:manifest.video,quality,protectedFormalProject:true}));
 }
}catch(e){if(encoder?.exitCode===null)encoder.kill();throw e;}finally{await browser.close();}
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>锚定效应 · 竖屏开头12秒样片</title><style>body{background:#fff8e9;color:#25252b;max-width:940px;margin:26px auto;padding:0 20px;font:17px/1.7 system-ui}h1{font-size:26px}.phone{max-width:380px;margin:20px auto}video{width:100%;display:block;border:3px solid #25252b;border-radius:14px;box-sizing:border-box}button{font:inherit;padding:7px 12px;margin:5px;border:2px solid #25252b;background:#e3f4ec;border-radius:8px;cursor:pointer}a{color:#246c62}p{color:#666258}.controls{text-align:center}</style><h1>锚定效应 · 竖屏开头方向样片</h1><p>12秒 · 9:16 · 漫画风格 · 02背景音乐。价格先成为主角，再通过人物的心动与迟疑展现判断变化。</p><div class="phone"><video id="film" src="video.mp4" poster="poster.png" controls playsinline preload="metadata"></video></div><div class="controls"><button data-time="0">从头看</button><button data-time="1.56">降到199</button><button data-time="3.16">感觉省了800</button><button data-time="5.8">另一家189</button><button data-time="9.5">重新比较</button><button id="loop">循环播放</button></div><p><a href="video.mp4" download="锚定效应_竖屏开头12秒.mp4">下载样片</a> · <a href="audio/music.wav">仅背景音乐</a> · <a href="audio/effects.wav">仅动作音效</a> · <a href="captions.srt">可选字幕</a> · <a href="storyboard.png">关键画面</a></p><details><summary>样片说明</summary><p>金额均为虚构示例，999是直播间标注原价，“省了800”是人物想法，未核实原价。189假设同款同条件，仅用来制造比较参照变化。此处是开头，原理和减少影响的方法将在后续展开。</p><p>音频同步、响度和峰值采用技术检查；助手未实际听音。音乐候选拍表未标记为人工校正。末尾0.18秒淡出仅用于独立样片边界。原70秒横屏视频及正式配置保留，本样片待用户反馈。</p></details><script>const v=document.getElementById('film');document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>{v.currentTime=Number(b.dataset.time);v.play();});document.getElementById('loop').onclick=e=>{v.loop=!v.loop;e.target.textContent=v.loop?'关闭循环':'循环播放';};</script></html>`);
console.log('Portrait audit ready: '+out);

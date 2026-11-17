// Project-local production: layout review, verified reuse of an approved sample,
// then chapter-by-chapter video encoding and a continuous full-film audio mux.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {ROOT,inside,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {prepare} from '../../scripts/prepare.mjs';
import {designFingerprint} from '../../scripts/design-plan.mjs';
import {recordSampleReview,requireFullFilmApproval} from '../../scripts/design-workflow.mjs';
import {binaries,decode,probe,run} from '../../scripts/runtime.mjs';
import {measureLoudness,qualityAssessment} from '../../scripts/audio-quality.mjs';

const [command,name,layoutName]=process.argv.slice(2);
if(!['check','render'].includes(command)||!/^[a-z0-9][a-z0-9-]*$/.test(name??''))throw Error('Usage: check <new-name> | render <new-name> <passed-layout-name>');
const p=loadProject('thinking-anchors');
if(p.visual?.id!=='comic'||p.timeline.fps!==30||p.project.video.width!==1920||p.project.video.height!==1080)throw Error('Expected selected 1080p/30 comic project');
const fingerprint=designFingerprint(p),approved=json(path.join(p.dir,'approved-sample.json'));
const oldOutput=inside(ROOT,approved.approvedOutput);
if(approved.record.state!=='approved'||sha(path.join(oldOutput,'video.mp4'))!==approved.videoSha256||sha(path.join(p.dir,approved.preserveScene))!==approved.preserveSceneSha256||sha(path.join(p.dir,'scenes/AnchorLifeScene.tsx'))!==approved.preserveArtSha256)throw Error('Approved sample or scene dependencies changed; review that change first');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=b=>createHash('sha256').update(b).digest('hex');

async function openCanvas(){
  const result=await build({entryPoints:['projects/thinking-anchors/style-entry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
  let css='body{margin:0}';
  for(const weight of [400,700]){
    const dir='node_modules/@fontsource/noto-sans-sc';
    css+=fs.readFileSync(`${dir}/${weight}.css`,'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(`${dir}/${f}`).toString('base64')})`);
  }
  const browser=await chromium.launch({executablePath:process.env.KNOWLEDGE_VIDEO_BROWSER??'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await page.setContent(`<html><head><style>${css}</style></head><body><div id="root"></div></body></html>`);
  await page.addScriptTag({content:result.outputFiles[0].text});
  return {browser,page};
}
async function show(page,data,f){
  await page.evaluate(({data,f})=>window.renderFrame(data,f),{data,f});
  await page.evaluate(()=>document.fonts.ready);
}
async function layout(page){
  return page.evaluate(()=>{
    const overflow=[...document.querySelectorAll('[data-fit]')].filter(e=>e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2).map(e=>e.textContent);
    const visible=e=>{for(let el=e;el;el=el.parentElement)if(Number(getComputedStyle(el).opacity)<.01)return false;return true;};
    const boxes=[...document.querySelectorAll('svg text')].filter(visible).map(e=>({text:e.textContent,b:e.getBoundingClientRect().toJSON()}));
    const outside=boxes.filter(({b})=>b.x<80||b.y<45||b.right>1840||b.bottom>1025).map(x=>x.text),collisions=[];
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i].b,b=boxes[j].b;
      if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>2)collisions.push([boxes[i].text,boxes[j].text]);
    }
    const bottomCaptions=[...document.querySelectorAll('[data-caption]')].map(e=>e.textContent);
    return {overflow,outside,collisions,bottomCaptions};
  });
}
if(command==='check'){
  const output=reserveOutput(p.id,name),range={from:0,to:p.timeline.durationInFrames,durationInFrames:p.timeline.durationInFrames};
  const data={project:p.project,timeline:p.timeline,theme:p.theme,visual:p.visual,assets:{},audio:{silent:false,variants:[]},range};
  writeJson(path.join(output,'layout-input.json'),data);
  const {browser,page}=await openCanvas();
  const checks=[],proof=[];
  try{
    const frames=new Set();
    for(let f=0;f<range.to;f+=3)frames.add(f);
    for(const s of p.timeline.segments){
      for(const f of [s.startFrame,s.startFrame+1,s.endFrame-1,s.endFrame-2])frames.add(f);
      for(const sec of Object.values(s.events))for(const offset of [-1,0,1,4,16])frames.add(Math.max(s.startFrame,Math.min(s.endFrame-1,Math.round((s.startSeconds+sec)*30)+offset)));
    }
    let last='';
    for(const f of [...frames].sort((a,b)=>a-b)){
      await show(page,data,f);
      const report=await layout(page),s=p.timeline.segments.find(s=>f>=s.startFrame&&f<s.endFrame);
      if(s.id!==last){last=s.id;console.log(`Checking ${last}`);}
      if(Object.values(report).some(x=>x.length)){
        await page.screenshot({path:path.join(output,`failure-${f}.png`)});
        writeJson(path.join(output,'layout-failure.json'),{frame:f,seconds:f/30,segment:s.id,...report});
        throw Error(`Layout failure ${f} (${s.id}): ${JSON.stringify(report)}`);
      }
      checks.push({frame:f,segment:s.id});
    }
    for(const s of p.timeline.segments){
      const f=Math.min(s.endFrame-1,Math.round((s.startSeconds+s.durationSeconds*.88)*30));
      await show(page,data,f);await page.screenshot({path:path.join(output,`${s.id}.png`)});
    }
    // Preserve actual accepted content, not merely the fact that a sample passed.
    const oldData=json(path.join(oldOutput,'input-props.json')).data;
    const currentEvidence=p.timeline.segments.find(s=>s.id==='evidence'),oldEvidence=oldData.timeline.segments.find(s=>s.id==='evidence');
    if(JSON.stringify(currentEvidence)!==JSON.stringify(oldEvidence)||JSON.stringify(p.theme)!==JSON.stringify(oldData.theme)||JSON.stringify(p.visual)!==JSON.stringify(oldData.visual))throw Error('Accepted sample render context changed');
    for(const f of [1020,1080,1170,1290,1319]){
      await show(page,data,f);const bytes=await page.screenshot({type:'png'}),expected=sha(path.join(oldOutput,`frame-${f}.png`));
      const identical=hash(bytes)===expected;proof.push({frame:f,sha256:hash(bytes),expected,identical});
      if(!identical)throw Error(`Accepted frame ${f} differs`);
    }
    await show(page,data,1290);const before=hash(await page.screenshot({type:'png'}));
    await show(page,data,0);await show(page,data,1290);
    if(before!==hash(await page.screenshot({type:'png'})))throw Error('Rewind changed accepted frame');
  }finally{await browser.close();}
  // Rebind byte-identical approved media to the new full-project fingerprint.
  const sampleOutput=reserveOutput(p.id,`sample-reused-${name}`);
  const ready=prepare(p,sampleOutput,{from:34,to:44,designKind:'sample'});
  if(sha(path.join(sampleOutput,'A-mix.wav'))!==sha(path.join(oldOutput,'A-mix.wav')))throw Error('Accepted sample audio changed');
  for(const file of ['video.mp4','poster.png','probe.json','encoded-audio-quality.json'])fs.copyFileSync(path.join(oldOutput,file),path.join(sampleOutput,file));
  const oldManifest=json(path.join(oldOutput,'manifest.json'));
  ready.manifest.status='rendered-and-decoded';ready.manifest.videoOutput=oldManifest.videoOutput;
  ready.manifest.encodedAudioQuality=oldManifest.encodedAudioQuality;
  ready.manifest.approvalReuse={userFeedback:approved.userFeedback,source:approved.approvedOutput,reason:'Scene dependencies, render context, five PNG frames, audio PCM and native MP4 verified unchanged',pixelProof:proof,videoSha256:sha(path.join(sampleOutput,'video.mp4'))};
  writeJson(path.join(sampleOutput,'manifest.json'),ready.manifest);
  recordSampleReview(p,`outputs/${p.id}/${path.basename(sampleOutput)}/manifest.json`,{state:'approved',viewed:true,listened:true,note:'沿用用户“目前看可以”对同一MP4的认可；与旧样片逐字节相同，场景依赖、代表帧和PCM混音均核验一致。不是对新增场景的认可。'});
  const report={status:'passed',fingerprint,checkedFrames:checks.length,checks,preservedSample:proof,sampleReuse:path.basename(sampleOutput),humanListening:'not-performed-by-assistant',fullFilmApproval:false};
  writeJson(path.join(output,'layout-report.json'),report);
  fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>动作表达版 · 分镜</title><style>body{max-width:1200px;margin:32px auto;padding:0 24px;background:#fff8e9;color:#25252b;font:17px/1.7 system-ui}img{width:100%;border:3px solid #25252b}article{margin:36px 0}</style><h1>你真的买便宜了吗？· 动作表达版</h1><p>二手砍价与网购折扣。全部金额和商品为剧情示例，知识与应用边界保存在工程facts.md。</p>${p.timeline.segments.map(s=>`<article><h2>${esc(s.props.title)}</h2><p>${s.startSeconds}–${s.startSeconds+s.durationSeconds}秒</p><img src="${s.id}.png" alt="${esc(s.intent)}"></article>`).join('')}</html>`);
  console.log(JSON.stringify({output,checkedFrames:checks.length,samplePreserved:true},null,2));
}else{
  if(!/^[a-z0-9][a-z0-9-]*$/.test(layoutName??''))throw Error('Supply passed layout revision');
  const layoutDir=inside(ROOT,`outputs/${p.id}/${layoutName}`),proof=json(path.join(layoutDir,'layout-report.json'));
  if(proof.status!=='passed'||proof.fingerprint!==fingerprint)throw Error('Run current layout checks before rendering');
  const range={from:0,to:p.timeline.durationInFrames,durationInFrames:p.timeline.durationInFrames};
  requireFullFilmApproval(p,range);
  const output=reserveOutput(p.id,name),ready=prepare(p,output,{designKind:'full-film'}),data=ready.data;
  const partsDir=path.join(output,'chapters');fs.mkdirSync(partsDir);
  const {browser,page}=await openCanvas();
  const chapters=[];
  try{
    let rendered=0;
    for(const [index,s] of p.timeline.segments.entries()){
      const file=path.join(partsDir,`${String(index+1).padStart(2,'0')}-${s.id}.mp4`);
      const ff=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-frames:v',String(s.endFrame-s.startFrame),file],{windowsHide:true,stdio:['pipe','ignore','pipe']});
      let errors='';ff.stderr.on('data',b=>{errors=(errors+b).slice(-6000);});ff.stdin.on('error',()=>{});
      const done=once(ff,'exit');
      console.log(`Rendering chapter ${index+1}/8: ${s.id}`);
      try{
        for(let f=s.startFrame;f<s.endFrame;f++){
          await show(page,data,f);const bytes=await page.screenshot({type:'jpeg',quality:94});
          if(!ff.stdin.write(bytes))await Promise.race([once(ff.stdin,'drain'),done.then(()=>{throw Error(errors);})]);
          rendered++;if(rendered%120===0)console.log(`Full film ${Math.round(rendered/range.to*100)}%`);
        }
        ff.stdin.end();const [code]=await done;if(code!==0)throw Error(errors);
      }catch(e){if(ff.exitCode===null)ff.kill();throw e;}
      const stream=probe(file).streams.find(x=>x.codec_type==='video');
      if(Number(stream?.nb_frames)!==s.endFrame-s.startFrame)throw Error(`Chapter frame mismatch ${s.id}`);
      chapters.push({id:s.id,file:`chapters/${path.basename(file)}`,from:s.startSeconds,to:s.startSeconds+s.durationSeconds,frames:Number(stream.nb_frames),audio:'video-only intermediate',sha256:sha(file)});
      writeJson(path.join(output,'production-progress.json'),{chapters,renderedFrames:rendered,totalFrames:range.to});
    }
  }finally{await browser.close();}
  const concat=path.join(partsDir,'concat.txt');
  fs.writeFileSync(concat,chapters.map(c=>`file '${path.basename(c.file)}'`).join('\n')+'\n');
  const movie=path.join(output,'video.mp4');
  run(binaries().ffmpeg,['-v','error','-n','-f','concat','-safe','1','-i',concat,'-i',path.join(output,'A/mix.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(p.timeline.durationSeconds),'-movflags','+faststart',movie]);
  decode(movie);const info=probe(movie),v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
  if(v?.width!==1920||v?.height!==1080||Number(v.nb_frames)!==range.to||v.avg_frame_rate!=='30/1'||!a||Math.abs(Number(info.format.duration)-88)>.05)throw Error('Full film duration, dimensions, frames or audio mismatch');
  const quality=qualityAssessment(measureLoudness(movie,binaries().ffmpeg),[],ready.manifest.audio[0].quality?.policy);
  writeJson(path.join(output,'probe.json'),info);writeJson(path.join(output,'encoded-audio-quality.json'),quality);
  ready.manifest.status='rendered-and-decoded';ready.manifest.videoOutput={file:'video.mp4',sha256:sha(movie),frames:Number(v.nb_frames),duration:Number(info.format.duration),width:1920,height:1080};
  ready.manifest.renderMethod='Offline registered React/SVG scenes via Chromium pipe; chapter-by-chapter H264 encoding, continuous audio mux';
  ready.manifest.rendererSources=Object.fromEntries(['style-entry.tsx','produce-motion-film.mjs'].map(f=>[f,sha(path.join(p.dir,f))]));
  ready.manifest.chapters=chapters;ready.manifest.encodedAudioQuality=quality;ready.manifest.layoutProof={revision:layoutName,checkedFrames:proof.checkedFrames};
  ready.manifest.approvedSampleReuse={source:approved.approvedOutput,range:[34,44],videoSha256:approved.videoSha256,preserved:true};
  ready.manifest.manualReview={visuals:'keyframes and transition inspections; full film user review pending',audio:'technical checks passed; full film listening pending'};
  writeJson(path.join(output,'manifest.json'),ready.manifest);
  for(const s of p.timeline.segments)fs.copyFileSync(path.join(layoutDir,`${s.id}.png`),path.join(output,`${s.id}.png`));
  fs.copyFileSync(path.join(layoutDir,'deal.png'),path.join(output,'poster.png'));
  fs.copyFileSync(path.join(layoutDir,'layout-report.json'),path.join(output,'layout-report.json'));
  fs.copyFileSync(path.join(layoutDir,'index.html'),path.join(output,'storyboard.html'));
  fs.writeFileSync(path.join(output,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>你真的买便宜了吗？</title><style>body{max-width:1200px;margin:30px auto;padding:0 24px;background:#fff8e9;color:#25252b;font:17px/1.7 system-ui}video{width:100%;border:3px solid #25252b;border-radius:12px}button{padding:9px 14px;margin:4px;background:#e3f4ec;border:1px solid #25252b;border-radius:6px;color:#25252b;font:15px system-ui}a{margin-right:20px}p{color:#666258}</style><h1>你真的买便宜了吗？</h1><p>锚定效应 · 二手砍价与网购折扣｜漫画实验室｜88秒｜无旁白</p><video id="film" controls playsinline preload="metadata" poster="poster.png" src="video.mp4"><track kind="subtitles" src="captions.vtt" srclang="zh" label="可选解释字幕"></video><div>${p.timeline.segments.map(s=>`<button onclick="film.currentTime=${s.startSeconds};film.play()">${esc(s.props.title)}</button>`).join('')}</div><p>音乐：用户指定「02_情感话题_故事讲述」。剧情金额为示例；查价、预算是对书中原则的生活化应用。</p><p><a href="storyboard.html">分镜静帧</a><a href="A-music.wav">配乐</a><a href="A-effects.wav">音效</a><a href="captions.srt">可选解释字幕</a></p><p>知识依据：<a href="https://cpcglobal.org/publications/Thinking%20Fast%20and%20Slow.pdf">《思考，快与慢》锚定章节</a>、<a href="https://journals.sagepub.com/doi/10.1177/01461672002611010">反向思考研究</a>、<a href="https://pubmed.ncbi.nlm.nih.gov/11642352/">谈判关注点研究</a>。这些方法帮助减少影响，不保证消除所有偏差。</p><p>已认可的十秒代表片段保留；全片尚待用户观看反馈，未自动记录全片试听或验收。</p></html>`);
  const srt=fs.readFileSync(path.join(output,'captions.srt'),'utf8');
  fs.writeFileSync(path.join(output,'captions.vtt'),'WEBVTT\n\n'+srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g,'$1.$2'));
  console.log(JSON.stringify({output,frames:Number(v.nb_frames),duration:Number(info.format.duration),audio:quality.measurements,warnings:quality.warnings},null,2));
}

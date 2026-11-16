// Finish a sample prepared by design:sample when localhost rendering is unavailable.
// Keeps the engine's range, fingerprint, full-clock animation, and sliced audio.
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
import {binaries,decode,probe} from '../../scripts/runtime.mjs';
import {measureLoudness,qualityAssessment} from '../../scripts/audio-quality.mjs';

const name=process.argv[2];
if(!/^[a-z0-9][a-z0-9-]*$/.test(name??''))throw Error('Supply the prepared sample revision name');
const p=loadProject('thinking-anchors'),r=p.production.representative;
const createPrepared=process.argv[3]==='--prepare';
if(process.argv[3]&&!createPrepared)throw Error('Supported option: --prepare');
if(createPrepared){
  if(p.visual?.id!=='comic')throw Error('Select the comic direction first');
  let covered=r.from;
  for(const c of p.compiledAudio.clips.filter(c=>c.role==='music').sort((a,b)=>a.at-b.at)){
    if(c.at>covered+1e-7)break;
    covered=Math.max(covered,c.at+c.duration);
  }
  if(covered<r.to-1e-7)throw Error('Cover the entire sample with fixed music');
  if(![...p.compiledAudio.clips,...p.compiledAudio.cues].some(c=>c.role!=='music'&&c.at<r.to&&c.at+c.duration>r.from))throw Error('Configure action sounds inside the representative range');
  const reserved=reserveOutput(p.id,name);
  prepare(p,reserved,{from:r.from,to:r.to,designKind:'sample'});
}
const output=inside(ROOT,`outputs/thinking-anchors/${name}`);
const manifest=json(path.join(output,'manifest.json'));
const {data}=json(path.join(output,'input-props.json'));
const {from,to,durationInFrames}=data.range;
const movie=path.join(output,'video.mp4');
if(fs.existsSync(movie))throw Error('Video already exists; prepare a new revision instead of overwriting');
if(manifest.status!=='prepared'||manifest.design?.kind!=='sample'||manifest.design.fingerprint!==designFingerprint(p)||manifest.design.selectedId!=='comic')throw Error('Use a current comic sample prepared by design:sample');
if(durationInFrames!==300||from!==r.from*30||to!==r.to*30||data.timeline.fps!==30||data.project.video.width!==1920||data.project.video.height!==1080)throw Error('Expected the exact current 1080p/30 ten-second representative range');
if(data.audio.silent||sha(path.join(output,'A/mix.wav'))!==manifest.audio[0].mixSha256)throw Error('Expected the prepared music and effects mix');

const result=await build({entryPoints:['projects/thinking-anchors/style-entry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
let css='body{margin:0}';
for(const weight of [400,700]){
  const dir='node_modules/@fontsource/noto-sans-sc';
  css+=fs.readFileSync(`${dir}/${weight}.css`,'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(`${dir}/${f}`).toString('base64')})`);
}
const browser=await chromium.launch({executablePath:process.env.KNOWLEDGE_VIDEO_BROWSER??'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const inspections=[];
let ff,exitPromise,errors='';
try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await page.setContent(`<html><head><style>${css}</style></head><body><div id="root"></div></body></html>`);
  await page.addScriptTag({content:result.outputFiles[0].text});
  const frame=async f=>{
    await page.evaluate(({data,f})=>window.renderFrame(data,f),{data,f});
    await page.evaluate(()=>document.fonts.ready);
  };
  const posterFrame=Math.round(r.stillTime*data.timeline.fps);
  const checkpointSet=new Set([from,to-1,posterFrame]);
  for(let f=from;f<to;f+=30)checkpointSet.add(f);
  for(const sec of Object.values(data.timeline.events))for(const offset of [-1,0,4,16]){
    const f=Math.round(sec*30)+offset;if(f>=from&&f<to)checkpointSet.add(f);
  }
  // Layout checks and stills may inspect the draft beyond the sample;
  // only the selected ten seconds are encoded as video.
  const draftDir=path.join(output,'draft-stills');fs.mkdirSync(draftDir);
  const draftFrames=new Map();
  for(const s of data.timeline.segments){
    const f=Math.min(s.endFrame-1,Math.round((s.startSeconds+s.durationSeconds*.88)*30));
    draftFrames.set(f,s.id);checkpointSet.add(f);
    for(const sec of Object.values(s.events))checkpointSet.add(Math.min(s.endFrame-1,Math.round((s.startSeconds+sec+.6)*30)));
  }
  const checkpoints=[...checkpointSet].sort((a,b)=>a-b);
  const savedFrames=new Set([from,from+60,from+150,posterFrame,to-1]);
  for(const f of checkpoints){
    await frame(f);
    const layout=await page.evaluate(()=>{
      const overflow=[...document.querySelectorAll('[data-fit]')].filter(e=>e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2).map(e=>e.textContent);
      const visible=e=>{for(let el=e;el;el=el.parentElement){if(Number(getComputedStyle(el).opacity)<.01)return false;}return true;};
      const boxes=[...document.querySelectorAll('svg text')].filter(visible).map(e=>({text:e.textContent,box:e.getBoundingClientRect().toJSON()}));
      const fullbleed=!!document.querySelector('[data-fullbleed-scene]');
      const outside=boxes.filter(({box:b})=>b.x<80||b.y<(fullbleed?45:235)||b.right>1840||b.bottom>(fullbleed?1025:840)).map(x=>x.text),collisions=[];
      for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
        const a=boxes[i].box,b=boxes[j].box;
        if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>2)collisions.push([boxes[i].text,boxes[j].text]);
      }
      const unintendedCaptions=fullbleed?[...document.querySelectorAll('[data-caption]')].map(e=>e.textContent):[];
      return {overflow,outside,collisions,unintendedCaptions};
    });
    if(Object.values(layout).some(x=>x.length))throw Error(`Layout failure ${f}: ${JSON.stringify(layout)}`);
    inspections.push({frame:f,...layout});
    if(savedFrames.has(f))await page.screenshot({path:path.join(output,`frame-${f}.png`)});
    if(draftFrames.has(f))await page.screenshot({path:path.join(draftDir,`${draftFrames.get(f)}.png`)});
  }
  await frame(posterFrame);const before=await page.screenshot({type:'png'});
  await frame(from);await frame(posterFrame);const after=await page.screenshot({type:'png'});
  const hash=b=>createHash('sha256').update(b).digest('hex');
  if(hash(before)!==hash(after))throw Error('Rewinding changed the rendered frame');
  fs.writeFileSync(path.join(output,'poster.png'),after);

  ff=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',path.join(output,'A-mix.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','10','-movflags','+faststart',movie],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  exitPromise=once(ff,'exit');
  ff.stderr.on('data',b=>{errors=(errors+b).slice(-6000);});ff.stdin.on('error',()=>{});
  for(let f=from;f<to;f++){
    await frame(f);
    const bytes=await page.screenshot({type:'jpeg',quality:94});
    if(!ff.stdin.write(bytes))await Promise.race([once(ff.stdin,'drain'),exitPromise.then(()=>{throw Error(errors);})]);
    if((f-from)%30===0)console.log(`Comic sample ${Math.round((f-from)/3)}%`);
  }
  ff.stdin.end();const [code]=await exitPromise;if(code!==0)throw Error(errors);
  writeJson(path.join(output,'visual-checks.json'),{inspections,rewindDeterminism:true,posterFrame,scope:'Draft still/layout checks; only representative ten seconds encoded',humanListening:'not-performed'});
}catch(error){if(ff?.exitCode===null)ff.kill();throw error;}
finally{await browser.close();}

decode(movie);
const info=probe(movie),v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
if(v?.width!==1920||v?.height!==1080||Number(v.nb_frames)!==300||v.avg_frame_rate!=='30/1'||!a||Math.abs(Number(info.format.duration)-10)>.04)throw Error('Encoded sample dimensions, frames, audio, or duration invalid');
const quality=qualityAssessment(measureLoudness(movie,binaries().ffmpeg),[],manifest.audio[0].quality?.policy);
writeJson(path.join(output,'probe.json'),info);writeJson(path.join(output,'encoded-audio-quality.json'),quality);
manifest.status='rendered-and-decoded';
manifest.renderMethod='Project React/SVG scenes via offline Chromium pipe and FFmpeg; default localhost renderer returned EACCES';
manifest.rendererSources=Object.fromEntries(['style-entry.tsx','render-sample-offline.mjs'].map(f=>[f,sha(path.join(p.dir,f))]));
manifest.videoOutput={file:'video.mp4',sha256:sha(movie),frames:300,width:1920,height:1080,duration:10};
manifest.encodedAudioQuality=quality;
manifest.manualReview={visuals:'keyframes-inspected-separately',audio:'needs-listening'};
writeJson(path.join(output,'manifest.json'),manifest);
fs.writeFileSync(path.join(output,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>漫画实验室 · 动作表达样片</title><style>body{max-width:1100px;margin:36px auto;padding:0 24px;background:#fff8e9;color:#25252b;font:17px/1.7 system-ui}video{width:100%;border:3px solid #25252b;border-radius:10px}button,a{margin-right:16px}button{padding:8px 16px}p{color:#666258}</style><h1>你真的买便宜了吗？· 动作表达版</h1><p>全片${r.from}–${r.to}秒｜场景对话与动作，无旁白</p><video id="film" controls playsinline preload="metadata" poster="poster.png" src="video.mp4"></video><p>人物检查商品、发现磨损和少配件，滑看成交记录，再把价格归到比较线上。本段已将底部大字字幕与小字说明改为场内表达。所有金额与商品均为剧情示例。</p><p>音乐仍为用户指定「02_情感话题_故事讲述」。</p><button onclick="film.currentTime=0;film.play()">重新播放</button><button onclick="film.loop=!film.loop;this.textContent=film.loop?'关闭循环':'循环播放'">循环播放</button><p>分轨试听：<a href="A-music.wav">配乐</a><a href="A-effects.wav">音效</a><a href="A-mix.wav">完整混音</a><a href="captions.srt">可选解释字幕</a></p><p><a href="storyboard.html">查看当前分镜静帧</a>；本轮先验证代表片段，其余段落尚未按这次反馈改造。</p><p>技术核验已完成；尚未记录用户对这一版的观看、试听或认可。请在聊天里反馈动作是否更生动、方法是否看得懂。</p></html>`);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
fs.writeFileSync(path.join(output,'storyboard.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>生活案例版 · 分镜</title><style>body{max-width:1200px;margin:30px auto;padding:0 24px;background:#fff8e9;font:17px/1.7 system-ui;color:#25252b}article{margin:36px 0}img{width:100%;border:2px solid #25252b}small{color:#666258}</style><h1>生活案例版 · 88秒分镜草稿</h1><p>二手砍价主线 + 网购折扣延伸。静帧用于看内容结构；整片尚未导出，动作和听感先看十秒样片。</p>${data.timeline.segments.map(s=>`<article><h2>${esc(s.props.title)}</h2><small>${s.startSeconds}–${s.startSeconds+s.durationSeconds} 秒</small><img src="draft-stills/${esc(s.id)}.png" alt="${esc(s.props.title)}"><p>${esc(p.production.scenePlan.find(x=>x.segmentId===s.id)?.change??s.intent)}</p></article>`).join('')}</html>`);
console.log(JSON.stringify({output,frames:300,duration:10,audioQuality:quality.measurements,warnings:quality.warnings},null,2));

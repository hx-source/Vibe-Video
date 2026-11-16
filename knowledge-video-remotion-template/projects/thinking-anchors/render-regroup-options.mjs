import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {ROOT,json,sha,writeJson} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,probe,decode,run} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),out=path.join(ROOT,'outputs/thinking-anchors/regroup-motion-v1');
const render=process.argv.includes('--render'),ff=binaries().ffmpeg;
fs.mkdirSync(out,{recursive:true});
const variants=[
 {id:'ruler',label:'A · 三点落尺',description:'三个价格逐个落到同一把尺上，再标出区间。三个短接触音对应落点。'},
 {id:'outline',label:'B · 圈定区间',description:'成交记录留在原位，一笔框出可比价格，再呈现区间。短铅笔录音只随框线绘制。'},
 {id:'summary',label:'C · 合拢成卡',description:'三个价格汇入同一张汇总卡，区间接着出现。一次短翻纸声对应汇入动作。'}
];
const protectedFiles=['audio-plan.json','approved-sample.json','scenes/AnchorEvidenceMotion.tsx','scenes/AnchorLifeScene.tsx'];
const protectedHashes=Object.fromEntries(protectedFiles.map(f=>[f,sha(path.join(dir,f))]));
const assetIndexPath=path.join(dir,'assets/index.json'),index=json(assetIndexPath);
const sourceRoot=path.join(dir,'assets/sound-palette-sources');
const soundDefinitions=[
 {id:'regroup-contact-v2',source:path.join(sourceRoot,'rpg-audio/Audio/bookPlace3.ogg'),file:'regroup-contact-v2.wav',filter:'atrim=start=0.07:end=0.18,asetpts=PTS-STARTPTS,highpass=f=600,lowpass=f=5500,afade=t=out:st=0.085:d=0.025',license:'Creative Commons Zero, CC0; Kenney RPG Audio',page:'https://kenney.nl/assets/rpg-audio'},
 {id:'regroup-draw-v1',source:path.join(dir,'assets/sound-palettes/pencil-continuous-recorded-v1.wav'),file:'regroup-draw-v1.wav',filter:'atrim=start=0.40:end=1.25,asetpts=PTS-STARTPTS,afade=t=in:d=0.025,afade=t=out:st=0.80:d=0.05',license:'CC0 1.0; Trtle.T, Pencil stroke long; native-speed excerpt of existing derived asset',page:'https://freesound.org/people/Trtle.T/sounds/809934/'},
 {id:'regroup-card-v1',source:path.join(sourceRoot,'rpg-audio/Audio/bookFlip2.ogg'),file:'regroup-card-v1.wav',filter:'highpass=f=450,lowpass=f=6500,atrim=duration=0.40,afade=t=in:d=0.012,afade=t=out:st=0.32:d=0.08',license:'Creative Commons Zero, CC0; Kenney RPG Audio',page:'https://kenney.nl/assets/rpg-audio'}
];
for(const d of soundDefinitions){
 const target=path.join(dir,'assets/sound-palettes',d.file);
 if(!fs.existsSync(target))run(ff,['-v','error','-n','-i',d.source,'-af',d.filter,'-ar','44100','-ac','2','-c:a','pcm_s16le',target]);
 if(!index.items.some(a=>a.id===d.id))index.items.push({id:d.id,path:'sound-palettes/'+d.file,type:'audio',source:`${d.page}; source SHA256=${sha(d.source)}; native-rate excerpt/filter/fades only; no added reverb or synthetic tones`,license:d.license});
}
writeJson(assetIndexPath,index);
const base=json(path.join(dir,'audio-palette-b-pencil-follow-through-v1.json'));
for(const v of variants){
 const plan=structuredClone(base);plan.clips=plan.clips.filter(c=>c.id!=='b-comic-6');
 const add=(id,source,offset,duration,gain,role='accent')=>plan.clips.push({id,source:'asset:'+source,at:{event:'evidence.range',offset},sourceIn:0,sourceOut:duration,gain,fadeIn:0.002,fadeOut:0.015,role,enabled:true,purpose:v.description,musicFit:'固定02背景音乐；短声仅配本版可见动作，无连续滑音或混响；听感待用户试听'});
 if(v.id==='ruler')for(let i=0;i<3;i++)add('ruler-land-'+i,'regroup-contact-v2',.56+i*.31,.11,2.4);
 if(v.id==='outline')add('outline-draw','regroup-draw-v1',.10,.85,.78,'process');
 if(v.id==='summary')add('summary-gather','regroup-card-v1',.24,.40,1.8,'transition');
 const name=`audio-regroup-${v.id}-v1.json`;writeJson(path.join(dir,name),plan);
 const target=path.join(out,v.id);fs.mkdirSync(target,{recursive:true});
 if(!fs.existsSync(path.join(target,'preview-audio.wav'))||!fs.existsSync(path.join(target,'audio-plan.json'))||JSON.stringify(json(path.join(target,'audio-plan.json')))!==JSON.stringify(plan)){
  if(fs.existsSync(path.join(target,'preview.mp4')))throw Error('Cannot change audio of completed video');
  const p=loadProject('thinking-anchors',{audioPlan:name}),resolved=structuredClone(plan);
  for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
  const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(target,'mix'),stems:true,quality:true});
  for(const role of ['mix','music','effects'])fs.writeFileSync(path.join(target,role==='mix'?'preview-audio.wav':role+'-preview.wav'),waveSlice(fs.readFileSync(path.join(target,'mix',role+'.wav')),32,46));
  writeJson(path.join(target,'audio-quality.json'),report.quality);
  writeJson(path.join(target,'audio-plan.json'),plan);
 }
}
const p=loadProject('thinking-anchors'),data={...json(path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/input-props.json')).data,timeline:p.timeline,theme:p.theme};
const result=await build({entryPoints:[path.join(dir,'regroup-entry.tsx')],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
let css='body{margin:0}';
for(const weight of [400,700]){const f=path.join(ROOT,'node_modules/@fontsource/noto-sans-sc');css+=fs.readFileSync(path.join(f,`${weight}.css`),'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,x)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join(f,x)).toString('base64')})`);}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const checks=[];
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 await page.setContent(`<style>${css}</style><div id="root"></div>`);await page.addScriptTag({content:result.outputFiles[0].text});
 const frame=async(f,variant)=>{await page.evaluate(({data,f,variant})=>window.renderRegroupFrame(data,f,variant),{data,f,variant});await page.evaluate(()=>document.fonts.ready);};
 const hash=b=>createHash('sha256').update(b).digest('hex');
 for(const f of [1080,1170,1199]){
  await frame(f,'original');const original=hash(await page.screenshot());
  for(const v of variants){await frame(f,v.id);if(hash(await page.screenshot())!==original)throw Error(`Before-8s picture changed: ${v.id}, ${f}`);}
 }
 for(const v of variants){
  const target=path.join(out,v.id);
  for(let f=1200;f<1380;f+=3){
   await frame(f,v.id);
   const layout=await page.evaluate(()=>{
    const visible=e=>{let opacity=1;for(let el=e;el;el=el.parentElement)opacity*=Number(getComputedStyle(el).opacity);return opacity>.05;};
    const boxes=[...document.querySelectorAll('svg text')].filter(visible).map(e=>({text:e.textContent,b:e.getBoundingClientRect().toJSON()}));
    const outside=boxes.filter(({b})=>b.x<80||b.y<45||b.right>1840||b.bottom>1025).map(x=>x.text),collisions=[];
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(Math.min(a.b.right,b.b.right)-Math.max(a.b.x,b.b.x)>3&&Math.min(a.b.bottom,b.b.bottom)-Math.max(a.b.y,b.b.y)>3)collisions.push([a.text,b.text]);}
    return {outside,collisions};
   });
   checks.push({variant:v.id,frame:f,...layout});
   if(layout.outside.length||layout.collisions.length){writeJson(path.join(out,'layout-failure.json'),checks);throw Error(`Layout ${v.id} at ${(f/30-32).toFixed(2)}: ${JSON.stringify(layout)}`);}
   if([1206,1215,1224,1233,1242,1254,1266,1290,1365].includes(f))await page.screenshot({path:path.join(target,`frame-${f}.png`)});
  }
  await frame(1242,v.id);const a=await page.screenshot();await frame(1080,v.id);await frame(1242,v.id);const b=await page.screenshot();if(hash(a)!==hash(b))throw Error('Nondeterministic motion');fs.writeFileSync(path.join(target,'poster.png'),b);
  if(render){
   const movie=path.join(target,'preview.mp4');if(fs.existsSync(movie))throw Error('Completed video exists; do not overwrite');
   const encoder=spawn(ff,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',path.join(target,'preview-audio.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',movie],{windowsHide:true,stdio:['pipe','ignore','pipe']});
   const done=once(encoder,'exit');let errors='';encoder.stderr.on('data',b=>errors=(errors+b).slice(-5000));encoder.stdin.on('error',()=>{});
   for(let f=960;f<1380;f++){await frame(f,v.id);const bytes=await page.screenshot({type:'jpeg',quality:94});if(!encoder.stdin.write(bytes))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error(errors);})]);if((f-960)%90===0)console.log(`${v.label} ${Math.round((f-960)/4.2)}%`);}
   encoder.stdin.end();const [code]=await done;if(code!==0)throw Error(errors);
   decode(movie);const info=probe(movie),video=info.streams.find(s=>s.codec_type==='video');if(video.width!==1920||video.height!==1080||Number(video.nb_frames)!==420||!info.streams.some(s=>s.codec_type==='audio'))throw Error('Invalid encoded output');
   writeJson(path.join(target,'probe.json'),info);writeJson(path.join(target,'encoded-audio.json'),measureLoudness(movie,ff));
  }
  console.log(`${v.id}: layout and rewind checks passed`);
 }
}finally{await browser.close();}
for(const [f,h]of Object.entries(protectedHashes))if(sha(path.join(dir,f))!==h)throw Error('Protected file changed: '+f);
writeJson(path.join(out,'visual-checks.json'),{checks,beforeEightSecondsPixelIdentical:true,rewindDeterministic:true});
writeJson(path.join(out,'manifest.json'),{status:render?'rendered-three-options':'stills-ready',variants,rangeSeconds:[32,46],localChangedMotionSeconds:[8,10],fps:30,frames:420,music:'02_情感话题_故事讲述.m4a',musicUnchanged:true,unrelatedCuesUnchanged:true,protectedHashes,sourceFiles:Object.fromEntries(['regroup-entry.tsx','scenes/RegroupStage.tsx','scenes/AnchorEvidenceRegroup.tsx','render-regroup-options.mjs'].map(f=>[f,sha(path.join(dir,f))])),sourceAudio:soundDefinitions.map(d=>({id:d.id,source:d.source,sha256:sha(d.source),filter:d.filter,license:d.license,page:d.page})),userApproval:false,assistantListening:'not-performed'});
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>第8秒归组 · 三种动作</title><style>body{max-width:1100px;margin:30px auto;padding:0 22px;background:#fff8e9;color:#25252b;font:17px/1.7 system-ui}video{width:100%;border:3px solid #25252b;border-radius:12px}button{padding:10px 16px;margin:8px 10px 8px 0;font:inherit;border:2px solid #25252b;border-radius:8px;background:#fffdf5;cursor:pointer}button.active{background:#cfece0}p{color:#666258}h1{font-size:28px}a{color:#206c63}</style><h1>第8–10秒：先改变归组动作</h1><p>保留漫画实验室、02背景音乐、前段检查和三笔成交记录音效。每版都是14秒实际动画；只比较第8秒起的归组表达。价格与成交记录均为剧情示例。</p><nav>${variants.map(v=>`<button data-variant="${v.id}">${v.label}</button>`).join('')}</nav><video id="film" controls playsinline preload="metadata" src="outline/preview.mp4" poster="outline/poster.png"></video><p id="description"></p><button id="focus">从第7.5秒看变化</button><button id="loop">循环第7.5–11秒</button><button id="mute">关闭声音看动作</button><p>先以B版作为对照页起点：价格无需搬动，笔触直接跟着框线。三版尚待观看、试听；技术检查不能代替听感判断。</p><p>${variants.map(v=>`<a href="${v.id}/preview.mp4">${v.label}视频</a> · <a href="${v.id}/effects-preview.wav">音效分轨</a>`).join(' ｜ ')}</p><script>const variants=${JSON.stringify(variants)},film=document.getElementById('film');let selected='outline',loop=false;function paint(){document.getElementById('description').textContent=variants.find(v=>v.id===selected).description;document.querySelectorAll('[data-variant]').forEach(b=>b.classList.toggle('active',b.dataset.variant===selected));}document.querySelectorAll('[data-variant]').forEach(b=>b.onclick=()=>{const t=film.currentTime,playing=!film.paused;selected=b.dataset.variant;film.src=selected+'/preview.mp4';film.poster=selected+'/poster.png';film.addEventListener('loadedmetadata',()=>{film.currentTime=Math.min(t,13.9);if(playing)film.play();},{once:true});paint();});document.getElementById('focus').onclick=()=>{film.currentTime=7.5;film.play();};document.getElementById('loop').onclick=e=>{loop=!loop;e.target.textContent=loop?'关闭循环':'循环第7.5–11秒';if(loop){film.currentTime=7.5;film.play();}};film.addEventListener('timeupdate',()=>{if(loop&&film.currentTime>=11)film.currentTime=7.5;});document.getElementById('mute').onclick=e=>{film.muted=!film.muted;e.target.textContent=film.muted?'恢复声音':'关闭声音看动作';};paint();</script></html>`);
console.log(JSON.stringify({out,rendered:render}));

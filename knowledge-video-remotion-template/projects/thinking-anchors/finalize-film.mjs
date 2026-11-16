import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {prepare} from '../../scripts/prepare.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

// Final master is rendered from the project, not assembled from chapter movies.
const dir=path.join(ROOT,'projects/thinking-anchors');
const out=path.join(ROOT,'outputs/thinking-anchors/final-v1');
const render=process.argv.includes('--render');
if(!fs.existsSync(out)){
 const history=path.join(dir,'history/before-final-v1');fs.mkdirSync(history,{recursive:true});
 for(const file of ['delivery-status.json','segment-production.json','README.md','sound-review.json'])if(fs.existsSync(path.join(dir,file)))fs.copyFileSync(path.join(dir,file),path.join(history,file));
 prepare(loadProject('thinking-anchors'),reserveOutput('thinking-anchors','final-v1'),{from:0,to:70});
}
const {data}=json(path.join(out,'input-props.json')),manifest=json(path.join(out,'manifest.json'));
if(data.range.from!==0||data.range.to!==2100||data.audio.silent)throw Error('Expected full audible 70s film');
const previous=json(path.join(ROOT,'outputs/thinking-anchors/ending-v1/manifest.json'));
for(const [file,hash] of Object.entries(previous.rendererSources??{})){
 const source=file==='registry.tsx'?path.join(ROOT,'src/scenes/registry.tsx'):path.join(dir,file);
 if(sha(source)!==hash)throw Error('Previously reviewed source changed: '+file);
}
const sourceFiles=['style-entry.tsx',...fs.readdirSync(path.join(dir,'scenes')).filter(f=>f.endsWith('.tsx')).map(f=>'scenes/'+f)];
manifest.rendererSources=Object.fromEntries(sourceFiles.map(f=>[f,sha(path.join(dir,f))]));
if(sha(path.join(out,'A/mix.wav'))!==sha(path.join(ROOT,'outputs/thinking-anchors/ending-v1/A/mix.wav')))throw Error('Final mix differs from reviewed ending revision');
const compiled=await build({entryPoints:['projects/thinking-anchors/style-entry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
let css='body{margin:0}';
for(const weight of [400,700]){const fontDir=path.join(ROOT,'node_modules/@fontsource/noto-sans-sc');css+=fs.readFileSync(path.join(fontDir,`${weight}.css`),'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join(fontDir,f)).toString('base64')})`);}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
let encoder;
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 await page.setContent(`<style>${css}</style><div id="root"></div>`);await page.addScriptTag({content:compiled.outputFiles[0].text});
 const frame=async f=>{await page.evaluate(({data,f})=>window.renderFrame(data,f),{data,f});await page.evaluate(()=>document.fonts.ready);};
 if(!fs.existsSync(path.join(out,'visual-audit.json'))){
  const checks=[],saved=new Set([0,210,390,570,690,840,930,990,1080,1140,1230,1350,1470,1560,1680,1770,1860,1980,2099]);
  for(const t of [14,24,32,46,58])for(const offset of [-1,0,8,9,18,36])saved.add(t*30+offset);
  const frames=[...new Set([...saved,...Array.from({length:700},(_,i)=>i*3)])].sort((a,b)=>a-b);
  for(const f of frames){
   await frame(f);
   const layout=await page.evaluate(()=>{
    const visible=e=>{let p=1;for(let el=e;el;el=el.parentElement)p*=Number(getComputedStyle(el).opacity);return p>.05;};
    const boxes=[...document.querySelectorAll('svg text')].filter(visible).map(e=>{
     const b=e.getBoundingClientRect().toJSON();
     if(e.closest('[data-context-copy]')){b.x=Math.max(0,b.x);b.y=Math.max(250,b.y);b.right=Math.min(1130,b.right);b.bottom=Math.min(1030,b.bottom);if(b.right<=b.x||b.bottom<=b.y)return null;}
     return {text:e.textContent,b};
    }).filter(Boolean);
    const outside=boxes.filter(({b})=>b.x<80||b.y<45||b.right>1840||b.bottom>1025).map(x=>x.text),collisions=[];
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(Math.min(a.b.right,b.b.right)-Math.max(a.b.x,b.b.x)>3&&Math.min(a.b.bottom,b.b.bottom)-Math.max(a.b.y,b.b.y)>3)collisions.push([a.text,b.text]);}
    return {outside,collisions,bottomCaptions:document.querySelectorAll('[data-caption]').length,visibleText:[...new Set(boxes.map(x=>x.text))]};
   });
   checks.push({frame:f,time:f/30,...layout});
   if(saved.has(f))await page.screenshot({path:path.join(out,`frame-${f}.png`)});
  }
  const joins=[];
  for(const t of [14,24,32,46,58]){
   const a=PNG.sync.read(fs.readFileSync(path.join(out,`frame-${t*30-1}.png`))),b=PNG.sync.read(fs.readFileSync(path.join(out,`frame-${t*30}.png`)));
   let changedPixels=0,maxChannelDelta=0;for(let i=0;i<a.data.length;i+=4){let d=0;for(let c=0;c<4;c++)d=Math.max(d,Math.abs(a.data[i+c]-b.data[i+c]));if(d){changedPixels++;maxChannelDelta=Math.max(maxChannelDelta,d);}}
   joins.push({time:t,changedPixels,maxChannelDelta,pass:changedPixels<=32&&maxChannelDelta<=1});
  }
  const problems=checks.filter(x=>x.outside.length||x.collisions.length||x.bottomCaptions);
  writeJson(path.join(out,'visual-audit.json'),{samplingIntervalSeconds:.1,sampleCount:checks.length,checks,joins,problems});
  // Track actual visible text spans. Short retained boundary fragments are merged
  // with preceding samples rather than mistaken for new reading opportunities.
  const spans=[],open=new Map();
  for(const c of checks){const now=new Set(c.visibleText);for(const [text,s] of open)if(!now.has(text)){spans.push({...s,to:c.time,duration:c.time-s.from});open.delete(text);}for(const text of now)if(!open.has(text))open.set(text,{text,from:c.time});}
  for(const s of open.values())spans.push({...s,to:70,duration:70-s.from});
  writeJson(path.join(out,'text-dwell.json'),spans);
  function sheet(name,frames,cols,width=480){const h=width*1080/1920,png=new PNG({width:width*cols,height:h*Math.ceil(frames.length/cols)});png.data.fill(255);frames.forEach((f,k)=>{const source=PNG.sync.read(fs.readFileSync(path.join(out,`frame-${f}.png`)));for(let y=0;y<h;y++)for(let x=0;x<width;x++){const src=(Math.floor(y*1080/h)*1920+Math.floor(x*1920/width))*4,dst=((Math.floor(k/cols)*h+y)*png.width+(k%cols)*width+x)*4;source.data.copy(png.data,dst,src,src+4);}});fs.writeFileSync(path.join(out,name),PNG.sync.write(png));}
  sheet('chapter-overview.png',[210,570,840,1230,1560,1980],2,640);
  sheet('boundary-overview.png',[14,24,32,46,58].flatMap(t=>[t*30-1,t*30+18,t*30+36]),3);
  if(problems.length||joins.some(x=>!x.pass))throw Error('Visual audit needs review: '+JSON.stringify(problems.slice(0,4)));
  console.log(JSON.stringify({visualSamples:checks.length,boundaries:joins,layoutIssues:problems.length}));
 }
 if(render){
  const audit=json(path.join(out,'visual-audit.json'));if(audit.problems.length||audit.joins.some(x=>!x.pass))throw Error('Unresolved visual audit');
  const movie=path.join(out,'video.mp4');if(fs.existsSync(movie))throw Error('Final output exists; do not overwrite');
  encoder=spawn(binaries().ffmpeg,['-n','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',path.join(out,'A/mix.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','70','-metadata','title=思考快与慢：生活中的锚定效应','-movflags','+faststart',movie],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let errors='';encoder.stderr.on('data',b=>errors=(errors+b).slice(-6000));encoder.stdin.on('error',()=>{});const done=once(encoder,'exit');
  for(let f=0;f<2100;f++){await frame(f);const bytes=await page.screenshot({type:'jpeg',quality:94});if(!encoder.stdin.write(bytes))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error(errors);})]);if(f%210===0)console.log(`Full master ${f/21}%`);}
  encoder.stdin.end();const [code]=await done;if(code!==0)throw Error(errors);
  decode(movie);const info=probe(movie),v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
  if(v.width!==1920||v.height!==1080||Number(v.nb_frames)!==2100||v.avg_frame_rate!=='30/1'||!a||Math.abs(Number(v.start_time))>1e-6||Math.abs(Number(a.start_time))>1e-6||Math.abs(Number(info.format.duration)-70)>.01)throw Error('Invalid final movie');
  const quality=measureLoudness(movie,binaries().ffmpeg);if(quality.silent||quality.truePeakDb>-1||Math.abs(quality.integratedLufs+18)>3)throw Error('Encoded audio outside policy');
  writeJson(path.join(out,'probe.json'),info);writeJson(path.join(out,'encoded-audio-quality.json'),quality);
  // Detect gross encoded black gaps; evaluate the fully decoded final file.
  run(binaries().ffmpeg,['-hide_banner','-i',movie,'-vf','blackdetect=d=0.03:pix_th=0.05','-an','-f','null','-'],{stdio:undefined});
  manifest.status='final-export-decoded';manifest.videoOutput={file:'video.mp4',sha256:sha(movie),frames:2100,duration:70,width:1920,height:1080,fps:30};
  manifest.encodedAudioQuality=quality;manifest.renderMethod='Fresh complete React/SVG frame render; single H.264 encode and continuous PCM to AAC encode; no chapter concatenation';manifest.manualReview={visuals:'layout-and-boundaries-audited; contact sheets reviewed separately',audio:'technical checks only; assistant listening not performed'};
  writeJson(path.join(out,'manifest.json'),manifest);
  fs.copyFileSync(path.join(out,'frame-210.png'),path.join(out,'poster.png'));
  console.log(JSON.stringify({video:movie,quality,frames:v.nb_frames,duration:info.format.duration,sha256:manifest.videoOutput.sha256}));
 }
}catch(error){if(encoder?.exitCode===null)encoder.kill();throw error;}finally{await browser.close();}

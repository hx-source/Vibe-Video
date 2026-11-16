import fs from 'node:fs';
import path from 'node:path';
import {PNG} from 'pngjs';
import {ROOT,writeJson} from '../../scripts/files.mjs';
import {binaries,run,probe} from '../../scripts/runtime.mjs';
const source='D:/Documents/dy/视频借鉴',out=path.join(ROOT,'outputs/thinking-anchors/reference-study-v1');fs.mkdirSync(out,{recursive:true});
function sheet(dir,files,name,cols=4){const w=480,h=270,png=new PNG({width:w*cols,height:h*Math.ceil(files.length/cols)});png.data.fill(255);files.forEach((f,k)=>{const p=PNG.sync.read(fs.readFileSync(path.join(dir,f)));for(let y=0;y<h;y++){const start=(Math.floor(k/cols)*h+y)*png.width*4+(k%cols)*w*4;p.data.copy(png.data,start,y*w*4,(y+1)*w*4);}});fs.writeFileSync(path.join(dir,name),PNG.sync.write(png));}
const reports=[];
for(const file of fs.readdirSync(source).filter(f=>f.endsWith('.mp4'))){
 const id=file.match(/-(\d+)\./)[1],dir=path.join(out,id);fs.mkdirSync(dir,{recursive:true});const input=path.join(source,file),info=probe(input);
 run(binaries().ffmpeg,['-v','error','-y','-i',input,'-vf',"select='eq(n,0)+not(mod(n,240))',scale=480:270",'-vsync','vfr',path.join(dir,'overview-%03d.png')]);
 const files=fs.readdirSync(dir).filter(f=>/^overview-\d+\.png$/.test(f)).sort();sheet(dir,files,'overview.png');
 run(binaries().ffmpeg,['-v','error','-y','-i',input,'-t','12','-vf',"select='not(mod(n,30))',scale=480:270",'-vsync','vfr',path.join(dir,'opening-%03d.png')]);
 const first=fs.readdirSync(dir).filter(f=>/^opening-\d+\.png$/.test(f)).sort();sheet(dir,first,'opening.png');
 const report={id,file,duration:Number(info.format.duration),video:info.streams.find(s=>s.codec_type==='video'),overview:files.map((f,i)=>({file:f,time:i*8})),opening:first.map((f,i)=>({file:f,time:i}))};reports.push(report);writeJson(path.join(dir,'frames.json'),report);console.log(JSON.stringify({id,duration:report.duration,overview:files.length,opening:first.length}));
}
writeJson(path.join(out,'references.json'),reports);

import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../../../scripts/files.mjs';
import {PNG} from 'pngjs';
import {sceneBrowser} from './browser.mjs';
const out=path.join(ROOT,'outputs/thinking-anchors/landscape-ending-v1-layout');fs.mkdirSync(out,{recursive:true});
const {browser,page,frame}=await sceneBrowser();
try{for(const f of [1919,1920,1965,2010,2055,2100,2145,2205,2219]){await frame(f);await page.screenshot({path:path.join(out,`frame-${f}.png`)});}}finally{await browser.close();}
const dst=new PNG({width:1280,height:1080});
[1965,2010,2055,2100,2145,2205].forEach((f,i)=>{const s=PNG.sync.read(fs.readFileSync(path.join(out,`frame-${f}.png`)));for(let y=0;y<360;y++)for(let x=0;x<640;x++){const a=(y*3*s.width+x*3)*4,b=((Math.floor(i/2)*360+y)*1280+(i%2)*640+x)*4;s.data.copy(dst.data,b,a,a+4);}});
fs.writeFileSync(path.join(out,'storyboard.png'),PNG.sync.write(dst));console.log(out);

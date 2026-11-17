import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
const local=path.join(ROOT,'projects/thinking-anchors/portrait-character-motion-v1'),parent=path.dirname(local),out=path.join(ROOT,'outputs/thinking-anchors/portrait-character-motion-v1'),previous=path.join(ROOT,'outputs/thinking-anchors/portrait-edge-cleanup-v1');
const windowPath='M-95 439 H65 V1066 H-95 M-95 725 H65 M-15 439 V1066';
const originals=['portrait-edge-cleanup-v1/Opening.tsx','portrait-edge-cleanup-v1/Mechanism.tsx','portrait-edge-cleanup-v1/Decision.tsx','portrait-mechanism-v1/SceneParts.tsx'];
const originalHashes=Object.fromEntries(originals.map(f=>[f,sha(path.join(parent,f))]));
const current=fs.readFileSync(path.join(local,'Decision.tsx'),'utf8').replace("\nimport {AnimatedShopper} from './Actor';",'').replace('import {Txt,Tag}','import {Txt,Tag,Shopper}').replace("from '../portrait-edge-cleanup-v1/Mechanism'","from './Mechanism'").replace('<AnimatedShopper time={time} clock={clock}/>','<Shopper happy={0} check={1} surprise={.306*(1-form)} time={clock} opacity={1}/>');
if(current!==fs.readFileSync(path.join(parent,'portrait-edge-cleanup-v1/Decision.tsx'),'utf8'))throw Error('Non-actor scene content changed');
const bundle=entry=>build({entryPoints:[entry],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
const builds=await Promise.all([bundle('projects/thinking-anchors/portrait-character-motion-v1/entry.tsx'),bundle('projects/thinking-anchors/portrait-edge-cleanup-v1/entry.tsx')]);
let css='body{margin:0}';for(const weight of [400,700]){const d=path.join(ROOT,'node_modules/@fontsource/noto-sans-sc');css+=fs.readFileSync(path.join(d,weight+'.css'),'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join(d,f)).toString('base64')})`);}

const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});await page.setContent('<style>'+css+'</style><div id="root"></div>');await page.addScriptTag({content:builds[0].outputFiles[0].text});for(const f of [810,885,945,996,1044,1110]){await page.evaluate(f=>window.renderPortrait(f),f);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(out,'adjusted-'+f+'.png')});}}finally{await browser.close();}

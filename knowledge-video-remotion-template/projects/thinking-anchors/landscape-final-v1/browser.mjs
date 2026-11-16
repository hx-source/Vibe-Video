import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {ROOT} from '../../../scripts/files.mjs';
export async function sceneBrowser(){
 const buildResult=await build({entryPoints:['projects/thinking-anchors/landscape-final-v1/entry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
 let css='body{margin:0}';const fontDir=path.join(ROOT,'node_modules/@fontsource/noto-sans-sc');
 for(const weight of [400,700])css+=fs.readFileSync(path.join(fontDir,weight+'.css'),'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join(fontDir,f)).toString('base64')})`);
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 await page.setContent(`<style>${css}</style><div id="root"></div>`);await page.addScriptTag({content:buildResult.outputFiles[0].text});
 const frame=async f=>{await page.evaluate(f=>window.renderLandscape(f),f);await page.evaluate(()=>document.fonts.ready);};
 return {browser,page,frame};
}

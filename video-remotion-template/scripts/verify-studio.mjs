import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {browserPath} from './runtime.mjs';
import {reserveOutput,writeJson} from './files.mjs';
const url=process.argv[2];if(!url)throw Error('Start preview, then pass its local URL to verify-studio.mjs');
const address=new URL(url);if(!['localhost','127.0.0.1'].includes(address.hostname))throw Error('Studio verification only connects to localhost');
const output=reserveOutput('validation',`studio-${Date.now()}`),browser=await chromium.launch({executablePath:await browserPath(),headless:true}),report={status:'running',url};
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${address.origin}/KnowledgeVideo`);let film;
 for(let i=0;i<60;i++){
  for(const frame of page.frames()){const candidate=frame.locator('[data-film]');if(await candidate.count()){film=candidate;break;}}
  if(film)break;await page.waitForTimeout(500);
 }
 assert.ok(film,'Studio did not load KnowledgeVideo');await film.waitFor();await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:path.join(output,'studio.png')});assert.deepEqual(errors,[]);
 report.status='passed';report.frame=await film.getAttribute('data-frame');console.log(JSON.stringify({output,...report},null,2));
}catch(error){report.status='failed';report.error=error.stack;throw error;}finally{writeJson(path.join(output,'studio-report.json'),report);await browser.close();}

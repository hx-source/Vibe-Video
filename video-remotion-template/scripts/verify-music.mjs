import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {chromium} from 'playwright';
import {ROOT,json,writeJson,reserveOutput} from './files.mjs';
import {pcmWave} from './pcm.mjs';
import {musicCommand} from './music-cli.mjs';
import {loadProject} from './project.mjs';
import {prepare} from './prepare.mjs';
import {browserPath} from './runtime.mjs';
import {beatGrid} from './music.mjs';

const id=`music-validation-${randomUUID()}`,fixture=path.join(ROOT,'projects',id),name=`validation-${Date.now()}`;
fs.mkdirSync(fixture);
let browser;
try{
 fs.cpSync(path.join(ROOT,'templates/starter'),fixture,{recursive:true});
 const project=json(path.join(fixture,'project.json'));project.id=id;project.files.musicSync='music-sync.json';writeJson(path.join(fixture,'project.json'),project);
 const rate=44100,samples=new Float64Array(rate*12*2);
 for(let t=.2;t<12;t+=.5)for(let j=0;j<1500;j++){const v=.3*Math.exp(-j/200)*Math.cos(j*.2);samples[(Math.round(t*rate)+j)*2]=v;samples[(Math.round(t*rate)+j)*2+1]=v;}
 fs.writeFileSync(path.join(fixture,'assets/pulse.wav'),pcmWave(samples,rate).buffer);
 writeJson(path.join(fixture,'assets/index.json'),{schemaVersion:1,items:[{id:'pulse',path:'pulse.wav',type:'audio',source:'Generated test pulses',license:'Project-generated fixture'}]});
 const plan=json(path.join(fixture,'audio-plan.json'));plan.clips=[{id:'bed',role:'music',source:'asset:pulse',sourceIn:0,sourceOut:12,at:0,gain:.5}];plan.cues=[{id:'ding',role:'accent',kind:'tone',at:{event:'opening.reveal'},duration:.2,gain:.06,frequency:784,purpose:'Test event',musicFit:'Technical fixture, not listening approval'}];writeJson(path.join(fixture,'audio-plan.json'),plan);
 musicCommand('analyze',{project:id,clip:'bed',name});
 musicCommand('manual',{project:id,clip:'bed',bpm:'120',first:'.2',name:`${name}-manual`});
 assert.equal(json(path.join(ROOT,'outputs',id,`${name}-manual/music-analysis.json`)).beats[0],.2);
 const analysisOutput=path.join(ROOT,'outputs',id,name);fs.copyFileSync(path.join(analysisOutput,'music-analysis.json'),path.join(fixture,'music-analysis.json'));
 musicCommand('review',{project:id,analysis:'music-analysis.json',name:`${name}-review`});
 const reviewOutput=path.join(ROOT,'outputs',id,`${name}-review`),grid=json(path.join(reviewOutput,'music-grid.json'));
 writeJson(path.join(fixture,'music-sync.json'),{schemaVersion:1,analysis:'music-analysis.json',music:{clipId:'bed',sourceIn:0,sourceOut:12,at:0,speed:1},actions:[{event:'opening.reveal',beat:8,landmark:'start',soundId:'ding',revision:grid.revision}]});
 const loaded=loadProject(id);assert.equal(loaded.musicReport.issues.length,0);assert.notEqual(loaded.timeline.events['opening.reveal'],4);
 const prepared=prepare(loaded,reserveOutput(id,`${name}-prepared`),{from:0,to:10});assert.equal(prepared.data.range.durationInFrames,300);
 browser=await chromium.launch({executablePath:await browserPath(),headless:true,downloadsPath:reviewOutput});const context=await browser.newContext({acceptDownloads:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(reviewOutput,'index.html')).href);await page.locator('#audio').evaluate(a=>new Promise((resolve,reject)=>{if(a.readyState>=1)return resolve();a.onloadedmetadata=resolve;a.onerror=()=>reject(Error('Audio failed to load'));}));
 assert.ok(await page.locator('#audio').evaluate(a=>a.duration)>11);
 await page.locator('#half').click();assert.ok(Number(await page.locator('#bpm').inputValue())<100);await page.locator('#double').click();
 await page.locator('#audio').evaluate(a=>a.play());await page.waitForTimeout(250);assert.ok((await page.locator('#status').textContent()).includes('源文件'));
 await page.getByText('查看或粘贴完整逐拍时间表',{exact:true}).click();await page.locator('#manual').fill('0.2, 0.71, 1.23, 1.76');await page.locator('#manual').dispatchEvent('change');
 const downloadPromise=page.waitForEvent('download');await page.locator('#save').click();const download=await downloadPromise;await download.saveAs(path.join(reviewOutput,'downloaded-overrides.json'));const overrides=json(path.join(reviewOutput,'downloaded-overrides.json'));assert.equal(overrides.reviewStatus,'needs-listening');assert.deepEqual(beatGrid(json(path.join(fixture,'music-analysis.json')),overrides).beats.map(b=>b.sourceTime),[.2,.71,1.23,1.76]);
 await page.screenshot({path:path.join(reviewOutput,'review.png'),fullPage:true});assert.deepEqual(errors,[]);
 writeJson(path.join(reviewOutput,'validation.json'),{status:'passed',checks:['real ffmpeg analysis','source fingerprint','event and effect alignment','300-frame selection','mixed audio export','browser playback','half/double tempo','override download'],humanListening:'not-performed'});
 console.log(`Music validation passed: ${reviewOutput}`);
}finally{
 await browser?.close();
 const parent=path.resolve(ROOT,'projects');if(path.dirname(path.resolve(fixture))!==parent||!id.startsWith('music-validation-'))throw Error('Refusing fixture cleanup outside projects');
 fs.rmSync(fixture,{recursive:true,force:true});
}

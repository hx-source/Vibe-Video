import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {ROOT,inside,writeJson} from '../../scripts/files.mjs';
const revision=process.argv[2];
if(!/^[a-z0-9][a-z0-9-]*$/.test(revision??''))throw Error('Supply revision');
const output=inside(ROOT,`outputs/thinking-anchors/${revision}`);
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1500,height:1120}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(output,'review.html')).href);
  await page.waitForFunction(()=>document.getElementById('fresh').readyState>=1&&document.getElementById('old').readyState>=1);
  await page.click('#play');
  await page.waitForFunction(()=>document.getElementById('fresh').currentTime>32.25);
  await page.click('#pause');
  const modes=[];
  for(const mode of ['effects','music','old','new']){
    const before=await page.locator('#fresh').evaluate(e=>e.currentTime);
    await page.click(`[data-mode="${mode}"]`);
    await page.waitForFunction(mode=>document.querySelector(`[data-mode="${mode}"]`).classList.contains('active'),mode);
    const state=await page.evaluate(()=>{const old=document.getElementById('old'),fresh=document.getElementById('fresh'),stem=document.getElementById('stem');return {time:fresh.currentTime,oldTime:old.currentTime,stemTime:stem.currentTime,oldMuted:old.muted,newMuted:fresh.muted,stemSrc:stem.src,paused:fresh.paused};});
    if(Math.abs(state.time-before)>.1||Math.abs(state.oldTime-state.time)>.1)throw Error(`Position changed while switching ${mode}`);
    if(mode==='old'&&(state.oldMuted||!state.newMuted))throw Error('Old mix mute routing wrong');
    if(mode==='new'&&(!state.oldMuted||state.newMuted))throw Error('New mix mute routing wrong');
    if(['effects','music'].includes(mode)&&(!state.oldMuted||!state.newMuted||!state.stemSrc.endsWith(`B-${mode}.wav`)))throw Error(`Stem routing wrong ${mode}`);
    modes.push({mode,...state});
  }
  await page.click('[data-mode="effects"]');
  await page.waitForFunction(()=>document.querySelector('[data-mode="effects"]').classList.contains('active'));
  await page.click('#play');
  await page.waitForFunction(()=>{const v=document.getElementById('fresh'),a=document.getElementById('stem');return !v.paused&&!a.paused&&a.currentTime>32.25&&Math.abs(v.currentTime-a.currentTime)<.15;});
  await page.click('#pause');
  await page.locator('#fresh').evaluate(e=>{e.currentTime=45.85;});
  await page.click('#play');
  await page.waitForFunction(()=>{const e=document.getElementById('fresh');return !e.paused&&e.currentTime>32&&e.currentTime<33.5;});
  await page.click('#pause');
  await page.click('[data-mode="new"]');
  await page.screenshot({path:path.join(output,'review-ui.png'),fullPage:true});
  if(errors.length)throw Error(JSON.stringify(errors));
  writeJson(path.join(output,'review-browser-check.json'),{status:'passed',modeSwitches:modes,positionPreserved:true,stemPlaybackAdvanced:true,loopRange:[32,46],loopRewindPassed:true,scriptErrors:errors,humanListening:'not-performed; browser playback only'});
  console.log('A/B routing, stem playback, position preservation and range loop passed. No listening claim.');
}finally{await browser.close();}

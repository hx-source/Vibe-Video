import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {ROOT,writeJson} from '../../scripts/files.mjs';
const out=path.join(ROOT,'outputs/thinking-anchors',process.argv[2]??'sound-palettes-v2');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1200}}),errors=[],switches=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(out,'review.html')).href);
 await page.waitForFunction(()=>document.getElementById('picture').currentTime>2&&document.getElementById('sound').readyState>=1);
 for(const palette of ['a-tactile','b-comic','c-sparse']){
  await page.click(`[data-palette="${palette}"]`);
  await page.waitForFunction(()=>!document.querySelector('[data-palette]').disabled);
  for(const mode of ['effects','music','mix']){
   const before=await page.locator('#picture').evaluate(e=>e.currentTime);
   await page.click(`[data-mode="${mode}"]`);
   await page.waitForFunction(()=>!document.querySelector('[data-mode]').disabled);
   const s=await page.evaluate(()=>{const v=document.getElementById('picture'),a=document.getElementById('sound');return {videoTime:v.currentTime,audioTime:a.currentTime,src:a.src,videoMuted:v.muted,audioMuted:a.muted,paused:v.paused}});
   const expected=(mode==='music'?'a-tactile':palette)+'/'+mode+'-preview.wav';
   if(!s.src.endsWith(expected)||!s.videoMuted||s.audioMuted||Math.abs(s.videoTime-before)>.08||Math.abs(s.audioTime-s.videoTime)>.08)throw Error('Invalid routing or position '+JSON.stringify(s));
   switches.push({palette,mode,...s});
  }
 }
 await page.click('#play');
 await page.waitForFunction(()=>{const v=document.getElementById('picture'),a=document.getElementById('sound');return v.currentTime>2.35&&!v.paused&&!a.paused&&Math.abs(v.currentTime-a.currentTime)<.15});
 await page.click('[data-palette="b-comic"]');
 await page.waitForFunction(()=>{const v=document.getElementById('picture'),a=document.getElementById('sound');return a.src.endsWith('b-comic/mix-preview.wav')&&!document.querySelector('[data-palette]').disabled&&!v.paused&&!a.paused});
 await page.click('#pause');
 await page.locator('#picture').evaluate(e=>e.currentTime=13.8);
 await page.click('#play');
 await page.waitForFunction(()=>{const v=document.getElementById('picture'),a=document.getElementById('sound');return v.currentTime>0&&v.currentTime<1&&!v.paused&&!a.paused});
 await page.click('#pause');
 await page.locator('#picture').evaluate(v=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Decoded frame timeout')),5000);v.requestVideoFrameCallback(()=>{clearTimeout(timer);resolve()});v.currentTime=6.2}));
 await page.waitForFunction(()=>{const v=document.getElementById('picture');return !v.seeking&&v.readyState>=2});
 await page.screenshot({path:path.join(out,'review-ui.png'),fullPage:true});
 if(errors.length)throw Error(JSON.stringify(errors));
 writeJson(path.join(out,'review-browser-check.json'),{status:'passed',switches,playbackAdvanced:true,playingStatePreservedOnSwitch:true,loopPassed:true,scriptErrors:errors,assistantListening:'not-performed; technical playback check only'});
 console.log('3 palettes × 3 stems: routing, position, playback and looping passed.');
}finally{await browser.close()}

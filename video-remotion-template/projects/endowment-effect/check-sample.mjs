// Targeted review check using the repository's pinned Playwright runtime.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {comparePng} from '../../scripts/pixels.mjs';
import {chromium} from 'playwright';
import {browserPath} from '../../scripts/runtime.mjs';
const revision=process.argv[2]??'v3',port=Number(process.argv[3]??18741);
if(!/^v\d+$/.test(revision)||!Number.isInteger(port))throw Error('Invalid review revision/port');
const dir=path.resolve(`output/playwright/endowment-a-${revision}`);fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({executablePath:await browserPath(),headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1984,height:1800}});
const errors=[],report={status:'running',checks:[],screenshots:[],assistantListening:'not-performed',userApproval:'pending'};
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(`http://127.0.0.1:${port}/src/review/index.html?data=/prepared/endowment-effect/review-a-${revision}/review.json`);
 await page.locator('[data-film]').waitFor({timeout:90000});await page.evaluate(()=>document.fonts.ready);
 // Inspect at the native 1920px canvas size. Fractional Player scaling can
 // rerasterize the same SVG after seeking and cannot serve as a pixel oracle.
 await page.addStyleTag({content:'main{max-width:1984px}header{height:90px}h1{line-height:36px}small{line-height:20px}'});
 await page.waitForTimeout(150);
 fs.writeFileSync(path.join(dir,'initial-snapshot.txt'),await page.locator('body').innerText());
 await page.getByRole('button',{name:'暂停',exact:true}).click();
 async function seek(t){
  await page.getByLabel('定位秒数').fill(String(t));await page.getByRole('button',{name:'定位',exact:true}).click();
  await page.waitForTimeout(100);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{document.activeElement?.blur();return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  assert.equal(Number(await page.locator('[data-film]').getAttribute('data-frame')),Math.ceil(t*30-1e-7));
 }
 const points=revision==='v5'?[35,35.3,37.8,38,38.6,39.8,40,40.4,41.3,42.7,44.9]:[35,36.5,37.2,39.4,39.6,40.2,43.3,43.7,44.9];
 for(const t of points){
  await seek(t);
  const failed=await page.locator('[data-film]').evaluate(root=>{
   const outer=root.getBoundingClientRect();
   return [...root.querySelectorAll('[data-fit]')].flatMap(el=>{const r=el.getBoundingClientRect();return r.left<outer.left-2||r.right>outer.right+2||r.top<outer.top-2||r.bottom>outer.bottom+2?[el.textContent]:[];});
  });assert.deepEqual(failed,[]);report.checks.push({name:'text-bounds-and-seek',time:t,passed:true});
  if([35,37.2,38.6,40.2,41.3,44.9].includes(t)){
   const name=`frame-${Math.round(t*30)}.png`;await page.locator('[data-film]').screenshot({path:path.join(dir,name)});report.screenshots.push(name);
  }
 }
 await seek(40.2);const beforeDom=await page.locator('[data-film]').innerHTML();const before=await page.locator('[data-film]').screenshot({path:path.join(dir,'seek-before.png')});
 await seek(35);await seek(44.9);await seek(40.2);const after=await page.locator('[data-film]').screenshot({path:path.join(dir,'seek-after.png')});
 assert.equal(await page.locator('[data-film]').innerHTML(),beforeDom);
 const comparison=comparePng(before,after);
 report.checks.push({name:'deterministic-scene-state-after-backward-seek',passed:true,pixelDiagnostic:comparison,note:'SVG/DOM state must match exactly. Pixel diagnostic is reported separately because Chromium may cache compositing of the formerly translucent cup/person groups.'});
 if(revision==='v4'){
  assert.equal(await page.locator('[data-caption]').count(),0);
  const visibleText=await page.locator('[data-film]').innerText();
  for(const removed of ['是在增加一件东西','卖掉，变成了一次损失','还没拥有时，你想的是','已经拥有时，卖掉就成了'])assert.equal(visibleText.includes(removed),false);
  const positions=[];
  for(const t of [39.6,40.2,41.7]){await seek(t);positions.push(Number(await page.locator('[data-cup-grip] circle').getAttribute('cx')));}
  assert.ok(positions[1]<positions[0]-80&&positions[2]>positions[1]+100,JSON.stringify(positions));
  report.checks.push({name:'bottom-narration-removed-and-cup-withdraws-then-returns',passed:true,handFollowsCupX:positions});
 }
 if(revision==='v5'){
  const story=[];
  for(const [t,expected] of [[36,'店里的报价'],[39,'免费获赠'],[43,'现在有人出价']]){
   await seek(t);
   assert.equal(await page.locator('[data-caption]').count(),0);
   assert.equal(await page.locator('[data-person]').count(),1);
   assert.equal(await page.locator('[data-main-cup]').count(),1);
   const offer=await page.locator('[data-offer]').textContent();assert.ok(offer.includes(expected));
   const record=await page.locator('[data-decision-record]').textContent();
   for(const key of ['付30元','得到杯子','交出我的杯子','收30元'])assert.ok(record.includes(key));
   story.push({time:t,offer,dialogue:await page.locator('[data-speech]').textContent()});
  }
  report.checks.push({name:'single-person-continuity-gift-trigger-and-two-opposite-transactions',passed:true,story});
 }
 await seek(40.2);await page.getByLabel('声音',{exact:true}).selectOption('effects');await page.waitForTimeout(120);
 assert.equal(Number(await page.locator('[data-film]').getAttribute('data-frame')),1206);
 await page.getByLabel('声音',{exact:true}).selectOption('mix');await page.waitForTimeout(120);
 await page.locator('audio').evaluateAll(items=>items.forEach(a=>a.muted=true));
 await page.getByRole('button',{name:'播放',exact:true}).click();await page.waitForTimeout(650);await page.getByRole('button',{name:'暂停',exact:true}).click();
 const frame=Number(await page.locator('[data-film]').getAttribute('data-frame'));assert.ok(frame>1206);
 const positions=await page.locator('audio').evaluateAll(items=>items.filter(a=>!a.src.startsWith('data:')).map(a=>({src:a.src,time:a.currentTime,ready:a.readyState})));assert.ok(positions.some(a=>Math.abs(a.time-frame/30)<.25&&a.ready>=2));
 report.checks.push({name:'track-switch-preserves-position-and-playback-clock',passed:true,frame,audio:positions});
 assert.equal(await page.getByRole('checkbox',{name:'已实际试听'}).isChecked(),false);
 assert.deepEqual(errors,[]);report.status='passed';
 console.log(JSON.stringify(report,null,2));
}catch(error){report.status='failed';report.error=error.stack;report.browserErrors=errors;throw error;}
finally{fs.writeFileSync(path.join(dir,'browser-check.json'),JSON.stringify(report,null,2));await browser.close();}

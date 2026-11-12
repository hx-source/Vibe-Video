import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {comparePng} from './pixels.mjs';
import {reviewServer} from './review-server.mjs';
import {chromium} from 'playwright';
import {ROOT,reserveOutput,writeJson} from './files.mjs';
import {loadProject} from './project.mjs';
import {prepare} from './prepare.mjs';
import {browserPath} from './runtime.mjs';
import {frameAt} from '../src/timeline/compile.mjs';

const name=`browser-${Date.now()}`,output=reserveOutput('validation',name),results={status:'running',checks:[],screenshots:[],humanListening:'not-performed'};
const server=await reviewServer(0);
let browser,page;const errors=[];
try{
 const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 browser=await chromium.launch({executablePath:await browserPath(),headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 page=await browser.newPage({viewport:{width:1440,height:1200}});
 page.on('pageerror',e=>errors.push(e.message));
 async function open(id,options={}){
  const ready=prepare(loadProject(id),reserveOutput(id,`${name}-${Object.keys(options).join('-')||'full'}`),options);
  await page.goto(origin+ready.reviewUrl);await page.locator('[data-film]').waitFor({timeout:90000});await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.fonts.check('400 32px "Noto Sans SC"','知识网络')) ,true);
  return ready;
 }
 async function seek(seconds){
  await page.getByRole('button',{name:'暂停',exact:true}).click();
  await page.getByLabel('定位秒数').fill(String(seconds));await page.getByRole('button',{name:'定位',exact:true}).click();
  await page.waitForTimeout(100);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 }
 async function layout(){
  const failures=await page.locator('[data-film]').evaluate(root=>{
   const outer=root.getBoundingClientRect();return [...root.querySelectorAll('[data-fit]')].flatMap(el=>{
    const r=el.getBoundingClientRect();let bad=r.left<outer.left-2||r.right>outer.right+2||r.top<outer.top-2||r.bottom>outer.bottom+2;
    if(el instanceof HTMLElement)bad ||= el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2;
    return bad?[el.textContent]:[];
   });
  });assert.deepEqual(failures,[]);
 }
 const tcp=await open('tcp-handshake');
 const points=new Set([0,1,73.1]);
 for(const s of tcp.data.timeline.segments){for(const f of [s.startFrame,Math.min(s.endFrame-1,s.startFrame+15),s.endFrame-1])points.add(f/30);}
 for(const t of Object.values(tcp.data.timeline.events)){if(t<tcp.data.timeline.durationSeconds){points.add(Math.max(0,t-.04));points.add(Math.min(73.1,t+.04));}}
 for(const t of [...points].sort((a,b)=>a-b)){await seek(t);await layout();}
 results.checks.push({name:'tcp-layout-and-seeking',sampledTimes:points.size});
 for(const [label,t] of [['handshake',25.2],['half-close',45.6],['timewait',59.2]]){
  await seek(t);const file=`${label}.png`;await page.locator('[data-film]').screenshot({path:path.join(output,file)});results.screenshots.push(file);
 }
 await seek(25.2);const before=await page.locator('[data-film]').screenshot({path:path.join(output,'seek-before.png')});const beforeFrame=await page.locator('[data-film]').getAttribute('data-frame');assert.equal(Number(beforeFrame),frameAt(25.2,30));await seek(70);await seek(25.2);const after=await page.locator('[data-film]').screenshot({path:path.join(output,'seek-after.png')});assert.equal(await page.locator('[data-film]').getAttribute('data-frame'),beforeFrame);const comparison=comparePng(before,after);assert.ok(comparison.passed,JSON.stringify(comparison));results.checks.push({name:'deterministic-backward-seek',...comparison});
 const audio=await open('audio-demo',{from:8,to:10.5,compare:'audio-alternative.json'});
 assert.ok(fs.readFileSync(path.join(audio.output,'A/music.wav')).equals(fs.readFileSync(path.join(audio.output,'B/music.wav'))));
 assert.ok(!fs.readFileSync(path.join(audio.output,'A/mix.wav')).equals(fs.readFileSync(path.join(audio.output,'B/mix.wav'))));
 await seek(9);const time=await page.getByTestId('time').innerText();await page.getByLabel('方案',{exact:true}).selectOption('B');await page.waitForTimeout(150);assert.equal(await page.getByTestId('time').innerText(),time);
 await page.getByLabel('声音',{exact:true}).selectOption('music');await page.waitForTimeout(150);assert.equal(await page.getByTestId('time').innerText(),time);
 const audioPosition=await page.locator('audio').evaluateAll(items=>items.filter(a=>a.src.includes('B-music.wav')).map(a=>a.currentTime));assert.ok(audioPosition.some(t=>Math.abs(t-9)<.12),`Audio should use full-film offset; got ${audioPosition}`);
 await page.getByRole('button',{name:'播放',exact:true}).click();await page.waitForTimeout(400);assert.notEqual(await page.getByTestId('time').innerText(),time);
 await page.getByLabel('方案',{exact:true}).selectOption('A');const afterSwitch=await page.getByTestId('time').innerText();await page.waitForTimeout(300);assert.notEqual(await page.getByTestId('time').innerText(),afterSwitch);
 await page.getByRole('button',{name:'暂停',exact:true}).click();await seek(10.4);await page.getByRole('button',{name:'播放',exact:true}).click();await page.waitForTimeout(450);await page.getByRole('button',{name:'暂停',exact:true}).click();assert.ok(Number(await page.getByTestId('time').innerText())<9);
 const downloadPromise=page.waitForEvent('download');await page.getByLabel('审片备注').fill('自动化界面验证，不代表人工试听');await page.getByRole('button',{name:'下载审片记录'}).click();const download=await downloadPromise;await download.saveAs(path.join(output,'review-download.json'));
 const record=JSON.parse(fs.readFileSync(path.join(output,'review-download.json'),'utf8'));assert.equal(record.listened,false);assert.equal(record.decision,'not-recorded');
 results.checks.push({name:'audio-ab-position-playback-loop-download',passed:true});
 assert.deepEqual(errors,[]);results.status='passed';
 console.log(JSON.stringify({output,...results},null,2));
}catch(error){results.status='failed';results.error=error.stack;results.browserErrors=errors;if(page){fs.writeFileSync(path.join(output,'failure.html'),await page.content());await page.screenshot({path:path.join(output,'failure.png')});}console.error(JSON.stringify(results));throw error;}
finally{writeJson(path.join(output,'browser-report.json'),results);await browser?.close();await server.close();}

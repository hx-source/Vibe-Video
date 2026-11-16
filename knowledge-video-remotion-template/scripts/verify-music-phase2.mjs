import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {ROOT,json,writeJson,reserveOutput} from './files.mjs';
import {pcmWave} from './pcm.mjs';
import {musicCommand} from './music-cli.mjs';
import {loadProject} from './project.mjs';
import {beatGrid} from './music.mjs';
import {projectSnapshot,readLedger,reviewStates,recordSegmentReview} from './music-impact.mjs';
import {prepare} from './prepare.mjs';
import {browserPath} from './runtime.mjs';

const id=`music-phase2-${randomUUID()}`,fixture=path.join(ROOT,'projects',id),name=`phase2-${Date.now()}`;
fs.mkdirSync(fixture);let browser;
const out=suffix=>path.join(ROOT,'outputs',id,`${name}-${suffix}`);
try{
 fs.cpSync(path.join(ROOT,'templates/starter'),fixture,{recursive:true});const project=json(path.join(fixture,'project.json'));project.id=id;project.files.musicSync='music-sync.json';writeJson(path.join(fixture,'project.json'),project);
 const scene=sceneId=>({id:sceneId,durationSeconds:6,intent:'technical fixture',sceneType:'cards',events:{hit:1,end:6},props:{title:sceneId,cards:[{title:'test',body:'beat',event:'hit'}]}});
 writeJson(path.join(fixture,'storyboard.json'),{segments:[scene('first'),scene('second')]});writeJson(path.join(fixture,'captions.json'),{items:[{id:'cap',segmentId:'second',start:{event:'hit'},end:5,text:'留出足够的阅读时间'}]});
 const rate=44100,bed=new Float64Array(rate*12*2),hit=new Float64Array(Math.round(rate*.7)*2);
 for(let i=0;i<rate*12;i++){const t=i/rate,v=.04*Math.sin(2*Math.PI*261.625*t)+.025*Math.sin(2*Math.PI*329.628*t)+.02*Math.sin(2*Math.PI*391.995*t);bed[i*2]=bed[i*2+1]=v;}
 for(let t=.2;t<12;t+=.5)for(let j=0;j<1200;j++){const i=Math.round(t*rate)+j;if(i<rate*12){const v=.12*Math.exp(-j/180)*Math.cos(j*.3);bed[i*2]+=v;bed[i*2+1]+=v;}}
 for(let i=0;i<hit.length/2;i++){const t=i/rate,value=t<.03?0:.2*Math.sin(2*Math.PI*784*t)*Math.exp(-(t-.03)*10);hit[i*2]=hit[i*2+1]=value;}
 fs.writeFileSync(path.join(fixture,'assets/bed.wav'),pcmWave(bed).buffer);fs.writeFileSync(path.join(fixture,'assets/chime.wav'),pcmWave(hit).buffer);
 writeJson(path.join(fixture,'assets/index.json'),{schemaVersion:1,items:[{id:'bed',type:'audio',path:'bed.wav',source:'Generated harmonic/pulse technical fixture',license:'Project-generated'},{id:'chime',type:'audio',path:'chime.wav',source:'Generated damped sine fixture',license:'Project-generated',sound:{instrument:'glockenspiel',pitches:[79],attackSeconds:.03,tailSeconds:.5,tags:['light'],roles:['accent']}}]});
 const plan=json(path.join(fixture,'audio-plan.json'));plan.clips=[{id:'bed',role:'music',source:'asset:bed',sourceIn:0,sourceOut:12,at:0,speed:1,gain:.8}];plan.cues=[{id:'ding',role:'accent',kind:'tone',frequency:784,at:{event:'second.hit'},duration:.25,gain:.06,purpose:'Test impact',musicFit:'Technical fixture'}];writeJson(path.join(fixture,'audio-plan.json'),plan);
 musicCommand('analyze',{project:id,clip:'bed',tracking:'adaptive',name:`${name}-analysis`});const analysis=json(path.join(out('analysis'),'music-analysis.json'));assert.ok(analysis.localTempo.length);assert.ok(analysis.tonality.windows.length);writeJson(path.join(fixture,'music-analysis.json'),analysis);
 const grid=beatGrid(analysis);const beat=grid.beats.findIndex(b=>b.sourceTime>7&&b.sourceTime<8);assert.ok(beat>=0);
 writeJson(path.join(fixture,'music-sync.json'),{schemaVersion:1,analysis:'music-analysis.json',music:{clipId:'bed',sourceIn:0,sourceOut:12,at:0,speed:1},actions:[{event:'second.hit',beat,landmark:'start',soundId:'ding',revision:grid.revision}]});
 const p=loadProject(id),prepared=prepare(p,reserveOutput(id,`${name}-prepared`),{});assert.ok(Number.isFinite(prepared.manifest.audio[0].quality.measurements.integratedLufs));assert.ok(Number.isFinite(prepared.manifest.audio[0].quality.measurements.truePeakDb));
 // Simulated acceptance records only in an isolated generated project, not user approval.
 assert.throws(()=>recordSegmentReview(fixture,prepared.manifest,'first','approved',false),/actual-listening/);
 recordSegmentReview(fixture,prepared.manifest,'first','approved',true,'Simulated test record');recordSegmentReview(fixture,prepared.manifest,'second','approved',true,'Simulated test record');
 const changed=[...analysis.beats];changed[beat]+=.1;writeJson(path.join(fixture,'music-proposal.json'),{overrides:{beats:changed}});
 musicCommand('impact',{project:id,proposal:'music-proposal.json',name:`${name}-impact`});const report=json(path.join(out('impact'),'impact.json'));assert.equal(report.canApply,true);assert.equal(report.segments.find(s=>s.id==='first').changed,false);assert.equal(report.segments.find(s=>s.id==='second').requiresReopen,true);assert.equal(report.captions.length,1);assert.equal(report.effects.length,1);
 const reportPath=`outputs/${id}/${name}-impact/impact.json`;assert.throws(()=>musicCommand('apply',{project:id,report:reportPath,expected:report.baselineFingerprint}),/reopen/);
 musicCommand('apply',{project:id,report:reportPath,expected:report.baselineFingerprint,reopen:'second'});
 assert.deepEqual(reviewStates(projectSnapshot(loadProject(id)),readLedger(fixture)).map(s=>s.state),['approved','needs-review']);
 assert.equal(readLedger(fixture).records.at(-1).reopened,true);
 assert.throws(()=>musicCommand('apply',{project:id,report:reportPath,expected:report.baselineFingerprint,reopen:'second'}),/stale/);
 musicCommand('sound',{project:id,asset:'chime',name:`${name}-sound`});const sound=json(path.join(out('sound'),'sound-analysis.json'));assert.ok(sound.features.attackSeconds>.02&&sound.features.attackSeconds<.05);assert.equal(sound.features.instrument.status,'requires-label');
 musicCommand('palette',{project:id,analysis:'music-analysis.json',instrument:'glockenspiel',tag:'light',role:'accent',name:`${name}-palette`});const palette=json(path.join(out('palette'),'palette.json'));assert.equal(palette.candidates.length,1);assert.ok(Number.isFinite(palette.candidates[0].measurements.truePeakDb));
 musicCommand('review',{project:id,analysis:'music-analysis.json',overrides:'music-overrides.json',name:`${name}-editor`});
 browser=await chromium.launch({executablePath:await browserPath(),headless:true,downloadsPath:out('editor')});const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(out('editor'),'index.html')).href);
 await page.locator('[data-beat]').first().waitFor();const count=await page.locator('[data-beat]').count();
 const before=await page.locator('#manual').inputValue();
 const handle=page.locator('[data-beat]').nth(4).locator('circle');const box=await handle.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+7,box.y+box.height/2,{steps:4});await page.mouse.up();assert.notEqual(await page.locator('#manual').inputValue(),before);
 await page.locator('#undo').click();assert.equal(await page.locator('#manual').inputValue(),before);await page.locator('#redo').click();assert.notEqual(await page.locator('#manual').inputValue(),before);await page.locator('#undo').click();
 await page.locator('#from').fill('6');await page.locator('#to').fill('10');await page.locator('#range-offset').fill('0.033333');await page.locator('#range-shift').click();const shifted=(await page.locator('#manual').inputValue()).split(',').map(Number);assert.deepEqual(shifted.filter(t=>t<6),analysis.beats.filter(t=>t<6));assert.ok((await page.locator('#impact').textContent()).includes('second.hit'));
 await page.locator('#section-add').click();assert.ok(await page.locator('#sections tr').count()>0);const section=page.locator('#sections tr').last();await section.locator('input[data-field=label]').fill('局部校正');await section.locator('input[data-field=label]').dispatchEvent('change');
 await page.locator('[data-sound-action="0"] select').selectOption('chime');await page.locator('[data-sound-action="0"] [data-sound-field="gain"]').fill('0.2');await page.locator('[data-sound-action="0"] [data-sound-field="gain"]').dispatchEvent('change');
 const downloadPromise=page.waitForEvent('download');await page.locator('#proposal').click();await (await downloadPromise).saveAs(path.join(out('editor'),'downloaded-proposal.json'));const proposal=json(path.join(out('editor'),'downloaded-proposal.json'));assert.equal(proposal.overrides.reviewStatus,'needs-listening');assert.ok(proposal.overrides.sections.some(s=>s.label==='局部校正'));assert.equal(proposal.audioPlan.clips.find(c=>c.id==='ding').source,'asset:chime');assert.equal(proposal.audioPlan.clips.find(c=>c.id==='ding').gain,.2);assert.equal(proposal.actions[0].soundOffset,.03);
 writeJson(path.join(fixture,'ui-proposal.json'),proposal);musicCommand('impact',{project:id,proposal:'ui-proposal.json',name:`${name}-ui-impact`});assert.equal(json(path.join(out('ui-impact'),'impact.json')).canApply,true);
 await page.screenshot({path:path.join(out('editor'),'desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out('editor'),'mobile.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.ok(count>10);writeJson(path.join(out('editor'),'validation.json'),{status:'passed',checks:['adaptive analysis and tonal windows','LUFS and true peak','impact and protected approvals','atomic apply and stale rejection','sound metadata and mixed palette','drag, undo, redo and local edit','section annotations','proposal download','desktop and mobile layout'],humanListening:'not-performed'});console.log(`Phase 2 passed: ${out('editor')}`);
}finally{await browser?.close();if(path.dirname(path.resolve(fixture))!==path.join(ROOT,'projects')||!id.startsWith('music-phase2-'))throw Error('Unsafe cleanup target');fs.rmSync(fixture,{recursive:true,force:true});}

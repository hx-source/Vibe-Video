import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries,run} from '../../../scripts/runtime.mjs';
import {validatePortrait} from './contract.mjs';

const relative='outputs/thinking-anchors/portrait-opening-v1',out=path.join(ROOT,relative),parent=path.join(ROOT,'projects/thinking-anchors'),local=path.join(parent,'portrait-opening');
const manifest=json(path.join(out,'manifest.json'));if(manifest.status!=='portrait-prototype-rendered-and-decoded')throw Error('Render prototype first');
validatePortrait(json(path.join(out,'input-props.json')));
for(const [file,hash] of Object.entries(manifest.protectedHashes))if(sha(path.join(parent,file))!==hash)throw Error('Protected landscape configuration changed: '+file);
for(const [file,hash] of Object.entries(manifest.sources))if(sha(path.join(local,file))!==hash)throw Error('Rendered portrait source changed: '+file);
const finalManifest=json(path.join(ROOT,'outputs/thinking-anchors/final-v1/manifest.json'));
if(sha(path.join(ROOT,'outputs/thinking-anchors/final-v1/video.mp4'))!==finalManifest.videoOutput.sha256)throw Error('Prior full video changed');
const frames=JSON.parse(run(binaries().ffprobe,['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',path.join(out,'video.mp4')])).frames;
const timestampError=Math.max(...frames.map((f,i)=>Math.abs(Number(f.best_effort_timestamp_time)-i/30)));
if(frames.length!==360||timestampError>1e-5)throw Error('Invalid portrait timestamps');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),seeks=[];
try{
 const page=await browser.newPage({viewport:{width:430,height:1080},deviceScaleFactor:1});await page.goto(pathToFileURL(path.join(out,'review.html')).href);
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v.readyState>=2&&v.duration===12;});
 for(const time of [0,2.5,4.3,7.2,10.7,11.9]){
  await page.evaluate(async time=>{const v=document.querySelector('video');if(Math.abs(v.currentTime-time)>.001)await new Promise((resolve,reject)=>{v.addEventListener('seeked',resolve,{once:true});v.addEventListener('error',reject,{once:true});v.currentTime=time;});},time);
  const state=await page.evaluate(()=>{const v=document.querySelector('video');return {time:v.currentTime,readyState:v.readyState,width:v.videoWidth,height:v.videoHeight,error:v.error?.message??null};});if(state.error||state.width!==1080||state.height!==1920||Math.abs(state.time-time)>.05)throw Error('Native playback seek failed');seeks.push(state);
 }
 await page.locator('[data-time="5.8"]').click();await page.waitForTimeout(700);const action=await page.evaluate(()=>{const v=document.querySelector('video');v.pause();return {time:v.currentTime,paused:v.paused,error:v.error?.message??null};});if(action.time<6.2||action.error)throw Error('Seek control did not play');
 await page.evaluate(async()=>{const v=document.querySelector('video');v.muted=true;v.currentTime=11.2;await v.play();});await page.waitForFunction(()=>document.querySelector('video').ended);
 await page.evaluate(()=>document.querySelector('video').currentTime=10.7);await page.waitForFunction(()=>Math.abs(document.querySelector('video').currentTime-10.7)<.05&&document.querySelector('video').readyState>=2);
 await page.locator('video').screenshot({path:path.join(out,'phone-playback.png')});
 writeJson(path.join(out,'browser-media-check.json'),{nativePortraitPlayback:true,seekChecks:seeks,seekButtonPlayback:action,playedToEnd:true,frameTimestampErrorSeconds:timestampError,assistantListening:false,technicalBrowserPlaybackOnly:true});
}finally{await browser.close();}
const visual=json(path.join(out,'visual-checks.json')),audio=json(path.join(out,'audio/audio-report.json'));
const status={state:'portrait-opening-prototype-ready-for-review',revision:'portrait-opening-v1',output:relative+'/video.mp4',review:relative+'/review.html',storyboard:relative+'/storyboard.png',source:'projects/thinking-anchors/portrait-opening',durationSeconds:12,resolution:[1080,1920],aspectRatio:'9:16',fps:30,frames:360,noNarration:true,music:'02_情感话题_故事讲述.m4a',musicSourceRange:[0,12],musicSpeed:1,effects:4,content:'999缩成参照→199成为主角→省800的想法与心动→另一家189→相差10元与重新判断',technicalChecks:{everyFrameVisualBounds:visual.sampleCount,textCollisions:visual.issues.length,audioClippedSamples:audio.clippedSamples,audioWarnings:audio.warnings,encodedAudio:manifest.encodedAudioQuality,browserPlayback:true,mainProjectAndFinalVideoPreserved:true},userApproved:false,fullPortraitFilmProduced:false,assistantListening:'not-performed',musicBeatCalibration:'automatic candidate only; no human listening calibration'};
writeJson(path.join(out,'review-status.json'),status);writeJson(path.join(parent,'portrait-prototype-status.json'),status);
const delivery=json(path.join(parent,'delivery-status.json'));delivery.portraitOpeningPrototype=status;writeJson(path.join(parent,'delivery-status.json'),delivery);
const ledger=json(path.join(parent,'segment-production.json'));ledger.portraitOpeningPrototype={revision:status.revision,rangeSeconds:[0,12],status:'preview-ready',output:status.output,userApproved:false,scope:'独立竖屏开头；未改写原横屏分段的认可记录'};writeJson(path.join(parent,'segment-production.json'),ledger);
const readme=path.join(parent,'README.md'),heading='## 新方向样片：抖音竖屏开头12秒';if(!fs.readFileSync(readme,'utf8').includes(heading))fs.writeFileSync(readme,`${heading}\n\n用户授权保留漫画风格和02配乐，减少同屏内容，突出价格与判断变化。原生1080×1920、30fps的12秒样片已完成，待用户反馈。\n\n- 视频：\`${status.output}\`\n- 审片页：\`${status.review}\`\n- 源码与独立竖屏适配：\`${status.source}\`\n\n本轮360帧文字碰撞与安全区域检查通过，4个短音效，音频完成技术核对，未记录助手人工听音。原70秒横屏完整视频及正式分镜、音频配置保留。\n\n`+fs.readFileSync(readme,'utf8'));
manifest.manualReview={visual:'six portrait keyframes inspected at phone scale; all-frame glyph bounds verified',audio:'technical checks only; actual listening not performed'};manifest.delivery='review-status.json';writeJson(path.join(out,'manifest.json'),manifest);
console.log(JSON.stringify({video:status.output,duration:12,resolution:status.resolution,frames:360,seeks:seeks.length,visualProblems:visual.issues.length,audioWarnings:audio.warnings,mainProjectPreserved:true,userApproval:false}));

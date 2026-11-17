import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {binaries,run,probe} from '../../scripts/runtime.mjs';
import {measureLoudness,qualityAssessment} from '../../scripts/audio-quality.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {designFingerprint} from '../../scripts/design-plan.mjs';
const out=path.resolve('outputs/endowment-effect/representative-a-v6');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const manifest=read(path.join(out,'manifest.json')),project=loadProject('endowment-effect');
if(manifest.design.fingerprint!==designFingerprint(project))throw Error('Current source differs from rendered sample');
const media=probe(path.join(out,'video.mp4')),video=media.streams.find(s=>s.codec_type==='video');
if(video.width!==1920||video.height!==1080||Number(video.nb_frames)!==300)throw Error('Unexpected output video');
for(const [t,file] of [[1,'buy.png'],[4,'gift.png'],[5.65,'offer.png'],[6.5,'refuse.png'],[9,'poster.png']]){
 run(binaries().ffmpeg,['-v','error','-ss',String(t),'-i',path.join(out,'video.mp4'),'-frames:v','1',path.join(out,file)]);
}
const browser=read('output/playwright/endowment-a-v6/browser-check.json');
if(browser.status!=='passed')throw Error('Browser checks did not pass');
const quality=qualityAssessment(measureLoudness(path.join(out,'video.mp4'),binaries().ffmpeg),[],project.audioPlan.qualityPolicy);
fs.writeFileSync(path.join(out,'encoded-audio-quality.json'),JSON.stringify(quality,null,2));
const actionQuality=read(path.join(out,'A/audio-quality.json'));
const sameMix=hash(path.join(out,'A-mix.wav'))===hash('outputs/endowment-effect/representative-a-v5/A-mix.wav');
if(!sameMix)throw Error('The unchanged audio mix differs from v5');
const evidence={status:'exported-pending-user-feedback',sourceFingerprintCurrent:true,rangeSeconds:[35,45],video:manifest.videoOutput,audioMixIdenticalToV5:sameMix,encodedAudio:quality,actionAudio:actionQuality,browser,changes:['去掉流程、报价、交易对比与重复解释','金色杯子放大，人物降低对比，构图集中','买入、获赠、卖出依次出现，一次只呈现当前问题和反应','归属标签与手臂收回承担关键含义'],assistantListening:'not-performed',userApproval:'pending'};
fs.writeFileSync(path.join(out,'delivery-checks.json'),JSON.stringify(evidence,null,2));
const frozen=path.join(out,'project-sources');fs.mkdirSync(frozen);
for(const file of ['project.json','storyboard.json','captions.json','audio-plan.json','production-plan.json','visual-plan.json','review.json','facts.md','scenes/EndowmentScene.tsx','scenes/OwnershipDecisionScene.tsx','scenes/OwnershipFocusScene.tsx']){
 const dest=path.join(frozen,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(project.dir,file),dest);
}
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>禀赋效应 · 聚焦杯子</title><style>*{box-sizing:border-box}body{max-width:1200px;margin:30px auto;padding:0 24px 48px;background:#080e1d;color:#f2e7d0;font:17px/1.7 system-ui,sans-serif}h1{font-size:29px;margin:8px 0}p{color:#b0bacd}video{width:100%;display:block;border-radius:14px;border:1px solid #35415b;background:#080e1d}a{color:#e1c487}button{font:inherit;padding:9px 16px;margin:5px 8px 5px 0;border-radius:8px;border:1px solid #35415b;background:#171d31;color:#f2e7d0;cursor:pointer}button[aria-pressed=true]{background:#e1c487;color:#080e1d}nav{margin:14px 0}details{margin-top:22px;font-size:14px}</style><h1>把重点交给杯子的变化</h1><p>新版十秒样片。去掉并列面板，用同一只杯子的连续动作讲清前后判断。</p><nav><button data-version="new" aria-pressed="true">看新版</button><button data-version="old" aria-pressed="false">对照上一版</button></nav><video id="film" src="video.mp4" poster="poster.png" controls playsinline preload="metadata"></video><p>30元买，嫌贵 → 免费获赠 → 30元卖，舍不得。</p><nav><button id="restart">从头播放</button><button id="loop">循环播放</button><a href="video.mp4" download="禀赋效应_聚焦版_十秒样片.mp4">下载新版</a></nav><details><summary>制作与检查说明</summary><p>1080p、30fps、10秒，对应全片35–45秒，带配乐与音效，无配音。30元是原创生活示意金额，不是实验数据。</p><p>完成配置、类型、关键帧、文字边界、任意跳转、播放时钟、300帧导出与解码检查。音频混音与v5完全相同；最终编码音频另行检查。助手未实际听音，用户尚未认可本版，整片仍在制作中。</p><a href="delivery-checks.json">检查记录</a> · <a href="manifest.json">产物清单</a></details><script>const film=document.getElementById('film');document.querySelectorAll('[data-version]').forEach(b=>b.onclick=()=>{const time=film.currentTime,play=!film.paused;film.src=b.dataset.version==='new'?'video.mp4':'../representative-a-v5/video.mp4';film.poster=b.dataset.version==='new'?'poster.png':'../representative-a-v5/poster.png';film.addEventListener('loadedmetadata',()=>{film.currentTime=Math.min(time,9.9);if(play)film.play()},{once:true});document.querySelectorAll('[data-version]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});document.getElementById('restart').onclick=()=>{film.currentTime=0;film.play()};document.getElementById('loop').onclick=e=>{film.loop=!film.loop;e.target.textContent=film.loop?'关闭循环':'循环播放'};</script></html>`);
console.log(JSON.stringify({output:out,frames:Number(video.nb_frames),duration:video.duration,audioWarnings:quality.warnings,actionWarnings:actionQuality.warnings,audioMixIdenticalToV5:sameMix,browser:browser.status}));

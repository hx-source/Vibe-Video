import fs from 'node:fs';
import path from 'node:path';
import {binaries,run,probe} from '../../scripts/runtime.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {designFingerprint} from '../../scripts/design-plan.mjs';
const out=path.resolve('outputs/endowment-effect/representative-a-v5');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const manifest=read(path.join(out,'manifest.json')),project=loadProject('endowment-effect');
if(manifest.design.fingerprint!==designFingerprint(project))throw Error('Current source differs from rendered sample');
for(const [t,file] of [[1,'buy.png'],[4,'gift.png'],[5.4,'offer.png'],[6.5,'refuse.png'],[9,'poster.png']]){
 run(binaries().ffmpeg,['-v','error','-ss',String(t),'-i',path.join(out,'video.mp4'),'-frames:v','1',path.join(out,file)]);
}
const media=probe(path.join(out,'video.mp4')),video=media.streams.find(s=>s.codec_type==='video');
if(video.width!==1920||video.height!==1080||Number(video.nb_frames)!==300)throw Error('Unexpected output video');
const browser=read('output/playwright/endowment-a-v5/browser-check.json');
const quality=read(path.join(out,'encoded-audio-quality.json'));
const actionQuality=read(path.join(out,'A/audio-quality.json'));
const old=read('outputs/endowment-effect/representative-a-v4/music-snapshot.json');
const baseMusicUnchanged=JSON.stringify(project.audioPlan.clips.find(c=>c.role==='music'))===JSON.stringify(old.audioPlan.clips.find(c=>c.role==='music'));
const evidence={status:'exported-pending-user-feedback',sourceFingerprintCurrent:true,rangeSeconds:[35,45],video:manifest.videoOutput,baseMusicUnchanged,encodedAudio:quality,actionAudio:actionQuality,browser,changes:['一名持续人物与同一只杯子','明确免费获赠的归属触发','买卖同样30元，直接比较判断','下方交换图解保留两次判断；不叠加长叙述字幕'],assistantListening:'not-performed',userApproval:'pending'};
fs.writeFileSync(path.join(out,'delivery-checks.json'),JSON.stringify(evidence,null,2));
const frozen=path.join(out,'project-sources');fs.mkdirSync(frozen);
for(const file of ['project.json','storyboard.json','captions.json','audio-plan.json','production-plan.json','facts.md','scenes/EndowmentScene.tsx','scenes/OwnershipDecisionScene.tsx']){
 const destination=path.join(frozen,file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(path.join(project.dir,file),destination);
}
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>禀赋效应 · 同一个人，同一只杯子</title><style>*{box-sizing:border-box}body{max-width:1200px;margin:30px auto;padding:0 24px 48px;background:#080e1d;color:#f2e7d0;font:17px/1.7 system-ui,sans-serif}h1{font-size:29px;margin:8px 0}p{color:#b0bacd}video{width:100%;display:block;border-radius:14px;border:1px solid #35415b;background:#080e1d}a{color:#e1c487}button{font:inherit;padding:9px 16px;margin:5px 8px 5px 0;border-radius:8px;border:1px solid #35415b;background:#171d31;color:#f2e7d0;cursor:pointer}button[aria-pressed=true]{background:#e1c487;color:#080e1d}nav{margin:14px 0}.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}.steps div{border-top:2px solid #35415b;padding:12px 0}.steps b{color:#e1c487}details{margin-top:22px;font-size:14px}@media(max-width:700px){.steps{grid-template-columns:1fr}}</style><h1>买时嫌贵，卖时舍不得。</h1><p>同一个人 · 同一只杯子 · 同样30元。十秒样片，对应全片35–45秒。</p><nav><button data-version="new" aria-pressed="true">看新版</button><button data-version="old" aria-pressed="false">对照上一版</button></nav><video id="film" src="video.mp4" poster="poster.png" controls playsinline preload="metadata"></video><div class="steps"><div><b>0–3秒 · 买入</b><br>花30元得到杯子：嫌贵，不买。</div><div><b>3–5秒 · 获赠</b><br>杯子免费送给他，成为“我的”。</div><div><b>5–10秒 · 卖出</b><br>交出杯子得到30元：舍不得，不卖。</div></div><p>下方动态图解保留两次交换方向与判断，上方演出人物、杯子和报价的变化。</p><nav><button id="restart">从头播放</button><button id="loop">循环播放</button><a href="video.mp4" download="禀赋效应_同人同杯同价_十秒样片.mp4">下载新版</a></nav><details><summary>制作说明</summary><p>1080p、30fps、10秒，带配乐与事件音效，无配音。30元是生活示意金额。完成类型、配置、关键帧边界、场景状态、播放时钟、300帧导出与完整解码检查。音频技术报告无告警，助手未实际听音。用户尚未认可该版本，整片仍在制作中。</p><p>跳转后SVG状态一致；浏览器截图存在少量边缘差异，原始像素诊断单独保留。</p><a href="delivery-checks.json">检查记录</a> · <a href="manifest.json">产物清单</a></details><script>const film=document.getElementById('film');document.querySelectorAll('[data-version]').forEach(b=>b.onclick=()=>{const time=film.currentTime,play=!film.paused;film.src=b.dataset.version==='new'?'video.mp4':'../representative-a-v4/video.mp4';film.poster=b.dataset.version==='new'?'poster.png':'../representative-a-v4/poster.png';film.addEventListener('loadedmetadata',()=>{film.currentTime=Math.min(time,9.9);if(play)film.play()},{once:true});document.querySelectorAll('[data-version]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});document.getElementById('restart').onclick=()=>{film.currentTime=0;film.play()};document.getElementById('loop').onclick=e=>{film.loop=!film.loop;e.target.textContent=film.loop?'关闭循环':'循环播放'};</script></html>`);
console.log(JSON.stringify({output:out,frames:Number(video.nb_frames),duration:video.duration,audioWarnings:quality.warnings,actionWarnings:actionQuality.warnings,baseMusicUnchanged,browser:browser.status}));

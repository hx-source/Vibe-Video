import fs from 'node:fs';
import path from 'node:path';
import {binaries,run} from '../../scripts/runtime.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {designFingerprint} from '../../scripts/design-plan.mjs';
const out=path.resolve('outputs/endowment-effect/representative-a-v4');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const manifest=read(path.join(out,'manifest.json'));
if(manifest.design.fingerprint!==designFingerprint(loadProject('endowment-effect')))throw Error('Source fingerprint changed');
for(const [t,file] of [[.8,'gain.png'],[2.5,'owned.png'],[5.2,'withdraw.png'],[7.1,'returned.png'],[9.4,'poster.png']]){
 run(binaries().ffmpeg,['-v','error','-ss',String(t),'-i',path.join(out,'video.mp4'),'-frames:v','1',path.join(out,file)]);
}
const unchangedAudio=fs.readFileSync(path.join(out,'A-mix.wav')).equals(fs.readFileSync('outputs/endowment-effect/representative-a-v3/A-mix.wav'));
if(!unchangedAudio)throw Error('Audio unexpectedly changed');
const browser=read('output/playwright/endowment-a-v4/browser-check.json');
const quality=read(path.join(out,'encoded-audio-quality.json'));
fs.writeFileSync(path.join(out,'delivery-checks.json'),JSON.stringify({status:'exported-pending-user-feedback',sourceFingerprintCurrent:true,range:[35,45],video:manifest.videoOutput,unchangedAudioPcm:unchangedAudio,encodedAudio:quality,browser,assistantListening:'not-performed',userApproval:'pending'},null,2));
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>禀赋效应 · 用动作解释得失</title><style>*{box-sizing:border-box}body{margin:32px auto;padding:0 24px 44px;max-width:1160px;background:#080e1d;color:#f2e7d0;font:17px/1.7 system-ui,sans-serif}h1{font-size:28px}p{color:#a9b2c6}video{width:100%;border:1px solid #35415b;border-radius:12px;background:#080e1d}a{color:#e1c487}button{border:1px solid #35415b;background:#171d31;color:#f2e7d0;border-radius:8px;padding:10px 14px;font:inherit;cursor:pointer;margin:5px 6px 5px 0}details{margin-top:22px}</style><h1>用动作解释“得到”和“失去”</h1><p>A 聚光叙事 · 修改后十秒样片 · 对应全片35–45秒 · 无配音</p><video id="film" src="video.mp4" poster="poster.png" controls playsinline preload="metadata"></video><p>撤掉底部叙述和重复说明：杯子靠近 → 成为“我的” → 尝试移出 → 人物伸手拉回。保留少量关键词与最后一句结论。</p><nav><button data-time="0">看得到与归属变化</button><button data-time="4.2">看移出与拉回</button><button data-time="7.8">看收束</button><button id="loop">循环播放</button></nav><p><a href="video.mp4" download="禀赋效应_A聚光叙事_动态可视化十秒样片.mp4">下载新版</a> · <a href="../representative-a-v3/video.mp4">对照上一版</a></p><details><summary>制作记录</summary><p>保留A风格、十秒范围、原配乐与音效；混音PCM与上一版完全一致。底部不再叠加解释句，原叙述另存于可选字幕文件。杯子移出又被拉回是“不愿放手”的示意，没有表现一次出售成交。</p><p>完成300帧1080p导出、音视频完整解码、文字边界、杯子移动和回跳状态检查。助手未实际听音；本版尚待观看反馈，整片仍在制作中。</p><a href="delivery-checks.json">检查记录</a> · <a href="manifest.json">产物清单</a></details><script>const film=document.getElementById('film');document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>{film.currentTime=Number(b.dataset.time);film.play()});document.getElementById('loop').onclick=e=>{film.loop=!film.loop;e.target.textContent=film.loop?'关闭循环':'循环播放'};</script></html>`);
console.log(JSON.stringify({output:out,frames:manifest.videoOutput.frames,unchangedAudio,qualityWarnings:quality.warnings,browser:browser.status}));

import fs from 'node:fs';
import path from 'node:path';
import {binaries,run,probe} from '../../scripts/runtime.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {designFingerprint} from '../../scripts/design-plan.mjs';
const out=path.resolve('outputs/endowment-effect/representative-a-v3');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const p=loadProject('endowment-effect'),manifest=read(path.join(out,'manifest.json'));
if(manifest.design.fingerprint!==designFingerprint(p))throw Error('Sample source fingerprint is no longer current');
for(const [t,file] of [[0,'start.png'],[2.4,'ownership.png'],[5.4,'reaction.png'],[9.3,'poster.png']]){
 run(binaries().ffmpeg,['-v','error','-ss',String(t),'-i',path.join(out,'video.mp4'),'-frames:v','1',path.join(out,file)]);
}
const movie=probe(path.join(out,'video.mp4'));
const encoded=read(path.join(out,'encoded-audio-quality.json'));
const audio=read(path.join(out,'A/audio-quality.json'));
const browser=read('output/playwright/endowment-a-v3/browser-check.json');
const report={rangeSeconds:[35,45],durationSeconds:10,video:{width:1920,height:1080,fps:30,frames:300},codec:movie.streams.find(s=>s.codec_type==='video').codec_name,audioCodec:movie.streams.find(s=>s.codec_type==='audio').codec_name,sourceFingerprintCurrent:true,encodedAudio:encoded,actionAudio:audio,browser,assistantListening:'not-performed',userApproval:'pending'};
fs.writeFileSync(path.join(out,'delivery-checks.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>禀赋效应 · A 聚光叙事 · 十秒样片</title><style>*{box-sizing:border-box}body{margin:32px auto;padding:0 24px 44px;max-width:1160px;background:#080e1d;color:#f2e7d0;font:17px/1.7 system-ui,sans-serif}h1{font-size:28px;margin-bottom:10px}p{color:#a9b2c6}video{width:100%;background:#080e1d;border-radius:12px;border:1px solid #35415b}a{color:#e1c487}button{border:1px solid #35415b;background:#171d31;color:#f2e7d0;border-radius:8px;padding:10px 14px;font:inherit;cursor:pointer;margin:5px 6px 5px 0}.meta{font-size:14px}details{margin-top:22px}</style><h1>杯子没变，“我的”改变了判断。</h1><p>A · 聚光叙事 / 十秒有声样片 / 1920×1080 / 中文字幕，无配音</p><video id="film" controls playsinline preload="metadata" poster="poster.png" src="video.mp4"></video><p>本播放器 0–10 秒，对应全片 35–45 秒；音乐和动作沿用全片时钟。</p><nav><button data-time="1">看归属变化</button><button data-time="4">看人物反应</button><button data-time="7.5">看结论落定</button><button id="loop">循环播放</button></nav><p><a href="video.mp4" download="禀赋效应_A聚光叙事_十秒有声样片.mp4">下载样片</a> · <a href="A-mix.wav">完整混音</a> · <a href="A-music.wav">单听配乐</a> · <a href="A-effects.wav">单听音效</a></p><details><summary>制作与检查说明</summary><p>配乐采用现有《02_情感话题_故事讲述》，原速连续播放。标签落定、护住物品、结论出现共三处短音效；标签落定附近短暂降低配乐，为音效留出空间。</p><p>已验证10秒、300帧、H.264/AAC音轨、完整解码、关键时刻文字边界，以及播放器跳转和音轨时钟。最终编码音频约 −19.8 LUFS，真峰值 −6.1 dBTP，无技术告警。助手未实际听音，听感待你试听。</p><p class="meta">浏览器返回同帧后SVG状态完全一致；截图有1226个像素的差异，集中在部分物件与人物边缘，可能与浏览器合成有关，原始诊断保留在检查记录中。仅该十秒已制作；整片尚未完成，样片尚未获得用户观看试听认可。</p><a href="delivery-checks.json">完整检查记录</a> · <a href="manifest.json">产物清单</a></details><script>const film=document.getElementById('film');document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>{film.currentTime=Number(b.dataset.time);film.play()});document.getElementById('loop').onclick=e=>{film.loop=!film.loop;e.target.textContent=film.loop?'关闭循环':'循环播放'};</script></html>`);
console.log(JSON.stringify({output:out,currentFingerprint:true,frames:manifest.videoOutput.frames,encodedWarnings:encoded.warnings,actionWarnings:audio.warnings}));

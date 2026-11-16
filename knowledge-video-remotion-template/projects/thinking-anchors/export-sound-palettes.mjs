import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),candidate=json(path.join(dir,'sound-palette-candidates.json'));
const name=process.argv[2]??'sound-palettes-v1',out=reserveOutput('thinking-anchors',name);
const source=path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/chapters/04-evidence.mp4');
const formalBefore=sha(path.join(dir,'audio-plan.json')),pictureBefore=sha(source),ff=binaries().ffmpeg;
const videoHash=f=>run(ff,['-v','error','-i',f,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).trim();
const originalHash=videoHash(source),results=[];
fs.copyFileSync(source,path.join(out,'picture.mp4'));
fs.copyFileSync(path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/evidence.png'),path.join(out,'poster.png'));
for(const palette of candidate.palettes){
  const p=loadProject('thinking-anchors',{audioPlan:palette.audioPlan}),target=path.join(out,palette.id);
  const plan=structuredClone(p.audioPlan);
  for(const clip of plan.clips)clip.source=p.assets.get(clip.source.slice(6)).path;
  const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:plan},ff,{directory:target,stems:true,quality:true});
  const assetEvidence=[...p.used].map(([id,a])=>({id,path:a.path,sha256:sha(a.diskPath),source:a.source,license:a.license}));
  writeJson(path.join(target,'audio-plan.json'),p.audioPlan);
  writeJson(path.join(target,'asset-sources.json'),assetEvidence);
  for(const stem of ['mix','effects','music'])fs.writeFileSync(path.join(target,`${stem}-preview.wav`),waveSlice(fs.readFileSync(path.join(target,stem+'.wav')),32,46));
  const movie=path.join(target,'preview.mp4');
  run(ff,['-v','error','-n','-i',source,'-i',path.join(target,'mix-preview.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',movie]);
  decode(movie); const info=probe(movie),v=info.streams.find(s=>s.codec_type==='video');
  if(Number(v?.nb_frames)!==420||v.width!==1920||v.height!==1080||!info.streams.some(s=>s.codec_type==='audio')||Math.abs(Number(info.format.duration)-14)>.04)throw Error('Invalid preview '+palette.id);
  if(videoHash(movie)!==originalHash)throw Error('Picture differs: '+palette.id);
  const encoded=measureLoudness(movie,ff);
  if(encoded.truePeakDb>-1)throw Error('Encoded audio headroom too low '+palette.id);
  writeJson(path.join(target,'encoded-audio-quality.json'),encoded);
  results.push({id:palette.id,title:palette.title,effects:palette.effects,video:'preview.mp4',videoSha256:sha(movie),videoStreamUnchanged:true,frames:420,duration:14,musicSha256:sha(path.join(target,'music-preview.wav')),quality:report.quality,warnings:report.warnings,encodedAudio:encoded});
  console.log(palette.id,'exported',JSON.stringify(encoded));
}
if(new Set(results.map(r=>r.musicSha256)).size!==1)throw Error('Music must be identical for comparison');
if(sha(path.join(dir,'audio-plan.json'))!==formalBefore||sha(source)!==pictureBefore)throw Error('Original source changed');
writeJson(path.join(out,'manifest.json'),{...candidate,createdAt:new Date().toISOString(),results,originalVideoStreamHash:originalHash,pictureUnchanged:true,musicBitIdenticalAcrossPalettes:true,formalAudioPlanUnchanged:true,formalAudioPlanSha256:formalBefore,manualReview:{audio:'needs-user-listening',assistantListening:'not-performed'}});
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>锚定效应 · 三组声音对照</title><style>*{box-sizing:border-box}body{margin:24px auto;max-width:1200px;padding:0 24px;background:#fff7e8;color:#242b30;font:17px/1.7 system-ui}h1{font-size:29px}p{color:#635e55}video{display:block;width:100%;border:3px solid #242b30;border-radius:12px;background:#fff7e8}button{font:16px system-ui;padding:12px 18px;margin:5px;border:2px solid #242b30;border-radius:9px;background:#fff;cursor:pointer}button.active{background:#57c4b4}button:disabled{opacity:.6;cursor:wait}.group{margin:14px 0}a{color:#227a72;margin-right:16px}.note{font-size:14px}#status{font-weight:600;color:#252c30}</style><h1>同一段画面，三种声音方向</h1><p>检查商品 → 翻看成交记录 → 价格归组。三组保持相同画面、相同02配乐与音乐音量；区别在音色、动作配法和留白。</p><div class="group" id="palettes"><button class="active" data-palette="a-tactile">A 生活拟音 · 7处</button><button data-palette="b-comic">B 柔和漫画 · 6处</button><button data-palette="c-sparse">C 清脆留白 · 4处</button></div><p id="description">纸页、布料摩擦和小物件细节，偏生活材质感。</p><video id="picture" controls playsinline preload="metadata" muted poster="poster.png" src="picture.mp4"></video><audio id="sound" preload="auto" src="a-tactile/mix-preview.wav"></audio><div class="group" id="modes"><button class="active" data-mode="mix">混合音乐听</button><button data-mode="effects">只听动作音效</button><button data-mode="music">只听配乐</button></div><div class="group"><button id="play">播放</button><button id="pause">暂停</button><button id="again">从头重听</button><label><input id="loop" type="checkbox" checked>循环14秒</label></div><p id="status">A 生活拟音 · 混合音乐听</p><p class="note">切换时保留位置和播放状态。音效轨沿用实际混音增益。部分漫画滑音为原创合成；下载音效来自 Kenney，来源与许可保存在工程。尚待实际听感确认，原成片保留。</p><p><a href="a-tactile/preview.mp4">A 视频</a><a href="b-comic/preview.mp4">B 视频</a><a href="c-sparse/preview.mp4">C 视频</a><a href="manifest.json">本次素材与检查记录</a></p><script>
const v=document.getElementById('picture'),a=document.getElementById('sound');
const desc={'a-tactile':'纸页、布料摩擦和小物件细节，偏生活材质感。','b-comic':'疑问音、咯吱声、连续滑音，偏轻松的漫画动作。','c-sparse':'减少触发，用少量玻璃轻响、翻页和空间尾音强调线索与结果。'};
const names={'a-tactile':'A 生活拟音','b-comic':'B 柔和漫画','c-sparse':'C 清脆留白'},modes={mix:'混合音乐听',effects:'只听动作音效',music:'只听配乐'};
let palette='a-tactile',mode='mix',switching=false;
function sync(){if(a.readyState>=1&&Math.abs(v.currentTime-a.currentTime)>.07)a.currentTime=v.currentTime}
async function play(){if(switching)return;v.muted=true;sync();try{await Promise.all([v.play(),a.play()])}catch(e){if(e.name==='AbortError')return;v.pause();a.pause();document.getElementById('status').textContent='请点击播放重试：'+e.message}}
function pause(){v.pause();a.pause()}
async function select(p,m){const t=v.currentTime,playing=!v.paused;switching=true;pause();document.querySelectorAll('[data-palette],[data-mode]').forEach(b=>b.disabled=true);palette=p;mode=m;a.src=(m==='music'?'a-tactile':p)+'/'+m+'-preview.wav';a.load();try{await new Promise((resolve,reject)=>{if(a.readyState>=1)return resolve();a.onloadedmetadata=resolve;a.onerror=()=>reject(Error('音频加载失败'))});a.currentTime=t;document.querySelectorAll('[data-palette]').forEach(b=>b.classList.toggle('active',b.dataset.palette===p));document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));document.getElementById('description').textContent=desc[p];document.getElementById('status').textContent=names[p]+' · '+modes[m]}finally{switching=false;document.querySelectorAll('[data-palette],[data-mode]').forEach(b=>b.disabled=false)}if(playing)await play()}
document.querySelectorAll('[data-palette]').forEach(b=>b.onclick=()=>select(b.dataset.palette,mode));document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>select(palette,b.dataset.mode));document.getElementById('play').onclick=play;document.getElementById('pause').onclick=pause;document.getElementById('again').onclick=async()=>{pause();v.currentTime=0;if(a.readyState>=1)a.currentTime=0;await play()};v.addEventListener('play',()=>{if(!switching){sync();a.play().catch(()=>{})}});v.addEventListener('pause',()=>a.pause());v.addEventListener('seeking',sync);v.addEventListener('timeupdate',sync);v.addEventListener('ended',()=>{if(document.getElementById('loop').checked){v.currentTime=0;a.currentTime=0;play()}});v.addEventListener('loadedmetadata',()=>{v.currentTime=2.05},{once:true});
</script></html>`;
fs.writeFileSync(path.join(out,'review.html'),html);
writeJson(path.join(dir,'sound-review.json'),{previousCandidate:{plan:'audio-action-candidate.json',output:'outputs/thinking-anchors/action-sfx-v1',userApproval:'rejected',feedback:'所有的音效都太单调，类似蹦崩，内容和风格不符合'},currentCandidate:{manifest:'sound-palette-candidates.json',output:`outputs/thinking-anchors/${name}`,range:[32,46],palettes:results.map(({id,title,effects})=>({id,title,effects}))},pictureUnchanged:true,musicUnchangedAcrossCandidates:true,formalPlanUnchanged:true,humanListening:'not-performed',userApproval:'pending'});
const status=json(path.join(dir,'delivery-status.json'));
status.output='outputs/thinking-anchors/full-motion-v1/video.mp4';status.review=`outputs/thinking-anchors/${name}/review.html`;status.preview=`outputs/thinking-anchors/${name}/a-tactile/preview.mp4`;status.candidateSoundAssetCount=12;delete status.foleyAssetCount;status.state='three-sound-palettes-ready-for-listening';status.previousSoundCandidate='outputs/thinking-anchors/action-sfx-v1';status.soundReview=`outputs/thinking-anchors/${name}/review.html`;status.soundPaletteManifest=`outputs/thinking-anchors/${name}/manifest.json`;status.userSoundApproval=false;status.soundCueCount='7 / 6 / 4 in separate 14-second auditions';status.formalAudioPlan='audio-plan.json unchanged; palette alternatives are separate';
writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,`当前声音试听：三组不同材质与风格，尚待用户选择。\n- 对照页：outputs/thinking-anchors/${name}/review.html\n- 范围：32–46秒；相同画面与02配乐；A生活拟音7处/B柔和漫画6处/C清脆留白4处。\n- 上一版 action-sfx-v1 因音色雷同被用户否定，保留作历史对照。\n- 正式 audio-plan.json 和全部原画面未改动；新方案尚未应用整片。\n\n`+fs.readFileSync(readme,'utf8'));
console.log('Ready:',out);

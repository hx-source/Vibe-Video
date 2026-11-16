// Audio-only revision: reuse the approved animation bitstream and expose A/B/stems.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,inside,json,sha,writeJson} from '../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness,qualityAssessment} from '../../scripts/audio-quality.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';

const name=process.argv[2];
if(!/^[a-z0-9][a-z0-9-]*$/.test(name??''))throw Error('Supply a prepared A/B revision');
const output=inside(ROOT,`outputs/thinking-anchors/${name}`),manifest=json(path.join(output,'manifest.json'));
const original=inside(ROOT,'outputs/thinking-anchors/full-motion-v1'),source=path.join(original,'video.mp4');
const sourceManifest=json(path.join(original,'manifest.json'));
if(sourceManifest.status!=='rendered-and-decoded'||sha(source)!==sourceManifest.videoOutput.sha256)throw Error('Original full-film output changed');
if(manifest.range.from!==0||manifest.range.to!==2640||manifest.audio.length!==2||manifest.audio[1].variant!=='B')throw Error('Prepare the full original/candidate A/B mix');
const candidatePath=inside(ROOT,'projects/thinking-anchors/audio-action-candidate.json');
if(manifest.audio[1].configuration.audioPlan.sha256!==sha(candidatePath))throw Error('Candidate changed since preparation');
for(const a of manifest.audio)if(sha(path.join(output,a.variant,'mix.wav'))!==a.mixSha256)throw Error(`Prepared ${a.variant} mix differs`);
if(sha(path.join(output,'A/mix.wav'))!==sha(path.join(original,'A/mix.wav')))throw Error('A must preserve the delivered original mix');
const movie=path.join(output,'video.mp4');
if(fs.existsSync(movie))throw Error('Choose a new output revision');
const ff=binaries().ffmpeg;
run(ff,['-v','error','-n','-i',source,'-i',path.join(output,'B/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','88','-movflags','+faststart',movie]);
decode(movie);const info=probe(movie),v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
if(v?.width!==1920||v.height!==1080||Number(v.nb_frames)!==2640||!a||Math.abs(Number(info.format.duration)-88)>.04)throw Error('Revised movie dimensions, frame count or audio invalid');
const videoHash=file=>run(ff,['-v','error','-i',file,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).trim();
const oldVideoHash=videoHash(source),newVideoHash=videoHash(movie);
if(oldVideoHash!==newVideoHash)throw Error('Audio-only update changed the video stream');
const policy=manifest.audio[1].quality.policy;
const quality=qualityAssessment(measureLoudness(movie,ff),[],policy);
writeJson(path.join(output,'probe.json'),info);writeJson(path.join(output,'encoded-audio-quality.json'),quality);

// Use the exact pre-encoded 14-second chapter, preserving the full-film audio clock.
const chapter=path.join(original,'chapters/04-evidence.mp4');
for(const [variant,suffix] of [['A','before'],['B','after']]){
  const wav=path.join(output,`${variant}-preview.wav`);
  fs.writeFileSync(wav,waveSlice(fs.readFileSync(path.join(output,variant,'mix.wav')),32,46));
  const target=path.join(output,`preview-${suffix}.mp4`);
  run(ff,['-v','error','-n','-i',chapter,'-i',wav,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',target]);
  decode(target);const pi=probe(target),pv=pi.streams.find(s=>s.codec_type==='video');
  if(Number(pv.nb_frames)!==420||!pi.streams.some(s=>s.codec_type==='audio'))throw Error('Audio preview invalid');
}
fs.writeFileSync(path.join(output,'B-effects-preview.wav'),waveSlice(fs.readFileSync(path.join(output,'B/effects.wav')),32,46));
for(const file of ['poster.png','captions.srt','captions.vtt','storyboard.html','knowledge-sources.json'])if(fs.existsSync(path.join(original,file)))fs.copyFileSync(path.join(original,file),path.join(output,file));
for(const id of ['deal','trap','rewind','evidence','reprice','shop','compare','close'])fs.copyFileSync(path.join(original,`${id}.png`),path.join(output,`${id}.png`));
const coverage=json(inside(ROOT,'projects/thinking-anchors/action-foley-coverage.json'));
const report={status:'audio-candidate-exported',sourceVideo:'outputs/thinking-anchors/full-motion-v1/video.mp4',sourceVideoSha256:sha(source),videoStreamUnchanged:true,videoStreamHash:newVideoHash,originalPcmUnchanged:true,durationSeconds:88,frames:2640,effectAssets:15,actionCues:coverage.effects.length,previewSeconds:[32,46],encodedAudio:quality,relativeLevels:manifest.audio[1].quality.eventLevels,pcmClippedSamples:0,humanListening:'not-performed-by-assistant',userSoundApproval:'pending',formalAudioPlan:'audio-plan.json unchanged; candidate kept separate'};
writeJson(path.join(output,'audio-revision-checks.json'),report);
writeJson(path.join(output,'action-coverage.json'),coverage);
manifest.status='rendered-and-decoded';manifest.design.kind='audio-variant';
manifest.audioVariantVideo='B';manifest.videoOutput={file:'video.mp4',sha256:sha(movie),frames:2640,width:1920,height:1080,duration:88};
manifest.encodedAudioQuality=quality;manifest.audioRevision={sourceVideo:report.sourceVideo,unchangedVideoHash:newVideoHash,actionCues:42,preview:{from:32,to:46,after:'preview-after.mp4',before:'preview-before.mp4'}};
manifest.manualReview={visuals:'original video stream copied unchanged',audio:'candidate-needs-user-listening'};
writeJson(path.join(output,'manifest.json'),manifest);

fs.writeFileSync(path.join(output,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>动作音效 · 同画面对照</title><style>*{box-sizing:border-box}body{max-width:1500px;margin:28px auto;padding:0 24px;background:#fff8e9;color:#25252b;font:17px/1.7 system-ui}main{display:grid;grid-template-columns:1fr 1fr;gap:20px}video{width:100%;border:3px solid #25252b;border-radius:10px}h2{margin:12px 0;font-size:22px}button{padding:10px 16px;margin:4px;background:#e3f4ec;border:2px solid #25252b;border-radius:8px;color:#25252b;font:16px system-ui;cursor:pointer}button.active{background:#45b9ae}p{color:#666258}.controls{margin:16px 0}.hint{font-size:15px}a{margin-right:16px}@media(max-width:900px){main{grid-template-columns:1fr}}</style><h1>动作音效 · 同画面 A/B 对照</h1><p>画面完全沿用原版，音乐仍为02。新版加入纸张翻动、卡片滑动、牵引、发现问题、暂停付款和物件落定等声音。</p><div class="controls"><button data-mode="new" class="active">听新版混音</button><button data-mode="old">听原版混音</button><button data-mode="effects">只听新版动作音效</button><button data-mode="music">只听新版配乐</button></div><main><section><h2>原版</h2><video id="old" muted playsinline preload="metadata" poster="poster.png" src="../full-motion-v1/video.mp4"></video></section><section><h2>动作音效版</h2><video id="fresh" controls playsinline preload="metadata" poster="poster.png" src="video.mp4"></video></section></main><div class="controls"><button id="play">播放当前片段</button><button id="pause">暂停</button><button id="again">重看当前片段</button><label><input id="loop" type="checkbox" checked>循环当前片段</label></div><div class="controls"><button data-range="0,88">完整88秒</button><button data-range="0,14">报价与砍价</button><button data-range="14,24">报价牵引判断</button><button data-range="32,46">检查、滑看与归组</button><button data-range="58,82">网购与暂停付款</button><button data-range="82,88">物件收进袋子</button></div><p id="status">当前对照：32–46秒 · 新版混音</p><p class="hint">切换混音或分轨会保留时间位置；一次只播放一条声音。下方新版视频可拖动定位。新音效尚待实际试听确认。</p><p><a href="video.mp4">完整新版MP4</a><a href="preview-after.mp4">14秒动作音效试片</a><a href="B-effects.wav">完整动作音效轨</a><a href="B-music.wav">新版配乐轨</a></p><audio id="stem" preload="metadata"></audio><script>
const old=document.getElementById('old'),fresh=document.getElementById('fresh'),stem=document.getElementById('stem'),status=document.getElementById('status');let mode='new',range=[32,46],busy=false;
const names={new:'新版混音',old:'原版混音',effects:'仅动作音效',music:'仅配乐'};
function audible(){old.muted=mode!=='old';fresh.muted=mode!=='new';stem.muted=false;status.textContent='当前对照：'+range[0]+'–'+range[1]+'秒 · '+names[mode]}
async function seek(t){busy=true;fresh.currentTime=t;old.currentTime=t;if(mode==='effects'||mode==='music')stem.currentTime=t;busy=false}
function follow(){if(Math.abs(old.currentTime-fresh.currentTime)>.06)old.currentTime=fresh.currentTime;if((mode==='effects'||mode==='music')&&Math.abs(stem.currentTime-fresh.currentTime)>.08)stem.currentTime=fresh.currentTime}
async function play(){audible();follow();await Promise.allSettled([fresh.play(),old.play(),...(mode==='effects'||mode==='music'?[stem.play()]:[])])}
function pause(){fresh.pause();old.pause();stem.pause()}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=async()=>{const t=fresh.currentTime,playing=!fresh.paused;stem.pause();mode=b.dataset.mode;if(mode==='effects'||mode==='music'){stem.src=mode==='effects'?'B-effects.wav':'B-music.wav';stem.load();await new Promise(r=>stem.addEventListener('loadedmetadata',r,{once:true}));stem.currentTime=t}audible();document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));if(playing)await play()});
document.querySelectorAll('[data-range]').forEach(b=>b.onclick=async()=>{range=b.dataset.range.split(',').map(Number);pause();await seek(range[0]);await play()});
document.getElementById('play').onclick=play;document.getElementById('pause').onclick=pause;document.getElementById('again').onclick=async()=>{pause();await seek(range[0]);await play()};
fresh.addEventListener('play',()=>{audible();old.play().catch(()=>{});if(mode==='effects'||mode==='music')stem.play().catch(()=>{})});fresh.addEventListener('pause',()=>{old.pause();stem.pause()});fresh.addEventListener('seeking',()=>{if(!busy)follow()});fresh.addEventListener('timeupdate',()=>{follow();if(document.getElementById('loop').checked&&fresh.currentTime>=range[1]-.025)seek(range[0])});
fresh.addEventListener('loadedmetadata',()=>seek(range[0]),{once:true});audible();
</script></html>`);
console.log(JSON.stringify({output,actionCues:42,videoUnchanged:true,quality:quality.measurements,warnings:quality.warnings},null,2));

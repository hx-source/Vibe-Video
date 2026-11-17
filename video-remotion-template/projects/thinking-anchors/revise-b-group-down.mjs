import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/b-record-entries-v1');
const out=reserveOutput('thinking-anchors','b-group-down-v1');
const formalHash=sha(path.join(dir,'audio-plan.json')),base=json(path.join(prior,'audio-plan.json')),plan=structuredClone(base);
const cue=plan.clips.find(c=>c.id==='b-comic-5'),before=structuredClone(cue);
cue.source='asset:group-down-sweep-v1';cue.at={event:'evidence.range',offset:.85};
cue.sourceIn=0;cue.sourceOut=1.15;cue.gain=.8;cue.fadeIn=.015;cue.fadeOut=.015;
cue.purpose='三个价格标签同时向下移动，单次柔和扫动随整体速度变化，到底部时收住';
cue.musicFit='固定02配乐，使用无额外音高的摩擦扫动，不组成滑音旋律；与知识漫画的配合待用户实际试听';
for(const c of base.clips.filter(c=>c.id!==cue.id))if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Other cue changed');
const planName='audio-palette-b-group-down-v1.json';writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);
for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(out,'mix'),stems:true,quality:true});
const a=fs.readFileSync(path.join(prior,'mix/mix.wav')),b=fs.readFileSync(path.join(out,'mix/mix.wav'));
const start=44+Math.round(40.1*44100)*4,end=44+Math.round(42*44100)*4;
if(a.length!==b.length||!a.subarray(44,start).equals(b.subarray(44,start))||!a.subarray(end).equals(b.subarray(end)))throw Error('PCM outside changed movement differs');
if(sha(path.join(prior,'mix/music.wav'))!==sha(path.join(out,'mix/music.wav')))throw Error('Music changed');
for(const role of ['mix','effects','music'])fs.writeFileSync(path.join(out,role+'-preview.wav'),waveSlice(fs.readFileSync(path.join(out,'mix',role+'.wav')),32,46));
fs.copyFileSync(path.join(prior,'preview.mp4'),path.join(out,'before.mp4'));
fs.copyFileSync(path.join(prior,'effects-preview.wav'),path.join(out,'before-effects.wav'));
const picture=path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/chapters/04-evidence.mp4'),video=path.join(out,'preview.mp4');
run(ff,['-v','error','-n','-i',picture,'-i',path.join(out,'mix-preview.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',video]);
decode(video);const info=probe(video),v=info.streams.find(s=>s.codec_type==='video');
if(Number(v?.nb_frames)!==420||v.width!==1920||v.height!==1080||!info.streams.some(s=>s.codec_type==='audio'))throw Error('Invalid preview');
const vh=f=>run(ff,['-v','error','-i',f,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).trim();
if(vh(video)!==vh(path.join(prior,'preview.mp4')))throw Error('Picture changed');
const encoded=measureLoudness(video,ff);if(encoded.truePeakDb>-1)throw Error('Insufficient encoded headroom');
if(sha(path.join(dir,'audio-plan.json'))!==formalHash)throw Error('Formal plan changed');
writeJson(path.join(out,'audio-plan.json'),plan);writeJson(path.join(out,'encoded-audio-quality.json'),encoded);
writeJson(path.join(out,'asset-sources.json'),[...p.used].map(([id,a])=>({id,path:a.path,source:a.source,license:a.license,sha256:sha(a.diskPath)})));
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-record-entries-v1',rangeSeconds:[32,46],beforeCue:before,afterCue:cue,
 movementSoundPreviewSeconds:[8.85,10],changedWindowSeconds:[8.1,10],pictureUnchanged:true,musicUnchanged:true,
 pcmOutsideChangedWindowBitIdentical:true,otherCuesUnchanged:true,threeRecordSoundsUnchanged:true,lensSoundUnchanged:true,
 settleSoundUnchanged:true,formalAudioPlanUnchanged:true,quality:report.quality,encodedAudio:encoded,frames:420,duration:14,
 userFeedback:'第9秒左右3个标签向下移动的音效不太合适',userApproval:'pending-downward-motion-listening',assistantListening:'not-performed'});
let html=fs.readFileSync(path.join(prior,'review.html'),'utf8');
html=html.replaceAll('B版 · 三条成交记录逐条配音','B版 · 标签整体下移音效')
 .replaceAll('B版 · 三条记录，三次纸张轻响','B版 · 三个标签整体下移')
 .replaceAll('第5.10、5.44、5.78秒各有一次短纸张声，依次跟随成交记录A、B、C出现。放大镜动作声与其他声音保留。','第8.85–10秒用一次轻扫跟随三个标签整体下移，到底部时收住。三条记录出现的声音、放大镜及落定轻响保留。')
 .replaceAll('三条记录逐条轻响','标签下移扫动').replaceAll('上版（滑动与一次翻页）','上版（短纸张声）')
 .replaceAll('从第4.5秒听三条记录','从第7.5秒听标签下移').replaceAll('v.currentTime=4.5','v.currentTime=7.5');
fs.writeFileSync(path.join(out,'review.html'),html);fs.copyFileSync(path.join(prior,'poster.png'),path.join(out,'poster.png'));
const history=path.join(dir,'history/before-b-group-down-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History exists');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];
review.feedback={text:'第9秒左右三个标签向下移动，音效不太合适',resolution:'去掉提前结束的短纸张声，改为8.85–10秒随整体下移速度变化的一次轻扫，保留落定轻响'};
review.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-group-down-v1',range:[32,46],review:'outputs/thinking-anchors/b-group-down-v1/review.html'};
review.userApproval='pending-downward-motion-listening';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='b-group-down-candidate-ready';status.preview='outputs/thinking-anchors/b-group-down-v1/preview.mp4';status.review='outputs/thinking-anchors/b-group-down-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-group-down-v1/manifest.json';status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; '+planName+' is the alternative';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：第8.85–10秒，三个价格标签整体下移配单次柔和扫动，速度包络跟随画面并在落定时收住。此前放大镜与三条记录声音保留。\n- 试听：outputs/thinking-anchors/b-group-down-v1/review.html\n- 正式音频方案与原画面未改，待本处实际试听。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output:out,motionRange:[8.85,10],encodedAudio:encoded,warnings:report.warnings,otherAudioUnchanged:true},null,2));

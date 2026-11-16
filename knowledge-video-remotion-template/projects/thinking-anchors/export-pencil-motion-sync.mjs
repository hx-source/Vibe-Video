import fs from 'node:fs';import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/b-pencil-underline-v1');
const out=reserveOutput('thinking-anchors','b-pencil-motion-sync-v1'),formalHash=sha(path.join(dir,'audio-plan.json'));
const base=json(path.join(prior,'audio-plan.json')),plan=structuredClone(base);
const endCue=plan.clips.find(c=>c.id==='b-comic-6');
if(!endCue)throw Error('Expected the single end cue');
endCue.at={event:'evidence.settle',offset:-.9};
endCue.source='asset:pencil-underline-recorded-v1';endCue.sourceIn=0;endCue.sourceOut=.24;endCue.gain=.9;endCue.fadeIn=.002;endCue.fadeOut=.010;
endCue.purpose='将同一短笔触提前到9.10–9.34秒标签下移过程中，主要声音对齐约9.23秒的最大下移速度';
endCue.musicFit='保持同一0.24秒录音、增益与淡入淡出，仅提前触发，使声音来自移动中的动作；保持02配乐和其他声音，音画同步感待用户实际试听';
for(const c of base.clips.filter(c=>c.id!==endCue.id))if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Unrelated cue changed');
const planName='audio-palette-b-pencil-motion-sync-v1.json';writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);
for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(out,'mix'),stems:true,quality:true});
const a=fs.readFileSync(path.join(prior,'mix/mix.wav')),b=fs.readFileSync(path.join(out,'mix/mix.wav'));
const start=44+Math.round(41.1*44100)*4,end=44+Math.round(42.36*44100)*4;
if(a.length!==b.length||!a.subarray(44,start).equals(b.subarray(44,start))||!a.subarray(end).equals(b.subarray(end)))throw Error('Unrelated audio changed');
if(sha(path.join(prior,'mix/music.wav'))!==sha(path.join(out,'mix/music.wav')))throw Error('Music changed');
for(const role of ['mix','effects','music'])fs.writeFileSync(path.join(out,role+'-preview.wav'),waveSlice(fs.readFileSync(path.join(out,'mix',role+'.wav')),32,46));
const effects=fs.readFileSync(path.join(out,'mix/effects.wav'));
const movement=waveSlice(effects,39,41.1);if(movement.subarray(44).some(x=>x!==0))throw Error('Movement still contains effects');
fs.writeFileSync(path.join(out,'ending-only.wav'),waveSlice(effects,41.1,41.46));
fs.copyFileSync(path.join(prior,'preview.mp4'),path.join(out,'before.mp4'));
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
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-pencil-underline-v1',rangeSeconds:[32,46],changedCue:'b-comic-6',endCue,
 continuousMovementEffectAbsent:true,pencilCueSeconds:[9.10,9.34],changedWindowSeconds:[9.10,10.36],timingShiftSeconds:-.9,
 pictureUnchanged:true,musicUnchanged:true,pcmOutsideChangedWindowBitIdentical:true,otherCuesUnchanged:true,
 formalAudioPlanUnchanged:true,quality:report.quality,encodedAudio:encoded,frames:420,duration:14,
 userFeedback:'铅笔声像在移动完之后突然划一道，而不是随着移动产生',
 decision:'Move exactly the same 0.24-second pencil cue 0.9 seconds earlier. Its energy center at about 9.244s aligns with maximum downward velocity around 9.23s. No continuous sound is introduced.',
 userApproval:'pencil-type-retained; motion-timing-pending',assistantListening:'not-performed'});
let html=fs.readFileSync(path.join(prior,'review.html'),'utf8');
html=html.replaceAll('B版 · 铅笔短划线结束音','B版 · 笔触跟随移动')
 .replaceAll('B版 · 横线完成时的一笔短划线','B版 · 铅笔声提前到标签下移中')
 .replaceAll('第10秒横线完成时，给一次约0.24秒的铅笔划线声。采用真实铅笔录音片段；放大镜、三条记录和配乐保留。','同一笔触提前到第9.10–9.34秒，主要声音对应标签下移最快的一段。只改时机，音色、时长、音量和其他声音保留。')
 .replaceAll('铅笔短划线','跟随移动的短笔触').replaceAll('上版（短玻璃提示）','上版（移动完才发声）')
 .replaceAll('从第9秒听横线完成','从第8.5秒听笔触与下移').replaceAll('v.currentTime=9','v.currentTime=8.5');
fs.writeFileSync(path.join(out,'review.html'),html);fs.copyFileSync(path.join(prior,'poster.png'),path.join(out,'poster.png'));
const history=path.join(dir,'history/before-b-pencil-motion-sync-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History exists');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];
review.feedback={text:'铅笔声应随着移动产生，原来像移动完成后突然补上一道',resolution:'同一笔触提前0.9秒，放在9.10–9.34秒实际下移过程中，声音能量中心与最大下移速度对齐；音色与其他声音保留'};
review.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-pencil-motion-sync-v1',range:[32,46],review:'outputs/thinking-anchors/b-pencil-motion-sync-v1/review.html'};
review.userApproval='pencil-type-retained; motion-timing-pending';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='pencil-motion-timing-candidate-ready';status.preview='outputs/thinking-anchors/b-pencil-motion-sync-v1/preview.mp4';status.review='outputs/thinking-anchors/b-pencil-motion-sync-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-pencil-motion-sync-v1/manifest.json';status.selectedMotionSound='same recorded pencil stroke at 9.10–9.34s; motion timing pending';status.soundCueCount=6;status.selectedMotionPlan=planName;status.userMotionCueSelection=false;status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; '+planName+' is the alternative';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：同一0.24秒铅笔声提前到9.10–9.34秒标签实际下移中，避免完成后补声；主要声音中心与最大下移速度对齐，其他声音保留。\n- 试听：outputs/thinking-anchors/b-pencil-motion-sync-v1/review.html\n- 音色、时长、音量和画面保留，本次只待时机对应感的试听。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output:out,movementEffectsRemoved:true,pencilRange:[9.10,9.34],encodedAudio:encoded,warnings:report.warnings},null,2));

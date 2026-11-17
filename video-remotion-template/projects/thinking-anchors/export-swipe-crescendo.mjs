import fs from 'node:fs';import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/b-swipe-integrated-v1');
const out=reserveOutput('thinking-anchors','b-swipe-crescendo-v1');
const base=json(path.join(prior,'audio-plan.json')),plan=structuredClone(base),formalHash=sha(path.join(dir,'audio-plan.json'));
const cue=plan.clips.find(c=>c.id==='b-comic-5'),before=structuredClone(cue);
cue.source='asset:paper-crescendo-v1';cue.at={event:'evidence.range',offset:-1};cue.sourceOut=3;cue.gain=.9;cue.fadeIn=.005;cue.fadeOut=.015;
cue.purpose='第7–10秒单次滑动，从轻轻进入到逐渐加重，再柔和收住；力度和细节连续推进，避免死硬的起止';
cue.musicFit='沿用选定纸卡频谱质感；三秒渐强与渐变滤波为明确用户需求，无外加敲击、旋律或空间效果；与02配乐的自然程度待实际试听';
// The explicit request is for the full three-second requested window, beyond the default
// 1.5-second process limit. Only this alternative's local review policy changes.
plan.reviewPolicy.maxProcessSeconds=3.05;
plan.clips=plan.clips.filter(c=>c.id!=='b-comic-6');
for(const c of base.clips.filter(c=>![cue.id,'b-comic-6'].includes(c.id)))if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Other cue changed');
const planName='audio-palette-b-swipe-crescendo-v1.json';writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);
for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(out,'mix'),stems:true,quality:true});
const a=fs.readFileSync(path.join(prior,'mix/mix.wav')),b=fs.readFileSync(path.join(out,'mix/mix.wav'));
const start=44+39*44100*4,end=44+42*44100*4;
if(a.length!==b.length||!a.subarray(44,start).equals(b.subarray(44,start))||!a.subarray(end).equals(b.subarray(end)))throw Error('Other audio differs');
if(sha(path.join(prior,'mix/music.wav'))!==sha(path.join(out,'mix/music.wav')))throw Error('Music differs');
for(const role of ['mix','effects','music'])fs.writeFileSync(path.join(out,role+'-preview.wav'),waveSlice(fs.readFileSync(path.join(out,'mix',role+'.wav')),32,46));
fs.copyFileSync(p.assets.get('paper-crescendo-v1').diskPath,path.join(out,'complete-gesture.wav'));
fs.copyFileSync(path.join(prior,'preview.mp4'),path.join(out,'before.mp4'));
const picture=path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/chapters/04-evidence.mp4'),video=path.join(out,'preview.mp4');
run(ff,['-v','error','-n','-i',picture,'-i',path.join(out,'mix-preview.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',video]);
decode(video);const info=probe(video),v=info.streams.find(s=>s.codec_type==='video');
if(Number(v?.nb_frames)!==420||v.width!==1920||v.height!==1080||!info.streams.some(s=>s.codec_type==='audio'))throw Error('Invalid preview');
const vh=f=>run(ff,['-v','error','-i',f,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).trim();
if(vh(video)!==vh(path.join(prior,'preview.mp4')))throw Error('Picture differs');
const encoded=measureLoudness(video,ff);if(encoded.truePeakDb>-1)throw Error('Insufficient encoded headroom');
if(sha(path.join(dir,'audio-plan.json'))!==formalHash)throw Error('Formal plan changed');
writeJson(path.join(out,'audio-plan.json'),plan);writeJson(path.join(out,'encoded-audio-quality.json'),encoded);
writeJson(path.join(out,'asset-sources.json'),[...p.used].map(([id,a])=>({id,path:a.path,source:a.source,license:a.license,sha256:sha(a.diskPath)})));
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-swipe-integrated-v1',rangeSeconds:[32,46],beforeCue:before,afterCue:cue,
 frictionRangeSeconds:[7,10],completeGestureSeconds:[7,10],changedWindowSeconds:[7,10],pictureUnchanged:true,musicUnchanged:true,
 pcmOutsideChangedWindowBitIdentical:true,otherCuesUnchanged:true,threeRecordSoundsUnchanged:true,lensSoundUnchanged:true,
 externalContactsRemoved:true,sameCarrierAcrossGesture:true,formalAudioPlanUnchanged:true,quality:report.quality,encodedAudio:encoded,frames:420,duration:14,
 userFeedback:'第7–10秒滑动声应由轻到重缓缓变化，体现开始、中间和结尾，而不是死硬的感觉',
 material:'single paper-spectrum carrier with 3-second crescendo, one smoothly opening filter, 200ms entry and 220ms exit; subjective naturalness remains unverified',
 userApproval:'pending-gentle-crescendo-listening',assistantListening:'not-performed'});
let html=fs.readFileSync(path.join(prior,'review.html'),'utf8');
html=html.replaceAll('B版 · 同一条滑动声的起止力度','B版 · 第7–10秒由轻到重')
 .replaceAll('B版 · 用摩擦声自身完成起止','B版 · 轻轻进入、持续加重、柔和收住')
 .replaceAll('第8–10秒使用同一条摩擦声，只改变起头、过程与收尾的力度。撤掉上一版额外的接触、落定素材，避免音色拼接。','第7–10秒：轻轻进入，滑动中持续加重、细节逐渐清楚，接近完成时达到最明显的力度，再柔和收住。仍是一条连续摩擦。')
 .replaceAll('同源摩擦起止','缓缓渐强的完整滑动').replaceAll('上版（额外接触与落定声）','上版（较硬的起止）')
 .replaceAll('单独听同一条摩擦的起止','单独听三秒由轻到重的滑动')
 .replaceAll('从第7.5秒听标签下移','从第6.5秒听完整转变').replaceAll('v.currentTime=7.5','v.currentTime=6.5');
fs.writeFileSync(path.join(out,'review.html'),html);fs.copyFileSync(path.join(prior,'poster.png'),path.join(out,'poster.png'));
const history=path.join(dir,'history/before-b-swipe-crescendo-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History exists');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];
review.feedback={text:'第7–10秒需要由轻到重缓缓变化，体现开始、中间和结尾，避免死硬',resolution:'同一摩擦声提前到第7秒，三秒连续渐强、细节渐变，最后柔和收住，无额外敲击或重复刷动'};
review.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-swipe-crescendo-v1',range:[32,46],review:'outputs/thinking-anchors/b-swipe-crescendo-v1/review.html'};
review.userApproval='pending-gentle-crescendo-listening';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='gentle-crescendo-swipe-candidate-ready';status.preview='outputs/thinking-anchors/b-swipe-crescendo-v1/preview.mp4';status.review='outputs/thinking-anchors/b-swipe-crescendo-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-swipe-crescendo-v1/manifest.json';status.selectedMotionSound='paper-crescendo-v1 (7–10s gradual light-to-firm gesture; listening pending)';status.soundCueCount=6;status.selectedMotionPlan=planName;status.userMotionCueSelection=false;status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; '+planName+' is the alternative';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：第7–10秒，轻轻进入—持续渐强与细节渐变—接近完成时最明显—柔和收住。单次摩擦连续推进，避免死硬；自然程度待用户实际试听。\n- 试听：outputs/thinking-anchors/b-swipe-crescendo-v1/review.html\n- 放大镜、三条记录和配乐保持原样，三秒力度弧线待实际试听。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output:out,frictionRange:[7,10],encodedAudio:encoded,warnings:report.warnings,otherAudioUnchanged:true},null,2));

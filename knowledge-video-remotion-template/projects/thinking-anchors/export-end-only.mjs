import fs from 'node:fs';import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/b-swipe-crescendo-v1');
const out=reserveOutput('thinking-anchors','b-end-only-v1'),formalHash=sha(path.join(dir,'audio-plan.json'));
const base=json(path.join(prior,'audio-plan.json')),plan=structuredClone(base);
plan.clips=plan.clips.filter(c=>c.id!=='b-comic-5');
const endCue=structuredClone(json(path.join(dir,'audio-palette-b-explainer-v1.json')).clips.find(c=>c.id==='b-comic-6'));
endCue.at={event:'evidence.settle',offset:0};
endCue.purpose='三个价格标签对齐落定时只给一次轻短结束提示；7–10秒的移动过程不铺持续音效';
endCue.musicFit='沿用原B讲解候选的短结束音与02配乐，简化声音密度；这是推荐的结束音单点候选，待用户实际试听';
plan.clips.push(endCue);plan.reviewPolicy.maxProcessSeconds=1.5;
for(const c of base.clips.filter(c=>c.id!=='b-comic-5'))if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Unrelated cue changed');
const planName='audio-palette-b-end-only-v1.json';writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);
for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(out,'mix'),stems:true,quality:true});
const a=fs.readFileSync(path.join(prior,'mix/mix.wav')),b=fs.readFileSync(path.join(out,'mix/mix.wav'));
const start=44+39*44100*4,end=44+Math.round(42.36*44100)*4;
if(a.length!==b.length||!a.subarray(44,start).equals(b.subarray(44,start))||!a.subarray(end).equals(b.subarray(end)))throw Error('Unrelated audio changed');
if(sha(path.join(prior,'mix/music.wav'))!==sha(path.join(out,'mix/music.wav')))throw Error('Music changed');
for(const role of ['mix','effects','music'])fs.writeFileSync(path.join(out,role+'-preview.wav'),waveSlice(fs.readFileSync(path.join(out,'mix',role+'.wav')),32,46));
const effects=fs.readFileSync(path.join(out,'mix/effects.wav'));
const movement=waveSlice(effects,39,42);if(movement.subarray(44).some(x=>x!==0))throw Error('Movement still contains effects');
fs.writeFileSync(path.join(out,'ending-only.wav'),waveSlice(effects,42,42.36));
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
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-swipe-crescendo-v1',rangeSeconds:[32,46],removedCue:'b-comic-5',endCue,
 movementRangeSeconds:[7,10],movementEffectsSilent:true,endSoundSeconds:[10,10.36],changedWindowSeconds:[7,10.36],
 pictureUnchanged:true,musicUnchanged:true,pcmOutsideChangedWindowBitIdentical:true,otherCuesUnchanged:true,
 formalAudioPlanUnchanged:true,quality:report.quality,encodedAudio:encoded,frames:420,duration:14,
 userFeedback:'不要3秒持续音，改为只有开始或结束的单个音效是否可以',
 decision:'Remove continuous movement effect as explicitly requested. Recommend one short end cue, pending user preference; not a claim that user already chose end over start.',
 userApproval:'pending-end-only-listening',assistantListening:'not-performed'});
let html=fs.readFileSync(path.join(prior,'review.html'),'utf8');
html=html.replaceAll('B版 · 第7–10秒由轻到重','B版 · 只留一个结束音')
 .replaceAll('B版 · 轻轻进入、持续加重、柔和收住','B版 · 移动时留白，落定时提示')
 .replaceAll('第7–10秒：轻轻进入，滑动中持续加重、细节逐渐清楚，接近完成时达到最明显的力度，再柔和收住。仍是一条连续摩擦。','第7–10秒只保留背景音乐，在第10秒标签对齐落定时给一个短结束音。放大镜、三条记录等声音保留。')
 .replaceAll('缓缓渐强的完整滑动','仅落定结束音').replaceAll('上版（较硬的起止）','上版（三秒持续滑动）')
 .replaceAll('complete-gesture.wav','ending-only.wav').replaceAll('单独听三秒由轻到重的滑动','单独听结束音');
fs.writeFileSync(path.join(out,'review.html'),html);fs.copyFileSync(path.join(prior,'poster.png'),path.join(out,'poster.png'));
const history=path.join(dir,'history/before-b-end-only-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History exists');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];
review.feedback={text:'不再使用3秒持续音，只使用开始或者结束的单个音效',resolution:'撤掉持续滑动，推荐先试听只在第10秒落定时给一个短结束音的版本，用户尚未正式选择起点或终点'};
review.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-end-only-v1',range:[32,46],review:'outputs/thinking-anchors/b-end-only-v1/review.html'};
review.userApproval='pending-end-only-listening';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='end-only-candidate-ready';status.preview='outputs/thinking-anchors/b-end-only-v1/preview.mp4';status.review='outputs/thinking-anchors/b-end-only-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-end-only-v1/manifest.json';status.selectedMotionSound='continuous cue removed; one short end cue proposed';status.soundCueCount=6;status.selectedMotionPlan=planName;status.userMotionCueSelection=false;status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; '+planName+' is the alternative';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：按用户要求取消3秒持续滑动，第7–10秒仅有配乐；推荐在第10秒标签落定时给一个短结束音。\n- 试听：outputs/thinking-anchors/b-end-only-v1/review.html\n- 其他声音与画面保留，起点/终点的最终选择待本次试听。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output:out,movementEffectsRemoved:true,endRange:[10,10.36],encodedAudio:encoded,warnings:report.warnings},null,2));

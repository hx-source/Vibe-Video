import fs from 'node:fs';import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/b-pencil-motion-sync-v1');
const out=reserveOutput('thinking-anchors','b-pencil-follow-through-v1'),formalHash=sha(path.join(dir,'audio-plan.json'));
const base=json(path.join(prior,'audio-plan.json')),plan=structuredClone(base);
const endCue=plan.clips.find(c=>c.id==='b-comic-6');
if(!endCue)throw Error('Expected the single end cue');
endCue.at={event:'evidence.range',offset:0};endCue.role='process';endCue.enabled=true;plan.reviewPolicy.maxProcessSeconds=2.05;
endCue.source='asset:pencil-continuous-recorded-v1';endCue.sourceIn=0;endCue.sourceOut=2;endCue.gain=.9;endCue.fadeIn=.002;endCue.fadeOut=.010;
endCue.purpose='第8秒开始一次连续铅笔划动，跟随标签横移和下移展开，到第10秒收住；完整起止和过程连为一笔';
endCue.musicFit='采用真实长铅笔录音的原速连续两秒片段，不再只移动短音时点；缓起、略加重、柔和收尾；主配乐和其他声音保留，跟随感待实际试听';
for(const c of base.clips.filter(c=>c.id!==endCue.id))if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Unrelated cue changed');
const planName='audio-palette-b-pencil-follow-through-v1.json';writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);
for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(out,'mix'),stems:true,quality:true});
const a=fs.readFileSync(path.join(prior,'mix/mix.wav')),b=fs.readFileSync(path.join(out,'mix/mix.wav'));
const start=44+40*44100*4,end=44+42*44100*4;
if(a.length!==b.length||!a.subarray(44,start).equals(b.subarray(44,start))||!a.subarray(end).equals(b.subarray(end)))throw Error('Unrelated audio changed');
if(sha(path.join(prior,'mix/music.wav'))!==sha(path.join(out,'mix/music.wav')))throw Error('Music changed');
for(const role of ['mix','effects','music'])fs.writeFileSync(path.join(out,role+'-preview.wav'),waveSlice(fs.readFileSync(path.join(out,'mix',role+'.wav')),32,46));
const effects=fs.readFileSync(path.join(out,'mix/effects.wav'));
const movement=waveSlice(effects,39,40);if(movement.subarray(44).some(x=>x!==0))throw Error('Movement still contains effects');
fs.writeFileSync(path.join(out,'pencil-motion-only.wav'),waveSlice(effects,40,42));
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
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-pencil-motion-sync-v1',rangeSeconds:[32,46],changedCue:'b-comic-6',endCue,
 oneContinuousPencilCue:true,pencilCueSeconds:[8,10],changedWindowSeconds:[8,10],sourceNativeSpeed:true,shortCueReplaced:true,
 pictureUnchanged:true,musicUnchanged:true,pcmOutsideChangedWindowBitIdentical:true,otherCuesUnchanged:true,
 formalAudioPlanUnchanged:true,quality:report.quality,encodedAudio:encoded,frames:420,duration:14,
 userFeedback:'从第8秒开始缓缓划到第10秒结束，要求同一次划线的持续过程',
 decision:'Replace the isolated short stroke with one continuous native-speed two-second pencil recording excerpt, spanning the full 8–10s motion, with a gentle pressure curve. No repeated short strokes or post-completion cue.',
 userApproval:'pending-two-second-pencil-follow-through-listening',assistantListening:'not-performed'});
let html=fs.readFileSync(path.join(prior,'review.html'),'utf8');
html=html.replaceAll('B版 · 笔触跟随移动','B版 · 第8秒起笔，第10秒收住')
 .replaceAll('B版 · 铅笔声提前到标签下移中','B版 · 同一次划线跟随完整移动')
 .replaceAll('同一笔触提前到第9.10–9.34秒，主要声音对应标签下移最快的一段。只改时机，音色、时长、音量和其他声音保留。','从第8秒开始一次连续铅笔划动，跟随横移与下移，到第10秒收住。使用长铅笔录音的原速连续片段，起头、过程和结尾连为一笔。')
 .replaceAll('跟随移动的短笔触','两秒连续铅笔划动').replaceAll('上版（移动完才发声）','上版（中段短笔触）')
 .replaceAll('ending-only.wav','pencil-motion-only.wav').replaceAll('单独听跟随移动的短笔触','单独听完整两秒划动')
 .replaceAll('从第8.5秒听笔触与下移','从第7.5秒看起笔到收尾').replaceAll('v.currentTime=8.5','v.currentTime=7.5')
 .replaceAll('https://freesound.org/people/JelloApocalypse/sounds/802603/','https://freesound.org/people/Trtle.T/sounds/809934/')
 .replaceAll('JelloApocalypse · Pencil - Drawing a Single Hard Line','Trtle.T · Pencil stroke long');
fs.writeFileSync(path.join(out,'review.html'),html);fs.copyFileSync(path.join(prior,'poster.png'),path.join(out,'poster.png'));
const history=path.join(dir,'history/before-b-pencil-follow-through-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History exists');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];
review.feedback={text:'要求第8秒开始同一次划线，随着移动缓缓展开，到第10秒结束',resolution:'换用真实长铅笔录音的原速连续两秒片段，8–10秒贯穿，起止平滑、轻微力度变化，无短音重复或完成后补声'};
review.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-pencil-follow-through-v1',range:[32,46],review:'outputs/thinking-anchors/b-pencil-follow-through-v1/review.html'};
review.userApproval='pending-two-second-pencil-follow-through-listening';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='pencil-full-motion-candidate-ready';status.preview='outputs/thinking-anchors/b-pencil-follow-through-v1/preview.mp4';status.review='outputs/thinking-anchors/b-pencil-follow-through-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-pencil-follow-through-v1/manifest.json';status.selectedMotionSound='one continuous recorded pencil gesture, 8–10s; follow-through pending';status.soundCueCount=6;status.selectedMotionPlan=planName;status.userMotionCueSelection=false;status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; '+planName+' is the alternative';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：第8秒起笔，第10秒收住的一次连续铅笔划动；使用Trtle.T长铅笔录音的原速2秒片段，轻缓起止、略有力度推进，不重复短笔触。\n- 试听：outputs/thinking-anchors/b-pencil-follow-through-v1/review.html\n- 主配乐、画面和其他动作声保留，两秒持续划线的跟随感待实际试听。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output:out,oneContinuousPencilCue:true,pencilRange:[8,10],encodedAudio:encoded,warnings:report.warnings},null,2));

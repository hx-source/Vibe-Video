import fs from 'node:fs';import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/b-end-only-v1');
const out=reserveOutput('thinking-anchors','b-pencil-underline-v1'),formalHash=sha(path.join(dir,'audio-plan.json'));
const base=json(path.join(prior,'audio-plan.json')),plan=structuredClone(base);
const endCue=plan.clips.find(c=>c.id==='b-comic-6');
if(!endCue)throw Error('Expected the single end cue');
endCue.source='asset:pencil-underline-recorded-v1';endCue.sourceIn=0;endCue.sourceOut=.24;endCue.gain=.9;endCue.fadeIn=.002;endCue.fadeOut=.010;
endCue.purpose='第10秒可比成交区间横线完成时，用一次真实录音的短铅笔划线声作结束提示';
endCue.musicFit='用户明确选择试铅笔短划线；单次原速录音约0.24秒，保留02背景音乐和其余动作声，音画搭配待用户实际试听';
for(const c of base.clips.filter(c=>c.id!==endCue.id))if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Unrelated cue changed');
const planName='audio-palette-b-pencil-underline-v1.json';writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);
for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(out,'mix'),stems:true,quality:true});
const a=fs.readFileSync(path.join(prior,'mix/mix.wav')),b=fs.readFileSync(path.join(out,'mix/mix.wav'));
const start=44+42*44100*4,end=44+Math.round(42.36*44100)*4;
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
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-end-only-v1',rangeSeconds:[32,46],changedCue:'b-comic-6',endCue,
 movementRangeSeconds:[7,10],movementEffectsSilent:true,endSoundSeconds:[10,10.24],changedWindowSeconds:[10,10.36],
 pictureUnchanged:true,musicUnchanged:true,pcmOutsideChangedWindowBitIdentical:true,otherCuesUnchanged:true,
 formalAudioPlanUnchanged:true,quality:report.quality,encodedAudio:encoded,frames:420,duration:14,
 userFeedback:'试试铅笔短划线声',
 decision:'Replace only the end cue with a native-speed recorded pencil stroke selected by the user for audition. No continuous movement sound is reintroduced.',
 userApproval:'pencil-type-selected; mixed-preview-pending',assistantListening:'not-performed'});
let html=fs.readFileSync(path.join(prior,'review.html'),'utf8');
html=html.replaceAll('B版 · 只留一个结束音','B版 · 铅笔短划线结束音')
 .replaceAll('B版 · 移动时留白，落定时提示','B版 · 横线完成时的一笔短划线')
 .replaceAll('第7–10秒只保留背景音乐，在第10秒标签对齐落定时给一个短结束音。放大镜、三条记录等声音保留。','第10秒横线完成时，给一次约0.24秒的铅笔划线声。采用真实铅笔录音片段；放大镜、三条记录和配乐保留。')
 .replaceAll('仅落定结束音','铅笔短划线').replaceAll('上版（三秒持续滑动）','上版（短玻璃提示）')
 .replaceAll('单独听结束音','单独听铅笔短划线')
 .replaceAll('从第6.5秒听完整转变','从第9秒听横线完成').replaceAll('v.currentTime=6.5','v.currentTime=9');
html=html.replace('</script>','</script><p>录音来源：<a href="https://freesound.org/people/JelloApocalypse/sounds/802603/">JelloApocalypse · Pencil - Drawing a Single Hard Line</a>（CC0）</p>');
fs.writeFileSync(path.join(out,'review.html'),html);fs.copyFileSync(path.join(prior,'poster.png'),path.join(out,'poster.png'));
const history=path.join(dir,'history/before-b-pencil-underline-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History exists');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];
review.feedback={text:'试试铅笔短划线声',resolution:'第10秒短结束提示改为真实铅笔单笔划线录音的0.24秒片段；其余声音及画面保留，待混合试听'};
review.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-pencil-underline-v1',range:[32,46],review:'outputs/thinking-anchors/b-pencil-underline-v1/review.html'};
review.userApproval='pencil-type-selected; mixed-preview-pending';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='pencil-underline-candidate-ready';status.preview='outputs/thinking-anchors/b-pencil-underline-v1/preview.mp4';status.review='outputs/thinking-anchors/b-pencil-underline-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-pencil-underline-v1/manifest.json';status.selectedMotionSound='recorded-pencil-underline at 10s; sound type selected, mix pending';status.soundCueCount=6;status.selectedMotionPlan=planName;status.userMotionCueSelection=false;status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; '+planName+' is the alternative';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：第10秒可比成交区间横线完成时给一次0.24秒铅笔短划线，使用JelloApocalypse的CC0真实录音片段。\n- 试听：outputs/thinking-anchors/b-pencil-underline-v1/review.html\n- 其他声音与画面保留，铅笔音效类型已选，混合听感待本次试听。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output:out,movementEffectsRemoved:true,endRange:[10,10.24],encodedAudio:encoded,warnings:report.warnings},null,2));

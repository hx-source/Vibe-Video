import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/b-group-down-v1');
const out=reserveOutput('thinking-anchors','b-group-down-dry-v1');
const base=json(path.join(prior,'audio-plan.json')),plan=structuredClone(base),formalHash=sha(path.join(dir,'audio-plan.json'));
const asset=json(path.join(dir,'assets/index.json')).items.find(x=>x.id==='group-down-dry-v1');
const cue=plan.clips.find(c=>c.id==='b-comic-5'),before=structuredClone(cue);
cue.source='asset:'+asset.id;cue.at={event:'evidence.range',offset:1.2};cue.sourceOut=asset.sound.durationSeconds;
cue.gain=1.1;cue.fadeIn=.005;cue.fadeOut=.025;
cue.purpose='三个标签下移最明显的一段，用短而干的纸卡接触声突出近距离材质';
cue.musicFit='固定02配乐，使用原速短纸张素材；不使用空间效果或拉伸；混合后的贴近感待用户实际试听';
for(const c of base.clips.filter(c=>c.id!==cue.id))if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Other cue changed');
const planName='audio-palette-b-group-down-dry-v1.json';writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);
for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(out,'mix'),stems:true,quality:true});
const a=fs.readFileSync(path.join(prior,'mix/mix.wav')),b=fs.readFileSync(path.join(out,'mix/mix.wav'));
const start=44+Math.round(40.85*44100)*4,end=44+Math.round(42*44100)*4;
if(a.length!==b.length||!a.subarray(44,start).equals(b.subarray(44,start))||!a.subarray(end).equals(b.subarray(end)))throw Error('Other audio differs');
if(sha(path.join(prior,'mix/music.wav'))!==sha(path.join(out,'mix/music.wav')))throw Error('Music differs');
for(const role of ['mix','effects','music'])fs.writeFileSync(path.join(out,role+'-preview.wav'),waveSlice(fs.readFileSync(path.join(out,'mix',role+'.wav')),32,46));
fs.copyFileSync(p.assets.get(asset.id).diskPath,path.join(out,'dry-source.wav'));
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
const motion=[9.2,9.2+asset.sound.durationSeconds];
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-group-down-v1',rangeSeconds:[32,46],beforeCue:before,afterCue:cue,
 motionSoundSeconds:motion,changedWindowSeconds:[8.85,10],pictureUnchanged:true,musicUnchanged:true,
 pcmOutsideChangedWindowBitIdentical:true,otherCuesUnchanged:true,threeRecordSoundsUnchanged:true,lensSoundUnchanged:true,
 settleSoundUnchanged:true,formalAudioPlanUnchanged:true,quality:report.quality,encodedAudio:encoded,frames:420,duration:14,
 diagnosis:'Previous cue had no added reverb; time-stretched cloth and airy filtering may contribute to perceived hollowness. This is an inference, not a listening conclusion.',
 userFeedback:'这个音效还是不太合适，怎么有一种空旷的感觉呢',userApproval:'pending-dry-paper-listening',assistantListening:'not-performed'});
let html=fs.readFileSync(path.join(prior,'review.html'),'utf8');
html=html.replaceAll('B版 · 标签整体下移音效','B版 · 标签下移改用短纸卡声')
 .replaceAll('B版 · 三个标签整体下移','B版 · 贴近纸卡材质的短滑动声')
 .replaceAll('第8.85–10秒用一次轻扫跟随三个标签整体下移，到底部时收住。三条记录出现的声音、放大镜及落定轻响保留。','第9.2秒附近用原速短纸张声配合标签下移，缩短持续时间并保留材质细节。此前放大镜、三条记录和落定声保留。')
 .replaceAll('标签下移扫动','原速短纸卡声').replaceAll('上版（短纸张声）','上版（拉长扫动）');
html=html.replace('</script>','</script><p><a href="dry-source.wav">单独听本次纸卡素材</a></p>');
fs.writeFileSync(path.join(out,'review.html'),html);fs.copyFileSync(path.join(prior,'poster.png'),path.join(out,'poster.png'));
const history=path.join(dir,'history/before-b-group-down-dry-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History exists');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];
review.feedback={text:'标签下移扫动声有空旷感，仍不合适',resolution:'换原速短纸张材质，保持主体与细节，不做拉伸或空间处理，配在9.2秒附近最明显的下移动作'};
review.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-group-down-dry-v1',range:[32,46],review:'outputs/thinking-anchors/b-group-down-dry-v1/review.html'};
review.userApproval='pending-dry-paper-listening';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='b-group-down-dry-candidate-ready';status.preview='outputs/thinking-anchors/b-group-down-dry-v1/preview.mp4';status.review='outputs/thinking-anchors/b-group-down-dry-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-group-down-dry-v1/manifest.json';status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; '+planName+' is the alternative';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：针对下移声空旷的反馈，用原速短纸卡材质替换拉长扫动，约第9.2–9.63秒触发。此前放大镜、三条记录与落定声音保留。\n- 试听：outputs/thinking-anchors/b-group-down-dry-v1/review.html\n- 本处听感待用户确认；正式音频方案保留。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output:out,motionSoundSeconds:motion,encodedAudio:encoded,warnings:report.warnings,otherAudioUnchanged:true},null,2));

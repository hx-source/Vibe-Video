import fs from 'node:fs';import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/b-paper-full-motion-v1');
const out=reserveOutput('thinking-anchors','b-paper-single-swipe-v1');
const base=json(path.join(prior,'audio-plan.json')),plan=structuredClone(base),formalHash=sha(path.join(dir,'audio-plan.json'));
const cue=plan.clips.find(c=>c.id==='b-comic-5'),before=structuredClone(cue);
cue.source='asset:paper-single-swipe-v1';cue.at={event:'evidence.range',offset:0};cue.sourceOut=2;cue.gain=.9;cue.fadeIn=.005;cue.fadeOut=.015;
cue.purpose='第8–10秒标签完整移动仅有一次刷动起音和收尾，消除反复摩擦的节奏';
cue.musicFit='参考用户选定纸卡的频谱质感重新设计单次刷动，不再循环短片段；保持02配乐与其他声音，实际听感待确认';
// The explicit request is for the full two-second movement, beyond the default
// 1.5-second process limit. Only this alternative's local review policy changes.
plan.reviewPolicy.maxProcessSeconds=2.05;
for(const c of base.clips.filter(c=>c.id!==cue.id))if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Other cue changed');
const planName='audio-palette-b-paper-single-swipe-v1.json';writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);
for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(out,'mix'),stems:true,quality:true});
const a=fs.readFileSync(path.join(prior,'mix/mix.wav')),b=fs.readFileSync(path.join(out,'mix/mix.wav'));
const start=44+40*44100*4,end=44+42*44100*4;
if(a.length!==b.length||!a.subarray(44,start).equals(b.subarray(44,start))||!a.subarray(end).equals(b.subarray(end)))throw Error('Other audio differs');
if(sha(path.join(prior,'mix/music.wav'))!==sha(path.join(out,'mix/music.wav')))throw Error('Music differs');
for(const role of ['mix','effects','music'])fs.writeFileSync(path.join(out,role+'-preview.wav'),waveSlice(fs.readFileSync(path.join(out,'mix',role+'.wav')),32,46));
fs.copyFileSync(p.assets.get('paper-single-swipe-v1').diskPath,path.join(out,'friction-only.wav'));
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
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-paper-full-motion-v1',rangeSeconds:[32,46],beforeCue:before,afterCue:cue,
 frictionRangeSeconds:[8,10],changedWindowSeconds:[8,10],pictureUnchanged:true,musicUnchanged:true,
 pcmOutsideChangedWindowBitIdentical:true,otherCuesUnchanged:true,threeRecordSoundsUnchanged:true,lensSoundUnchanged:true,
 settleSoundUnchanged:true,formalAudioPlanUnchanged:true,quality:report.quality,encodedAudio:encoded,frames:420,duration:14,
 userFeedback:'覆盖完整过程但有多次唰唰唰，希望只有一次刷动',
 material:'paper-spectrum resynthesis, not a recording or grain loop; one global gesture envelope; subjective single-swipe perception needs user listening',
 userApproval:'pending-single-swipe-listening',assistantListening:'not-performed'});
let html=fs.readFileSync(path.join(prior,'review.html'),'utf8');
html=html.replaceAll('B版 · 摩擦声覆盖完整移动','B版 · 一次完整刷动')
 .replaceAll('B版 · 从开始移动到落定的一次摩擦','B版 · 一次起音、连续滑过、最后收住')
 .replaceAll('第8–10秒，从标签开始横移、继续下移到落定，连续保持纸卡摩擦。沿用选定的纸卡材质，其他声音保留。','第8–10秒覆盖完整移动，仅有一次刷动的起音和收尾。取消短纹理的重复节奏，其他声音保留。')
 .replaceAll('完整移动摩擦声','单次刷动声').replaceAll('上版（中段短纸卡声）','上版（多次摩擦感）')
 .replaceAll('单独听两秒连续摩擦','单独听一次刷动');
fs.writeFileSync(path.join(out,'review.html'),html);fs.copyFileSync(path.join(prior,'poster.png'),path.join(out,'poster.png'));
const history=path.join(dir,'history/before-b-paper-single-swipe-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History exists');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];
review.feedback={text:'现在有多次唰唰唰，需要一次完整的刷声',resolution:'采用单次起音与收尾的频谱重建纹理，去除短片段循环；继续覆盖8–10秒，其他声音保留'};
review.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-paper-single-swipe-v1',range:[32,46],review:'outputs/thinking-anchors/b-paper-single-swipe-v1/review.html'};
review.userApproval='paper-material-selected; single-swipe-candidate-pending';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='single-swipe-candidate-ready';status.preview='outputs/thinking-anchors/b-paper-single-swipe-v1/preview.mp4';status.review='outputs/thinking-anchors/b-paper-single-swipe-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-paper-single-swipe-v1/manifest.json';status.selectedMotionSound='paper-single-swipe-v1 (single gesture; listening pending)';status.selectedMotionPlan=planName;status.userMotionCueSelection=false;status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; '+planName+' is the alternative';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：第8–10秒仅有一次刷动起音与收尾，取消短片段重复带来的多次摩擦感。频谱重建参考选定纸卡材质，待实际听感确认。\n- 试听：outputs/thinking-anchors/b-paper-single-swipe-v1/review.html\n- 其他声音与配乐保持原样，单次刷动版本待实际试听。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output:out,frictionRange:[8,10],encodedAudio:encoded,warnings:report.warnings,otherAudioUnchanged:true},null,2));

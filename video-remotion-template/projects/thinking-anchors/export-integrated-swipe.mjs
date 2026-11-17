import fs from 'node:fs';import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/b-swipe-edge-accents-v1');
const out=reserveOutput('thinking-anchors','b-swipe-integrated-v1');
const base=json(path.join(prior,'audio-plan.json')),plan=structuredClone(base),formalHash=sha(path.join(dir,'audio-plan.json'));
const cue=plan.clips.find(c=>c.id==='b-comic-5'),before=structuredClone(cue);
cue.source='asset:paper-single-integrated-v1';cue.at={event:'evidence.range',offset:0};cue.sourceOut=2;cue.gain=.9;cue.fadeIn=.005;cue.fadeOut=.015;
cue.purpose='同一条刷动声以摩擦力度变化体现起头、过程与收束，覆盖完整8–10秒；撤掉音色不符的接触与落定叠层';
cue.musicFit='单一摩擦载波贯穿，起止只改变平滑力度包络，不叠加敲击或玻璃声；保持02配乐，融合感必须由用户实际试听判断';
// The explicit request is for the full two-second movement, beyond the default
// 1.5-second process limit. Only this alternative's local review policy changes.
plan.reviewPolicy.maxProcessSeconds=2.15;
plan.clips=plan.clips.filter(c=>c.id!=='b-comic-6');
for(const c of base.clips.filter(c=>![cue.id,'b-comic-6'].includes(c.id)))if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Other cue changed');
const planName='audio-palette-b-swipe-integrated-v1.json';writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);
for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(out,'mix'),stems:true,quality:true});
const a=fs.readFileSync(path.join(prior,'mix/mix.wav')),b=fs.readFileSync(path.join(out,'mix/mix.wav'));
const start=44+40*44100*4,end=44+Math.round(42.10*44100)*4;
if(a.length!==b.length||!a.subarray(44,start).equals(b.subarray(44,start))||!a.subarray(end).equals(b.subarray(end)))throw Error('Other audio differs');
if(sha(path.join(prior,'mix/music.wav'))!==sha(path.join(out,'mix/music.wav')))throw Error('Music differs');
for(const role of ['mix','effects','music'])fs.writeFileSync(path.join(out,role+'-preview.wav'),waveSlice(fs.readFileSync(path.join(out,'mix',role+'.wav')),32,46));
fs.copyFileSync(p.assets.get('paper-single-integrated-v1').diskPath,path.join(out,'complete-gesture.wav'));
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
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-swipe-edge-accents-v1',rangeSeconds:[32,46],beforeCue:before,afterCue:cue,
 frictionRangeSeconds:[8,10],completeGestureSeconds:[8,10],changedWindowSeconds:[8,10.1],pictureUnchanged:true,musicUnchanged:true,
 pcmOutsideChangedWindowBitIdentical:true,otherCuesUnchanged:true,threeRecordSoundsUnchanged:true,lensSoundUnchanged:true,
 externalContactsRemoved:true,sameCarrierAcrossGesture:true,formalAudioPlanUnchanged:true,quality:report.quality,encodedAudio:encoded,frames:420,duration:14,
 userFeedback:'起头与结尾和整体滑动音效不符合，质问为何未发现',
 material:'same paper-spectrum carrier as prior single-swipe body; smooth pressure contour only; no external contact or impact layer; perceptual coherence remains unverified',
 userApproval:'pending-single-source-coherence-listening',assistantListening:'not-performed'});
let html=fs.readFileSync(path.join(prior,'review.html'),'utf8');
html=html.replaceAll('B版 · 轻起、刷过、稍重落定','B版 · 同一条滑动声的起止力度')
 .replaceAll('B版 · 补起头与落定的轻重','B版 · 用摩擦声自身完成起止')
 .replaceAll('第8秒轻触起头，中间一次刷过，第10秒稍重落定。单独试听已包含完整起止；此前放大镜和三条记录的声音保留。','第8–10秒使用同一条摩擦声，只改变起头、过程与收尾的力度。撤掉上一版额外的接触、落定素材，避免音色拼接。')
 .replaceAll('有轻重起止的完整刷动','同源摩擦起止').replaceAll('上版（只有刷声主体）','上版（额外接触与落定声）')
 .replaceAll('单独听完整起头、刷过与落定','单独听同一条摩擦的起止');
fs.writeFileSync(path.join(out,'review.html'),html);fs.copyFileSync(path.join(prior,'poster.png'),path.join(out,'poster.png'));
const history=path.join(dir,'history/before-b-swipe-integrated-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History exists');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];
review.feedback={text:'起止接触声与整体滑动音效不符合',resolution:'撤掉外加接触音与落定音，沿用同一摩擦载波，只以平滑力度包络体现起止；实际融合感待用户听辨'};
review.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-swipe-integrated-v1',range:[32,46],review:'outputs/thinking-anchors/b-swipe-integrated-v1/review.html'};
review.userApproval='pending-single-source-coherence-listening';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='single-source-swipe-candidate-ready';status.preview='outputs/thinking-anchors/b-swipe-integrated-v1/preview.mp4';status.review='outputs/thinking-anchors/b-swipe-integrated-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-swipe-integrated-v1/manifest.json';status.selectedMotionSound='paper-single-integrated-v1 (same-source pressure changes; listening pending)';status.soundCueCount=6;status.selectedMotionPlan=planName;status.userMotionCueSelection=false;status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; '+planName+' is the alternative';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：撤掉音色不符的起止接触素材，使用同一摩擦载波与平滑力度包络完成8–10秒动作；技术验证不代表融合感通过。\n- 试听：outputs/thinking-anchors/b-swipe-integrated-v1/review.html\n- 放大镜、三条记录和配乐保持原样，同源起止融合感待实际试听。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output:out,frictionRange:[8,10],encodedAudio:encoded,warnings:report.warnings,otherAudioUnchanged:true},null,2));

import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const project=path.join(ROOT,'projects/thinking-anchors');
const previous=path.join(ROOT,'outputs/thinking-anchors/b-explainer-v1');
const output=reserveOutput('thinking-anchors','b-explainer-lens-v1');
const formalHash=sha(path.join(project,'audio-plan.json'));
const plan=json(path.join(previous,'audio-plan.json'));
const cue={id:'b-lens-accessory',source:'asset:palette-cloth-two',role:'process',enabled:true,
 at:{event:'evidence.accessory-check',offset:.4},sourceIn:0,sourceOut:.4150793650793651,
 gain:.6,fadeIn:.025,fadeOut:.07,
 purpose:'放大镜移到少配件位置时的轻微滑擦，覆盖试片第4秒附近的移动与停稳',
 musicFit:'使用已有短布料摩擦素材作为手持物件移动拟音；保持02配乐与其余音效，实际可辨认性待用户试听'};
plan.clips.push(cue);
const planName='audio-palette-b-explainer-lens-v1.json';writeJson(path.join(project,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName});
const resolved=structuredClone(plan);for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(project,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(output,'mix'),stems:true,quality:true});
const compiled=report.plan.clips.find(c=>c.id===cue.id),from=compiled.at,to=from+compiled.duration;
const a=fs.readFileSync(path.join(previous,'mix/mix.wav')),b=fs.readFileSync(path.join(output,'mix/mix.wav'));
const start=44+Math.round(from*44100)*4,end=44+Math.round(to*44100)*4;
if(a.length!==b.length||!a.subarray(44,start).equals(b.subarray(44,start))||!a.subarray(end).equals(b.subarray(end)))throw Error('Audio outside new cue differs');
if(a.subarray(start,end).equals(b.subarray(start,end)))throw Error('Lens sound is absent');
if(sha(path.join(previous,'mix/music.wav'))!==sha(path.join(output,'mix/music.wav')))throw Error('Music differs');
for(const stem of ['mix','effects','music'])fs.writeFileSync(path.join(output,stem+'-preview.wav'),waveSlice(fs.readFileSync(path.join(output,'mix',stem+'.wav')),32,46));
fs.copyFileSync(path.join(previous,'preview.mp4'),path.join(output,'before.mp4'));
const picture=path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/chapters/04-evidence.mp4'),video=path.join(output,'preview.mp4');
run(ff,['-v','error','-n','-i',picture,'-i',path.join(output,'mix-preview.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',video]);
decode(video);const info=probe(video),v=info.streams.find(s=>s.codec_type==='video');
if(Number(v?.nb_frames)!==420||v.width!==1920||v.height!==1080||!info.streams.some(s=>s.codec_type==='audio'))throw Error('Invalid preview');
const vh=f=>run(ff,['-v','error','-i',f,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).trim();
if(vh(video)!==vh(path.join(previous,'preview.mp4')))throw Error('Picture differs');
const encoded=measureLoudness(video,ff);if(encoded.truePeakDb>-1)throw Error('Insufficient headroom');
if(sha(path.join(project,'audio-plan.json'))!==formalHash)throw Error('Formal audio changed');
writeJson(path.join(output,'audio-plan.json'),plan);
writeJson(path.join(output,'encoded-audio-quality.json'),encoded);
writeJson(path.join(output,'asset-sources.json'),[...p.used].map(([id,a])=>({id,path:a.path,source:a.source,license:a.license,sha256:sha(a.diskPath)})));
const checks={base:'outputs/thinking-anchors/b-explainer-v1',previewSeconds:[32,46],addedCue:cue,
 addedSoundPreviewSeconds:[from-32,to-32],pictureUnchanged:true,musicUnchanged:true,
 pcmOutsideNewCueBitIdentical:true,formalAudioPlanUnchanged:true,quality:report.quality,encodedAudio:encoded,
 frames:420,duration:14,userFeedback:'第四秒放大镜到少配件那里没有音效吗？',
 userApproval:'pending-added-sound-listening',assistantListening:'not-performed'};
writeJson(path.join(output,'manifest.json'),checks);
let html=fs.readFileSync(path.join(previous,'review.html'),'utf8');
html=html.replaceAll('B版 · 知识讲解声音对照','B版 · 放大镜动作音效')
 .replaceAll('B版 · 更克制的讲解声音','B版 · 补上第4秒放大镜动作声')
 .replaceAll('保留滑看记录的动作声；疑问音改为物件轻响，缺配件处留白，上扬滑音改为纸张声，归组提示缩短。画面与02配乐保持原样。','第3.7–4.1秒补上轻微滑擦声，跟随放大镜移到少配件位置。其余五处音效、画面和配乐保持原样。')
 .replaceAll('知识讲解候选','放大镜动作声').replaceAll('原B版','上版（此处仅配乐）')
 .replaceAll('从头播放对照','从第2.8秒听放大镜').replaceAll('v.currentTime=0','v.currentTime=2.8');
fs.writeFileSync(path.join(output,'review.html'),html);fs.copyFileSync(path.join(previous,'poster.png'),path.join(output,'poster.png'));
const history=path.join(project,'history/before-b-explainer-lens-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(path.join(project,name),dst)}
const review=json(path.join(project,'sound-review.json'));
review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];
review.feedback={text:'第四秒放大镜到少配件那里没有音效吗？',interpretation:'在B知识讲解候选上补回轻微动作拟音，保持其余声音'};
review.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-explainer-lens-v1',range:[32,46],review:'outputs/thinking-anchors/b-explainer-lens-v1/review.html'};
review.userApproval='pending-added-sound-listening';writeJson(path.join(project,'sound-review.json'),review);
const status=json(path.join(project,'delivery-status.json'));
status.state='b-explainer-lens-candidate-ready';status.preview='outputs/thinking-anchors/b-explainer-lens-v1/preview.mp4';status.review='outputs/thinking-anchors/b-explainer-lens-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-explainer-lens-v1/manifest.json';status.soundCueCount=6;status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; '+planName+' is the local candidate';writeJson(path.join(project,'delivery-status.json'),status);
const readme=path.join(project,'README.md');fs.writeFileSync(readme,'当前声音候选：B知识讲解版补上第3.7–4.1秒放大镜移到少配件位置的轻微滑擦声。其余声音与配乐保持原样，待本处试听。\n- 试听：outputs/thinking-anchors/b-explainer-lens-v1/review.html\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output,addedSoundSeconds:checks.addedSoundPreviewSeconds,encodedAudio:encoded,warnings:report.warnings,otherAudioUnchanged:true},null,2));

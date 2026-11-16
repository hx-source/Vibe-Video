// A restrained sound-design alternative for the unchanged B audition picture.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors');
const prior=path.join(ROOT,'outputs/thinking-anchors/sound-palettes-v2/b-comic');
const out=reserveOutput('thinking-anchors','b-explainer-v1');
const formalHash=sha(path.join(dir,'audio-plan.json'));
const base=json(path.join(prior,'audio-plan.json')),plan=structuredClone(base);
const history=path.join(dir,'history/before-b-explainer-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){
 const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(path.join(dir,name),dst);
}
const changes=[];
const question=plan.clips.find(c=>c.id==='b-comic-1');
question.source='asset:palette-metal-detail';question.sourceOut=.4458503401360544;question.gain=.65;
question.purpose='放大镜检查时的细小物件轻响，避免用夸张疑问音替观众反应';
question.musicFit='使用已有非旋律性物件素材；固定02配乐，搭配效果待用户试听';
changes.push({time:2,change:'疑问音改为细小物件轻响'});
plan.clips=plan.clips.filter(c=>c.id!=='b-comic-2');
changes.push({time:3.45,change:'缺配件处取消咯吱反应，留出阅读与判断空间'});
const slide=plan.clips.find(c=>c.id==='b-comic-5');
slide.source='asset:paper-slide-soft-v1';slide.sourceOut=.4;slide.gain=.9;
slide.purpose='价格标签开始归组时的短纸张滑擦，保留动作过程而不添加上扬滑音';
slide.musicFit='无额外旋律；固定02配乐，纸张材质与画面配合待用户试听';
changes.push({time:8.1,change:'连续上扬滑音改为轻柔纸张滑擦'});
const end=plan.clips.find(c=>c.id==='b-comic-6');
end.sourceOut=.36;end.gain=.48;end.fadeOut=.10;
end.purpose='可比价格归组完成的轻响，缩短提示与空间尾音，避免过度强调成功情绪';
end.musicFit='保留原B的单次玻璃质感，缩短尾音；有音高部分不作调性已协调断言，待实际试听';
changes.push({time:10,change:'归组轻响缩短收尾，减轻强调'});
const planName='audio-palette-b-explainer-v1.json';writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName});
const oldAssets=json(path.join(prior,'asset-sources.json'));
for(const [id,a] of p.used){const old=oldAssets.find(x=>x.id===id);if(old&&old.sha256!==sha(a.diskPath))throw Error('Existing B source changed: '+id)}
for(const id of ['continuous-bed','b-comic-3','b-comic-4']){
 if(JSON.stringify(plan.clips.find(c=>c.id===id))!==JSON.stringify(base.clips.find(c=>c.id===id)))throw Error('Retained cue changed: '+id);
}
const resolved=structuredClone(plan);for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(out,'mix'),stems:true,quality:true});
if(sha(path.join(out,'mix/music.wav'))!==sha(path.join(prior,'music.wav')))throw Error('Music differs');
const oldPCM=fs.readFileSync(path.join(prior,'mix.wav')),newPCM=fs.readFileSync(path.join(out,'mix/mix.wav'));
const windows=[[34,34.49068027210884],[35.45,36.11104308390023],[40.1,40.84],[42,43.07553287981859]];
let from=44;
for(const [a,b] of windows){const start=44+Math.round(a*44100)*4,end=44+Math.round(b*44100)*4;if(!oldPCM.subarray(from,start).equals(newPCM.subarray(from,start)))throw Error('PCM differs outside change windows');from=end}
if(!oldPCM.subarray(from).equals(newPCM.subarray(from)))throw Error('PCM differs after changed windows');
for(const role of ['mix','effects','music'])fs.writeFileSync(path.join(out,role+'-preview.wav'),waveSlice(fs.readFileSync(path.join(out,'mix',role+'.wav')),32,46));
fs.copyFileSync(path.join(prior,'preview.mp4'),path.join(out,'before.mp4'));
fs.copyFileSync(path.join(prior,'effects-preview.wav'),path.join(out,'before-effects.wav'));
const picture=path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/chapters/04-evidence.mp4'),movie=path.join(out,'preview.mp4');
run(ff,['-v','error','-n','-i',picture,'-i',path.join(out,'mix-preview.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',movie]);
decode(movie);const info=probe(movie),v=info.streams.find(s=>s.codec_type==='video');
if(v.width!==1920||v.height!==1080||Number(v.nb_frames)!==420||!info.streams.some(s=>s.codec_type==='audio')||Math.abs(Number(info.format.duration)-14)>.04)throw Error('Preview format mismatch');
const vh=f=>run(ff,['-v','error','-i',f,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).trim();
if(vh(movie)!==vh(path.join(prior,'preview.mp4')))throw Error('Picture differs');
const encoded=measureLoudness(movie,ff);if(encoded.truePeakDb>-1)throw Error('Insufficient peak headroom');
if(sha(path.join(dir,'audio-plan.json'))!==formalHash)throw Error('Formal plan changed');
writeJson(path.join(out,'encoded-audio-quality.json'),encoded);
writeJson(path.join(out,'audio-plan.json'),plan);
writeJson(path.join(out,'asset-sources.json'),[...p.used].map(([id,a])=>({id,path:a.path,source:a.source,license:a.license,sha256:sha(a.diskPath)})));
writeJson(path.join(out,'manifest.json'),{kind:'b-explainer-audio-alternative',base:'outputs/thinking-anchors/sound-palettes-v2/b-comic',rangeSeconds:[32,46],changes,
 pictureUnchanged:true,musicUnchanged:true,recordSwipeCuesUnchanged:true,pcmOutsideChangedWindowsUnchanged:true,
 formalAudioPlanUnchanged:true,frames:420,duration:14,quality:report.quality,encodedAudio:encoded,
 feedback:'B版整体效果不错，但总感觉不太符合这部分知识的讲解风格',
 designIntent:'保留漫画的动作感，让声音跟随检查、查证与比较；减少夸张反应和滑音，给判断留白',
 userApproval:'pending-user-listening',assistantListening:'not-performed'});
// Reuse the verified local comparison player without changing its media routing.
let html=fs.readFileSync(path.join(ROOT,'outputs/thinking-anchors/c-price-slide-v1/review.html'),'utf8');
html=html.replaceAll('C方案 · 第8秒音效修改','B版 · 知识讲解声音对照')
 .replaceAll('C 清脆留白 · 只改第8秒','B版 · 更克制的讲解声音')
 .replaceAll('价格标签归组：布料扫动 → 轻柔纸张滑擦。其他三处音效与02配乐保持原样。','保留滑看记录的动作声；疑问音改为物件轻响，缺配件处留白，上扬滑音改为纸张声，归组提示缩短。画面与02配乐保持原样。')
 .replaceAll('轻柔纸张滑擦','知识讲解候选').replaceAll('布料扫动','原B版')
 .replaceAll('从第6.5秒听这一处','从头播放对照').replaceAll('v.currentTime=6.5','v.currentTime=0');
fs.writeFileSync(path.join(out,'review.html'),html);
fs.copyFileSync(path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/evidence.png'),path.join(out,'poster.png'));
const sound=json(path.join(dir,'sound-review.json'));
sound.feedbackHistory=[...(sound.feedbackHistory??[]),...(sound.feedback?[sound.feedback]:[])];
sound.feedback={text:'总感觉不太符合这部分知识的讲解风格',base:'b-comic',preference:'保留B整体动作感，声音气质需要适合知识讲解'};
sound.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-explainer-v1',range:[32,46],review:'outputs/thinking-anchors/b-explainer-v1/review.html'};
sound.userApproval='pending-style-listening';writeJson(path.join(dir,'sound-review.json'),sound);
const status=json(path.join(dir,'delivery-status.json'));
status.state='b-explainer-audio-candidate-ready';status.review='outputs/thinking-anchors/b-explainer-v1/review.html';status.preview='outputs/thinking-anchors/b-explainer-v1/preview.mp4';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-explainer-v1/manifest.json';status.selectedSoundPalette='B as preferred base; explainer candidate pending';status.soundCueCount=5;status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; audio-palette-b-explainer-v1.json is the alternative';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：B版作为基础，减少夸张反应和上扬滑音，保留查记录动作声。\n- 试听：outputs/thinking-anchors/b-explainer-v1/review.html\n- 画面与02配乐保持原样；本期正式audio-plan.json未变更；尚待听感反馈。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output:out,effects:5,pictureUnchanged:true,musicUnchanged:true,encodedAudio:encoded,warnings:report.warnings},null,2));

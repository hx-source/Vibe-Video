import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors');
const previous=path.join(ROOT,'outputs/thinking-anchors/b-explainer-lens-v1');
const resume=process.argv.includes('--resume');
const out=resume?path.join(ROOT,'outputs/thinking-anchors/b-record-entries-v1'):reserveOutput('thinking-anchors','b-record-entries-v1');
if(resume&&fs.existsSync(path.join(out,'manifest.json')))throw Error('Completed output must be preserved');
const formalHash=sha(path.join(dir,'audio-plan.json')),base=json(path.join(previous,'audio-plan.json'));
const index=json(path.join(dir,'assets/index.json')),plan=structuredClone(base);
const scene=fs.readFileSync(path.join(dir,'scenes/AnchorEvidenceMotion.tsx'),'utf8');
if(!scene.includes('time-e.records-i*.34')||!scene.includes('/.5)'))throw Error('Review the actual row-animation timing before updating sound');
plan.clips=plan.clips.filter(c=>!['b-comic-3','b-comic-4'].includes(c.id));
const gains=[1.15,1.3,.95],rows=[];
for(let i=0;i<3;i++){
 const asset=index.items.find(x=>x.id===`record-paper-${i+1}-v1`),offset=.10+i*.34;
 const cue={id:`b-record-row-${i+1}`,source:'asset:'+asset.id,role:'accent',
  at:{event:'evidence.records',offset},sourceIn:0,sourceOut:asset.sound.durationSeconds,
  gain:gains[i],fadeOut:.015,purpose:`成交记录${'ABC'[i]}单独出现的短纸张轻响`,
  musicFit:'同一纸张材质的三种短采样，分别跟随三条记录，不添加升调或额外撞击；02配乐保持原样，搭配待试听'};
 plan.clips.push(cue);rows.push({record:'ABC'[i],animationStartSeconds:5+i*.34,soundStartSeconds:5+offset,duration:asset.sound.durationSeconds});
}
const planName='audio-palette-b-record-entries-v1.json';writeJson(path.join(dir,planName),plan);
for(const c of base.clips.filter(c=>!['b-comic-3','b-comic-4'].includes(c.id))){
 if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Other cue changed: '+c.id);
}
const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);
for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(out,'mix'),stems:true,quality:true});
const a=fs.readFileSync(path.join(previous,'mix/mix.wav')),b=fs.readFileSync(path.join(out,'mix/mix.wav'));
const from=37,to=Math.max(37.91061224489796,...report.plan.clips.filter(c=>c.id.startsWith('b-record-row-')).map(c=>c.at+c.duration));
const start=44+Math.round(from*44100)*4,end=44+Math.round(to*44100)*4;
if(a.length!==b.length||!a.subarray(44,start).equals(b.subarray(44,start))||!a.subarray(end).equals(b.subarray(end)))throw Error('Audio outside record-entry window changed');
if(sha(path.join(previous,'mix/music.wav'))!==sha(path.join(out,'mix/music.wav')))throw Error('Music changed');
const rowCues=report.plan.clips.filter(c=>c.id.startsWith('b-record-row-')).sort((a,b)=>a.at-b.at);
if(rowCues.length!==3||rowCues.some((c,i)=>i&&rowCues[i-1].at+rowCues[i-1].duration>=c.at))throw Error('Three paper entries must have separate attacks and tails');
for(const stem of ['mix','effects','music'])fs.writeFileSync(path.join(out,stem+'-preview.wav'),waveSlice(fs.readFileSync(path.join(out,'mix',stem+'.wav')),32,46));
fs.copyFileSync(path.join(previous,'preview.mp4'),path.join(out,'before.mp4'));
fs.copyFileSync(path.join(previous,'effects-preview.wav'),path.join(out,'before-effects.wav'));
const picture=path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/chapters/04-evidence.mp4'),video=path.join(out,'preview.mp4');
run(ff,['-v','error','-n','-i',picture,'-i',path.join(out,'mix-preview.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',video]);
decode(video);const info=probe(video),v=info.streams.find(s=>s.codec_type==='video');
if(v.width!==1920||v.height!==1080||Number(v.nb_frames)!==420||!info.streams.some(s=>s.codec_type==='audio'))throw Error('Invalid preview');
const vh=f=>run(ff,['-v','error','-i',f,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).trim();
if(vh(video)!==vh(path.join(previous,'preview.mp4')))throw Error('Picture changed');
const encoded=measureLoudness(video,ff);if(encoded.truePeakDb>-1)throw Error('Insufficient encoded headroom');
if(sha(path.join(dir,'audio-plan.json'))!==formalHash)throw Error('Formal plan changed');
writeJson(path.join(out,'audio-plan.json'),plan);writeJson(path.join(out,'encoded-audio-quality.json'),encoded);
writeJson(path.join(out,'asset-sources.json'),[...p.used].map(([id,a])=>({id,path:a.path,source:a.source,license:a.license,sha256:sha(a.diskPath)})));
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-explainer-lens-v1',previewSeconds:[32,46],rows,
 design:'三条成交记录间隔0.34秒依次出现；每条起动约0.10秒后出现纸张轻响，短尾音分开，不组成升调旋律',
 changedWindowSeconds:[5,to-32],pictureUnchanged:true,musicUnchanged:true,
 pcmOutsideChangedWindowBitIdentical:true,lensCueUnchanged:true,otherCuesUnchanged:true,formalAudioPlanUnchanged:true,
 quality:report.quality,encodedAudio:encoded,frames:420,duration:14,
 assistantListening:'not-performed',userApproval:'pending-three-record-listening'});
let html=fs.readFileSync(path.join(previous,'review.html'),'utf8');
html=html.replaceAll('B版 · 放大镜动作音效','B版 · 三条成交记录逐条配音')
 .replaceAll('B版 · 补上第4秒放大镜动作声','B版 · 三条记录，三次纸张轻响')
 .replaceAll('第3.7–4.1秒补上轻微滑擦声，跟随放大镜移到少配件位置。其余五处音效、画面和配乐保持原样。','第5.10、5.44、5.78秒各有一次短纸张声，依次跟随成交记录A、B、C出现。放大镜动作声与其他声音保留。')
 .replaceAll('放大镜动作声','三条记录逐条轻响').replaceAll('上版（此处仅配乐）','上版（滑动与一次翻页）')
 .replaceAll('从第2.8秒听放大镜','从第4.5秒听三条记录').replaceAll('v.currentTime=2.8','v.currentTime=4.5');
fs.writeFileSync(path.join(out,'review.html'),html);fs.copyFileSync(path.join(previous,'poster.png'),path.join(out,'poster.png'));
const history=path.join(dir,'history/before-b-record-entries-v1');
for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History must be preserved');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];
review.feedback={text:'第5秒左右三条同款成色相近的记录逐个出现，音效感觉只有一个，应与三次出现相对应',resolution:'替换原滑动与翻页为三次独立短纸张声，不改画面与其他音效'};
review.currentCandidate={plan:planName,output:'outputs/thinking-anchors/b-record-entries-v1',range:[32,46],review:'outputs/thinking-anchors/b-record-entries-v1/review.html'};
review.userApproval='pending-three-record-listening';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='b-record-entries-candidate-ready';status.preview='outputs/thinking-anchors/b-record-entries-v1/preview.mp4';status.review='outputs/thinking-anchors/b-record-entries-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-record-entries-v1/manifest.json';status.soundCueCount=7;status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; '+planName+' is the alternative';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：三条成交记录分别在试片5.10、5.44、5.78秒触发短纸张声，保留放大镜及其他声音。\n- 试听：outputs/thinking-anchors/b-record-entries-v1/review.html\n- 画面和配乐保持原样，尚待本处听感反馈。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output:out,rows,encodedAudio:encoded,warnings:report.warnings,otherAudioUnchanged:true},null,2));

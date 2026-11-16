// Revise exactly one cue in C; compare PCM and picture with the delivered audition.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const project=path.join(ROOT,'projects/thinking-anchors');
const previous=path.join(ROOT,'outputs/thinking-anchors/sound-palettes-v2/c-sparse');
const basePlan=json(path.join(previous,'audio-plan.json')),formalBefore=sha(path.join(project,'audio-plan.json'));
const asset=json(path.join(project,'assets/sound-palettes/paper-slide-soft-v1.source.json'));
const indexFile=path.join(project,'assets/index.json'),index=json(indexFile);
const resume=process.argv.includes('--resume');
const history=path.join(project,'history/before-c-price-slide-v1');fs.mkdirSync(history,{recursive:true});
for(const name of ['assets/index.json','sound-review.json','delivery-status.json','README.md']){
 const dst=path.join(history,name);if(fs.existsSync(dst)){if(resume)continue;throw Error('History already exists; use a new revision');}
 fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(path.join(project,name),dst);
}
const registered=index.items.find(i=>i.id===asset.id);
if(registered&&(!resume||JSON.stringify(registered)!==JSON.stringify(asset)))throw Error('Candidate asset already registered or differs');
if(!registered){index.items.push(asset);writeJson(indexFile,index);}

const plan=structuredClone(basePlan),cue=plan.clips.find(c=>c.id==='c-sparse-3');
if(cue?.source!=='asset:palette-quiet-sweep'||cue.at!==40)throw Error('Unexpected base cue');
const beforeCue=structuredClone(cue);
cue.source='asset:'+asset.id;cue.sourceIn=0;cue.sourceOut=asset.sound.durationSeconds;
cue.gain=.9;cue.purpose='价格标签抽出归组，以短促柔和的纸张滑擦代替布料扫动';
cue.musicFit='保持C方案的02配乐与其他三处音效；无额外音高或撞击层，低密度纸张材质候选待用户实际试听';
const planFile='audio-palette-c-price-slide-v1.json';writeJson(path.join(project,planFile),plan);
const changed=basePlan.clips.filter((c,i)=>JSON.stringify(c)!==JSON.stringify(plan.clips[i]));
if(changed.length!==1||changed[0].id!=='c-sparse-3')throw Error('Only the price slide may change');
const output=resume?path.join(ROOT,'outputs/thinking-anchors/c-price-slide-v1'):reserveOutput('thinking-anchors','c-price-slide-v1');
if(resume&&fs.existsSync(path.join(output,'manifest.json')))throw Error('Completed output must not be overwritten');
const p=loadProject('thinking-anchors',{audioPlan:planFile});
for(const [id,a] of p.used){
 if(id===asset.id)continue;
 const old=json(path.join(previous,'asset-sources.json')).find(x=>x.id===id);
 if(!old||old.sha256!==sha(a.diskPath))throw Error('Other source asset changed: '+id);
}
const resolved=structuredClone(p.audioPlan);
for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
const ff=binaries().ffmpeg;
const report=buildArrangement({dir:path.join(project,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(output,'mix'),stems:true,quality:true});
const oldPcm=fs.readFileSync(path.join(previous,'mix.wav')),newPcm=fs.readFileSync(path.join(output,'mix/mix.wav'));
if(oldPcm.length!==newPcm.length)throw Error('Duration changed');
const changedDuration=Math.max(beforeCue.sourceOut-beforeCue.sourceIn,asset.sound.durationSeconds);
const start=44+Math.round(40*44100)*4,end=44+Math.round((40+changedDuration)*44100)*4;
if(!oldPcm.subarray(44,start).equals(newPcm.subarray(44,start))||!oldPcm.subarray(end).equals(newPcm.subarray(end)))throw Error('Audio outside replaced cue changed');
if(oldPcm.subarray(start,end).equals(newPcm.subarray(start,end)))throw Error('Replacement cue is unchanged');
if(sha(path.join(previous,'music.wav'))!==sha(path.join(output,'mix/music.wav')))throw Error('Music changed');
for(const s of ['mix','music','effects'])fs.writeFileSync(path.join(output,s+'-preview.wav'),waveSlice(fs.readFileSync(path.join(output,'mix',s+'.wav')),32,46));
fs.copyFileSync(path.join(previous,'mix-preview.wav'),path.join(output,'before-mix.wav'));
fs.copyFileSync(path.join(previous,'effects-preview.wav'),path.join(output,'before-effects.wav'));
fs.copyFileSync(path.join(previous,'preview.mp4'),path.join(output,'before.mp4'));
const source=path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/chapters/04-evidence.mp4');
const movie=path.join(output,'preview.mp4');
run(ff,['-v','error','-n','-i',source,'-i',path.join(output,'mix-preview.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',movie]);
decode(movie);const info=probe(movie),v=info.streams.find(x=>x.codec_type==='video');
if(v.width!==1920||v.height!==1080||Number(v.nb_frames)!==420||!info.streams.some(x=>x.codec_type==='audio'))throw Error('Invalid revised preview');
const vhash=f=>run(ff,['-v','error','-i',f,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).trim();
if(vhash(movie)!==vhash(path.join(previous,'preview.mp4')))throw Error('Picture changed');
const encoded=measureLoudness(movie,ff);if(encoded.truePeakDb>-1)throw Error('Insufficient headroom');
writeJson(path.join(output,'encoded-audio-quality.json'),encoded);
fs.copyFileSync(path.join(project,planFile),path.join(output,'audio-plan.json'));
writeJson(path.join(output,'asset-sources.json'),[...p.used].map(([id,a])=>({id,path:a.path,source:a.source,license:a.license,sha256:sha(a.diskPath)})));
if(sha(path.join(project,'audio-plan.json'))!==formalBefore)throw Error('Formal plan changed');
const manifest={type:'single-cue-audio-revision',base:'outputs/thinking-anchors/sound-palettes-v2/c-sparse',
 previewRange:[32,46],replacedClipSeconds:[8,8+changedDuration],replacedFilmSeconds:[40,40+changedDuration],
 beforeCue,afterCue:cue,pictureUnchanged:true,musicUnchanged:true,otherCuesUnchanged:true,
 pcmOutsideReplacementBitIdentical:true,formalAudioPlanUnchanged:true,formalAudioPlanSha256:formalBefore,
 video:{file:'preview.mp4',sha256:sha(movie),width:1920,height:1080,frames:420,duration:14},
 quality:report.quality,encodedAudio:encoded,previousCueFeedback:'第8秒附近动画音效不合适；用户明确指C清脆留白，其他声音勉强接受',
 userApproval:'pending-replacement-listening',assistantListening:'not-performed'};
writeJson(path.join(output,'manifest.json'),manifest);

// A single player avoids doubled sound; native MP4 controls handle sync and seek.
fs.copyFileSync(path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/evidence.png'),path.join(output,'poster.png'));
fs.writeFileSync(path.join(output,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>C方案 · 第8秒音效修改</title><style>body{max-width:1100px;margin:30px auto;padding:0 20px;background:#fff7e8;color:#25252b;font:17px/1.7 system-ui}video{width:100%;border:3px solid #25252b;border-radius:10px}button{font:16px system-ui;padding:12px 18px;margin:6px;border:2px solid #25252b;border-radius:8px;background:white;cursor:pointer}button.active{background:#57c4b4}p{color:#635e55}</style><h1>C 清脆留白 · 只改第8秒</h1><p>价格标签归组：布料扫动 → 轻柔纸张滑擦。其他三处音效与02配乐保持原样。</p><div><button data-version="after" class="active">修改后</button><button data-version="before">修改前</button><button id="focus">从第6.5秒听这一处</button></div><video id="player" src="preview.mp4" controls playsinline preload="metadata" poster="poster.png"></video><p id="status">修改后 · 轻柔纸张滑擦</p><p><a href="preview.mp4">新版14秒视频</a> · <a href="effects-preview.wav">单独听新版音效</a></p><script>
const v=document.getElementById('player'),status=document.getElementById('status');let switching=false;
document.querySelectorAll('[data-version]').forEach(b=>b.onclick=async()=>{if(switching)return;switching=true;const t=v.currentTime,playing=!v.paused;v.pause();v.src=b.dataset.version==='after'?'preview.mp4':'before.mp4';v.load();try{await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=()=>rej(Error('视频加载失败'))});v.currentTime=t;document.querySelectorAll('[data-version]').forEach(x=>x.classList.toggle('active',x===b));status.textContent=b.dataset.version==='after'?'修改后 · 轻柔纸张滑擦':'修改前 · 布料扫动';if(playing)await v.play()}catch(e){if(e.name!=='AbortError')status.textContent=e.message}finally{switching=false}});
document.getElementById('focus').onclick=async()=>{v.currentTime=6.5;await v.play()};
</script></html>`);
const soundReview=json(path.join(project,'sound-review.json'));
soundReview.feedback={text:'第8秒附近的那个动画效果的音效不太合适，其他的还可以勉强接受',palette:'c-sparse',otherSounds:'tentatively-tolerated; do not polish or replace without further feedback'};
soundReview.currentCandidate={plan:planFile,output:'outputs/thinking-anchors/c-price-slide-v1',range:[32,46],changedCue:'c-sparse-3',review:'outputs/thinking-anchors/c-price-slide-v1/review.html'};
soundReview.userApproval='pending-single-cue-review';writeJson(path.join(project,'sound-review.json'),soundReview);
const status=json(path.join(project,'delivery-status.json'));status.state='c-price-slide-revision-ready';status.review='outputs/thinking-anchors/c-price-slide-v1/review.html';status.preview='outputs/thinking-anchors/c-price-slide-v1/preview.mp4';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/c-price-slide-v1/manifest.json';status.selectedSoundPalette='c-sparse (current feedback target)';status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; audio-palette-c-price-slide-v1.json is the local candidate';writeJson(path.join(project,'delivery-status.json'),status);
const readme=path.join(project,'README.md');fs.writeFileSync(readme,'当前声音修改：C清脆留白，第8秒标签归组改为轻柔纸张滑擦。其余三处音效与配乐保留，尚待本处听感确认。\n- 试听：outputs/thinking-anchors/c-price-slide-v1/review.html\n- 新方案：audio-palette-c-price-slide-v1.json；正式audio-plan.json未变更。\n\n'+fs.readFileSync(readme,'utf8'));
console.log(JSON.stringify({output,changedCue:cue.id,pcmOutsideReplacementUnchanged:true,encodedAudio:encoded,warnings:report.warnings},null,2));

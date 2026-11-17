import fs from 'node:fs';import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';
const dir=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/b-group-down-dry-v1');
const out=reserveOutput('thinking-anchors','b-nonpaper-down-v1'),formalHash=sha(path.join(dir,'audio-plan.json'));
const base=json(path.join(prior,'audio-plan.json')),index=json(path.join(dir,'assets/index.json'));
const ff=binaries().ffmpeg,originalPCM=fs.readFileSync(path.join(prior,'mix/mix.wav'));
const vh=f=>run(ff,['-v','error','-i',f,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).trim();
const picture=path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/chapters/04-evidence.mp4'),pictureHash=vh(path.join(prior,'preview.mp4'));
const options=[{id:'mechanical',asset:'group-mechanical-v1',label:'短机械滑扣',purpose:'三个标签下移归组时的短机械滑动与轻微扣合，区分前面的纸张声'},
 {id:'electronic',asset:'group-electronic-v1',label:'电子收拢短音',purpose:'用单次短电子收拢声表示三个标签整体归到比较线上，区分纸张材质'}];
const results=[];
for(const option of options){
 const target=path.join(out,option.id),asset=index.items.find(a=>a.id===option.asset),plan=structuredClone(base);
 const cue=plan.clips.find(c=>c.id==='b-comic-5');cue.source='asset:'+option.asset;cue.sourceOut=asset.sound.durationSeconds;cue.gain=.9;cue.fadeIn=.005;cue.fadeOut=.02;cue.purpose=option.purpose;
 cue.musicFit='固定02配乐；与此前纸张声音区分，短而干的声音候选，实际音色与有音高部分的搭配待用户试听';
 for(const c of base.clips.filter(c=>c.id!==cue.id))if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Other cue changed');
 const planName=`audio-palette-b-down-${option.id}-v1.json`;writeJson(path.join(dir,planName),plan);
 const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
 const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(target,'mix'),stems:true,quality:true});
 const b=fs.readFileSync(path.join(target,'mix/mix.wav')),start=44+Math.round(41.2*44100)*4,end=44+Math.round(41.68*44100)*4;
 if(b.length!==originalPCM.length||!originalPCM.subarray(44,start).equals(b.subarray(44,start))||!originalPCM.subarray(end).equals(b.subarray(end)))throw Error('Audio outside grouping cue changed');
 if(sha(path.join(prior,'mix/music.wav'))!==sha(path.join(target,'mix/music.wav')))throw Error('Music changed');
 for(const stem of ['mix','effects','music'])fs.writeFileSync(path.join(target,stem+'-preview.wav'),waveSlice(fs.readFileSync(path.join(target,'mix',stem+'.wav')),32,46));
 fs.copyFileSync(p.assets.get(option.asset).diskPath,path.join(target,'source.wav'));
 const video=path.join(target,'preview.mp4');run(ff,['-v','error','-n','-i',picture,'-i',path.join(target,'mix-preview.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',video]);
 decode(video);const info=probe(video),v=info.streams.find(s=>s.codec_type==='video');if(Number(v?.nb_frames)!==420||v.width!==1920||v.height!==1080||!info.streams.some(s=>s.codec_type==='audio')||vh(video)!==pictureHash)throw Error('Invalid or altered picture');
 const encoded=measureLoudness(video,ff);if(encoded.truePeakDb>-1)throw Error('Insufficient headroom');
 writeJson(path.join(target,'audio-plan.json'),plan);writeJson(path.join(target,'encoded-audio-quality.json'),encoded);
 writeJson(path.join(target,'asset-sources.json'),[...p.used].map(([id,a])=>({id,path:a.path,source:a.source,license:a.license,sha256:sha(a.diskPath)})));
 results.push({...option,plan:planName,motionSeconds:[9.2,9.2+asset.sound.durationSeconds],pictureUnchanged:true,musicUnchanged:true,otherCuesUnchanged:true,pcmOutsideCueUnchanged:true,quality:report.quality,encodedAudio:encoded});
 console.log(option.id,JSON.stringify(encoded),JSON.stringify(report.warnings));
}
if(sha(path.join(dir,'audio-plan.json'))!==formalHash)throw Error('Formal plan changed');
fs.copyFileSync(path.join(prior,'preview.mp4'),path.join(out,'paper-before.mp4'));
fs.copyFileSync(path.join(prior,'poster.png'),path.join(out,'poster.png'));
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-group-down-dry-v1',range:[32,46],options:results,formalAudioPlanUnchanged:true,frames:420,duration:14,assistantListening:'not-performed',userApproval:'pending-nonpaper-sound-choice'});
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>标签归组 · 两种非纸张声音</title><style>body{max-width:1100px;margin:28px auto;padding:0 20px;background:#fff7e8;color:#25252b;font:17px/1.7 system-ui}video{width:100%;border:3px solid #25252b;border-radius:10px}button{font:16px system-ui;padding:12px 18px;margin:6px;border:2px solid #25252b;border-radius:8px;background:white;cursor:pointer}button.active{background:#57c4b4}p{color:#635e55}a{margin-right:20px}</style><h1>标签归组，换两种声音材质</h1><p>只比较第9.2秒附近的下移动作。三条记录出现、放大镜、落定和配乐均沿用上版。</p><button data-sound="mechanical" class="active">短机械滑扣</button><button data-sound="electronic">电子收拢短音</button><button data-sound="paper">上版纸卡声</button><button id="focus">从第8秒听这一处</button><video id="player" controls playsinline preload="metadata" poster="poster.png" src="mechanical/preview.mp4"></video><p id="status">短机械滑扣 · 单次滑动与轻扣合</p><p><a href="mechanical/source.wav">单独听机械素材</a><a href="electronic/source.wav">单独听电子素材</a></p><p>两种音效都是短声，无额外空间处理。音色是否贴合这段知识漫画，待实际试听选择。</p><script>
const v=document.getElementById('player'),status=document.getElementById('status'),files={mechanical:'mechanical/preview.mp4',electronic:'electronic/preview.mp4',paper:'paper-before.mp4'},names={mechanical:'短机械滑扣 · 单次滑动与轻扣合',electronic:'电子收拢短音 · 简短的界面收拢',paper:'上版纸卡声'};let busy=false;
document.querySelectorAll('[data-sound]').forEach(b=>b.onclick=async()=>{if(busy)return;busy=true;const t=v.currentTime,playing=!v.paused;v.pause();v.src=files[b.dataset.sound];v.load();try{await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=()=>rej(Error('视频加载失败'))});v.currentTime=t;document.querySelectorAll('[data-sound]').forEach(x=>x.classList.toggle('active',x===b));status.textContent=names[b.dataset.sound];if(playing)await v.play()}catch(e){if(e.name!=='AbortError')status.textContent=e.message}finally{busy=false}});
document.getElementById('focus').onclick=async()=>{v.currentTime=8;await v.play()};
</script></html>`);
const history=path.join(dir,'history/before-b-nonpaper-down-v1');for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History exists');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];review.feedback={text:'短纸卡滑动与前面重复，需要其他音效',resolution:'同画面比较短机械滑扣和电子收拢短音，仅更换第9.2秒附近的归组声'};review.currentCandidate={output:'outputs/thinking-anchors/b-nonpaper-down-v1',plans:results.map(x=>x.plan),range:[32,46],review:'outputs/thinking-anchors/b-nonpaper-down-v1/review.html'};review.userApproval='pending-nonpaper-sound-choice';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='two-nonpaper-down-options-ready';status.preview='outputs/thinking-anchors/b-nonpaper-down-v1/mechanical/preview.mp4';status.review='outputs/thinking-anchors/b-nonpaper-down-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-nonpaper-down-v1/manifest.json';status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; two nonpaper alternatives kept separately';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：第9.2秒标签归组试听机械滑扣、电子收拢两种材质，其余声音保留。\n- 对照：outputs/thinking-anchors/b-nonpaper-down-v1/review.html\n- 仅候选，待听感选择；正式音频方案保留。\n\n'+fs.readFileSync(readme,'utf8'));
console.log('Ready:',out);

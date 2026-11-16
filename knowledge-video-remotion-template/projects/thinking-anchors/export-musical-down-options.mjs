import fs from 'node:fs';import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {buildArrangement} from '../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../scripts/pcm.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';
import {tonalFeatures} from '../../scripts/music-features.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/b-group-down-dry-v1');
const out=reserveOutput('thinking-anchors','b-musical-down-v1'),formalHash=sha(path.join(dir,'audio-plan.json'));
const base=json(path.join(prior,'audio-plan.json')),index=json(path.join(dir,'assets/index.json'));
const ff=binaries().ffmpeg,originalPCM=fs.readFileSync(path.join(prior,'mix/mix.wav'));
const musicPCM=fs.readFileSync(path.join(prior,'mix/music.wav'));
const tonal=[];
for(const [from,to] of [[36,44],[40,42],[40.85,42]]){
 const a=new Float32Array(Math.floor((to-from)*11025));for(let i=0;i<a.length;i++){const k=44+(Math.round(from*44100)+i*4)*4;a[i]=(musicPCM.readInt16LE(k)+musicPCM.readInt16LE(k+2))/65536;}
 tonal.push({from,to,estimate:tonalFeatures(a,11025).overall});
}
writeJson(path.join(out,'tonal-candidates.json'),{source:'user-selected 02 music, actual arranged music stem',musicStemSha256:sha(path.join(prior,'mix/music.wav')),ranges:tonal,
 interpretation:'36–44s suggests F minor; the 40–42s estimate is uncertain. C/Eb/G are provisional common-note choices, not confirmed harmony or manual listening.',manualListening:'not-performed'});
const vh=f=>run(ff,['-v','error','-i',f,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).trim();
const picture=path.join(ROOT,'outputs/thinking-anchors/full-motion-v1/chapters/04-evidence.mp4'),pictureHash=vh(path.join(prior,'preview.mp4'));
const options=[{id:'glide',asset:'musical-warm-glide-v1',label:'柔和下行滑音',purpose:'用中音区连续乐音的下行表示三个标签同时下移，音高随移动位置变化'},
 {id:'arpeggio',asset:'musical-rounded-arp-v1',label:'圆润下行琶音',purpose:'用三个连奏键音形成短下行乐句，衔接标签下移与归组'}];
const results=[];
for(const option of options){
 const target=path.join(out,option.id),asset=index.items.find(a=>a.id===option.asset),plan=structuredClone(base);
 const cue=plan.clips.find(c=>c.id==='b-comic-5');cue.source='asset:'+option.asset;cue.at={event:'evidence.range',offset:.85};cue.sourceOut=asset.sound.durationSeconds;cue.gain=.9;cue.fadeIn=.005;cue.fadeOut=.02;cue.purpose=option.purpose;
 cue.musicFit='用户希望用平滑乐音表现动态；保持02配乐，局部调性估计含uncertain结果，使用候选音高，尚待混合试听；不声称已确认和声协调';
 for(const c of base.clips.filter(c=>c.id!==cue.id))if(JSON.stringify(c)!==JSON.stringify(plan.clips.find(n=>n.id===c.id)))throw Error('Other cue changed');
 const planName=`audio-palette-b-musical-${option.id}-v1.json`;writeJson(path.join(dir,planName),plan);
 const p=loadProject('thinking-anchors',{audioPlan:planName}),resolved=structuredClone(plan);for(const c of resolved.clips)c.source=p.assets.get(c.source.slice(6)).path;
 const report=buildArrangement({dir:path.join(dir,'assets'),config:p.config,audioPlan:resolved},ff,{directory:path.join(target,'mix'),stems:true,quality:true});
 const b=fs.readFileSync(path.join(target,'mix/mix.wav')),start=44+Math.round(40.85*44100)*4,end=44+Math.round(41.95*44100)*4;
 if(b.length!==originalPCM.length||!originalPCM.subarray(44,start).equals(b.subarray(44,start))||!originalPCM.subarray(end).equals(b.subarray(end)))throw Error('Audio outside motion cue changed');
 if(sha(path.join(prior,'mix/music.wav'))!==sha(path.join(target,'mix/music.wav')))throw Error('Music changed');
 for(const stem of ['mix','effects','music'])fs.writeFileSync(path.join(target,stem+'-preview.wav'),waveSlice(fs.readFileSync(path.join(target,'mix',stem+'.wav')),32,46));
 fs.copyFileSync(p.assets.get(option.asset).diskPath,path.join(target,'source.wav'));
 const video=path.join(target,'preview.mp4');run(ff,['-v','error','-n','-i',picture,'-i',path.join(target,'mix-preview.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','14','-movflags','+faststart',video]);
 decode(video);const info=probe(video),v=info.streams.find(s=>s.codec_type==='video');if(Number(v?.nb_frames)!==420||v.width!==1920||v.height!==1080||!info.streams.some(s=>s.codec_type==='audio')||vh(video)!==pictureHash)throw Error('Invalid or altered picture');
 const encoded=measureLoudness(video,ff);if(encoded.truePeakDb>-1)throw Error('Insufficient headroom');
 writeJson(path.join(target,'audio-plan.json'),plan);writeJson(path.join(target,'encoded-audio-quality.json'),encoded);
 writeJson(path.join(target,'asset-sources.json'),[...p.used].map(([id,a])=>({id,path:a.path,source:a.source,license:a.license,sha256:sha(a.diskPath)})));
 results.push({...option,plan:planName,motionSeconds:[8.85,9.95],pictureUnchanged:true,musicUnchanged:true,otherCuesUnchanged:true,pcmOutsideCueUnchanged:true,quality:report.quality,encodedAudio:encoded});
 console.log(option.id,JSON.stringify(encoded),JSON.stringify(report.warnings));
}
if(sha(path.join(dir,'audio-plan.json'))!==formalHash)throw Error('Formal plan changed');
fs.copyFileSync(path.join(prior,'preview.mp4'),path.join(out,'before.mp4'));fs.copyFileSync(path.join(prior,'poster.png'),path.join(out,'poster.png'));
writeJson(path.join(out,'manifest.json'),{base:'outputs/thinking-anchors/b-group-down-dry-v1',range:[32,46],options:results,formalAudioPlanUnchanged:true,frames:420,duration:14,
 intent:'Keep the selected main music and use a short original musical gesture to express the downward movement; two timbre/gesture candidates, not replacement soundtrack tracks.',tonalReview:'provisional; see tonal-candidates.json',assistantListening:'not-performed',userApproval:'pending-musical-motion-choice'});
fs.writeFileSync(path.join(out,'review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>标签下移 · 平滑动作配乐</title><style>body{max-width:1100px;margin:28px auto;padding:0 20px;background:#fff7e8;color:#25252b;font:17px/1.7 system-ui}video{width:100%;border:3px solid #25252b;border-radius:10px}button{font:16px system-ui;padding:12px 18px;margin:6px;border:2px solid #25252b;border-radius:8px;background:white;cursor:pointer}button.active{background:#57c4b4}p{color:#635e55}a{margin-right:20px}</style><h1>用一小段乐音表现标签下移</h1><p>第8.85–9.95秒：柔和连续滑音，或圆润键音琶音。两版都沿用02背景音乐和此前的动作音效，乐音为本期原创合成。</p><button data-sound="glide" class="active">柔和下行滑音</button><button data-sound="arpeggio">圆润下行琶音</button><button data-sound="before">上版纸卡声</button><button id="focus">从第8秒听标签下移</button><video id="player" controls playsinline preload="metadata" poster="poster.png" src="glide/preview.mp4"></video><p id="status">柔和下行滑音 · 音高随标签下移</p><p><a href="glide/source.wav">单独听滑音</a><a href="arpeggio/source.wav">单独听琶音</a></p><p>建议在带背景音乐的混音里比较，感受哪种乐音更能跟随标签下移，并与原配乐自然衔接。</p><script>
const v=document.getElementById('player'),status=document.getElementById('status'),files={glide:'glide/preview.mp4',arpeggio:'arpeggio/preview.mp4',before:'before.mp4'},names={glide:'柔和下行滑音 · 音高随标签下移',arpeggio:'圆润下行琶音 · 三个连奏键音',before:'上版纸卡声'};let busy=false;
document.querySelectorAll('[data-sound]').forEach(b=>b.onclick=async()=>{if(busy)return;busy=true;const t=v.currentTime,playing=!v.paused;v.pause();v.src=files[b.dataset.sound];v.load();try{await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=()=>rej(Error('视频加载失败'))});v.currentTime=t;document.querySelectorAll('[data-sound]').forEach(x=>x.classList.toggle('active',x===b));status.textContent=names[b.dataset.sound];if(playing)await v.play()}catch(e){if(e.name!=='AbortError')status.textContent=e.message}finally{busy=false}});
document.getElementById('focus').onclick=async()=>{v.currentTime=8;await v.play()};
</script></html>`);
const history=path.join(dir,'history/before-b-musical-down-v1');for(const name of ['sound-review.json','delivery-status.json','README.md']){const dst=path.join(history,name);fs.mkdirSync(path.dirname(dst),{recursive:true});if(fs.existsSync(dst))throw Error('History exists');fs.copyFileSync(path.join(dir,name),dst)}
const review=json(path.join(dir,'sound-review.json'));review.feedbackHistory=[...(review.feedbackHistory??[]),review.feedback];review.feedback={text:'有没有其他平滑的音乐，然后展现这个动态的变化',interpretation:'局部标签下移动作使用短动作配乐，沿用明确指定的02主配乐',resolution:'两种原创合成乐音：柔和连续下行滑音与圆润下行琶音，先做混合试听'};review.currentCandidate={output:'outputs/thinking-anchors/b-musical-down-v1',plans:results.map(x=>x.plan),range:[32,46],review:'outputs/thinking-anchors/b-musical-down-v1/review.html'};review.userApproval='pending-musical-motion-choice';writeJson(path.join(dir,'sound-review.json'),review);
const status=json(path.join(dir,'delivery-status.json'));status.state='two-musical-motion-options-ready';status.preview='outputs/thinking-anchors/b-musical-down-v1/glide/preview.mp4';status.review='outputs/thinking-anchors/b-musical-down-v1/review.html';status.soundReview=status.review;status.soundPaletteManifest='outputs/thinking-anchors/b-musical-down-v1/manifest.json';status.userSoundApproval=false;status.formalAudioPlan='audio-plan.json unchanged; short musical-motion alternatives kept separately';writeJson(path.join(dir,'delivery-status.json'),status);
const readme=path.join(dir,'README.md');fs.writeFileSync(readme,'当前声音候选：标签下移用短动作配乐，提供柔和下行滑音、圆润下行琶音两版。主配乐仍为用户指定的02，其他动作声保留。\n- 试听：outputs/thinking-anchors/b-musical-down-v1/review.html\n- 局部调性估计有不确定性；音乐协调性待实际试听，正式方案保留。\n\n'+fs.readFileSync(readme,'utf8'));
console.log('Ready:',out);

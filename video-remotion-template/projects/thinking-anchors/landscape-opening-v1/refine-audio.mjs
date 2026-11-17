import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
import {measureLoudness} from '../../../scripts/audio-quality.mjs';
import {makeAudio} from './audio.mjs';
const out=path.join(ROOT,'outputs/thinking-anchors/landscape-opening-v1'),variant=path.join(out,'term-audio-check-v3'),local=path.join(ROOT,'projects/thinking-anchors/landscape-opening-v1'),ff=binaries().ffmpeg;
if(fs.existsSync(variant))throw Error('Audio variant already exists');fs.mkdirSync(variant);
const sound=makeAudio(variant),quality=json(path.join(variant,'audio/audio-quality.json'));
if(quality.warnings.some(w=>w.id==='hook-term'))throw Error('Term cue still outside the technical level range');
const files=[];for(const [picture,audio,file,duration,frames] of [['opening-picture.mp4','opening-mix.wav','video.mp4',24,720],['continuity-picture.mp4','audio/mix.wav','continuity-0-38.mp4',38,1140]]){
 const movie=path.join(variant,file);run(ff,['-v','error','-n','-i',path.join(out,picture),'-i',path.join(variant,audio),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(duration),'-avoid_negative_ts','disabled','-movflags','+faststart',movie]);decode(movie);
 const p=probe(movie),v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio'),encodedAudioQuality=measureLoudness(movie,ff);
 if(Number(v.nb_frames)!==frames||v.width!==1920||v.height!==1080||v.avg_frame_rate!=='30/1'||Math.abs(Number(p.format.duration)-duration)>.01||Number(v.start_time)!==0||Number(a.start_time)!==0||encodedAudioQuality.truePeakDb>-1||Math.abs(encodedAudioQuality.integratedLufs+18)>3)throw Error('Invalid refined output');
 writeJson(path.join(variant,file==='video.mp4'?'probe.json':'continuity-probe.json'),p);files.push({file,durationSeconds:duration,frames,sha256:sha(movie),encodedAudioQuality});
}
const manifest=json(path.join(out,'manifest.json'));
const pixels=run(ff,['-v','error','-i',path.join(variant,'continuity-0-38.mp4'),'-map','0:v:0','-vf','trim=start_frame=720:end_frame=1140,setpts=PTS-STARTPTS','-pix_fmt','yuv420p','-f','hash','-hash','sha256','-']).trim();if(pixels!==manifest.retained.pixelHash)throw Error('Following picture changed');
function moveWithin(from,to){const a=path.resolve(out,from),b=path.resolve(out,to);if(!a.startsWith(out+path.sep)||!b.startsWith(out+path.sep)||fs.existsSync(b))throw Error('Archive path invalid or already exists');fs.renameSync(a,b);}
for(const f of ['video.mp4','continuity-0-38.mp4','opening-mix.wav','audio-plan.json','audio-impact.json','music-reference.json','probe.json','continuity-probe.json']){const stem=f.replace(/(\.[^.]+)$/,'-before-term-gain$1');moveWithin(f,stem);moveWithin('term-audio-check-v3/'+f,f);}
moveWithin('audio','audio-before-term-gain');moveWithin('term-audio-check-v3/audio','audio');
manifest.files=files;manifest.audio=sound.checks;manifest.audioRevision={reason:'Removed redundant term click; music carries the text reveal, while object action sounds remain',previousGain:.9,newGain:0,termCueRemoved:true,previousFilesSuffix:'before-term-gain',technicalLevelWarningResolved:true,assistantListening:'not-performed'};
manifest.sources['audio.mjs']=sha(path.join(local,'audio.mjs'));manifest.sources['refine-audio.mjs']=sha(path.join(local,'refine-audio.mjs'));writeJson(path.join(out,'manifest.json'),manifest);
writeJson(path.join(out,'audio-warning-review.json'),{remainingWarnings:quality.warnings,interpretation:'hook-price is compared with nearly silent opening music: music RMS -94.76 dBFS, cue RMS -28.77 dBFS before master gain; high relative ratio is not evidence of absolute clipping. No ducking applied. Actual listening remains pending.',termLevel:quality.eventLevels.find(e=>e.id==='hook-term'),assistantListening:'not-performed'});
console.log(JSON.stringify({files,termLevel:quality.eventLevels.find(e=>e.id==='hook-term'),musicUnchanged:sound.checks.musicPcmUnchangedAcross0to38}));

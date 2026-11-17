import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
import {measureLoudness} from '../../../scripts/audio-quality.mjs';
import {makeOfferAudio} from './audio.mjs';
const out=path.join(ROOT,'outputs/thinking-anchors/landscape-offer-v1'),local=path.join(ROOT,'projects/thinking-anchors/landscape-offer-v1'),candidate=path.join(out,'refusal-level-check'),ff=binaries().ffmpeg;
if(fs.existsSync(candidate))throw Error('Audio candidate exists');fs.mkdirSync(candidate);
const sound=makeOfferAudio(candidate),audio=json(path.join(candidate,'audio/audio-quality.json'));
if(audio.warnings.some(w=>w.id==='offer-refusal'))throw Error('Refusal event level still outside the technical range');
const files=[];for(const [picture,wav,file,durationSeconds,frames] of [['segment-picture.mp4','segment-mix.wav','video.mp4',12,360],['continuity-picture.mp4','audio/mix.wav','continuity-0-64.mp4',64,1920]]){
 const movie=path.join(candidate,file);run(ff,['-v','error','-n','-i',path.join(out,picture),'-i',path.join(candidate,wav),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(durationSeconds),'-avoid_negative_ts','disabled','-movflags','+faststart',movie]);decode(movie);
 const p=probe(movie),v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio'),encodedAudioQuality=measureLoudness(movie,ff);
 if(v.width!==1920||v.height!==1080||v.avg_frame_rate!=='30/1'||Number(v.nb_frames)!==frames||Math.abs(Number(p.format.duration)-durationSeconds)>.01||Number(v.start_time)!==0||Number(a.start_time)!==0||encodedAudioQuality.truePeakDb>-1||Math.abs(encodedAudioQuality.integratedLufs+18)>3)throw Error('Invalid audio revision');
 writeJson(path.join(candidate,file==='video.mp4'?'probe.json':'continuity-probe.json'),p);files.push({file,durationSeconds,frames,sha256:sha(movie),encodedAudioQuality});
}
const manifest=json(path.join(out,'manifest.json'));
function withinMove(from,to){const a=path.resolve(out,from),b=path.resolve(out,to);if(!a.startsWith(out+path.sep)||!b.startsWith(out+path.sep)||fs.existsSync(b))throw Error('Archive path outside output or occupied');fs.renameSync(a,b);}
for(const f of ['video.mp4','continuity-0-64.mp4','segment-mix.wav','audio-plan.json','audio-impact.json','music-reference.json','probe.json','continuity-probe.json']){withinMove(f,f.replace(/(\.[^.]+)$/,'-before-refusal-level$1'));withinMove('refusal-level-check/'+f,f);}
withinMove('audio','audio-before-refusal-level');withinMove('refusal-level-check/audio','audio');
manifest.files=files;manifest.audio=sound.checks;manifest.audioRevision={event:'offer-refusal',previousGain:1.7,gain:2.1,reason:'short refusal contact was about 1 dB below the automatic event level range',moviePictureStreamsUnchanged:true,previousFilesSuffix:'before-refusal-level',assistantListening:'not-performed'};
for(const f of ['audio.mjs','refine-audio.mjs'])manifest.sources[f]=sha(path.join(local,f));writeJson(path.join(out,'manifest.json'),manifest);console.log(JSON.stringify({files,refusalLevel:audio.eventLevels.find(e=>e.id==='offer-refusal'),newWarnings:audio.warnings.filter(w=>w.id?.startsWith('offer-'))}));

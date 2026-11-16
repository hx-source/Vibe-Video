// Resume a complete picture export that stopped at continuity timestamp checks.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../scripts/runtime.mjs';
import {measureLoudness} from '../../scripts/audio-quality.mjs';

const name=process.argv[2]??'used-evidence-v1';
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid revision');
const out=path.join(ROOT,'outputs/thinking-anchors',name),manifest=json(path.join(out,'manifest.json'));
if(manifest.status!=='prepared')throw Error('Only resume an unfinished export');
const ff=binaries().ffmpeg,movie=path.join(out,'video.mp4'),joined=path.join(out,'continuity-0-46.mp4');
const originalStart=Number(probe(joined).streams.find(s=>s.codec_type==='video').start_time??0);
if(originalStart>1e-6){
 const aligned=path.join(out,'continuity-0-46-aligned.mp4');
 if(!fs.existsSync(aligned))run(ff,['-v','error','-n','-itsoffset',String(-originalStart),'-i',joined,'-i',path.join(out,'mix-0-46.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','46','-avoid_negative_ts','disabled','-movflags','+faststart',aligned]);
 const result=probe(aligned),video=result.streams.find(s=>s.codec_type==='video');
 if(Number(video.nb_frames)!==1380||Number(video.start_time)!==0||Math.abs(Number(result.format.duration)-46)>.01)throw Error('Aligned export invalid');
 fs.renameSync(joined,path.join(out,'continuity-before-timestamp-normalization.mp4'));fs.renameSync(aligned,joined);
}
decode(joined);const info=probe(joined),video=info.streams.find(s=>s.codec_type==='video');
if(Number(video.nb_frames)!==1380||Number(video.start_time)!==0||Math.abs(Number(info.format.duration)-46)>.01)throw Error('Continuity export invalid');
const pixels=file=>run(ff,['-v','error','-i',file,'-map','0:v:0','-frames:v','960','-pix_fmt','yuv420p','-f','hash','-hash','sha256','-']).trim();
const pixelHash=pixels(path.join(ROOT,'outputs/thinking-anchors/live-decision-v2/continuity-0-32.mp4'));
if(pixels(joined)!==pixelHash)throw Error('Previously accepted pixels changed');
writeJson(path.join(out,'continuity-probe.json'),info);
const joinedQuality=measureLoudness(joined,ff);if(joinedQuality.truePeakDb>-1||joinedQuality.silent)throw Error('Joined audio invalid');
writeJson(path.join(out,'continuity-encoded-audio.json'),joinedQuality);
manifest.status='rendered-and-decoded';manifest.videoOutput={file:'video.mp4',sha256:sha(movie),frames:420,duration:14,width:1920,height:1080,fps:30};
manifest.continuityOutput={file:'continuity-0-46.mp4',sha256:sha(joined),frames:1380,duration:46,acceptedOpeningDecodedPixelsUnchanged:true,openingPixelHash:pixelHash,timestampNormalization:{beforeVideoStart:originalStart,afterVideoStart:0,videoStreamCopied:true,audioFromOriginalContinuousPcm:true}};
manifest.encodedAudioQuality=json(path.join(out,'encoded-audio-quality.json'));manifest.manualReview={visual:'keyframes-inspected-separately',audio:'needs-user-listening'};
manifest.renderMethod='Prepared timeline and PCM mix; project React/SVG via offline Chromium, FFmpeg encoding, and continuity video timestamp normalization without picture re-encoding';
writeJson(path.join(out,'manifest.json'),manifest);
console.log(JSON.stringify({out,frames:1380,duration:info.format.duration,timestampNormalization:manifest.continuityOutput.timestampNormalization}));

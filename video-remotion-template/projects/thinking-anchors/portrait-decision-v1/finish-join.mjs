import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
import {measureLoudness} from '../../../scripts/audio-quality.mjs';
const out=path.resolve(ROOT,'outputs/thinking-anchors/portrait-decision-v1'),source=path.join(out,'continuity-before-timestamp-normalization.mp4'),joined=path.join(out,'continuity-0-38.mp4'),archived=path.join(out,'continuity-invalid-truncated-24s.mp4');
for(const file of [source,joined,archived])if(path.dirname(path.resolve(file))!==out)throw Error('Path must remain inside this revision directory');
const native=probe(path.join(out,'video.mp4'));if(Number(native.streams.find(s=>s.codec_type==='video').nb_frames)!==420)throw Error('New chapter must already be complete');
if(fs.existsSync(joined)){if(Number(probe(joined).format.duration)>25)throw Error('Unexpected file; do not replace');if(fs.existsSync(archived))throw Error('Recovery already attempted');fs.renameSync(joined,archived);}
const offset=Number(probe(source).streams.find(s=>s.codec_type==='video').start_time??0);
run(binaries().ffmpeg,['-v','error','-n','-itsoffset',String(-offset),'-i',source,'-i',path.join(out,'audio/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','38','-avoid_negative_ts','disabled','-movflags','+faststart',joined]);
decode(joined);const p=probe(joined),v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');if(v.width!==1080||v.height!==1920||v.avg_frame_rate!=='30/1'||Number(v.nb_frames)!==1140||Math.abs(Number(p.format.duration)-38)>.01||Math.abs(Number(v.start_time))>1e-6||Math.abs(Number(a.start_time))>1e-6)throw Error('Invalid recovered movie');
const pixels=f=>run(binaries().ffmpeg,['-v','error','-i',f,'-map','0:v:0','-frames:v','720','-pix_fmt','yuv420p','-f','hash','-hash','sha256','-']).trim();const prefix=pixels(path.join(ROOT,'outputs/thinking-anchors/portrait-mechanism-v1/continuity-0-24.mp4'));if(pixels(joined)!==prefix)throw Error('Accepted first 24 seconds changed');
const quality=measureLoudness(joined,binaries().ffmpeg);if(quality.silent||quality.truePeakDb>-1||Math.abs(quality.integratedLufs+18)>3)throw Error('Invalid encoded sound');
writeJson(path.join(out,'continuity-probe.json'),p);writeJson(path.join(out,'continuity-encoded-audio.json'),quality);
const manifest=json(path.join(out,'manifest.json'));manifest.renderAttemptSources=manifest.sources;manifest.sources['render.mjs']=sha(path.join(ROOT,'projects/thinking-anchors/portrait-decision-v1/render.mjs'));manifest.sources['finish-join.mjs']=sha(path.join(ROOT,'projects/thinking-anchors/portrait-decision-v1/finish-join.mjs'));
manifest.status='rendered-and-decoded';manifest.segmentOutput={file:'video.mp4',sha256:sha(path.join(out,'video.mp4')),frames:420,duration:14};manifest.continuityOutput={file:'continuity-0-38.mp4',sha256:sha(joined),frames:1140,duration:38,acceptedOpeningDecodedPixelsUnchanged:true,openingPixelHash:prefix};manifest.encodedAudioQuality=json(path.join(out,'encoded-audio-quality.json'));manifest.joinRecovery='Corrected preview timestamp remux duration from 24 to 38 seconds; new chapter and prior encoded picture preserved';writeJson(path.join(out,'manifest.json'),manifest);
console.log(JSON.stringify({duration:p.format.duration,frames:v.nb_frames,quality,acceptedFirst24SecondsUnchanged:true}));

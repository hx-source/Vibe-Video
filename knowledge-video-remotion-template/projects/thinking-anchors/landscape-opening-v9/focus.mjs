import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries,run,probe,decode} from '../../../scripts/runtime.mjs';
import {waveSlice} from '../../../scripts/pcm.mjs';
const out=path.join(ROOT,'outputs/thinking-anchors/landscape-opening-v9'),m=json(path.join(out,'manifest.json')),ff=binaries().ffmpeg,file='focus-16-20.mp4',wav=path.join(out,'audit/focus-16-20.wav'),movie=path.join(out,file);
fs.writeFileSync(wav,waveSlice(fs.readFileSync(path.join(out,'preview-mix.wav')),16,20));
run(ff,['-v','error','-n','-ss','16','-i',path.join(out,'picture.mp4'),'-i',wav,'-map','0:v:0','-map','1:a:0','-frames:v','120','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','4','-avoid_negative_ts','disabled','-movflags','+faststart',movie]);decode(movie);const p=probe(movie),v=p.streams.find(s=>s.codec_type==='video');if(v.width!==1920||v.height!==1080||Number(v.nb_frames)!==120||v.avg_frame_rate!=='30/1'||Math.abs(Number(p.format.duration)-4)>.001)throw Error('Focus preview invalid');
m.focusVideo=file;m.files.push({file,sha256:sha(movie),durationSeconds:4,frames:120,globalRangeSeconds:[16,20],localReviewReencoded:true});writeJson(path.join(out,'manifest.json'),m);console.log(JSON.stringify({focusVideo:file,globalRangeSeconds:[16,20]}));

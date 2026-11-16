import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
import {ROOT,sha,writeJson} from './files.mjs';
import {browserPath,probe,decode,binaries} from './runtime.mjs';
import {measureLoudness,qualityAssessment} from './audio-quality.mjs';
import {frameAt} from '../src/timeline/compile.mjs';
export async function renderPrepared(prepared,options={}){
  const {data,output,manifest}=prepared;
  const serveUrl=await bundle({entryPoint:path.join(ROOT,'src/index.ts'),publicDir:path.join(ROOT,'public'),outDir:path.join(ROOT,'.cache',`bundle-${data.project.id}-${path.basename(output)}`)});
  const browserExecutable=await browserPath();
  const inputProps={data};
  const composition=await selectComposition({serveUrl,id:'KnowledgeVideo',inputProps,browserExecutable,logLevel:'warn'});
  const common={serveUrl,composition,inputProps,browserExecutable,logLevel:'warn',timeoutInMilliseconds:90000};
  if(options.stills){
    const frames=options.stills.map(s=>frameAt(Number(s),data.timeline.fps)-data.range.from);
    for(const frame of frames){
      if(!Number.isInteger(frame)||frame<0||frame>=data.range.durationInFrames)throw Error('Still time outside selected range');
      await renderStill({...common,frame,output:path.join(output,`frame-${frame+data.range.from}.png`),imageFormat:'png'});
    }
    manifest.status=manifest.videoOutput?'rendered-and-decoded-with-stills':'stills-rendered';manifest.stillFrames=frames.map(f=>f+data.range.from);
  }else{
    const movie=path.join(output,'video.mp4');let last=-1;
    await renderMedia({...common,outputLocation:movie,codec:'h264',crf:18,pixelFormat:'yuv420p',imageFormat:'png',concurrency:Math.max(1,Math.min(4,Number(options.concurrency??2))),audioCodec:'aac',audioBitrate:'192k',overwrite:false,onProgress:({progress})=>{const p=Math.floor(progress*10);if(p!==last){console.log(`渲染 ${Math.min(100,p*10)}%`);last=p;}}});
    decode(movie);const info=probe(movie),stream=info.streams.find(s=>s.codec_type==='video');
    if(!stream||stream.width!==data.project.video.width||stream.height!==data.project.video.height||Number(stream.nb_frames)!==data.range.durationInFrames)throw Error('Encoded video differs from requested dimensions/frame count');
    if(!data.audio.silent&&!info.streams.some(s=>s.codec_type==='audio'))throw Error('Expected audio stream missing');
    manifest.status='rendered-and-decoded';manifest.videoOutput={file:'video.mp4',sha256:sha(movie),frames:Number(stream.nb_frames),duration:Number(stream.duration),width:stream.width,height:stream.height};
    if(!data.audio.silent){manifest.encodedAudioQuality=qualityAssessment(measureLoudness(movie,binaries().ffmpeg),[],manifest.audio[0].quality?.policy);writeJson(path.join(output,'encoded-audio-quality.json'),manifest.encodedAudioQuality);}
    writeJson(path.join(output,'probe.json'),info);
  }
  writeJson(path.join(output,'manifest.json'),manifest);return prepared;
}

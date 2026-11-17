import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {ensureBrowser,RenderInternals} from '@remotion/renderer';
import ffmpegStatic from 'ffmpeg-static';
// Centralized access to the pinned renderer's binaries; tested by doctor and integration checks.
export function binaries(){
  const executable=type=>RenderInternals.getExecutablePath({type,indent:false,logLevel:'error',binariesDirectory:null});
  if(!ffmpegStatic&&!process.env.KNOWLEDGE_VIDEO_FFMPEG)throw Error('Install ffmpeg-static or configure KNOWLEDGE_VIDEO_FFMPEG');
  return {ffmpeg:process.env.KNOWLEDGE_VIDEO_FFMPEG||ffmpegStatic,ffprobe:process.env.KNOWLEDGE_VIDEO_FFPROBE||executable('ffprobe')};
}
export function run(binary,args,options={}){
  const result=spawnSync(binary,args,{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024,...options});
  if(result.status!==0) throw Error(result.error?.message||result.stderr||`${binary} failed (exit ${result.status})`);
  return result.stdout;
}
export async function browserPath(){
  if(process.env.KNOWLEDGE_VIDEO_BROWSER){
    if(!fs.existsSync(process.env.KNOWLEDGE_VIDEO_BROWSER)) throw Error('Configured browser not found');
    return process.env.KNOWLEDGE_VIDEO_BROWSER;
  }
  const browser=await ensureBrowser({logLevel:'info'});
  if(!browser.path) throw Error('Render browser unavailable');
  return browser.path;
}
export function probe(file){return JSON.parse(run(binaries().ffprobe,['-v','error','-show_format','-show_streams','-of','json',file]));}
export function decode(file){run(binaries().ffmpeg,['-v','error','-i',file,'-c:v','rawvideo','-c:a','pcm_s16le','-f','null','-']);}

import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadProject} from './project.mjs';
import {inside,json,sha,writeJson,reserveOutput} from './files.mjs';
import {binaries,run} from './runtime.mjs';
import {analyzeSamples,beatGrid} from './music.mjs';
import {musicReviewHtml} from './music-review.mjs';
import {rhythmFeatures,tonalFeatures} from './music-features.mjs';
import {workflowCommand} from './music-workflow.mjs';
import {projectSnapshot,readLedger} from './music-impact.mjs';
export function musicCommand(command,options){
  if(['snapshot','impact','apply','status','accept','quality','sound','palette'].includes(command))return workflowCommand(command,options);
  const p=loadProject(options.project??'starter-demo',{skipMusic:command!=='check'});
  if(command==='check'){if(!p.musicReport)throw Error('Configure project.files.musicSync first');console.log(JSON.stringify(p.musicReport,null,2));return;}
  const output=reserveOutput(p.id,options.name??`music-${command}-${Date.now()}`);
  if(command==='analyze'||command==='manual'){
    const clip=p.compiledAudio.clips.find(c=>c.role==='music'&&(!options.clip||c.id===options.clip));if(!clip)throw Error('Choose an enabled music clip with --clip');
    const asset=p.used.get(clip.source.slice(6));const bytes=run(binaries().ffmpeg,['-v','error','-i',asset.diskPath,'-t','601','-ar','8000','-ac','1','-f','f32le','pipe:1'],{encoding:null,maxBuffer:601*8000*4+8192});
    if(bytes.length>600*8000*4)throw Error('Music exceeds 600 seconds; register a shorter source');
    const samples=Array.from({length:Math.floor(bytes.length/4)},(_,i)=>bytes.readFloatLE(i*4));
    let detected;
    if(command==='manual'){
      detected={duration:samples.length/8000,bpm:Number(options.bpm),beats:[],beatsPerBar:4,downbeatPhase:0,confidence:null,energy:[],warnings:['Manual constant-tempo grid; verify by listening.'],reviewStatus:'needs-listening'};
      detected.beats=beatGrid(detected,{bpm:detected.bpm,firstBeat:Number(options.first??0)}).beats.map(b=>b.sourceTime);
    }else {detected=analyzeSamples(samples);const features=rhythmFeatures(samples,8000,detected);detected={...detected,...features,tonality:tonalFeatures(samples,8000)};if(options.tracking==='adaptive')detected.beats=features.adaptiveBeats;else if(options.tracking&&options.tracking!=='constant')throw Error('tracking must be constant or adaptive');}
    const analysis={schemaVersion:1,algorithm:command==='manual'?'manual-grid-v1':'local-rhythm-tonality-v2',source:{assetId:asset.id,sha256:sha(asset.diskPath)},...detected};
    writeJson(path.join(output,'music-analysis.json'),analysis);
    console.log(JSON.stringify({output,bpm:analysis.bpm,confidence:analysis.confidence,warnings:analysis.warnings},null,2));return;
  }
  if(command!=='review'||!options.analysis)throw Error('Use music:analyze, music:review --analysis <project-relative-path>, or music:check');
  const analysis=json(inside(p.dir,options.analysis)),overrides=options.overrides?json(inside(p.dir,options.overrides)):{};const grid=beatGrid(analysis,overrides);
  const asset=p.used.get(analysis.source.assetId);if(!asset||sha(asset.diskPath)!==analysis.source.sha256)throw Error('Analysis does not match an enabled music source');
  run(binaries().ffmpeg,['-v','error','-i',asset.diskPath,'-t',String(analysis.duration),'-ar','44100','-ac','2',path.join(output,'music.wav')]);
  fs.writeFileSync(path.join(output,'index.html'),musicReviewHtml(analysis,overrides,p.timeline.fps,{snapshot:projectSnapshot(p),ledger:readLedger(p.dir),grid}));
  writeJson(path.join(output,'music-analysis.json'),analysis);writeJson(path.join(output,'music-grid.json'),grid);
  console.log(`节拍试听：${pathToFileURL(path.join(output,'index.html')).href}`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{const [command,...args]=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){const key=args[i].replace(/^--/,'');if(!args[i].startsWith('--')||!['project','clip','name','analysis','overrides','bpm','first','tracking','proposal','baseline','report','expected','reopen','manifest','segment','state','listened','note','asset','instrument','tags','tag','role','at'].includes(key)||args[i+1]===undefined||key in options)throw Error('Invalid music option');options[key]=args[i+1];}musicCommand(command,options);}catch(e){console.error(e.message);process.exitCode=1;}}

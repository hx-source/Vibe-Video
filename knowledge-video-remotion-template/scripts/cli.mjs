import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {reviewServer} from './review-server.mjs';
import {ROOT,json,reserveOutput,writeJson} from './files.mjs';
import {loadProject,newProject} from './project.mjs';
import {prepare} from './prepare.mjs';
import {renderPrepared} from './render.mjs';
import {browserPath,binaries,run} from './runtime.mjs';
import {requireFullFilmApproval} from './design-workflow.mjs';
import {selectRange} from '../src/timeline/compile.mjs';
const [command,...argv]=process.argv.slice(2),options={};
const allowed=new Set(['project','title','name','from','to','event','before','after','segment','compare','port','times','concurrency','preset']);
let activeOutput;
try{
  for(let i=0;i<argv.length;i+=2){const key=argv[i]?.replace(/^--/,'');if(!argv[i]?.startsWith('--')||!allowed.has(key)||argv[i+1]===undefined||argv[i+1].startsWith('--')||key in options)throw Error(`Invalid option: ${argv[i]}`);options[key]=argv[i+1];}
  const id=options.project??'starter-demo';
  if(options.preset&&command!=='new')throw Error('--preset is a project creation option; existing projects use project.json video');
  if(command==='new'){const p=newProject(id,options.title,options.preset);console.log(`已创建 ${p.dir}`);}
  else if(command==='doctor'){
    const p=loadProject(id);const browser=await browserPath();
    for(const binary of Object.values(binaries()))run(binary,['-version']);
    console.log(JSON.stringify({engine:json(path.join(ROOT,'package.json')).version,node:process.version,project:id,browser,video:p.project.video,frames:p.timeline.durationInFrames,audioWarnings:p.compiledAudio.warnings},null,2));
  }else if(command==='check'){
    const p=loadProject(id);console.log(JSON.stringify({project:id,segments:p.timeline.segments.length,frames:p.timeline.durationInFrames,captions:p.timeline.captions.length,usedAssets:p.used.size,audioWarnings:p.compiledAudio.warnings,music:p.musicReport,visualReview:'not-performed',audioReview:'not-performed'},null,2));
  }else if(['prepare','audio','render','stills','preview','review'].includes(command)){
    const p=loadProject(id),name=options.name??`${command}-${Date.now()}`;
    if(command==='render')requireFullFilmApproval(p,selectRange(p.timeline,options));
    const output=reserveOutput(id,name);activeOutput=output;
    const ready=prepare(p,output,options);
    if(command==='render'||command==='stills')await renderPrepared(ready,{...options,stills:command==='stills'?(options.times??'1,5,9').split(','):undefined});
    console.log(`输出：${output}`);
    const port=Number(options.port??(command==='preview'?8737:8738));
    if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
    if(command==='preview'){
      const cli=path.join(ROOT,'node_modules/@remotion/cli/remotion-cli.js');
      const child=spawn(process.execPath,[cli,'studio','src/index.ts',`--props=${path.join(output,'input-props.json')}`,`--port=${port}`,'--no-open'],{cwd:ROOT,stdio:'inherit',windowsHide:true});
      child.on('error',e=>{console.error(e);process.exitCode=1;});child.on('exit',code=>{process.exitCode=code??1;});
      process.once('SIGINT',()=>child.kill());
    }
    if(command==='review'){
      const server=await reviewServer(port);
      console.log(`审片：http://127.0.0.1:${port}${ready.reviewUrl}`);
      process.once('SIGINT',async()=>{await server.close();process.exit(0);});
    }
  }else throw Error('Commands: new, doctor, check, prepare, audio, preview, review, stills, render');
}catch(error){if(activeOutput)writeJson(path.join(activeOutput,'failure.json'),{status:'failed',command,error:error.message});console.error(error.stack??error.message);process.exitCode=1;}

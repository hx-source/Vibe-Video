import fs from 'node:fs';
import path from 'node:path';
import {ROOT,inside,json} from './files.mjs';
import {loadProject} from './project.mjs';
import {probe} from './runtime.mjs';
import {initializeProduction,loadProduction,productionStatus,syncProductionViews,sourceReferences,productionPaths,createProductionRevision,registerProductionArtifacts,activateProductionRevision,recordProductionApproval,recordProductionDelivery,recordProductionSnapshot} from './production-state.mjs';
import {buildProductionSnapshot} from './production-snapshot.mjs';
import {renderProductionRevision,checkProductionRevision} from './production-render.mjs';
import {importCurrentProduction} from './production-import.mjs';
import {createProductionReview,serveProductionReview} from './production-review.mjs';
const [command,...args]=process.argv.slice(2),options={},allowed={init:['seed'], 'import-current':['feedback'],status:[],sync:[],revise:['proposal'],snapshot:['revision','config'],render:['revision','name','from','to','register'],check:['revision'],register:['revision','proposal'],activate:['revision'],accept:['revision','proposal'],deliver:['revision','proposal'],review:['before','after','from','to','context','name','serve','port']};
const inspectMedia=file=>{const p=probe(file),v=p.streams.find(s=>s.codec_type==='video');return {duration:Number(p.format.duration),...(v?{width:v.width,height:v.height,fps:Number(v.avg_frame_rate.split('/')[0])/Number(v.avg_frame_rate.split('/')[1])}:{})};};
try{
 if(!Object.hasOwn(allowed,command))throw Error('Commands: '+Object.keys(allowed).join(', '));for(let i=0;i<args.length;i+=2){const key=args[i]?.slice(2);if(!args[i]?.startsWith('--')||!['project',...allowed[command]].includes(key)||!args[i+1]||args[i+1].startsWith('--')||Object.hasOwn(options,key))throw Error('Invalid option: '+args[i]);options[key]=args[i+1];}const projectId=options.project;if(!projectId)throw Error('--project required');const projectPaths=productionPaths(projectId),input=key=>{if(!options[key])throw Error('--'+key+' required');return json(inside(projectPaths.dir,options[key]));};let result;
 if(command==='review'){if(options.serve!==undefined&&!['true','false'].includes(options.serve))throw Error('--serve must be true or false');if(options.port!==undefined&&(options.serve!=='true'||!Number.isInteger(Number(options.port))||Number(options.port)<0||Number(options.port)>65535))throw Error('Valid --port requires --serve true');}
 if(command==='init'){let seed;if(options.seed)seed=input('seed');else{const p=loadProject(projectId),files=Object.fromEntries(Object.entries(p.project.files).filter(([,f])=>typeof f==='string'&&fs.statSync(inside(p.dir,f)).isFile()).map(([k,f])=>[k,`projects/${projectId}/${f}`]));seed={schemaVersion:1,projectId,generation:0,specification:p.project.video,durationSeconds:p.timeline.durationSeconds,currentRevision:'initial',segments:p.timeline.segments.map(s=>({id:s.id,rangeSeconds:[s.startFrame/p.timeline.fps,s.endFrame/p.timeline.fps]})),revisions:{initial:{id:'initial',parent:null,status:'draft',rangeSeconds:[0,p.timeline.durationSeconds],sources:sourceReferences(files),artifacts:{},audioTracks:{},approvals:[]}},reviews:[]};}result=initializeProduction(projectId,seed);}
 else if(command==='import-current')result=importCurrentProduction(projectId,{inspectMedia,feedback:options.feedback});
 else if(command==='status')result=productionStatus(projectId);
 else if(command==='sync')result=syncProductionViews(projectId);
 else if(command==='revise')result=createProductionRevision(projectId,input('proposal'));
 else if(command==='snapshot'){const {state}=loadProduction(projectId),revision=state.revisions[options.revision];if(!revision)throw Error('Revision not found');const reference=await buildProductionSnapshot(projectId,revision,input('config'),{specification:state.specification,durationSeconds:state.durationSeconds,configFile:`projects/${projectId}/${options.config}`});result=recordProductionSnapshot(projectId,revision.id,reference);}
 else if(command==='render'){if(options.register!==undefined&&!['true','false'].includes(options.register))throw Error('--register must be true or false');result=await renderProductionRevision(projectId,options.revision,{name:options.name,from:options.from===undefined?undefined:Number(options.from),to:options.to===undefined?undefined:Number(options.to),register:options.register!=='false'});}
 else if(command==='check')result=await checkProductionRevision(projectId,options.revision);
 else if(command==='register')result=registerProductionArtifacts(projectId,options.revision,input('proposal'),{inspectMedia});
 else if(command==='activate')result=activateProductionRevision(projectId,options.revision);
 else if(command==='accept')result=recordProductionApproval(projectId,options.revision,input('proposal'));
 else if(command==='deliver')result=recordProductionDelivery(projectId,options.revision,input('proposal'));
 else if(command==='review'){const reviewOptions={...options};for(const key of ['from','to','context'])if(options[key]!==undefined)reviewOptions[key]=Number(options[key]);const ready=createProductionReview(projectId,reviewOptions);result={review:ready.file,rangeSeconds:ready.data.rangeSeconds,before:ready.data.before.id,after:ready.data.after.id};if(options.serve!==undefined&&!['true','false'].includes(options.serve))throw Error('--serve must be true or false');if(options.serve==='true'){const port=options.port===undefined?8740:Number(options.port);if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');const server=await serveProductionReview(ready.data,{port});result.url=server.url;process.once('SIGINT',async()=>{await server.close();process.exit(0);});}}
 console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error.stack??error.message);process.exitCode=1;}

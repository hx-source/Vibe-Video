import fs from 'node:fs';
import path from 'node:path';
import {build,version as esbuildVersion} from 'esbuild';
import {ROOT,inside,json,sha,writeJson} from './files.mjs';

const rel=(root,file)=>path.relative(root,file).split(path.sep).join('/');
export function pointer(value,key){
 if(typeof key!=='string'||!key.startsWith('/'))throw Error('Expected JSON pointer');
 for(const part of key.slice(1).split('/')){if(/~(?:[^01]|$)/.test(part))throw Error('Invalid JSON pointer');const k=part.replaceAll('~1','/').replaceAll('~0','~');if(['__proto__','constructor','prototype'].includes(k)||!value||!Object.hasOwn(value,k))throw Error('JSON pointer not found');value=value[k];}return value;
}
export function snapshotHealth(reference,{root=ROOT,live=true}={}){
 const corrupt=[],changed=[];let manifest;
 try{const file=inside(root,reference.file);if(sha(file)!==reference.sha256)throw Error('manifest changed');manifest=json(file);
  for(const ref of [...manifest.dependencies,...Object.values(manifest.built)]){try{if(sha(inside(root,ref.blob))!==ref.sha256)throw Error();}catch{corrupt.push(ref.blob);}}
  if(live)for(const ref of manifest.dependencies){try{if(sha(inside(root,ref.file))!==ref.sha256)changed.push(ref.file);}catch{changed.push(ref.file);}}
 }catch(error){corrupt.push(reference.file+': '+error.message);}
 return {corrupt:[...new Set(corrupt)],changed:[...new Set(changed)],manifest};
}
// Freeze both input bytes and executable bundles. Historical previews need no live TSX imports.
export async function buildProductionSnapshot(projectId,revision,config,{root=ROOT,specification,durationSeconds,configFile}={}){
 if(!/^[a-z0-9][a-z0-9-]*$/.test(projectId)||!revision?.id||!specification||!durationSeconds)throw Error('Snapshot context required');
 if(config.schemaVersion!==1||config.type!=='browser-entry'||!/^[$A-Z_a-z][$\w]*$/.test(config.renderFunction))throw Error('Unsupported renderer config');
 const entry=inside(root,config.entry),dependencies=new Map(),store=`projects/${projectId}/production-snapshots/blobs`;
 fs.mkdirSync(inside(root,store),{recursive:true});
 function blob(bytes,ext){const scratch=inside(root,`${store}/write-${process.pid}${ext}`);fs.writeFileSync(scratch,bytes);const hash=sha(scratch),file=`${store}/${hash}${ext}`,target=inside(root,file);try{if(fs.existsSync(target)){if(sha(target)!==hash)throw Error('Existing snapshot blob corrupt');}else fs.copyFileSync(scratch,target,fs.constants.COPYFILE_EXCL);}finally{fs.unlinkSync(scratch);}return {blob:file,sha256:hash};}
 function capture(file){const absolute=inside(root,rel(root,file)),name=rel(root,absolute);if(!dependencies.has(name))dependencies.set(name,{file:name,...blob(fs.readFileSync(absolute),path.extname(name)||'.bin')});return dependencies.get(name);}
 if(configFile)capture(inside(root,configFile));
 const tsconfigFile=inside(root,'tsconfig.json'),tsconfig=fs.existsSync(tsconfigFile)?tsconfigFile:undefined;
 if(tsconfig)capture(tsconfig);
 const overrides=new Map();for(const [key,origin] of Object.entries(revision.sourceOrigins??{})){const ref=revision.sources[key];if(ref&&origin!==ref.file)overrides.set(inside(root,origin),inside(root,ref.file));}
 const plugin={name:'production-json-parameters',setup(b){b.onLoad({filter:/\.json$/},args=>{const replacement=overrides.get(args.path);if(replacement){capture(replacement);return {contents:fs.readFileSync(replacement,'utf8'),loader:'json'};}});}};
 const picture=await build({absWorkingDir:root,entryPoints:[entry],tsconfig,bundle:true,write:false,metafile:true,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'},plugins:[plugin]});
 for(const name of Object.keys(picture.metafile.inputs))capture(path.resolve(root,name));
 let css='body{margin:0;background:#fff8e9}';
 if(config.fonts!==false)for(const weight of [400,700]){const file=inside(root,`node_modules/@fontsource/noto-sans-sc/${weight}.css`);capture(file);css+=fs.readFileSync(file,'utf8').replace(/url\(\.\/([^)]*)\)/g,(_,f)=>{const font=path.join(path.dirname(file),f);capture(font);return `url(data:font/woff2;base64,${fs.readFileSync(font).toString('base64')})`;});}
 for(const ref of Object.values(revision.sources)){if(sha(inside(root,ref.file))!==ref.sha256)throw Error('Source changed: '+ref.file);capture(inside(root,ref.file));}
 for(const name of ['package.json','package-lock.json'])if(fs.existsSync(inside(root,name)))capture(inside(root,name));
 const built={picture:blob(picture.outputFiles[0].contents,'.js'),css:blob(Buffer.from(css),'.css')};let audio=null;
 if(config.audio){
  const a=config.audio,source=revision.sources[a.planSourceKey];if(!source)throw Error('Audio plan source key missing');const plan=structuredClone(json(inside(root,source.file))),assets=new Map();
  for(const indexFile of a.assetIndexes??[]){capture(inside(root,indexFile));const index=json(inside(root,indexFile));if(!Array.isArray(index.items))throw Error('Asset index items required');for(const asset of index.items){const file=rel(root,inside(path.dirname(inside(root,indexFile)),asset.path));if(assets.has(asset.id)&&assets.get(asset.id)!==file)throw Error('Conflicting asset id: '+asset.id);assets.set(asset.id,file);}}
  for(const clip of plan.clips??[]){if(clip.enabled===false||clip.role==='process'&&clip.enabled!==true)continue;const file=clip.source.startsWith('asset:')?assets.get(clip.source.slice(6)):clip.source;if(!file)throw Error('Unknown audio asset: '+clip.source);clip.source=path.basename(capture(inside(root,file)).blob);}
  const events={};for(const item of a.eventSources??[]){const file=item.sourceKey?revision.sources[item.sourceKey]?.file:item.file;if(!file)throw Error('Event source missing');capture(inside(root,file));const data=json(inside(root,file)),values=pointer(data,item.pointer??'/events');for(const [name,value] of Object.entries(values)){const key=(item.prefix??'')+name;if(Object.hasOwn(events,key))throw Error('Duplicate event '+key);events[key]=value+(item.offset??0);}}
  for(const [name,binding] of Object.entries(a.eventValues??{})){const ref=revision.sources[binding.sourceKey];if(!ref)throw Error('Event parameter missing');events[name]=pointer(json(inside(root,ref.file)),binding.pointer)+(binding.offset??0);}
  if(Object.values(events).some(n=>!Number.isFinite(n)))throw Error('Event time must be finite');
  const engine=await build({absWorkingDir:root,entryPoints:[inside(root,'scripts/arrange-audio.mjs')],bundle:true,write:false,metafile:true,format:'esm',platform:'node'});
  for(const name of Object.keys(engine.metafile.inputs))capture(path.resolve(root,name));built.audioEngine=blob(engine.outputFiles[0].contents,'.mjs');audio={plan,events,assetDirectory:store};
 }
 const manifest={schemaVersion:1,projectId,revision:revision.id,createdAt:new Date().toISOString(),specification,durationSeconds,renderer:{type:config.type,renderFunction:config.renderFunction},dependencies:[...dependencies.values()].sort((a,b)=>a.file.localeCompare(b.file)),built,audio,toolchain:{node:process.version,esbuild:esbuildVersion},config};
 const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n'),ref=blob(bytes,'.json');return {file:ref.blob,sha256:ref.sha256,dependencyCount:manifest.dependencies.length};
}

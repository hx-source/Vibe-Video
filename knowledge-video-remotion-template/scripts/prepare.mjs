import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,engineSources} from './files.mjs';
import {loadProject} from './project.mjs';
import {selectRange,captionsSrt} from '../src/timeline/compile.mjs';
import {buildArrangement} from './arrange-audio.mjs';
import {binaries} from './runtime.mjs';
import {waveSlice} from './pcm.mjs';
import {projectSnapshot,segmentFingerprints,readLedger,reviewStates} from './music-impact.mjs';
import {createHash} from 'node:crypto';
import {designFingerprint} from './design-plan.mjs';

export function prepare(project,output,options={}){
  const range=selectRange(project.timeline,options),revision=options.publicRevision??path.basename(output);
  if(!/^[a-z0-9][a-z0-9-]*$/.test(revision))throw Error('Invalid prepared revision');
  const publicBase=`prepared/${project.id}/${revision}`;
  const publicDir=path.join(ROOT,'public',publicBase);
  if(fs.existsSync(publicDir)) throw Error('Prepared revision already exists; choose another --name');
  fs.mkdirSync(publicDir,{recursive:true});
  const variants=[['A',project]];
  if(options.compare) variants.push(['B',loadProject(project.id,{audioPlan:options.compare})]);
  const audioVariants=[],reports=[],sourceAssets=[],assets={};
  for(const [variant,p] of variants){
    const assetMap=new Map();
    for(const [id,a] of p.used){
      const ext=path.extname(a.diskPath).toLowerCase();
      const filename=`${id}-${sha(a.diskPath).slice(0,12)}${ext}`;
      fs.copyFileSync(a.diskPath,path.join(publicDir,filename));
      assetMap.set(id,filename);assets[id]=`${publicBase}/${filename}`;
      sourceAssets.push({variant,id,path:a.path,type:a.type,source:a.source,license:a.license,sha256:sha(a.diskPath)});
    }
    const audioPlan=structuredClone(p.audioPlan);
    // Disabled candidates remain untouched and need not resolve to an existing asset.
    for(const clip of audioPlan.clips??[]){if(assetMap.has(clip.source?.slice(6)))clip.source=assetMap.get(clip.source.slice(6));}
    const dir=path.join(output,variant);fs.mkdirSync(dir,{recursive:true});
    const report=buildArrangement({dir:publicDir,config:p.config,audioPlan},binaries().ffmpeg,{directory:dir,stems:true,quality:true});
    const silent=report.plan.clips.length+report.plan.cues.length===0;
    const tracks={},clipAudio={};
    for(const [role,name] of Object.entries({mix:'mix.wav',...report.stems})){
      const filename=`${variant}-${name}`;
      fs.writeFileSync(path.join(output,filename),waveSlice(fs.readFileSync(path.join(dir,name)),range.from/project.timeline.fps,range.to/project.timeline.fps));
      clipAudio[role]=filename;
    }
    if(!silent){
      for(const [role,name] of Object.entries({mix:'mix.wav',...report.stems})){
        const filename=`${variant}-${name}`;fs.copyFileSync(path.join(dir,name),path.join(publicDir,filename));tracks[role]=`${publicBase}/${filename}`;
      }
    }
    audioVariants.push({id:variant,tracks});reports.push({variant,silent,peakDb:report.peakDb,rmsDb:report.rmsDb,quality:report.quality,warnings:report.warnings,reviewStatus:silent?'no-audio':'needs-listening',mixSha256:report.mixSha256,clipAudio,configuration:p.sources});
  }
  const data={project:project.project,timeline:project.timeline,theme:project.theme,visual:project.visual,assets,audio:{silent:reports.every(r=>r.silent),variants:audioVariants},range};
  writeJson(path.join(output,'input-props.json'),{data});
  if(project.musicReport)writeJson(path.join(output,'music-check.json'),project.musicReport);
  writeJson(path.join(publicDir,'review.json'),data);
  fs.writeFileSync(path.join(output,'captions.srt'),captionsSrt(project.timeline,range));
  const snapshot=projectSnapshot(project);writeJson(path.join(output,'music-snapshot.json'),snapshot);
  const mixedBytes=fs.readFileSync(path.join(output,'A/mix.wav'));
  const segmentSnapshots=segmentFingerprints(snapshot).map(s=>({...s,renderedAudioSha256:createHash('sha256').update(waveSlice(mixedBytes,s.from,s.to)).digest('hex')}));
  writeJson(path.join(output,'segment-status.json'),reviewStates(snapshot,readLedger(project.dir)));
  const manifest={engineVersion:json(path.join(ROOT,'package.json')).version,createdAt:new Date().toISOString(),project:project.id,range,video:project.project.video,segmentSnapshots,configuration:project.sources,theme:{id:project.theme.id,sha256:sha(path.join(ROOT,'src/themes',`${project.theme.id}.json`))},engineSources:engineSources(),dependenciesSha256:sha(path.join(ROOT,'package-lock.json')),assets:sourceAssets,audio:reports,manualReview:{visuals:'not-reviewed',audio:data.audio.silent?'no-audio':'needs-listening'},status:'prepared'};
  if(project.production)manifest.design={fingerprint:designFingerprint(project),selectedId:project.visual?.id??null,representative:project.production.representative,kind:options.designKind??'render'};
  writeJson(path.join(output,'manifest.json'),manifest);
  return {data,output,manifest,reviewUrl:`/src/review/index.html?data=/${publicBase}/review.json`};
}

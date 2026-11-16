import fs from 'node:fs';
import path from 'node:path';
import {fingerprint,beatGrid,applyMusicTiming,checkMusicSync} from './music.mjs';
import {compileTimeline,resolveTime} from '../src/timeline/compile.mjs';
import {compileAudioPlan} from '../src/audio/plan.mjs';
import {eventTime} from '../src/audio/content.mjs';
import {inside,json,sha,writeJson} from './files.mjs';
import {validateScene} from './project.mjs';

export function projectSnapshot(p){
  const files=p.project.files,read=k=>json(inside(p.dir,files[k]));
  const sync=files.musicSync&&fs.existsSync(inside(p.dir,files.musicSync))?read('musicSync'):null;
  const assets=Object.fromEntries([...p.assets.values()].filter(a=>fs.existsSync(a.diskPath)).map(a=>[a.id,{type:a.type,sha256:sha(a.diskPath),sound:a.sound??null}]));
  return {schemaVersion:1,project:p.project,storyboard:read('storyboard'),captions:read('captions'),audioPlan:p.audioPlan,sync,analysis:sync?json(inside(p.dir,sync.analysis)):null,overrides:sync?.overrides?json(inside(p.dir,sync.overrides)):{},assets,theme:p.theme,visual:p.visual??null,sceneSources:p.sceneSources??{}};
}
export function proposeSnapshot(snapshot,proposal){
  if(!proposal||typeof proposal!=='object'||Array.isArray(proposal))throw Error('Invalid proposal');
  const allowed=['overrides','analysis','music','actions','storyboard','captions','audioPlan'];for(const key of Object.keys(proposal))if(!allowed.includes(key))throw Error(`Unknown proposal key: ${key}`);
  const next=structuredClone(snapshot);
  for(const key of ['analysis','storyboard','captions','audioPlan'])if(proposal[key]!==undefined)next[key]=proposal[key];
  if(proposal.overrides)next.overrides={...next.overrides,...proposal.overrides,reviewStatus:proposal.overrides.reviewStatus??'needs-listening'};
  if(proposal.music){if(!next.sync)throw Error('Configure musicSync first');next.sync.music={...next.sync.music,...proposal.music};const clip=next.audioPlan.clips.find(c=>c.id===next.sync.music.clipId);if(!clip)throw Error('Missing proposed music clip');for(const key of ['sourceIn','sourceOut','at','speed'])clip[key]=next.sync.music[key];}
  if(proposal.actions){if(!next.sync)throw Error('Configure musicSync first');next.sync.actions=proposal.actions;}
  return next;
}
export function resolveSnapshot(snapshot){
  const {project,captions,audioPlan}=snapshot;let board=snapshot.storyboard,grid=null,sync=snapshot.sync;
  if(sync){grid=beatGrid(snapshot.analysis,snapshot.overrides);sync=structuredClone(sync);for(const a of sync.actions)a.revision=grid.revision;board=applyMusicTiming(board,sync,grid,project.video.fps);}
  const timeline=compileTimeline(project,board,captions),config={video:{...project.video,duration:timeline.durationInFrames/timeline.fps},timeline:{events:timeline.events}};
  const audio=compileAudioPlan(audioPlan,config);const musicReport=sync?checkMusicSync(sync,timeline,audio,grid):null;
  for(const segment of timeline.segments){validateScene(segment);if(segment.props.imageAsset){const asset=snapshot.assets[segment.props.imageAsset];if(!asset?.sha256||(asset.type&&asset.type!=='image'))throw Error(`Missing image asset: ${segment.props.imageAsset}`);}}
  for(const clip of audio.clips){if(!clip.source.startsWith('asset:'))throw Error('Audio source must be asset:<id>');const asset=snapshot.assets[clip.source.slice(6)];if(!asset?.sha256||(asset.type&&asset.type!=='audio'))throw Error(`Missing audio asset: ${clip.source}`);if(asset.sound?.durationSeconds!==undefined&&clip.sourceOut>asset.sound.durationSeconds+(clip.maxTailPadding??0)+1e-7)throw Error(`Sound range exceeds registered duration: ${clip.id}`);}
  if(musicReport?.issues.length)throw Error(JSON.stringify(musicReport.issues));
  if(sync){const clip=audio.clips.find(c=>c.id===sync.music.clipId),assetId=clip.source.slice(6);if(snapshot.analysis.source.sha256!==snapshot.assets[assetId]?.sha256)throw Error('Analysis source does not match selected music asset');if(clip.sourceOut>snapshot.analysis.duration+1e-7)throw Error('Music range exceeds analyzed source duration');}
  return {timeline,audio,grid,sync};
}
export function segmentFingerprints(snapshot,resolved=resolveSnapshot(snapshot)){
  const {timeline,audio}=resolved;
  return timeline.segments.map(segment=>{
    const from=segment.startSeconds,to=from+segment.durationSeconds;
    const clips=audio.clips.filter(c=>c.at<to&&c.at+c.duration>from).map(c=>{
      const a=Math.max(c.at,from),b=Math.min(c.at+c.duration,to),{id,role,source,speed,gain,fadeIn,fadeOut,envelope}=c;
      return {id,role,source,at:a-from,sourceIn:c.sourceIn+(a-c.at)*speed,sourceOut:c.sourceIn+(b-c.at)*speed,speed,gain,fadeIn:Math.max(0,fadeIn-(a-c.at)),fadeOut:Math.max(0,fadeOut-(c.at+c.duration-b)),envelope:envelope?.length?envelope:[],asset:snapshot.assets[source.slice(6)]?.sha256};
    });
    const cues=audio.cues.filter(c=>c.at<to&&c.at+c.duration>from).map(c=>({...c,at:c.at-from}));
    const ducks=audio.ducking?.filter(d=>d.at-d.attack<to&&d.at+d.hold+d.release>from);
    const caps=timeline.captions.filter(c=>c.startFrame<segment.endFrame&&c.endFrame>segment.startFrame);
    const evidence={video:snapshot.project.video,title:snapshot.project.title,segment,captions:caps,clips,cues,ducking:ducks??[],buses:audio.buses,masterGain:audio.masterGain,theme:snapshot.theme,visual:snapshot.visual??null,sceneSources:snapshot.sceneSources,image:segment.props.imageAsset?snapshot.assets[segment.props.imageAsset]?.sha256:null};
    return {id:segment.id,from,to,fingerprint:fingerprint(evidence)};
  });
}
function looseTimes(snapshot){
  // Collect even invalid proposed caption/effect times to make the failure actionable.
  let board=structuredClone(snapshot.storyboard),start=0;const events={};
  let grid;try{grid=snapshot.sync?beatGrid(snapshot.analysis,snapshot.overrides):null;}catch{}
  for(const s of board.segments){for(const [key,value] of Object.entries(s.events))events[s.id+'.'+key]=start+value;start+=s.durationSeconds;}
  const problems=[];if(grid)for(const a of snapshot.sync.actions){const b=grid.beats[a.beat],m=snapshot.sync.music;if(!b){problems.push({event:a.event,code:'missing-beat'});continue;}events[a.event]=Math.round((m.at+(b.sourceTime-m.sourceIn)/m.speed)*snapshot.project.video.fps)/snapshot.project.video.fps;}
  const captions=[];start=0;for(const s of board.segments){const local=Object.fromEntries(Object.keys(s.events).map(k=>[k,events[s.id+'.'+k]-start]));for(const c of snapshot.captions.items.filter(c=>c.segmentId===s.id)){try{const from=resolveTime(c.start,local)+start,to=resolveTime(c.end,local)+start;captions.push({id:c.id,segment:s.id,text:c.text,from,to,duration:to-from});if(to<=from||from<start||to>start+s.durationSeconds)problems.push({caption:c.id,code:'caption-outside-segment'});}catch(e){problems.push({caption:c.id,error:e.message});}}start+=s.durationSeconds;}
  const effects=[];for(const c of [...snapshot.audioPlan.clips??[],...snapshot.audioPlan.cues??[]])if(c.role!=='music'&&c.enabled!==false&&(c.role!=='process'||c.enabled===true)){try{const at=eventTime(c.at,{timeline:{events}}),duration=c.duration??(c.sourceOut-c.sourceIn)/(c.speed??1);effects.push({...c,at,duration});if(at<0||at+duration>start)problems.push({sound:c.id,code:'effect-outside-film'});}catch(e){problems.push({sound:c.id,error:e.message});}}
  return {events,captions,effects,problems};
}
export function impactReport(before,after,ledger={records:[]}){
  const old=looseTimes(before),next=looseTimes(after),events=[];
  for(const name of new Set([...Object.keys(old.events),...Object.keys(next.events)]))if(old.events[name]!==next.events[name])events.push({event:name,segment:name.split('.')[0],before:old.events[name]??null,after:next.events[name]??null,delta:old.events[name]!==undefined&&next.events[name]!==undefined?next.events[name]-old.events[name]:null});
  const captions=next.captions.flatMap(c=>{const b=old.captions.find(x=>x.id===c.id);return !b||b.from!==c.from||b.to!==c.to||b.text!==c.text?[{...c,before:b??null,readingRisk:c.duration<Math.max(1,c.text.length/8)}]:[];});
  for(const c of old.captions)if(!next.captions.some(x=>x.id===c.id))captions.push({...c,removed:true,before:c});
  const effects=next.effects.flatMap(c=>{const b=old.effects.find(x=>x.id===c.id);return !b||fingerprint(b)!==fingerprint(c)?[{...c,before:b??null}]:[];});
  for(const c of old.effects)if(!next.effects.some(x=>x.id===c.id))effects.push({...c,removed:true,before:c});
  let segments=[],validationError=null;
  try{const a=segmentFingerprints(before),b=segmentFingerprints(after);segments=b.map(s=>{const old=a.find(x=>x.id===s.id);const records=(ledger.records??[]).filter(r=>r.segmentId===s.id);const record=records.at(-1);return {...s,beforeFingerprint:old?.fingerprint??null,changed:s.fingerprint!==old?.fingerprint,reviewState:record?(record.fingerprint===old?.fingerprint&&!record.reopened?record.state:'needs-review'):'pending',requiresReopen:record?.state==='approved'&&s.fingerprint!==record.fingerprint};});for(const s of a)if(!b.some(x=>x.id===s.id))segments.push({...s,changed:true,removed:true,requiresReopen:(ledger.records??[]).filter(r=>r.segmentId===s.id).at(-1)?.state==='approved'});}catch(e){validationError=e.message;}
  return {schemaVersion:1,baselineFingerprint:fingerprint(before),candidateFingerprint:fingerprint(after),events,captions,effects,segments,problems:next.problems,validationError,canApply:!validationError&&!next.problems.length,reviewStatus:'requires-review'};
}
export function readLedger(dir){const file=inside(dir,'segment-reviews.json');return fs.existsSync(file)?json(file):{schemaVersion:1,records:[]};}
export function recordSegmentReview(dir,manifest,segmentId,state,listened,note=''){
  if(!['pending','needs-changes','approved'].includes(state))throw Error('Invalid review state');
  if(state==='approved'&&listened!==true)throw Error('Approval requires an explicit actual-listening record');
  const segment=manifest.segmentSnapshots?.find(s=>s.id===segmentId);if(!segment)throw Error('Manifest has no matching segment snapshot');
  const ledger=readLedger(dir);ledger.records.push({segmentId,state,listened:listened===true,note,fingerprint:segment.fingerprint,renderedAudioSha256:segment.renderedAudioSha256??null,configuration:manifest.configuration,createdAt:new Date().toISOString()});writeJson(inside(dir,'segment-reviews.json'),ledger);return ledger.records.at(-1);
}
export function reviewStates(snapshot,ledger){return segmentFingerprints(snapshot).map(s=>{const last=(ledger.records??[]).filter(r=>r.segmentId===s.id).at(-1);return {...s,state:last?(last.fingerprint===s.fingerprint&&!last.reopened?last.state:'needs-review'):'pending',previousState:last?.state??null};});}

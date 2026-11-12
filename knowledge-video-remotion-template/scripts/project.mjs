import fs from 'node:fs';
import path from 'node:path';
import {ROOT, json, inside, sha, writeJson} from './files.mjs';
import {compileTimeline, identifier} from '../src/timeline/compile.mjs';
import {compileAudioPlan} from '../src/audio/plan.mjs';

export function loadProject(id, {audioPlan: alternative} = {}) {
  if (!identifier(id)) throw Error('Invalid project id');
  const dir = inside(ROOT,`projects/${id}`), project = json(inside(dir,'project.json'));
  if (project.id !== id) throw Error('Project folder and id disagree');
  const files = project.files;
  for (const key of ['storyboard','captions','audioPlan','facts','review','assets']) {
    if (!fs.statSync(inside(dir,files[key])).isFile()) throw Error(`Missing ${key}`);
  }
  const board = json(inside(dir,files.storyboard)), captions = json(inside(dir,files.captions));
  const timeline = compileTimeline(project,board,captions);
  if (!identifier(project.themeId)) throw Error('Invalid theme id');
  const theme = json(inside(ROOT,`src/themes/${project.themeId}.json`));
  for (const key of ['background','text','muted','primary','accent','panel','line','success']) if (!/^#[0-9a-f]{6}$/i.test(theme.colors[key])) throw Error(`Invalid theme color: ${key}`);
  for (const segment of timeline.segments) validateScene(segment);
  const assetIndex = json(inside(dir,files.assets)), shared = json(path.join(ROOT,'assets/index.json'));
  const assets = new Map();
  for (const [index, base] of [[shared,path.join(ROOT,'assets')],[assetIndex,path.join(dir,'assets')]]) {
    if (index.schemaVersion !== 1 || !Array.isArray(index.items)) throw Error('Invalid assets index');
    for (const a of index.items) {
      if (!identifier(a.id) || assets.has(a.id) || !a.source || !a.license || !['audio','image'].includes(a.type)) throw Error(`Invalid asset metadata: ${a.id}`);
      assets.set(a.id,{...a, diskPath:inside(base,a.path)});
    }
  }
  const audioPlan = json(inside(dir,alternative ?? files.audioPlan));
  if (audioPlan.schemaVersion !== 2) throw Error('Use audio schema 2');
  const config = {video:{...project.video,duration:timeline.durationInFrames/timeline.fps}, timeline:{events:timeline.events}, audio:{mix:'unused.wav'}};
  const compiledAudio = compileAudioPlan(audioPlan,config);
  const used = new Map();
  function useAsset(id, expected) {
    const a = assets.get(id); if (!a || a.type !== expected) throw Error(`Missing ${expected} asset: ${id}`);
    if (!fs.existsSync(a.diskPath)) throw Error(`Missing asset file: ${a.path}`);
    used.set(id,a);
  }
  for (const c of compiledAudio.clips) {
    if (!c.source.startsWith('asset:')) throw Error('Audio source must be asset:<id>');
    useAsset(c.source.slice(6),'audio');
  }
  for (const s of timeline.segments) if (s.props.imageAsset) useAsset(s.props.imageAsset,'image');
  const sources = Object.fromEntries(Object.entries(files).map(([key,relative])=>[key,{path:relative,sha256:sha(inside(dir,relative))}]));
  sources.project={path:'project.json',sha256:sha(path.join(dir,'project.json'))};
  if (alternative) sources.audioPlan = {path:alternative,sha256:sha(inside(dir,alternative))};
  return {id,dir,project,timeline,theme,config,audioPlan,compiledAudio,used,sources};
}
function validateScene(s) {
  const p=s.props;
  if (!p || typeof p.title !== 'string' || !p.title.trim()) throw Error(`Scene title required: ${s.id}`);
  if (!['cards','sequence','cycle'].includes(s.sceneType)) throw Error(`Unknown sceneType: ${s.sceneType}`);
  if (s.sceneType==='cards') {
    if (!Array.isArray(p.cards) || p.cards.length<1 || p.cards.length>3) throw Error('Cards scene requires 1–3 cards');
    for(const c of p.cards) if(typeof c.title!=='string'||typeof c.body!=='string'||!Number.isFinite(s.events[c.event])) throw Error(`Invalid card in ${s.id}`);
  }
  if(s.sceneType==='sequence') {
    if(!Array.isArray(p.nodes)||p.nodes.length!==2||p.nodes.some(n=>!identifier(n.id)||typeof n.label!=='string')||p.nodes[0].id===p.nodes[1].id) throw Error('Sequence needs two distinct nodes');
    if(!Array.isArray(p.messages)||p.messages.length>5) throw Error('Sequence supports up to five messages');
    const ids=new Set();
    for(const m of p.messages){
      if(!identifier(m.id)||ids.has(m.id)||!p.nodes.some(n=>n.id===m.from)||typeof m.label!=='string'||typeof m.detail!=='string') throw Error('Invalid message'); ids.add(m.id);
      const start=s.events[m.startEvent],end=s.events[m.endEvent];
      if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start) throw Error(`Invalid message event: ${m.id}`);
    }
  }
  if(s.sceneType==='cycle') {
    if(!Array.isArray(p.steps)||p.steps.length<2||p.steps.length>4||p.steps.some(x=>typeof x.label!=='string'||!Number.isFinite(s.events[x.event]))) throw Error('Cycle requires 2–4 labelled events');
  }
}
export function newProject(id,title) {
  if(!identifier(id)) throw Error('Invalid project id');
  const dest=inside(ROOT,`projects/${id}`); if(fs.existsSync(dest)) throw Error('Project already exists');
  fs.cpSync(path.join(ROOT,'templates/starter'),dest,{recursive:true});
  const p=json(path.join(dest,'project.json')); p.id=id; p.title=title||id; writeJson(path.join(dest,'project.json'),p);
  const catalog=json(path.join(ROOT,'projects/catalog.json')); catalog.projects.push({id,path:id,kind:'topic',status:'draft'}); writeJson(path.join(ROOT,'projects/catalog.json'),catalog);
  return loadProject(id);
}

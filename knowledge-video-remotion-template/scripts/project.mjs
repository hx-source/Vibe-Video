import fs from 'node:fs';
import path from 'node:path';
import {ROOT, json, inside, sha, writeJson} from './files.mjs';
import {compileTimeline, identifier} from '../src/timeline/compile.mjs';
import {compileAudioPlan} from '../src/audio/plan.mjs';
import {beatGrid,applyMusicTiming,checkMusicSync} from './music.mjs';
import {validateSoundMetadata} from './music-sounds.mjs';
import {videoPreset} from '../src/video-presets.mjs';
import {selectedVisual,validateProductionPlan} from './design-plan.mjs';
import {styleTheme} from '../src/visual/styles.mjs';

export function loadProject(id, {audioPlan: alternative,skipMusic=false} = {}) {
  if (!identifier(id)) throw Error('Invalid project id');
  const dir = inside(ROOT,`projects/${id}`), project = json(inside(dir,'project.json'));
  if (project.id !== id) throw Error('Project folder and id disagree');
  const files = project.files;
  for (const key of ['storyboard','captions','audioPlan','facts','review','assets']) {
    if (!fs.statSync(inside(dir,files[key])).isFile()) throw Error(`Missing ${key}`);
  }
  let board = json(inside(dir,files.storyboard)); const captions = json(inside(dir,files.captions));
  let sync,grid;
  if(!skipMusic&&files.musicSync){
    sync=json(inside(dir,files.musicSync));
    const analysis=json(inside(dir,sync.analysis));
    const overrides=sync.overrides?json(inside(dir,sync.overrides)):{};
    grid=beatGrid(analysis,overrides);board=applyMusicTiming(board,sync,grid,project.video.fps);
  }
  const timeline = compileTimeline(project,board,captions);
  if (!identifier(project.themeId)) throw Error('Invalid theme id');
  let theme = json(inside(ROOT,`src/themes/${project.themeId}.json`));
  for (const key of ['background','text','muted','primary','accent','panel','line','success']) if (!/^#[0-9a-f]{6}$/i.test(theme.colors[key])) throw Error(`Invalid theme color: ${key}`);
  const visualPlan=files.visualPlan?json(inside(dir,files.visualPlan)):null;
  const visual=selectedVisual(visualPlan);theme=styleTheme(theme,visual);
  for (const segment of timeline.segments) validateScene(segment);
  const assetIndex = json(inside(dir,files.assets)), shared = json(path.join(ROOT,'assets/index.json'));
  const assets = new Map();
  for (const [index, base] of [[shared,path.join(ROOT,'assets')],[assetIndex,path.join(dir,'assets')]]) {
    if (index.schemaVersion !== 1 || !Array.isArray(index.items)) throw Error('Invalid assets index');
    for (const a of index.items) {
      if (!identifier(a.id) || assets.has(a.id) || !a.source || !a.license || !['audio','image'].includes(a.type)) throw Error(`Invalid asset metadata: ${a.id}`);
      validateSoundMetadata(a.sound);
      assets.set(a.id,{...a, diskPath:inside(base,a.path)});
    }
  }
  const audioPlan = json(inside(dir,alternative ?? files.audioPlan));
  if (audioPlan.schemaVersion !== 2) throw Error('Use audio schema 2');
  const config = {video:{...project.video,duration:timeline.durationInFrames/timeline.fps}, timeline:{events:timeline.events}, audio:{mix:'unused.wav'}};
  const compiledAudio = compileAudioPlan(audioPlan,config);
  const musicReport=sync?checkMusicSync(sync,timeline,compiledAudio,grid):null;
  if(musicReport?.issues.length)throw Error(`Music sync check failed: ${JSON.stringify(musicReport.issues)}`);
  const used = new Map();
  function useAsset(id, expected) {
    const a = assets.get(id); if (!a || a.type !== expected) throw Error(`Missing ${expected} asset: ${id}`);
    if (!fs.existsSync(a.diskPath)) throw Error(`Missing asset file: ${a.path}`);
    a.contentHash=sha(a.diskPath);used.set(id,a);
  }
  for (const c of compiledAudio.clips) {
    if (!c.source.startsWith('asset:')) throw Error('Audio source must be asset:<id>');
    useAsset(c.source.slice(6),'audio');
  }
  for (const s of timeline.segments) if (s.props.imageAsset) useAsset(s.props.imageAsset,'image');
  const sources = Object.fromEntries(Object.entries(files).filter(([key])=>!skipMusic||key!=='musicSync').map(([key,relative])=>[key,{path:relative,sha256:sha(inside(dir,relative))}]));
  sources.project={path:'project.json',sha256:sha(path.join(dir,'project.json'))};
  if (alternative) sources.audioPlan = {path:alternative,sha256:sha(inside(dir,alternative))};
  if(sync){for(const key of ['analysis','overrides'])if(sync[key])sources[`music-${key}`]={path:sync[key],sha256:sha(inside(dir,sync[key]))};
    const clip=compiledAudio.clips.find(c=>c.id===sync.music.clipId),asset=assets.get(clip.source.slice(6));
    const analysis=json(inside(dir,sync.analysis));if(analysis.source.sha256!==sha(asset.diskPath))throw Error('Music source changed; analyze it again');
    if(sync.music.sourceOut>analysis.duration+1e-7)throw Error('Music range exceeds analyzed source duration');}
  const sceneSources={};
  function sceneHashes(base,prefix){if(!fs.existsSync(base))return;for(const entry of fs.readdirSync(base,{withFileTypes:true})){const file=path.join(base,entry.name);if(entry.isSymbolicLink())throw Error('Scene source links are not supported');if(entry.isDirectory())sceneHashes(file,`${prefix}/${entry.name}`);else if(/\.(tsx?|mjs|css|json)$/.test(entry.name))sceneSources[`${prefix}/${entry.name}`]=sha(file);}}
  sceneHashes(path.join(ROOT,'src'),'src');sceneHashes(path.join(dir,'scenes'),'project-scenes');
  for(const file of ['arrange-audio.mjs','pcm.mjs','render.mjs'])sceneSources[`render-engine/${file}`]=sha(path.join(ROOT,'scripts',file));
  const result={id,dir,project,timeline,theme,visual,visualPlan,production:files.productionPlan?json(inside(dir,files.productionPlan)):null,config,audioPlan,compiledAudio,used,assets,sources,musicReport,sceneSources};
  if(result.production)validateProductionPlan(result.production,result);
  return result;
}
export function validateScene(s) {
  const p=s.props;
  if (!p || typeof p.title !== 'string' || !p.title.trim()) throw Error(`Scene title required: ${s.id}`);
  if (p.layout!==undefined && !['standard','fullbleed'].includes(p.layout)) throw Error('Invalid scene layout');
  if(p.captionPlacement!==undefined&&!['bottom','scene'].includes(p.captionPlacement))throw Error('Invalid scene caption placement');
  if (!['cards','sequence','cycle','anchoring','moon-match','anchor-study','anchor-life','anchor-evidence-motion','anchor-story-motion'].includes(s.sceneType)) throw Error(`Unknown sceneType: ${s.sceneType}`);
  if(s.sceneType==='anchor-story-motion'){
    const modes={deal:['reveal','offer','counter','celebrate','question'],trap:['reveal','anchor','thought','pull','result'],rewind:['reveal','reset','ask','target'],reprice:['reveal','reason','offer','reply','exit'],shop:['reveal','old','sale','joy','pause'],compare:['reveal','hide','history','others','decision','settle'],close:['reveal','first','second','third','result']};
    const keys=modes[p.mode];
    if(p.layout!=='fullbleed'||p.captionPlacement!=='scene'||!keys||keys.some((k,i)=>!Number.isFinite(s.events[k])||s.events[k]<0||s.events[k]>=s.durationSeconds||(i>0&&s.events[k]<=s.events[keys[i-1]])))throw Error('Story motion needs a supported mode, fullbleed scene captions and ordered events');
  }
  if(s.sceneType==='anchor-evidence-motion'){
    const keys=['reveal','inspect','condition','accessory-check','records','range','settle'];
    if(p.mode!=='evidence'||p.layout!=='fullbleed'||p.captionPlacement!=='scene'||keys.some((k,i)=>!Number.isFinite(s.events[k])||s.events[k]<0||s.events[k]>=s.durationSeconds||(i>0&&s.events[k]<=s.events[keys[i-1]])))throw Error('Motion evidence needs fullbleed scene captions and ordered action events');
  }
  if(s.sceneType==='anchor-life'){
    const keys={deal:['reveal','offer','counter','celebrate','question'],trap:['reveal','anchor','thought','pull','result'],rewind:['reveal','reset','ask','target'],evidence:['reveal','inspect','condition','records','range','settle'],reprice:['reveal','reason','offer','reply','exit'],shop:['reveal','old','sale','joy','pause'],compare:['reveal','hide','history','others','decision','settle'],close:['reveal','first','second','third','result']}[p.mode];
    if(!keys||keys.some((k,i)=>!Number.isFinite(s.events[k])||s.events[k]<0||s.events[k]>=s.durationSeconds||(i>0&&s.events[k]<=s.events[keys[i-1]])))throw Error('Anchor life scene needs a supported mode and ordered content events');
  }
  if (s.sceneType==='anchor-study' && (p.mode!=='experiment' || !Number.isFinite(s.events.reveal) || !Number.isFinite(s.events.result))) throw Error('Anchor study supports the experiment mode with reveal/result events');
  if(s.sceneType==='moon-match') {
    const keys=['enter','preferences','first','challenger','compare','replace','retry','settle'];
    if(p.layout!=='fullbleed'||keys.some((k,i)=>!Number.isFinite(s.events[k])||s.events[k]<0||s.events[k]>=s.durationSeconds||(i>0&&s.events[k]<=s.events[keys[i-1]]))) throw Error('Moon match needs ordered action events and fullbleed layout');
  }
  if (s.sceneType==='anchoring' && (!['price','pull','experiment','reset','close'].includes(p.mode) || !Number.isFinite(s.events.reveal) || !Number.isFinite(s.events.result))) throw Error('Invalid anchoring scene');
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
export function newProject(id,title,preset='hd1080') {
  if(!identifier(id)) throw Error('Invalid project id');
  const video=videoPreset(preset);
  const dest=inside(ROOT,`projects/${id}`); if(fs.existsSync(dest)) throw Error('Project already exists');
  fs.cpSync(path.join(ROOT,'templates/starter'),dest,{recursive:true});
  const p=json(path.join(dest,'project.json')); p.id=id; p.title=title||id; p.video=video; writeJson(path.join(dest,'project.json'),p);
  const catalog=json(path.join(ROOT,'projects/catalog.json')); catalog.projects.push({id,path:id,kind:'topic',status:'draft'}); writeJson(path.join(ROOT,'projects/catalog.json'),catalog);
  return loadProject(id);
}

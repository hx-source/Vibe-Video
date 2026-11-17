import fs from 'node:fs';
import path from 'node:path';
import {ROOT,inside,json,sha,writeJson,reserveOutput} from './files.mjs';
import {loadProject} from './project.mjs';
import {projectSnapshot,proposeSnapshot,impactReport,resolveSnapshot,readLedger,recordSegmentReview,reviewStates} from './music-impact.mjs';
import {fingerprint} from './music.mjs';
import {prepare} from './prepare.mjs';
import {binaries,run} from './runtime.mjs';
import {recommendSounds,soundFeatures} from './music-sounds.mjs';
import {measureLoudness} from './audio-quality.mjs';
import {frameAt} from '../src/timeline/compile.mjs';

const safeHtml=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const decode=(file,seconds=600)=>{const bytes=run(binaries().ffmpeg,['-v','error','-i',file,'-t',String(seconds),'-ar','8000','-ac','1','-f','f32le','pipe:1'],{encoding:null,maxBuffer:Math.ceil(seconds*8000*4)+8192});return Array.from({length:bytes.length/4},(_,i)=>bytes.readFloatLE(i*4));};
export function workflowCommand(command,options){
  const p=loadProject(options.project??'starter-demo',{skipMusic:!['quality'].includes(command)}),snapshot=projectSnapshot(p),ledger=readLedger(p.dir);
  if(command==='status'){console.log(JSON.stringify(reviewStates(snapshot,ledger),null,2));return;}
  if(command==='accept'){
    if(!options.manifest||!options.segment||!options.state)throw Error('Use --manifest <root-relative> --segment <id> --state pending|needs-changes|approved');
    const manifest=json(inside(ROOT,options.manifest));if(manifest.project!==p.id)throw Error('Manifest belongs to another project');
    const segment=manifest.segmentSnapshots?.find(s=>s.id===options.segment),current=reviewStates(snapshot,ledger).find(s=>s.id===options.segment);
    if(!segment||segment.fingerprint!==current?.fingerprint)throw Error('Manifest is stale; create a current preview first');
    if(options.state==='approved'&&(manifest.range.from>frameAt(current.from,p.timeline.fps)||manifest.range.to<frameAt(current.to,p.timeline.fps)))throw Error('Preview must cover the complete segment before segment approval');
    console.log(JSON.stringify(recordSegmentReview(p.dir,manifest,options.segment,options.state,options.listened==='true',options.note??''),null,2));return;
  }
  if(command==='apply'){
    if(!options.report||!options.expected)throw Error('Preview impact first, then use --report <root-relative-impact.json> --expected <baselineFingerprint>');
    const reportFile=inside(ROOT,options.report),report=json(reportFile),dir=path.dirname(reportFile),before=json(path.join(dir,'baseline.json')),candidate=json(path.join(dir,'candidate.json'));
    if(report.baselineFingerprint!==options.expected||fingerprint(snapshot)!==options.expected||fingerprint(before)!==options.expected||fingerprint(candidate)!==report.candidateFingerprint)throw Error('Impact preview is stale or modified; generate it again');
    const fresh=impactReport(snapshot,candidate,ledger);if(!fresh.canApply)throw Error(`Candidate invalid: ${fresh.validationError??JSON.stringify(fresh.problems)}`);
    const reopen=(options.reopen??'').split(',').filter(Boolean),blocked=fresh.segments.filter(s=>s.requiresReopen&&!reopen.includes(s.id));if(blocked.length)throw Error(`Approved segments require explicit --reopen: ${blocked.map(s=>s.id).join(',')}`);
    const resolved=resolveSnapshot(candidate);candidate.sync=resolved.sync;
    const files=p.project.files,updates=[[files.storyboard,candidate.storyboard],[files.captions,candidate.captions],[files.audioPlan,candidate.audioPlan]];
    if(candidate.sync){candidate.sync.overrides??='music-overrides.json';updates.push([candidate.sync.analysis,candidate.analysis],[candidate.sync.overrides,candidate.overrides],[files.musicSync,candidate.sync]);}
    const targets=new Set();for(const [relative] of updates){const target=inside(p.dir,relative);if(targets.has(target))throw Error('Configuration paths must be distinct');targets.add(target);}
    const backup=path.join(dir,`apply-${Date.now()}`);fs.mkdirSync(backup);const originals=[];
    try{
      for(const [relative,value] of updates){const file=inside(p.dir,relative),old=fs.existsSync(file)?fs.readFileSync(file):null;originals.push({file,old});if(old)fs.writeFileSync(path.join(backup,`${originals.length}.json`),old);writeJson(file,value);}
      loadProject(p.id);
      const reopened=fresh.segments.filter(s=>s.requiresReopen);
      if(reopened.length){const ledgerFile=inside(p.dir,'segment-reviews.json'),old=fs.existsSync(ledgerFile)?fs.readFileSync(ledgerFile):null;originals.push({file:ledgerFile,old});if(old)fs.writeFileSync(path.join(backup,'segment-reviews.json'),old);for(const s of reopened)ledger.records.push({segmentId:s.id,state:'pending',reopened:true,listened:false,fingerprint:s.fingerprint,baselineFingerprint:report.baselineFingerprint,candidateFingerprint:report.candidateFingerprint,note:'Explicitly reopened for modification; actual review is pending',createdAt:new Date().toISOString()});writeJson(ledgerFile,ledger);}
    }catch(e){for(const {file,old} of originals.reverse())if(old)fs.writeFileSync(file,old);else fs.rmSync(file,{force:true});throw e;}
    writeJson(path.join(backup,'applied.json'),{baseline:options.expected,candidate:report.candidateFingerprint,segments:fresh.segments.filter(s=>s.changed).map(s=>s.id)});
    console.log(`已应用；状态：${JSON.stringify(reviewStates(projectSnapshot(loadProject(p.id)),ledger))}`);return;
  }
  const output=reserveOutput(p.id,options.name??`music-${command}-${Date.now()}`);
  if(command==='snapshot'){writeJson(path.join(output,'music-snapshot.json'),snapshot);console.log(output);return;}
  if(command==='impact'){
    if(!options.proposal)throw Error('Use --proposal <project-relative-json>');
    const baseline=options.baseline?json(inside(ROOT,options.baseline)):snapshot;
    if(baseline.project.id!==p.id)throw Error('Baseline belongs to another project');
    const candidate=proposeSnapshot(baseline,json(inside(p.dir,options.proposal))),report=impactReport(baseline,candidate,ledger);
    writeJson(path.join(output,'baseline.json'),baseline);writeJson(path.join(output,'candidate.json'),candidate);writeJson(path.join(output,'impact.json'),report);
    fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><meta charset="utf-8"><title>修改影响预览</title><style>body{font:16px system-ui;margin:40px;max-width:1200px}td,th{padding:10px;border-bottom:1px solid #ccc;text-align:left}pre{white-space:pre-wrap}</style><h1>修改影响预览</h1><p>此预览没有修改项目。${report.canApply?'结构检查通过；仍需核对阅读与听感。':'候选存在错误，不能应用。'}</p><h2>片段</h2><table><tr><th>片段</th><th>变化</th><th>验收状态</th><th>需要重新打开</th></tr>${report.segments.map(s=>`<tr><td>${safeHtml(s.id)}</td><td>${s.changed?'有':'无'}</td><td>${safeHtml(s.reviewState??'pending')}</td><td>${s.requiresReopen?'是':'否'}</td></tr>`).join('')}</table><h2>动作、字幕与音效</h2><pre>${safeHtml(JSON.stringify({events:report.events,captions:report.captions,effects:report.effects,problems:report.problems,validationError:report.validationError},null,2))}</pre>`);
    console.log(JSON.stringify({output,baselineFingerprint:report.baselineFingerprint,canApply:report.canApply,affected:report.segments.filter(s=>s.changed).map(s=>s.id),validationError:report.validationError},null,2));return;
  }
  if(command==='quality'){prepare(loadProject(p.id),output,{});console.log(path.join(output,'A/audio-quality.json'));return;}
  if(command==='sound'){
    const asset=p.assets.get(options.asset);if(!asset||asset.type!=='audio')throw Error('Use --asset <registered-audio-id>');
    const features=soundFeatures(decode(asset.diskPath),8000),quality=measureLoudness(asset.diskPath,binaries().ffmpeg);
    const suggested={...asset.sound,instrument:options.instrument??asset.sound?.instrument,tags:options.tags?options.tags.split(','):asset.sound?.tags,durationSeconds:features.duration,attackSeconds:features.attackSeconds,tailSeconds:features.tailSeconds,loudnessLufs:quality.integratedLufs,truePeakDb:quality.truePeakDb,...(features.pitch.midi!==undefined?{pitches:[features.pitch.midi]}:{})};
    writeJson(path.join(output,'sound-analysis.json'),{assetId:asset.id,sourceSha256:sha(asset.diskPath),features,quality,suggestedMetadata:suggested,status:'candidate-not-applied'});console.log(output);return;
  }
  if(command==='palette'){
    const analysis=options.analysis?json(inside(p.dir,options.analysis)):snapshot.analysis,music=p.compiledAudio.clips.find(c=>c.role==='music'&&(!options.clip||c.id===options.clip)),cards=[];
    const at=Number(options.at??music?.at??0);if(!Number.isFinite(at)||at<0||at>=p.timeline.durationSeconds)throw Error('Invalid palette preview time');
    const keyTime=music?music.sourceIn+(at-music.at)*music.speed:0,key=analysis?.tonality?.windows?.find(w=>keyTime>=w.from&&keyTime<w.to)??analysis?.tonality?.overall;
    const candidates=recommendSounds([...p.assets.values()],key,options);
    if(candidates.length&&!music)throw Error('Configure an enabled music clip for mixed previews');
    if(analysis&&music&&analysis.source.sha256!==sha(p.assets.get(music.source.slice(6)).diskPath))throw Error('Tonal analysis does not match selected music');
    for(const candidate of candidates.slice(0,12)){
      const asset=p.assets.get(candidate.id),file=`${candidate.id}-mix.wav`,raw=`${candidate.id}-solo.wav`,musicAsset=p.assets.get(music.source.slice(6));
      run(binaries().ffmpeg,['-v','error','-i',asset.diskPath,'-t','3','-ar','44100','-ac','2',path.join(output,raw)]);
      const sourceTime=music.sourceIn+(at-music.at)*music.speed;if(sourceTime<music.sourceIn||sourceTime>=music.sourceOut)throw Error('Preview is outside selected music clip');
      run(binaries().ffmpeg,['-v','error','-ss',String(sourceTime),'-i',musicAsset.diskPath,'-i',asset.diskPath,'-filter_complex',`[0:a]atrim=duration=${Math.min(3*music.speed,music.sourceOut-sourceTime)},asetpts=PTS-STARTPTS,atempo=${music.speed},volume=${music.gain*.7}[m];[1:a]atrim=duration=2.5,asetpts=PTS-STARTPTS,volume=0.3,adelay=500|500[s];[m][s]amix=inputs=2:duration=longest:normalize=0[a]`,'-map','[a]','-t','3','-ar','44100','-ac','2',path.join(output,file)]);
      const measurements=measureLoudness(path.join(output,file),binaries().ffmpeg);cards.push({...candidate,solo:raw,mix:file,measurements});
    }
    writeJson(path.join(output,'palette.json'),{key:key??{status:'uncertain'},candidates:cards,reviewStatus:'needs-listening'});
    fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><meta charset="utf-8"><title>音效候选试听</title><style>body{font:18px system-ui;max-width:960px;margin:40px auto}article{padding:22px;border-bottom:1px solid #bbb}audio{display:block;margin:12px 0}</style><h1>音效候选试听</h1><p>原音与背景音乐混合比较。这里只推荐已登记的素材，不自动改配器。调性匹配仍需试听。</p>${cards.length?cards.map(c=>`<article><h2>${safeHtml(c.id)} · ${safeHtml(c.instrument)}</h2><p>${safeHtml(c.reasons.join('；'))}</p><label>原音<audio controls src="${c.solo}"></audio></label><label>混合<audio controls src="${c.mix}"></audio></label><p>真峰值 ${c.measurements.truePeakDb??'—'} dBTP；来源 ${safeHtml(c.source)}；许可 ${safeHtml(c.license)}</p></article>`).join(''):'<p>还没有带 sound 标签的音频素材。先登记乐器、用途、音高与音色标签，再生成候选。</p>'}`);
    console.log(output);return;
  }
  throw Error('Unknown music workflow command');
}

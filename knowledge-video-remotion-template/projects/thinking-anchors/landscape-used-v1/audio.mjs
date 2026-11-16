import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {buildArrangement} from '../../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../../scripts/pcm.mjs';
import {binaries} from '../../../scripts/runtime.mjs';
export function makeUsedAudio(out){
 const project=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/landscape-opening-v1');
 const plan=json(path.join(prior,'audio-plan.json'));plan.clips.find(c=>c.role==='music').sourceOut=52;
 const opening=json(path.join(project,'landscape-opening-v2/board.json')),decision=json(path.join(project,'landscape-focus-v1/board.json')),used=json(path.join(project,'landscape-used-v1/board.json'));
 const fit='02音乐原素材0–52秒原速延续，音量与原前段相同；本段短纸张、接触、检查和铅笔声跟随物件与记录，不新增旋律或持续过程音。听感待实际看片确认。';
 const cues=[
  {id:'used-quote',asset:'palette-paper-short',event:'switch',offset:.20,duration:.23061224489795917,gain:.6,purpose:'二手报价800进入'},
  {id:'used-inspect',asset:'palette-cloth-two',event:'inspect',offset:.10,duration:.4150793650793651,gain:.45,purpose:'放大镜检查外壳磨损'},
  {id:'used-missing',asset:'opening-ui-contact-v1',event:'missing',offset:.12,duration:.095,gain:.8,purpose:'标出缺少充电器'},
  {id:'used-match',asset:'record-paper-1-v1',event:'match',offset:.06,duration:.20,gain:.6,purpose:'同款条件出现'},
  {id:'used-condition',asset:'record-paper-2-v1',event:'condition',offset:.06,duration:.18034013605442176,gain:.6,purpose:'成色相近条件出现'},
  {id:'used-parts',asset:'palette-paper-short',event:'parts',offset:.06,duration:.23061224489795917,gain:.35,purpose:'配件相近条件出现'},
  {id:'used-sale1',asset:'record-paper-1-v1',event:'sale1',offset:.10,duration:.20,gain:.9,purpose:'第一笔已成交620记录进入'},
  {id:'used-sale2',asset:'record-paper-2-v1',event:'sale2',offset:.10,duration:.18034013605442176,gain:.9,purpose:'第二笔已成交650记录接替'},
  {id:'used-sale3',asset:'palette-paper-short',event:'sale3',offset:.10,duration:.23061224489795917,gain:.6,purpose:'第三笔已成交680记录接替'},
  {id:'used-range',asset:'pencil-underline-recorded-v1',event:'range',offset:.14,duration:.235,gain:.6,purpose:'成交参考区间下方划线形成'}
 ];
 plan.clips.push(...cues.map(c=>({id:c.id,source:'asset:'+c.asset,role:'accent',at:{event:'used.'+c.event,offset:c.offset},sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,fadeOut:.012,purpose:c.purpose,musicFit:fit})));
 writeJson(path.join(out,'audio-plan.json'),plan);
 const assets=json(path.join(project,'assets/index.json')),map=new Map(assets.items.map(a=>[a.id,a])),resolved={...plan,clips:plan.clips.map(c=>({...c,source:map.get(c.source.slice(6)).path}))};
 const events={...Object.fromEntries(Object.entries(opening.events).map(([k,t])=>['opening.'+k,t])),...Object.fromEntries(Object.entries(decision.events).map(([k,t])=>['decision.'+k,24+t])),...Object.fromEntries(Object.entries(used.events).map(([k,t])=>['used.'+k,38+t]))};
 const report=buildArrangement({dir:path.join(project,'assets'),config:{video:{width:1920,height:1080,fps:30,duration:52},timeline:{events},audio:{mix:'unused.wav'}},audioPlan:resolved},binaries().ffmpeg,{directory:path.join(out,'audio'),stems:true,quality:true});
 const oldMix=fs.readFileSync(path.join(prior,'audio/mix.wav')),mix=fs.readFileSync(path.join(out,'audio/mix.wav'));
 if(!waveSlice(mix,0,37.82).equals(waveSlice(oldMix,0,37.82)))throw Error('Original audio changed before preview fade');
 if(!waveSlice(fs.readFileSync(path.join(out,'audio/music.wav')),0,37.82).equals(waveSlice(fs.readFileSync(path.join(prior,'audio/music.wav')),0,37.82)))throw Error('Music prefix changed');
 fs.writeFileSync(path.join(out,'segment-mix.wav'),waveSlice(mix,38,52));
 const analysis=json(path.join(ROOT,'outputs/thinking-anchors/music-portrait-reference-v1/music-analysis.json'));writeJson(path.join(out,'music-reference.json'),{source:analysis.source,beats:analysis.beats.filter(t=>t<52),sourceRange:[0,52],speed:1,status:'existing automatic candidate only; no manual listening calibration'});
 const checks={mixPcmUnchangedUntilSeconds:37.82,removedPreviewFade:[37.82,38],newPreviewFade:[51.82,52],musicSpeed:1,musicSourceRange:[0,52],priorMixSha256:sha(path.join(prior,'audio/mix.wav')),newCues:cues,assistantListening:'not-performed'};
 writeJson(path.join(out,'audio-impact.json'),{rangeSeconds:[38,52],reason:'extend accepted portrait-free landscape timeline with used-item checking and sales evidence',...checks});
 return {report,checks};
}

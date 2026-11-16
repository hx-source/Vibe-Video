import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {buildArrangement} from '../../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../../scripts/pcm.mjs';
import {binaries} from '../../../scripts/runtime.mjs';
export function makeOfferAudio(out){
 const project=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/landscape-used-v1');
 const plan=json(path.join(prior,'audio-plan.json'));plan.clips.find(c=>c.role==='music').sourceOut=64;
 const boards={opening:json(path.join(project,'landscape-opening-v2/board.json')),decision:json(path.join(project,'landscape-focus-v1/board.json')),used:json(path.join(project,'landscape-used-v1/board.json')),offer:json(path.join(project,'landscape-offer-v1/board.json'))};
 const fit='沿用02原素材0–64秒原速和原音量；短纸张、接触及铅笔声分别对应整理依据、递出报价、拒绝、收回和保留选择，不添加旋律或持续过程声。真实听感待看片确认。';
 const cues=[
  {id:'offer-reference',asset:'record-paper-2-v1',event:'switch',offset:.15,duration:.18034013605442176,gain:.7,purpose:'成交区间收拢到报价依据位置'},
  {id:'offer-reasons',asset:'palette-cloth-two',event:'reasons',offset:.10,duration:.4150793650793651,gain:.4,purpose:'回顾商品磨损及缺配件'},
  {id:'offer-proposal',asset:'record-paper-1-v1',event:'offer',offset:.15,duration:.20,gain:.9,purpose:'630示例报价从买家侧递出'},
  {id:'offer-refusal',asset:'regroup-contact-v2',event:'refusal',offset:.12,duration:.11,gain:2.1,purpose:'卖家拒绝信息落定'},
  {id:'offer-withdraw',asset:'palette-paper-long',event:'withdraw',offset:.12,duration:.43045351473922905,gain:.55,purpose:'买家收回报价，一次短纸张声'},
  {id:'offer-choice',asset:'pencil-underline-recorded-v1',event:'choice',offset:.15,duration:.235,gain:.6,purpose:'再看看也可以的结论下划线形成'}
 ];
 plan.clips.push(...cues.map(c=>({id:c.id,source:'asset:'+c.asset,role:'accent',at:{event:'offer.'+c.event,offset:c.offset},sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,fadeOut:.012,purpose:c.purpose,musicFit:fit})));
 writeJson(path.join(out,'audio-plan.json'),plan);
 const assets=json(path.join(project,'assets/index.json')),map=new Map(assets.items.map(a=>[a.id,a])),resolved={...plan,clips:plan.clips.map(c=>({...c,source:map.get(c.source.slice(6)).path}))},offsets={opening:0,decision:24,used:38,offer:52};
 const events=Object.fromEntries(Object.entries(boards).flatMap(([id,b])=>Object.entries(b.events).map(([key,t])=>[id+'.'+key,offsets[id]+t])));
 const report=buildArrangement({dir:path.join(project,'assets'),config:{video:{width:1920,height:1080,fps:30,duration:64},timeline:{events},audio:{mix:'unused.wav'}},audioPlan:resolved},binaries().ffmpeg,{directory:path.join(out,'audio'),stems:true,quality:true});
 const oldMix=fs.readFileSync(path.join(prior,'audio/mix.wav')),mix=fs.readFileSync(path.join(out,'audio/mix.wav'));
 if(!waveSlice(mix,0,51.82).equals(waveSlice(oldMix,0,51.82)))throw Error('Accepted prefix audio changed before preview fade');
 if(!waveSlice(fs.readFileSync(path.join(out,'audio/music.wav')),0,51.82).equals(waveSlice(fs.readFileSync(path.join(prior,'audio/music.wav')),0,51.82)))throw Error('Music prefix changed');
 fs.writeFileSync(path.join(out,'segment-mix.wav'),waveSlice(mix,52,64));
 const analysis=json(path.join(ROOT,'outputs/thinking-anchors/music-portrait-reference-v1/music-analysis.json'));writeJson(path.join(out,'music-reference.json'),{source:analysis.source,beats:analysis.beats.filter(t=>t<64),sourceRange:[0,64],speed:1,status:'existing automatic candidate only; not manually calibrated by listening'});
 const checks={mixPcmUnchangedUntilSeconds:51.82,removedPreviewFade:[51.82,52],newPreviewFade:[63.82,64],musicSpeed:1,musicSourceRange:[0,64],priorMixSha256:sha(path.join(prior,'audio/mix.wav')),newCues:cues,assistantListening:'not-performed'};
 writeJson(path.join(out,'audio-impact.json'),{rangeSeconds:[52,64],reason:'extend used-item evidence into a reasoned offer and no-deal choice',...checks});return {report,checks};
}

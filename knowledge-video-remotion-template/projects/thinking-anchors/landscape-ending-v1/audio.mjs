import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {buildArrangement} from '../../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../../scripts/pcm.mjs';
import {binaries} from '../../../scripts/runtime.mjs';
export function makeEndingAudio(out){
 const project=path.join(ROOT,'projects/thinking-anchors'),prior=path.join(ROOT,'outputs/thinking-anchors/landscape-offer-v1');
 const plan=json(path.join(prior,'audio-plan.json')),bed=plan.clips.find(c=>c.role==='music');bed.sourceOut=74;bed.fadeOut=1.2;
 const folders={opening:'landscape-opening-v2',decision:'landscape-focus-v1',used:'landscape-used-v1',offer:'landscape-offer-v1',ending:'landscape-ending-v1'},offsets={opening:0,decision:24,used:38,offer:52,ending:64};
 const boards=Object.fromEntries(Object.entries(folders).map(([id,folder])=>[id,json(path.join(project,folder,'board.json'))]));
 const fit='沿用02原素材0–74秒原速和前段音量，尾部1.2秒渐出；短纸张、检查和铅笔声只帮助回顾可比价格、商品状况和决策，不增加第二旋律或持续过程声。听感待实际看片确认。';
 const cues=[
  {id:'ending-live',asset:'palette-paper-short',event:'live',offset:.12,duration:.23061224489795917,gain:.6,purpose:'直播间同款到手价比较进入'},
  {id:'ending-conditions',asset:'record-paper-2-v1',event:'conditions',offset:.10,duration:.18034013605442176,gain:.7,purpose:'同款同条件关系落定'},
  {id:'ending-used',asset:'palette-paper-long',event:'used',offset:.10,duration:.43045351473922905,gain:.6,purpose:'由衣服回到二手相机'},
  {id:'ending-inspect',asset:'palette-cloth-two',event:'inspect',offset:.18,duration:.4150793650793651,gain:.45,purpose:'放大镜回顾成色配件检查'},
  {id:'ending-records',asset:'record-paper-1-v1',event:'records',offset:.10,duration:.20,gain:.9,purpose:'可比的已成交记录进入'},
  {id:'ending-decision',asset:'palette-paper-short',event:'decision',offset:.15,duration:.23061224489795917,gain:.55,purpose:'回到自己的需求判断'},
  {id:'ending-budget',asset:'record-paper-2-v1',event:'budget',offset:.08,duration:.18034013605442176,gain:.7,purpose:'钱包进入，提醒预算'},
  {id:'ending-choice',asset:'pencil-underline-recorded-v1',event:'choice',offset:.12,duration:.235,gain:.6,purpose:'也可以不买下划线形成，保留选择'}
 ];
 plan.clips.push(...cues.map(c=>({id:c.id,source:'asset:'+c.asset,role:'accent',at:{event:'ending.'+c.event,offset:c.offset},sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,fadeOut:.012,purpose:c.purpose,musicFit:fit})));
 writeJson(path.join(out,'audio-plan.json'),plan);
 const assets=json(path.join(project,'assets/index.json')),map=new Map(assets.items.map(a=>[a.id,a])),resolved={...plan,clips:plan.clips.map(c=>({...c,source:map.get(c.source.slice(6)).path}))};
 const events=Object.fromEntries(Object.entries(boards).flatMap(([id,b])=>Object.entries(b.events).map(([key,t])=>[id+'.'+key,offsets[id]+t])));
 const report=buildArrangement({dir:path.join(project,'assets'),config:{video:{width:1920,height:1080,fps:30,duration:74},timeline:{events},audio:{mix:'unused.wav'}},audioPlan:resolved},binaries().ffmpeg,{directory:path.join(out,'audio'),stems:true,quality:true});
 const oldMix=fs.readFileSync(path.join(prior,'audio/mix.wav')),mix=fs.readFileSync(path.join(out,'audio/mix.wav'));
 if(!waveSlice(mix,0,63.82).equals(waveSlice(oldMix,0,63.82)))throw Error('Accepted prefix audio changed before preview fade');
 if(!waveSlice(fs.readFileSync(path.join(out,'audio/music.wav')),0,63.82).equals(waveSlice(fs.readFileSync(path.join(prior,'audio/music.wav')),0,63.82)))throw Error('Music prefix changed');
 fs.writeFileSync(path.join(out,'segment-mix.wav'),waveSlice(mix,64,74));
 const analysis=json(path.join(ROOT,'outputs/thinking-anchors/music-portrait-reference-v1/music-analysis.json'));writeJson(path.join(out,'music-reference.json'),{source:analysis.source,beats:analysis.beats.filter(t=>t<74),sourceRange:[0,74],speed:1,status:'existing automatic candidate only; not manually calibrated by listening'});
 const checks={mixPcmUnchangedUntilSeconds:63.82,removedPreviewFade:[63.82,64],endingFade:[72.8,74],musicSpeed:1,musicSourceRange:[0,74],priorMixSha256:sha(path.join(prior,'audio/mix.wav')),newCues:cues,assistantListening:'not-performed'};
 writeJson(path.join(out,'audio-impact.json'),{rangeSeconds:[64,74],reason:'recap two methods, independent needs/budget and the option not to buy',...checks});return {report,checks};
}

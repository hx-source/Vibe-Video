import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries} from '../../../scripts/runtime.mjs';
import {buildArrangement} from '../../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../../scripts/pcm.mjs';
const topic=path.join(ROOT,'projects/thinking-anchors'),out=path.join(ROOT,'outputs/thinking-anchors/landscape-decision-v1'),old=path.join(ROOT,'outputs/thinking-anchors/landscape-reason-v1'),board=json(path.join(topic,'landscape-decision-v1/board.json')),opening=json(path.join(topic,'landscape-opening-v9/board.json')),reason=json(path.join(topic,'landscape-reason-v1/board.json')),plan=json(path.join(old,'audio-plan.json'));
plan.clips.find(c=>c.role==='music').sourceOut=52;
const fit='保留认可的02原速、音量与前34秒混音，短事件声配合查价、价格比较、逐个条件勾选、钱包与收手动作；不加持续声或新旋律。实际混合听感待用户播放确认。';
const cues=[
 {id:'decision-history',asset:'palette-paper-short',role:'accent',event:'history',offset:0,in:0,out:.23061224489795917,gain:.55,fadeOut:.012,purpose:'近期实际到手价纸条开始进入，单次短纸张声'},
 {id:'decision-other',asset:'palette-paper-short',role:'accent',event:'other',offset:0,in:0,out:.23061224489795917,gain:.55,fadeOut:.012,purpose:'其他店到手价替换近期记录，单次纸张声'},
 {id:'decision-compare',asset:'pencil-underline-recorded-v1',role:'accent',event:'compare',offset:.05,in:0,out:.235,gain:.65,fadeOut:.012,purpose:'199与189之间比较线绘制，强调仅相差10元'},
 ...[0,1,2].map(i=>({id:'decision-condition-'+i,asset:'opening-ui-contact-v1',role:'accent',event:'conditions',offset:.1+i*4/30,in:0,out:.095,gain:1.4,fadeOut:.012,purpose:['同款','运费','售后'][i]+'勾选开始出现，对应三个勾选各一次短触碰声'})),
 {id:'decision-need',asset:'palette-quiet-sweep',role:'transition',event:'need',offset:0,in:.03,out:.28,gain:.45,fadeIn:.018,fadeOut:.035,purpose:'由可比商品条件转向个人需求，短掠过转场'},
 {id:'decision-budget',asset:'palette-paper-short',role:'accent',event:'budget',offset:0,in:0,out:.23061224489795917,gain:.55,fadeOut:.012,purpose:'钱包和事先150元预算出现，提示199超出个人约束'},
 {id:'decision-choice',asset:'palette-paper-long',role:'accent',event:'choice',offset:0,in:0,out:.4,gain:.6,fadeOut:.025,purpose:'人物收手，划算也可以不买下方一次刷线，强调保留选择'}
];
plan.clips.push(...cues.map(c=>({id:c.id,source:'asset:'+c.asset,role:c.role,at:{event:'decision.'+c.event,offset:c.offset},sourceIn:c.in,sourceOut:c.out,speed:1,gain:c.gain,...(c.fadeIn?{fadeIn:c.fadeIn}:{}),fadeOut:c.fadeOut,purpose:c.purpose,musicFit:fit})));
writeJson(path.join(out,'audio-plan.json'),plan);
const assets=new Map(json(path.join(topic,'assets/index.json')).items.map(a=>[a.id,a])),resolved={...plan,clips:plan.clips.map(c=>({...c,source:assets.get(c.source.slice(6)).path}))};
const events={...Object.fromEntries(Object.entries(opening.events).map(([k,t])=>['opening.'+k,t])),...Object.fromEntries(Object.entries(reason.events).map(([k,t])=>['reason.'+k,20+t])),...Object.fromEntries(Object.entries(board.events).map(([k,t])=>['decision.'+k,34+t]))};
const report=buildArrangement({dir:path.join(topic,'assets'),config:{video:{width:1920,height:1080,fps:30,duration:52},timeline:{events},audio:{mix:'unused.wav'}},audioPlan:resolved},binaries().ffmpeg,{directory:path.join(out,'audio'),stems:true,quality:true});
const mix=fs.readFileSync(path.join(out,'audio/mix.wav')),music=fs.readFileSync(path.join(out,'audio/music.wav'));if(!waveSlice(mix,0,34).equals(fs.readFileSync(path.join(old,'audio/mix.wav')))||!waveSlice(music,0,34).equals(fs.readFileSync(path.join(old,'audio/music.wav'))))throw Error('Approved0–34PCM changed');
if(report.clippedSamples||report.plan.maxConcurrentEffects>1)throw Error('Clipping or effects overlap');
const userMusic='D:/Documents/dy/音频/02_情感话题_故事讲述.m4a';if(report.inputs.find(c=>c.role==='music').sha256!==sha(userMusic))throw Error('Not selected02 music');
const full=Buffer.from(mix);function fade(b,from,to,inward=false){for(let f=Math.round(from*44100);f<Math.round(to*44100);f++){const g=inward?(f-from*44100)/((to-from)*44100):(to*44100-f)/((to-from)*44100);for(let c=0;c<2;c++){const i=44+(f*2+c)*2;b.writeInt16LE(Math.round(b.readInt16LE(i)*g),i);}}}
fade(full,51.82,52);fs.writeFileSync(path.join(out,'full-preview-mix.wav'),full);const segment=waveSlice(full,34,52);fade(segment,0,.08,true);fs.writeFileSync(path.join(out,'segment-preview-mix.wav'),segment);
writeJson(path.join(out,'audio-impact.json'),{rangeSeconds:[34,52],priorMixPcmAll34SecondsUnchanged:true,priorMusicPcmAll34SecondsUnchanged:true,accepted17And19CuesUnchanged:true,sourceMusic:userMusic,sourceMusicSha256:sha(userMusic),speed:1,sourceRange:[0,52],newCueCount:cues.length,cues:cues.map(c=>({id:c.id,event:'decision.'+c.event,at:34+board.events[c.event]+c.offset,duration:c.out-c.in,purpose:c.purpose})),maxConcurrentEffects:report.plan.maxConcurrentEffects,fullPreviewFade:[51.82,52],standalonePreviewFadeInSeconds:.08,continuousMaster:'audio/mix.wav',assistantListening:'not-performed'});
console.log(JSON.stringify({audioProduced:true,newCueCount:cues.length,prior34PCMUnchanged:true,maxConcurrentEffects:report.plan.maxConcurrentEffects,assistantListening:'not-performed'}));

import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries} from '../../../scripts/runtime.mjs';
import {buildArrangement} from '../../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../../scripts/pcm.mjs';
const topic=path.join(ROOT,'projects/thinking-anchors'),out=path.join(ROOT,'outputs/thinking-anchors/landscape-reason-v1'),old=path.join(ROOT,'outputs/thinking-anchors/landscape-opening-v9'),board=json(path.join(topic,'landscape-reason-v1/board.json')),opening=json(path.join(topic,'landscape-opening-v9/board.json')),plan=json(path.join(topic,'landscape-opening-v9/audio-plan.json'));
plan.clips.find(c=>c.role==='music').sourceOut=34;
const fit='保留已认可的02原速与0–20秒混音，新增声音只对应原因段的界面进入、参照纸签、思考气泡翻转、判断强调线及问题衔接；不添加持续声或新旋律。实际听感待用户播放确认。';
const cues=[
 {id:'reason-switch',asset:'palette-quiet-sweep',role:'transition',event:'switch',offset:0,in:.03,out:.28,gain:.45,fadeIn:.018,fadeOut:.035,purpose:'20.3秒从点题进入原因讲解，沿用认可的短掠过转场质感'},
 {id:'reason-anchor',asset:'palette-paper-long',role:'accent',event:'anchor',offset:0,in:0,out:.23,gain:.6,fadeOut:.02,purpose:'999纸签进入比较位置，纸签移动0.23秒与刷声同长'},
 {id:'reason-question',asset:'palette-paper-short',role:'accent',event:'question',offset:.08,in:0,out:.23061224489795917,gain:.55,fadeOut:.012,purpose:'思考气泡从值不值199翻成比999便宜多少'},
 {id:'reason-judgment',asset:'palette-paper-long',role:'accent',event:'judgment',offset:0,in:0,out:.4,gain:.6,fadeOut:.025,purpose:'同样199显得划算，气泡下强调线0.4秒绘制与一次纸张刷声同长'},
 {id:'reason-bridge',asset:'palette-paper-short',role:'transition',event:'bridge',offset:.12,in:0,out:.23061224489795917,gain:.55,fadeOut:.012,purpose:'回到商品值多少与该拿什么比的问题'}
];
plan.clips.push(...cues.map(c=>({id:c.id,source:'asset:'+c.asset,role:c.role,at:{event:'reason.'+c.event,offset:c.offset},sourceIn:c.in,sourceOut:c.out,speed:1,gain:c.gain,...(c.fadeIn?{fadeIn:c.fadeIn}:{}),fadeOut:c.fadeOut,purpose:c.purpose,musicFit:fit})));
writeJson(path.join(out,'audio-plan.json'),plan);
const map=new Map(json(path.join(topic,'assets/index.json')).items.map(a=>[a.id,a])),resolved={...plan,clips:plan.clips.map(c=>({...c,source:map.get(c.source.slice(6)).path}))};
const events={...Object.fromEntries(Object.entries(opening.events).map(([k,t])=>['opening.'+k,t])),...Object.fromEntries(Object.entries(board.events).map(([k,t])=>['reason.'+k,20+t]))};
const report=buildArrangement({dir:path.join(topic,'assets'),config:{video:{width:1920,height:1080,fps:30,duration:34},timeline:{events},audio:{mix:'unused.wav'}},audioPlan:resolved},binaries().ffmpeg,{directory:path.join(out,'audio'),stems:true,quality:true});
const mix=fs.readFileSync(path.join(out,'audio/mix.wav')),music=fs.readFileSync(path.join(out,'audio/music.wav'));if(!waveSlice(mix,0,20).equals(fs.readFileSync(path.join(old,'audio/mix.wav')))||!waveSlice(music,0,20).equals(fs.readFileSync(path.join(old,'audio/music.wav'))))throw Error('Approved0–20PCM changed');
if(report.clippedSamples||report.plan.maxConcurrentEffects>1)throw Error('Audio clips or effects overlap');
const userMusic='D:/Documents/dy/音频/02_情感话题_故事讲述.m4a';if(report.inputs.find(c=>c.role==='music').sha256!==sha(userMusic))throw Error('Not selected02 music');
const fullPreview=Buffer.from(mix);function fade(bytes,from,to,inward=false){for(let f=Math.round(from*44100);f<Math.round(to*44100);f++){const g=inward?(f-from*44100)/((to-from)*44100):(to*44100-f)/((to-from)*44100);for(let c=0;c<2;c++){const i=44+(f*2+c)*2;bytes.writeInt16LE(Math.round(bytes.readInt16LE(i)*g),i);}}}
fade(fullPreview,33.82,34);fs.writeFileSync(path.join(out,'full-preview-mix.wav'),fullPreview);const segment=waveSlice(fullPreview,20,34);fade(segment,0,.08,true);fs.writeFileSync(path.join(out,'segment-preview-mix.wav'),segment);
writeJson(path.join(out,'audio-impact.json'),{rangeSeconds:[20,34],openingMixPcmAll20SecondsUnchanged:true,openingMusicPcmAll20SecondsUnchanged:true,accepted17And19CuesUnchanged:true,sourceMusic:userMusic,sourceMusicSha256:sha(userMusic),speed:1,sourceRange:[0,34],newCueCount:cues.length,cues:cues.map(c=>({id:c.id,event:'reason.'+c.event,at:20+board.events[c.event]+c.offset,duration:c.out-c.in,purpose:c.purpose})),maxConcurrentEffects:report.plan.maxConcurrentEffects,fullPreviewFade:[33.82,34],standalonePreviewFadeInSeconds:.08,continuousMaster:'audio/mix.wav',assistantListening:'not-performed'});
console.log(JSON.stringify({audioProduced:true,newCueCount:5,openingPCMUnchanged:true,maxConcurrentEffects:report.plan.maxConcurrentEffects,assistantListening:'not-performed'}));

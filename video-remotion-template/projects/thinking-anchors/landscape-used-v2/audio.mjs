import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {binaries} from '../../../scripts/runtime.mjs';
import {buildArrangement} from '../../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../../scripts/pcm.mjs';
const topic=path.join(ROOT,'projects/thinking-anchors'),out=path.join(ROOT,'outputs/thinking-anchors/landscape-used-v2'),old=path.join(ROOT,'outputs/thinking-anchors/landscape-decision-v1'),board=json(path.join(topic,'landscape-used-v2/board.json')),plan=json(path.join(old,'audio-plan.json'));
plan.clips.find(c=>c.role==='music').sourceOut=70;
const fit='02原素材、原速及音量连续，前52秒已认可混音保留。短物件声对应检查，三个筛选标签与三条成交记录各单独触发，区间只配一次短刷线声，不叠持续音、新旋律或混响；实际听感待反馈。';
const cues=[
 {id:'used-case',asset:'palette-quiet-sweep',role:'transition',event:'switch',offset:0,in:.03,out:.28,gain:.45,fadeIn:.018,fadeOut:.035,purpose:'由直播购物选择切入二手砍价，单次柔和转场'},
 {id:'used-power',asset:'opening-ui-contact-v1',role:'accent',event:'test',offset:.1,in:0,out:.095,gain:1.4,fadeOut:.012,purpose:'开机指示灯和能开机的检查结果出现'},
 {id:'used-photo',asset:'palette-metal-detail',role:'accent',event:'shutter',offset:0,in:0,out:.18,gain:.65,fadeOut:.018,purpose:'试拍时镜头一次闪白和能拍照结果，短机械触碰示意，不声称为该型号真实快门录音'},
 {id:'used-wear',asset:'palette-metal-detail',role:'accent',event:'inspect',offset:.12,in:0,out:.3,gain:.65,fadeOut:.02,purpose:'放大镜靠近磨损，短物件声帮助定位检查动作'},
 {id:'used-missing',asset:'palette-quiet-sweep',role:'transition',event:'missing',offset:.1,in:.03,out:.28,gain:.45,fadeIn:.018,fadeOut:.035,purpose:'检查转向充电器，缺配件符号出现'},
 ...['match','condition','parts'].map((event,i)=>({id:'used-filter-'+i,asset:'opening-ui-contact-v1',role:'accent',event,offset:.1,in:0,out:.095,gain:1.4,fadeOut:.012,purpose:['同款','成色相近','配件相近'][i]+'筛选标签单独出现，各配一次短触碰声'})),
 ...['sale1','sale2','sale3'].map((event,i)=>({id:'used-sale-'+(i+1),asset:'record-paper-'+(i+1)+'-v1',role:'accent',event,offset:.08,in:0,out:[.2,.18034013605442178,.20931972789115647][i],gain:[1.15,1.3,.95][i],fadeOut:.012,purpose:'第'+(i+1)+'笔已成交示例单独翻入，采用三段不同纸张采样'})),
 {id:'used-range',asset:'palette-paper-long',role:'accent',event:'range',offset:.05,in:0,out:.4,gain:.6,fadeOut:.025,purpose:'三笔记录转换成620到680的参考区间，强调线一次刷过'},
 {id:'used-compare',asset:'palette-paper-short',role:'accent',event:'compare',offset:.08,in:0,out:.23061224489795917,gain:.55,fadeOut:.012,purpose:'淡化后的800报价重新出现，提示需结合实物再判断'}
];
plan.clips.push(...cues.map(c=>({id:c.id,source:'asset:'+c.asset,role:c.role,at:{event:'used.'+c.event,offset:c.offset},sourceIn:c.in,sourceOut:c.out,speed:1,gain:c.gain,...(c.fadeIn?{fadeIn:c.fadeIn}:{}),fadeOut:c.fadeOut,purpose:c.purpose,musicFit:fit})));
writeJson(path.join(out,'audio-plan.json'),plan);
const assets=new Map(json(path.join(topic,'assets/index.json')).items.map(a=>[a.id,a])),resolved={...plan,clips:plan.clips.map(c=>({...c,source:assets.get(c.source.slice(6)).path}))};
const chapters=[['landscape-opening-v9','opening',0],['landscape-reason-v1','reason',20],['landscape-decision-v1','decision',34],['landscape-used-v2','used',52]],events=Object.fromEntries(chapters.flatMap(([name,id,offset])=>Object.entries(json(path.join(topic,name,'board.json')).events).map(([k,t])=>[id+'.'+k,offset+t])));
const report=buildArrangement({dir:path.join(topic,'assets'),config:{video:{width:1920,height:1080,fps:30,duration:70},timeline:{events},audio:{mix:'unused.wav'}},audioPlan:resolved},binaries().ffmpeg,{directory:path.join(out,'audio'),stems:true,quality:true});
const mix=fs.readFileSync(path.join(out,'audio/mix.wav')),music=fs.readFileSync(path.join(out,'audio/music.wav'));if(!waveSlice(mix,0,52).equals(fs.readFileSync(path.join(old,'audio/mix.wav')))||!waveSlice(music,0,52).equals(fs.readFileSync(path.join(old,'audio/music.wav'))))throw Error('Approved0–52PCM changed');
if(report.clippedSamples||report.plan.maxConcurrentEffects>1)throw Error('Clipping or effects overlap');
const userMusic='D:/Documents/dy/音频/02_情感话题_故事讲述.m4a';if(report.inputs.find(c=>c.role==='music').sha256!==sha(userMusic))throw Error('Not selected02 music');
const full=Buffer.from(mix);function fade(b,from,to,inward=false){for(let f=Math.round(from*44100);f<Math.round(to*44100);f++){const g=inward?(f-from*44100)/((to-from)*44100):(to*44100-f)/((to-from)*44100);for(let c=0;c<2;c++){const i=44+(f*2+c)*2;b.writeInt16LE(Math.round(b.readInt16LE(i)*g),i);}}}
fade(full,69.82,70);fs.writeFileSync(path.join(out,'full-preview-mix.wav'),full);const segment=waveSlice(full,52,70);fade(segment,0,.08,true);fs.writeFileSync(path.join(out,'segment-preview-mix.wav'),segment);
writeJson(path.join(out,'audio-impact.json'),{rangeSeconds:[52,70],priorMixPcmAll52SecondsUnchanged:true,priorMusicPcmAll52SecondsUnchanged:true,accepted17And19CuesUnchanged:true,sourceMusic:userMusic,sourceMusicSha256:sha(userMusic),speed:1,sourceRange:[0,70],newCueCount:cues.length,cues:cues.map(c=>({id:c.id,event:'used.'+c.event,at:52+board.events[c.event]+c.offset,duration:c.out-c.in,purpose:c.purpose})),maxConcurrentEffects:report.plan.maxConcurrentEffects,fullPreviewFade:[69.82,70],standalonePreviewFadeInSeconds:.08,continuousMaster:'audio/mix.wav',assistantListening:'not-performed'});
console.log(JSON.stringify({audioProduced:true,newCueCount:cues.length,prior52PCMUnchanged:true,maxConcurrentEffects:report.plan.maxConcurrentEffects,warnings:report.warnings,assistantListening:'not-performed'}));

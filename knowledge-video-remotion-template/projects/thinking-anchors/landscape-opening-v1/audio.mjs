import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
import {buildArrangement} from '../../../scripts/arrange-audio.mjs';
import {waveSlice} from '../../../scripts/pcm.mjs';
import {binaries} from '../../../scripts/runtime.mjs';
export function makeAudio(out){
 const project=path.join(ROOT,'projects/thinking-anchors'),old=path.join(ROOT,'outputs/thinking-anchors/portrait-decision-v1'),board=json(path.join(project,'landscape-opening-v1/board.json')),decision=json(path.join(project,'landscape-focus-v1/board.json'));
 const plan=json(path.join(old,'audio-plan.json'));plan.clips=plan.clips.filter(c=>c.role==='music'||c.id.startsWith('decision-'));
 const fit='沿用02原素材0–38秒、原速与音量；沿用本期纸张、界面接触和铅笔素材，只对应报价揭示、心动、付款金额强调、参照和问题转换；不添加持续音，听感待反馈。';
 const cues=[
  {id:'hook-price',asset:'opening-ui-contact-v1',event:'price',offset:.20,duration:.095,gain:1.25,purpose:'199价格标签进入并落定'},
  {id:'hook-reference',asset:'palette-paper-long',event:'reference',offset:.18,duration:.43045351473922905,gain:.7,purpose:'商家原价999纸签翻出'},
  {id:'hook-delight',asset:'regroup-contact-v2',event:'delight',offset:.18,duration:.11,gain:1.7,purpose:'人物心动，向商品伸手'},
  {id:'hook-reality',asset:'pencil-underline-recorded-v1',event:'reality',offset:.32,duration:.235,gain:.85,purpose:'199付款金额下方划线强调，实际付款未变'},
  {id:'hook-explain',asset:'palette-paper-long',event:'explain',offset:.14,duration:.43045351473922905,gain:.6,purpose:'999作为脑中的参照重新出现'},
  {id:'hook-question',asset:'palette-paper-short',event:'question',offset:.18,duration:.23061224489795917,gain:.6,purpose:'参照退后，转向该拿什么比的问题'}
 ];
 const clips=cues.map(c=>({id:c.id,source:'asset:'+c.asset,role:'accent',at:{event:'opening.'+c.event,offset:c.offset},sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,fadeOut:.012,purpose:c.purpose,musicFit:fit}));
 plan.clips.splice(1,0,...clips);writeJson(path.join(out,'audio-plan.json'),plan);
 const assets=json(path.join(project,'assets/index.json')),map=new Map(assets.items.map(a=>[a.id,a])),resolved={...plan,clips:plan.clips.map(c=>{const a=map.get(c.source.slice(6));if(!a)throw Error('Unknown audio asset');return {...c,source:a.path};})};
 const config={video:{width:1920,height:1080,fps:30,duration:38},timeline:{events:{...Object.fromEntries(Object.entries(board.events).map(([k,t])=>['opening.'+k,t])),...Object.fromEntries(Object.entries(decision.events).map(([k,t])=>['decision.'+k,24+t]))}},audio:{mix:'unused.wav'}};
 const report=buildArrangement({dir:path.join(project,'assets'),config,audioPlan:resolved},binaries().ffmpeg,{directory:path.join(out,'audio'),stems:true,quality:true});
 const musicUnchanged=sha(path.join(out,'audio/music.wav'))===sha(path.join(old,'audio/music.wav'));
 const mix=fs.readFileSync(path.join(out,'audio/mix.wav')),priorMix=fs.readFileSync(path.join(old,'audio/mix.wav'));
 const decisionPcmUnchanged=waveSlice(mix,24,38).equals(waveSlice(priorMix,24,38));
 if(!musicUnchanged||!decisionPcmUnchanged||report.clippedSamples)throw Error('Music or following segment audio changed');
 const opening=waveSlice(mix,0,24);for(let i=Math.round(23.82*44100);i<24*44100;i++){const gain=(24*44100-i)/(44100*.18);for(let c=0;c<2;c++){const j=44+(i*2+c)*2;opening.writeInt16LE(Math.round(opening.readInt16LE(j)*gain),j);}}
 fs.writeFileSync(path.join(out,'opening-mix.wav'),opening);
 const analysis=json(path.join(ROOT,'outputs/thinking-anchors/music-portrait-reference-v1/music-analysis.json'));
 writeJson(path.join(out,'music-reference.json'),{source:analysis.source,beats:analysis.beats.filter(t=>t<38),speed:1,sourceRange:[0,38],status:'existing automatic candidate only; no manual listening calibration'});
 const checks={musicPcmUnchangedAcross0to38:musicUnchanged,decision24to38PcmUnchanged:decisionPcmUnchanged,newCueCount:cues.length,cues,oldAudioPlanUnmodified:true,fullVersionNoFadeAt24:true,standalonePreviewFade:[23.82,24],assistantListening:'not-performed'};
 writeJson(path.join(out,'audio-impact.json'),{scopeSeconds:[0,24],reasons:'new approved opening content and event timing',preserved:['02原素材0–38秒、原速及音量','24–38秒原混音PCM','历史计划与输出'],...checks});
 return {report,checks};
}

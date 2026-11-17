import React from 'react';
import {ease} from '../../../src/components/primitives';
import {AnchorLandscapeOffer} from './Offer';
import {Text,Coat,PriceTag} from '../landscape-opening-v2/Shapes';
import {Camera} from '../landscape-offer-v1/Props';
import {EndingShopper} from '../landscape-ending-v1/Actor';
import board from '../landscape-ending-v1/board.json';
const ink='#25252b',cream='#fff8e9',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
function Wallet(){return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M-69 -38 L51 -60 V-25" fill="#f1c4a0"/><rect x="-74" y="-30" width="148" height="107" rx="17" fill="#f1c4a0"/><path d="M28 -5 H83 V49 H28 Q12 49 12 29 V15 Q12 -5 28 -5 Z" fill={paper}/><circle cx="40" cy="22" r="7" fill={ink}/></g>;}
function SaleRecord({p}:{p:number}){
 return <g opacity={p} transform={`translate(${910+60*(1-p)} ${578+35*(1-p)})`}>
  <path d="M-272 -176 H280 V184 L251 162 L222 184 L193 162 L164 184 L135 162 L106 184 L77 162 L48 184 L19 162 L-10 184 L-39 162 L-68 184 L-97 162 L-126 184 L-155 162 L-184 184 L-213 162 L-242 184 L-272 162 Z" fill={ink}/>
  <path d="M-282 -186 H270 V174 L241 152 L212 174 L183 152 L154 174 L125 152 L96 174 L67 152 L38 174 L9 152 L-20 174 L-49 152 L-78 174 L-107 152 L-136 174 L-165 152 L-194 174 L-223 152 L-252 174 L-282 152 Z" fill={paper} stroke={ink} strokeWidth="5"/>
  <Text x={-6} y={-100} size={38}>同款 · 条件相近</Text><path d="M-225 -66 H214" stroke={ink} strokeWidth="3" strokeDasharray="8 8" opacity=".3"/>
  <Text x={-6} y={57} size={94} color="#207b72">已成交记录</Text>
  <path d="M-91 106 L-57 132 L3 83" fill="none" stroke={teal} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-p}/>
 </g>;
}
export function AnchorLandscapeEnding({frame}:{frame:number}){
 if(!Number.isInteger(frame)||frame<0||frame>=300)throw Error('Ending frame outside 0–299');
 const t=frame/30,e=board.events;if(t<e.switch)return <AnchorLandscapeOffer frame={359}/>;
 const enter=ease((t-e.switch)/.65),live=ease((t-e.live)/.35),conditions=ease((t-e.conditions)/.35),used=ease((t-e.used)/.4),inspect=ease((t-e.inspect)/.35),records=ease((t-e.records)/.35),decision=ease((t-e.decision)/.4),budget=ease((t-e.budget)/.3),choice=ease((t-e.choice)/.4);
 const liveStage=1-used,usedStage=used*(1-decision),heading=t<e.used?'直播间：查同款到手价':t<e.decision?'二手：验商品，查成交':'先找依据，再决定';
 const stage=t<e.used?'recap-live-comparison':t<e.decision?'recap-used-evidence':t<e.choice?'need-and-budget':'preserve-choice';
 return <svg data-landscape-scene data-stage={stage} width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="总结两个案例：直播间查同款同条件到手价，二手检查商品并查可比成交，再按需求预算决定，也可以不买">
  <defs><pattern id="ending-paper" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill={cream}/><rect width="1920" height="1080" fill="url(#ending-paper)"/>
  <path d="M0 945 Q770 903 1920 950 V1080 H0 Z" fill="#e9dec9"/><path d="M0 982 Q950 943 1920 984" fill="none" stroke="#d8cbb5" strokeWidth="3"/>
  <ellipse cx="1610" cy="1002" rx="240" ry="27" fill={ink} opacity=".08"/><ellipse cx="755" cy="948" rx="590" ry="30" fill={ink} opacity=".05"/>
  <g opacity={0}><AnchorLandscapeOffer frame={359}/></g>
  <g opacity={1}>
   <Text x={820} y={177} size={t<e.decision?72:84}>{heading}</Text>
   <g data-recap="live" opacity={liveStage}>
    <g transform="translate(280 567) scale(1.27) rotate(-3)"><Coat/></g>
    <g opacity={live} transform={`translate(${35*(1-live)} 0)`}><PriceTag x={710} y={558} w={350} h={300} label="本店到手" value={199}/><PriceTag x={1120} y={558} w={350} h={300} label="他店到手" value={189}/></g>
    <g opacity={conditions}><path d="M704 755 V779 H1117 V755" stroke={teal} strokeWidth="6" fill="none" strokeLinecap="round"/><Text x={910} y={850} size={50}>同款 · 同条件</Text></g>
   </g>
   <g data-recap="used" opacity={usedStage}>
    <g transform="translate(300 568) scale(1.08)"><Camera scratch={1}/></g>
    <g opacity={inspect}>
     <g transform="translate(160 610)" stroke={ink} strokeWidth="6" strokeLinecap="round"><circle r="51" fill={paper} fillOpacity=".12"/><path d="M36 36 L86 86" strokeWidth="13"/><path d="M36 36 L86 86" stroke={coral} strokeWidth="6"/></g>
     <Text x={300} y={842} size={44}>成色 · 配件</Text>
    </g>
    <SaleRecord p={records}/>
    <g opacity={records}><Text x={910} y={850} size={50}>据此谈价</Text></g>
   </g>
   <g data-recap="decision" opacity={decision}>
    <g transform={`translate(530 ${520+20*(1-decision)}) scale(1.12)`}><Coat/></g><Text x={530} y={735} size={54}>需要吗？</Text>
    <g opacity={budget} transform={`translate(995 ${518+20*(1-budget)}) scale(1.65)`}><Wallet/></g><g opacity={budget}><Text x={995} y={735} size={54}>预算合适吗？</Text></g>
    <g opacity={choice} transform={`translate(0 ${12*(1-choice)})`}><Text x={820} y={876} size={66}>也可以不买</Text><path d="M620 909 Q817 921 1016 909" fill="none" stroke={teal} strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-choice}/></g>
   </g>
   <g transform={`translate(${mix(766,706,enter)+55*choice} -925) scale(1.1)`}><EndingShopper time={t} clock={64+t}/></g>
  </g>
 </svg>;
}
export const endingScenes={'anchor-landscape-ending':AnchorLandscapeEnding};
export function validateEnding(){
 if(board.video.width!==1920||board.video.height!==1080||board.video.fps!==30||board.durationSeconds!==10||!endingScenes[board.sceneType as keyof typeof endingScenes])throw Error('Invalid closing scene');
 let last=-1;for(const t of Object.values(board.events)){if(t<=last||t<0||t>=10)throw Error('Invalid ending event order');last=t;}
}

import React from 'react';
import type {Segment} from '../../../src/types';
import {ease} from '../../../src/components/primitives';
import {AnchorUsedOffer} from './AnchorUsedOffer';
import {Coffee} from './AnchorLifeScene';
import {T,Person} from './OpeningActors';

const ink='#25252b',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export const offerHoldEvents={basis:.3,offer:3.1,reply:6,leave:8.5,choice:9.1};
function Coat(){
 return <g transform="translate(285 520) scale(.72)" stroke={ink} strokeWidth="5" strokeLinejoin="round"><path d="M-52 -83 L-111 -42 L-74 13 L-45 -5 V116 H58 V-5 L85 13 L120 -42 L61 -83 L24 -62 H-13 Z" fill={coral}/><path d="M-52 -83 Q-11 -14 61 -83 M8 -60 V110" fill="none"/>{[-5,35,75].map(v=><circle key={v} cx="22" cy={v} r="4" fill={ink}/>)}</g>;
}
function Book(){
 return <g transform="translate(370 635) scale(.9)"><path d="M-100 -133 L90 -151 L106 130 L-92 143 Z" fill={coral} stroke={ink} strokeWidth="5"/><path d="M-83 -128 L-72 136" stroke={ink} strokeWidth="4"/><T x={3} y={-39} size={31} bold>思考，</T><T x={3} y={13} size={31} bold>快与慢</T><path d="M-53 58 H58 M-52 75 H38" stroke={paper} strokeWidth="7" strokeLinecap="round"/></g>;
}
export function AnchorEnding({segment,time}:{segment:Segment;time:number}){
 if(time<.3)return <AnchorUsedOffer segment={{...segment,events:offerHoldEvents}} time={359/30}/>;
 const e=segment.events,entry=ease((time-e.ask)/.4),counter=ease((time-e.counter)/.4),compared=ease((time-e.compare)/.4),decision=ease((time-e.decide)/.35);
 const fold=ease((time-e.takeaway)/.3),final=ease((time-e.takeaway-.3)/.4),move=ease((time-e.takeaway)/.7);
 const priceQuestion=time<e.counter;
 return <svg data-fullbleed-scene width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label="总结直播间与二手砍价：问依据、找反证、比较可比信息、按需求预算决定；最后提醒便宜多少取决于比较参照，买不买要看自己的依据">
  <defs><pattern id="ending-dots" width="27" height="27" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill="#fff8e9"/><rect width="1920" height="1080" fill="url(#ending-dots)"/>
  <T x={100} y={116} size={49} bold anchor="start">{time>=e.takeaway?'先找依据，再做决定':'两个场景，同一套方法'}</T>
  <g transform="translate(1653 93) rotate(-5)"><rect x="-118" y="-34" width="236" height="67" rx="7" fill={paper} stroke={teal} strokeWidth="4"/><T x={0} y={13} size={24} bold>锚定效应</T></g>
  {['问依据','找反证','比可比价','按需决定'].map((label,i)=><g key={label}><circle cx={130+i*450} cy="195" r="16" fill={[entry,counter,compared,decision][i]>.5?teal:paper} stroke={ink} strokeWidth="3"/><T x={165+i*450} y={207} size={28} bold anchor="start">{label}</T>{i<3&&<path d={`M${325+i*450} 195 H${545+i*450}`} stroke={ink} strokeWidth="3" strokeDasharray="5 9" opacity=".25"/>}</g>)}
  {time<e.takeaway+.3&&<g opacity={entry*(1-fold)} transform={`translate(0 ${12*(1-entry)})`}>
   {[100,1020].map(x=><g key={x}><rect x={x+11} y="286" width="800" height="589" rx="24" fill={ink}/><rect x={x} y="275" width="800" height="589" rx="24" fill={paper} stroke={ink} strokeWidth="4"/></g>)}
   <T x={500} y={332} size={32} bold>直播间降价</T><T x={1420} y={332} size={32} bold>二手砍价</T>
   <Coat/><Coffee x={1220} y={523} scale={.65} scratches={counter}/>
   <g opacity={1-counter*.55}>
    <T x={650} y={398} size={24} color="#666258">标注“原价”</T><T x={650} y={475} size={56} bold>¥ 999</T>
    <T x={1590} y={398} size={24} color="#666258">卖家开价</T><T x={1590} y={475} size={56} bold>¥ 2000</T>
   </g>
   <g opacity={counter}><path d="M543 472 L755 425 M1475 472 L1703 425" stroke={coral} strokeWidth="5" pathLength="1" strokeDasharray="1" strokeDashoffset={1-counter}/></g>
   <T x={650} y={558} size={31} bold>{priceQuestion?'原价有依据吗？':'查同款到手价'}</T><T x={1590} y={558} size={31} bold>{priceQuestion?'开价有依据吗？':'查成色、配件'}</T>
   <g opacity={counter} transform={`translate(0 ${10*(1-counter)})`}>
    <rect x="145" y="630" width="710" height="183" rx="15" fill={mint} stroke={ink} strokeWidth="3"/>
    <rect x="1065" y="630" width="710" height="183" rx="15" fill={mint} stroke={ink} strokeWidth="3"/>
    <T x={500} y={676} size={27} bold>核对同款、运费、售后</T><T x={1420} y={676} size={27} bold>核对同款、成色相近的成交</T>
    <g opacity={compared}>
     <T x={500} y={754} size={36} bold>本店 199 / 他店 189</T><T x={1420} y={754} size={36} bold>成交 1100–1300</T>
     <path d="M259 778 H743 M1201 778 H1637" stroke={teal} strokeWidth="4" pathLength="1" strokeDasharray="1" strokeDashoffset={1-compared}/>
    </g>
   </g>
  </g>}
  <g opacity={final}>
   <Book/><T x={370} y={835} size={30} bold>锚定效应</T>
   <T x={1115} y={525} size={44} bold>便宜多少，要看它和谁比。</T>
   <T x={1115} y={605} size={44} bold>买不买，要看自己的依据。</T>
   <Person x={1650} y={850} scale={1.05} pose={.45}/>
  </g>
  <g data-ending-decision opacity={decision}>
   <rect x={mix(370,700,move)} y={mix(900,704,move)} width={mix(1180,820,move)} height={mix(70,82,move)} rx="15" fill={mint} stroke={ink} strokeWidth="3"/>
   <T x={mix(960,1110,move)} y={mix(946,758,move)} size={mix(31,27,move)} bold>需要吗？预算合适吗？也可以不买。</T>
  </g>
 </svg>;
}

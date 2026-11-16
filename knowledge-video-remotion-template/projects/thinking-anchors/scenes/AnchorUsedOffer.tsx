import React from 'react';
import type {Segment} from '../../../src/types';
import {ease} from '../../../src/components/primitives';
import {AnchorUsedEvidence} from './AnchorUsedEvidence';
import {Coffee} from './AnchorLifeScene';
import {T,Talk,Person} from './OpeningActors';

const ink='#25252b',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
export const evidenceHoldEvents={'case-ready':1.8,reveal:.2,inspect:2.05,condition:2.7,'accessory-check':4,records:5.6,range:8.8,settle:10.8};
export function AnchorUsedOffer({segment,time}:{segment:Segment;time:number}){
 if(time<.3)return <AnchorUsedEvidence segment={{...segment,events:evidenceHoldEvents}} time={419/30}/>;
 const e=segment.events,wear=ease((time-e.basis-.45)/.35),missing=ease((time-e.basis-.75)/.35);
 const offer=ease((time-e.offer)/.45),reply=ease((time-e.reply)/.3),leave=ease((time-e.leave)/.65),status=ease((time-e.leave-.5)/.3);
 const choice=ease((time-e.choice)/.4);
 const lines=time<e.offer?['参考成交区间，','还要结合这台状况。']:time<e.reply?['这台有磨损、少配件，','我出 1200 元，行吗？']:time<e.leave?['价格谈不拢，','也不用急着加价。']:['那我再看看，','这次可以不成交。'];
 return <svg data-fullbleed-scene width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label="根据1100至1300元示例成交和商品磨损缺配件提出1200元示例报价，卖家拒绝后收回报价，可换一家或不买；并非标准估值公式">
  <defs><pattern id="offer-dots" width="27" height="27" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill="#fff8e9"/><rect width="1920" height="1080" fill="url(#offer-dots)"/>
  <T x={100} y={116} size={49} bold anchor="start">依据讲清楚，价格不合适就不成交</T>
  <g transform="translate(1653 93) rotate(-5)"><rect x="-118" y="-34" width="236" height="67" rx="7" fill={paper} stroke={coral} strokeWidth="4"/><T x={0} y={13} size={24} color="#bc503e" bold>剧情示例</T></g>
  {['说明依据','提出报价','保留选择'].map((label,i)=><g key={label}><circle cx={130+i*600} cy="195" r="16" fill={[1,offer,leave][i]>.5?teal:paper} stroke={ink} strokeWidth="3"/><T x={165+i*600} y={207} size={28} bold anchor="start">{label}</T>{i<2&&<path d={`M${340+i*600} 195 H${660+i*600}`} stroke={ink} strokeWidth="3" strokeDasharray="5 9" opacity=".25"/>}</g>)}
  <Coffee x={459} y={602} scale={.93} scratches={1}/>
  <ellipse cx="459" cy="744" rx="153" ry="16" fill={ink} opacity=".08"/>
  <g transform="translate(352 789) rotate(-5)"><rect x="-65" y="-37" width="130" height="59" rx="9" fill={paper} stroke={coral} strokeWidth="3"/><T x={0} y={3} size={27} color="#bc503e" bold>磨损</T></g>
  <g transform="translate(731 699)" stroke={ink} strokeWidth="4"><path d="M-30 -24 H27 L20 22 H-22 Z M-40 28 H39" fill="none" strokeDasharray="6 6"/><path d="M28 -12 H69" strokeDasharray="6 6"/></g>
  <path d="M693 668 L772 737 M774 666 L694 736" stroke={coral} strokeWidth="5" strokeLinecap="round"/><T x={732} y={804} size={28} color="#bc503e">少配件</T>
  <Person x={211-45*leave} y={817} scale={1.25} pose={offer*.6*(1-leave)} surprise={reply*.7*(1-leave)} tilt={-3*reply*(1-leave)}/>
  <Talk x={100} y={278} w={680} lines={lines}/>
  <rect x="1006" y="289" width="790" height="180" rx="20" fill={ink}/><rect x="995" y="278" width="790" height="180" rx="20" fill={paper} stroke={ink} strokeWidth="4"/>
  <T x={1390} y={323} size={27} bold>同款、成色相近的成交</T><T x={1390} y={412} size={53} bold>¥ 1100–1300</T>
  <g opacity={wear} transform={`translate(${15*(1-wear)} 0)`}><rect x="1010" y="473" width="325" height="52" rx="11" fill={mint} stroke={ink} strokeWidth="3"/><T x={1172} y={508} size={25} bold>这台：有磨损</T></g>
  <g opacity={missing} transform={`translate(${15*(1-missing)} 0)`}><rect x="1420" y="473" width="325" height="52" rx="11" fill={mint} stroke={ink} strokeWidth="3"/><T x={1582} y={508} size={25} bold>这台：少配件</T></g>
  <g data-offer-card opacity={offer*(1-leave)} transform={`translate(${-28*leave} ${14*(1-offer)+12*leave})`}>
   <rect x="1092" y="552" width="620" height="168" rx="18" fill={ink}/><rect x="1080" y="540" width="620" height="168" rx="18" fill={mint} stroke={ink} strokeWidth="4"/>
   <T x={1390} y={581} size={26} bold>我的出价（示例）</T><T x={1390} y={672} size={65} bold>¥ 1200</T>
  </g>
  <g data-seller-reply opacity={reply}><rect x="1000" y="739" width="785" height="109" rx="17" fill={paper} stroke={coral} strokeWidth="4"/><T x={1392} y={779} size={24} color="#666258">卖家回复</T><T x={1392} y={827} size={31} bold>这个价不卖。</T></g>
  <g data-walk-away opacity={status}>
   <rect x="1080" y="550" width="620" height="148" rx="18" fill={paper} stroke={teal} strokeWidth="4"/><T x={1390} y={641} size={48} bold>这次不成交</T>
  </g>
  <g data-choice-buttons opacity={choice} transform={`translate(0 ${9*(1-choice)})`}>
   <rect x="1005" y="900" width="375" height="70" rx="13" fill={mint} stroke={teal} strokeWidth="4"/><T x={1192} y={946} size={31} bold>换一家看看</T>
   <rect x="1410" y="900" width="375" height="70" rx="13" fill={paper} stroke={ink} strokeWidth="3"/><T x={1597} y={946} size={31} bold>也可以不买</T>
  </g>
 </svg>;
}

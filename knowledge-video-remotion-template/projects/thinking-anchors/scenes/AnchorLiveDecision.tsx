import React from 'react';
import type {Segment} from '../../../src/types';
import {ease} from '../../../src/components/primitives';
import {AnchorLiveMechanism} from './AnchorLiveMechanism';
import {T,Talk,Person} from './OpeningActors';

const ink='#25252b',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
export const mechanismHoldEvents={shift:.3,recall:1.2,compare:3.2,name:6.2,question:7.3};
function Coat(){
 return <g transform="translate(310 630)" stroke={ink} strokeWidth="5" strokeLinejoin="round"><path d="M-52 -83 L-111 -42 L-74 13 L-45 -5 V116 H58 V-5 L85 13 L120 -42 L61 -83 L24 -62 H-13 Z" fill={coral}/><path d="M-52 -83 Q-11 -14 61 -83 M8 -60 V110" fill="none"/>{[-5,35,75].map(v=><circle key={v} cx="22" cy={v} r="4" fill={ink}/>)}</g>;
}
function Comparable({title,value,y,p,highlight=0}:{title:string;value:number;y:number;p:number;highlight?:number}){
 return <g opacity={p} transform={`translate(${25*(1-p)} 0)`}>
  <rect x="520" y={y+10} width="540" height="151" rx="17" fill={ink}/><rect x="510" y={y} width="540" height="151" rx="17" fill={paper} stroke={ink} strokeWidth="4"/>
  <T x={550} y={y+43} size={25} bold anchor="start">{title}</T>
  <T x={780} y={y+118} size={50} bold>¥ {value}</T>
  <rect x="510" y={y} width="540" height="151" rx="17" fill="none" stroke={teal} strokeWidth="7" pathLength="1" strokeDasharray="1" strokeDashoffset={1-highlight} opacity={highlight}/>
 </g>;
}
export function AnchorLiveDecision({segment,time}:{segment:Segment;time:number}){
 if(time<.3)return <AnchorLiveMechanism segment={{...segment,events:mechanismHoldEvents}} time={299/30}/>;
 const e=segment.events,retire=ease((time-e.search)/.45),history=ease((time-e.history)/.45),other=ease((time-e.other)/.45);
 const compared=ease((time-e.compare)/.4),decision=ease((time-e.decision)/.35);
 const lines=time<e.compare?['有什么证据，','说明 199 不便宜？']:time<e.decision?['改看同款，','比较实际到手价。']:['我需要这件衣服吗？','价格在预算内吗？'];
 return <svg data-fullbleed-scene width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label="承接该用什么作依据的问题，先找反对199便宜的证据，查同款同条件的常态价219和另一家到手价189，再考虑需求和预算；所有金额为剧情示例">
  <defs><pattern id="decision-dots" width="27" height="27" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill="#fff8e9"/><rect width="1920" height="1080" fill="url(#decision-dots)"/>
  <T x={100} y={116} size={49} bold anchor="start">别只看降价，先查可比价格</T>
  <g transform="translate(1653 93) rotate(-5)"><rect x="-118" y="-34" width="236" height="67" rx="7" fill={paper} stroke={coral} strokeWidth="4"/><T x={0} y={13} size={24} color="#bc503e" bold>剧情示例</T></g>
  {['主动找反证','核对可比价格','按需作决定'].map((label,i)=><g key={label}><circle cx={130+i*600} cy="195" r="16" fill={[1,other,decision][i]>.5?teal:paper} stroke={ink} strokeWidth="3"/><T x={165+i*600} y={207} size={28} bold anchor="start">{label}</T>{i<2&&<path d={`M${380+i*600} 195 H${660+i*600}`} stroke={ink} strokeWidth="3" strokeDasharray="5 9" opacity=".25"/>}</g>)}
  <rect x="113" y="285" width="1008" height="680" rx="30" fill={ink}/><rect x="100" y="273" width="1008" height="680" rx="30" fill={paper} stroke={ink} strokeWidth="5"/>
  <path d="M103 361 H1106" stroke={ink} strokeWidth="3"/>
  <g transform="translate(166 319)" stroke={ink} strokeWidth="4" fill="none"><circle r="15"/><path d="M11 11 L28 28" strokeWidth="6" strokeLinecap="round"/></g>
  <T x={220} y={332} size={28} bold anchor="start">核对同款实际价格</T>
  <rect x="150" y="385" width="910" height="74" rx="13" fill={mint} stroke={ink} strokeWidth="3"/>
  <T x={605} y={433} size={29} bold>同款 · 同条件 · 比到手价</T>
  <Coat/><T x={310} y={810} size={25} color="#666258">同一件衣服</T>
  <Comparable title="近期常态价" value={219} y={500} p={history}/>
  <Comparable title="其他店到手价" value={189} y={697} p={other} highlight={compared}/>
  <g opacity={decision} transform={`translate(0 ${8*(1-decision)})`}>
   <rect x="150" y="877" width="910" height="57" rx="11" fill={mint} stroke={ink} strokeWidth="3"/>
   <T x={605} y={916} size={28} bold>按需决定，不急着买</T>
  </g>
  <Talk x={1208} y={280} w={600} lines={lines}/>
  <Person x={1690} y={825} pose={decision*.25} surprise={0} tilt={-4+4*decision}/>
  <g data-retiring-reference opacity={1-retire} transform={`translate(${60*retire} ${-30*retire})`}>
   <path d="M1230 440 H1577 Q1599 440 1599 462 V578 Q1599 600 1576 600 H1233 Q1211 600 1211 578 V462 Q1211 440 1230 440 Z" fill="#fce1d6" stroke={coral} strokeWidth="4"/>
   <T x={1410} y={486} size={25} color="#9c4738" bold>脑中的参照</T><T x={1410} y={572} size={64} bold>¥ 999</T>
   <rect x="1220" y="609" width="380" height="52" rx="10" fill={mint}/><T x={1410} y={645} size={28} bold>999 − 199 = 800</T>
  </g>
  <g data-comparison-result opacity={compared} transform={`translate(0 ${12*(1-compared)})`}>
   <rect x="1230" y="475" width="360" height="155" rx="20" fill={mint} stroke={teal} strokeWidth="4"/>
   <T x={1410} y={520} size={25} color="#666258">和另一家到手价比</T>
   <T x={1410} y={592} size={42} bold>相差 10 元</T>
  </g>
  <g data-actual-price>
   <rect x="1243" y="688" width="360" height="175" rx="25" fill={ink}/><rect x="1230" y="675" width="360" height="175" rx="25" fill={paper} stroke={ink} strokeWidth="5"/>
   <T x={1410} y={712} size={25} color="#666258">直播间到手价</T><T x={1410} y={798} size={60} bold>¥ 199</T>
  </g>
 </svg>;
}

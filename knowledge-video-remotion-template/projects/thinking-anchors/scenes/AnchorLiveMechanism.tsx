import React from 'react';
import type {Segment} from '../../../src/types';
import {ease} from '../../../src/components/primitives';
import {AnchorLiveOpening} from './AnchorLiveOpening';
import {T,Talk,Person,Hand} from './OpeningActors';

const ink='#25252b',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
// Preserve the accepted opening's terminal state. Export verifies these events
// against the accepted opening input, rather than silently following a new edit.
export const openingHoldEvents={drop:1.8,sale:3.6,pay:4.8,reach:7,pause:10,cover:10.5,compare:11.3};

export function AnchorLiveMechanism({segment,time}:{segment:Segment;time:number}){
 const openingSegment={...segment,events:openingHoldEvents};
 if(time<.3)return <AnchorLiveOpening segment={openingSegment} time={419/30}/>;
 const e=segment.events,move=ease((time-e.shift)/.8),clear=1-ease((time-e.shift)/.12);
 const recall=ease((time-e.recall)/.5),equation=ease((time-e.compare)/.35),name=ease((time-e.name)/.4);
 const referenceX=mix(1190,1410,recall),referenceScale=.92+.08*recall;
 const lines=time<e.compare?['屏幕遮住了 999，','心里却还在和它比。']:time<e.question?['只算了“少多少”，','还没查“值多少”。']:['199 到底贵不贵，','该用什么作依据？'];
 return <svg data-fullbleed-scene width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label="延续直播间场景，实际价格199不变，脑中重新浮现999参照并计算少800，说明锚定可能影响判断，再追问应寻找什么依据">
  <defs><pattern id="mechanism-dots" width="27" height="27" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill={ink} opacity=".055"/></pattern><clipPath id="keep-live-context"><rect x="0" y="250" width="1130" height="780"/></clipPath></defs>
  <rect width="1920" height="1080" fill="#fff8e9"/><rect width="1920" height="1080" fill="url(#mechanism-dots)"/>
  <T x={100} y={116} size={49} bold anchor="start">199 便宜吗，你在和谁比较？</T>
  <g transform="translate(1653 93) rotate(-5)"><rect x="-118" y="-34" width="236" height="67" rx="7" fill={paper} stroke={coral} strokeWidth="4"/><T x={0} y={13} size={24} color="#bc503e" bold>机制示意</T></g>
  {['想起最初报价','围着它比较','寻找判断依据'].map((label,i)=><g key={label}><circle cx={130+i*600} cy="195" r="16" fill={[recall,equation,time>=e.question?1:0][i]>.5?teal:paper} stroke={ink} strokeWidth="3"/><T x={165+i*600} y={207} size={28} bold anchor="start">{label}</T>{i<2&&<path d={`M${380+i*600} 195 H${660+i*600}`} stroke={ink} strokeWidth="3" strokeDasharray="5 9" opacity=".25"/>}</g>)}
  <g data-context-copy clipPath="url(#keep-live-context)" opacity={1-.2*move}><AnchorLiveOpening segment={openingSegment} time={419/30}/></g>
  <Talk x={1208} y={280} w={600} lines={lines}/>
  <Person x={1690} y={825} pose={0} surprise={.7*(1-name*.5)} tilt={-4}/>
  <g data-actual-price>
   <rect x="1243" y={mix(488,688,move)} width="360" height={mix(365,175,move)} rx="25" fill={ink}/>
   <rect x="1230" y={mix(475,675,move)} width="360" height={mix(365,175,move)} rx="25" fill={paper} stroke={ink} strokeWidth="5"/>
   <T x={1410} y={mix(537,712,move)} size={mix(27,25,move)} color="#666258">{move<.5?'先停一下':'到手价 · 保持不变'}</T>
   <T x={1410} y={mix(633,798,move)} size={60} bold>¥ 199</T>
   <g opacity={clear}><T x={1410} y={686} size={25} color="#666258">便宜，要有比较依据</T><rect x="1260" y="728" width="300" height="70" rx="12" fill={paper} stroke={ink} strokeWidth="3"/><T x={1410} y={775} size={32} bold>先查价格</T></g>
  </g>
  <Hand x={1608} y={904} opacity={1-ease((time-e.shift)/.4)}/>
  <g data-mental-reference opacity={recall} transform={`translate(${referenceX} 520) scale(${referenceScale})`}>
   <path d="M-180 -80 Q-199 -80 -199 -58 V58 Q-199 80 -177 80 H166 Q189 80 189 58 V-58 Q189 -80 167 -80 Z" fill="#fce1d6" stroke={coral} strokeWidth="4"/>
   <T x={0} y={-34} size={25} color="#9c4738" bold>脑中的参照</T>
   <T x={0} y={52} size={64} bold>¥ 999</T>
  </g>
  <path d="M1218 520 Q1170 520 1170 560 V765 Q1170 790 1218 790" fill="none" stroke={coral} strokeWidth="4" strokeDasharray="420" strokeDashoffset={420*(1-equation)} opacity={equation}/>
  <g data-comparison-equation opacity={equation}>
   <rect x="1220" y="609" width="380" height="52" rx="10" fill={mint}/>
   <T x={1410} y={645} size={28} bold>999 − 199 = 800</T>
   <path d="M1261 654 H1559" stroke={teal} strokeWidth="3" pathLength="1" strokeDasharray="1" strokeDashoffset={1-equation}/>
  </g>
  <g data-concept-label opacity={name} transform={`translate(0 ${10*(1-name)})`}>
   <rect x="181" y="556" width="495" height="142" rx="17" fill={ink}/><rect x="170" y="545" width="495" height="142" rx="17" fill={mint} stroke={ink} strokeWidth="4"/>
   <g transform="translate(222 590)" stroke={ink} strokeWidth="4" fill="none"><circle cy="-18" r="9"/><path d="M0 -9 V38 M-31 8 Q-31 41 0 40 Q31 41 31 8 M-31 8 L-41 20 M-31 8 L-17 16 M31 8 L41 20 M31 8 L17 16"/></g>
   <T x={450} y={606} size={43} bold>锚定效应</T>
   <T x={417} y={658} size={25}>最初的数字，可能成为参照。</T>
  </g>
 </svg>;
}

import React from 'react';
import {ease} from '../../../src/components/primitives';
import {Text} from '../landscape-opening-v2/Shapes';
import board from './board.json';
const ink='#25252b',cream='#fff8e9',teal='#45b9ae',coral='#ed795f';
export function ConceptTitle({time}:{time:number}){
 const lead=ease((time-board.events.topicLead)/.25),term=ease((time-board.events.term)/.25),line=ease((time-21.18)/.23);
 return <svg data-landscape-scene data-stage="concept-title" data-concept-title width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="今天我们讲《思考，快与慢》中的锚定效应">
  <defs><pattern id="topic-paper" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill={cream}/><rect width="1920" height="1080" fill="url(#topic-paper)"/>
  <g stroke={ink} strokeWidth="5" strokeLinecap="round" opacity={.17*term}>{Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return <path key={i} d={`M${960+800*Math.cos(a)} ${540+422*Math.sin(a)} L${960+920*Math.cos(a)} ${540+484*Math.sin(a)}`}/>;})}</g>
  <g transform={`translate(960 540) scale(${.96+.04*lead}) translate(-960 -540)`}>
   <rect x="265" y="182" width="1400" height="690" rx="24" fill={ink}/>
   <rect x="250" y="167" width="1400" height="690" rx="24" fill="#fffdf5" stroke={ink} strokeWidth="6"/>
   <path d="M282 199 H1620" stroke={teal} strokeWidth="12" strokeLinecap="round"/>
   <g opacity={lead}>
    <Text x={960} y={292} size={52}>今天我们讲</Text>
    <Text x={960} y={410} size={74}>《思考，快与慢》中的</Text>
   </g>
   <g opacity={term} transform={`translate(0 ${28*(1-term)})`}>
    <path d="M492 508 L1430 498 L1445 688 L478 699 Z" fill="#e3f4ec"/>
    <Text x={960} y={658} size={190}>锚定效应</Text>
    <path d="M567 735 Q955 763 1351 730" fill="none" stroke={coral} strokeWidth="13" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-line}/>
    <path d="M1482 490 V536 M1459 513 H1505" stroke={coral} strokeWidth="8" strokeLinecap="round"/>
    <path d="M408 658 L391 689 M380 646 L347 651" stroke={teal} strokeWidth="8" strokeLinecap="round"/>
   </g>
  </g>
 </svg>;
}

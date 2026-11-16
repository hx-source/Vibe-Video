import React from 'react';
import {ease} from '../../../src/components/primitives';
import {Text,Coat,PriceTag} from '../landscape-opening-v2/Shapes';
import {StoryShopper} from './Actor';
import board from './board.json';
const ink='#25252b',cream='#fff8e9',coral='#ed795f',paper='#fffdf5';
export function AnchorReason({time}:{time:number}){
 const arrow=ease((time-board.events.explain-.1)/.45),thought=ease((time-(board.events.reasonThought-.1))/.28);
 return <svg data-landscape-scene data-stage="reference-explains-judgment" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="主播报出的999成了参照；拿999一比，同一件衣服的199元售价就显得划算">
  <defs><pattern id="reason-paper" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill={cream}/><rect width="1920" height="1080" fill="url(#reason-paper)"/>
  <path d="M0 945 Q770 903 1920 950 V1080 H0 Z" fill="#e9dec9"/><path d="M0 982 Q950 943 1920 984" fill="none" stroke="#d8cbb5" strokeWidth="3"/>
  <ellipse cx="1610" cy="1002" rx="240" ry="27" fill={ink} opacity=".08"/>
  <Text x={960} y={155} size={68}>拿999一比，199就显得划算</Text>
  <g transform="translate(329 567) scale(1.42) rotate(-3)"><Coat/></g>
  <Text x={329} y={825} size={40}>同一件衣服</Text>
  <path d="M408 466 Q459 397 625 405" fill="none" stroke={ink} strokeWidth="4"/>
  <g data-reference-price transform="translate(835 287)">
   <rect x="-264" y="-68" width="528" height="136" rx="20" fill="#fce1d6" stroke={coral} strokeWidth="5" strokeDasharray="10 8"/>
   <Text x={-164} y={17} size={38} color="#a34d3c">参照</Text><Text x={58} y={37} size={96} color="#a34d3c">999</Text>
  </g>
  <g stroke={coral} strokeWidth="6" strokeLinecap="round" fill="none">
   <path d="M1118 309 Q1310 299 1433 485" pathLength="1" strokeDasharray="1" strokeDashoffset={1-arrow}/>
   <path d="M1405 467 L1433 485 L1403 494" opacity={arrow}/>
  </g>
  <g data-fixed-price><PriceTag x={835} y={570} w={610} h={404} label="实际售价" value={199}/></g>
  <g transform="translate(706 -925) scale(1.1)"><StoryShopper time={9.2} clock={time}/></g>
  <g data-relative-judgment opacity={thought} transform={`translate(1555 ${285+10*(1-thought)})`}>
   <path d="M-195 -56 H195 Q215 -56 215 -36 V28 Q215 48 195 48 H-25 L-38 83 L-66 48 H-195 Q-215 48 -215 28 V-36 Q-215 -56 -195 -56 Z" fill={paper} stroke={ink} strokeWidth="4"/>
   <Text x={0} y={18} size={52}>显得划算</Text>
  </g>
 </svg>;
}

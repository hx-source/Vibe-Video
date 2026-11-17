import React from 'react';
import {ease} from '../../../src/components/primitives';
import {Text,Coat,PriceTag} from '../landscape-opening-v2/Shapes';
import {StoryShopper} from './Actor';
import board from './board.json';
const ink='#25252b',cream='#fff8e9',teal='#45b9ae',paper='#fffdf5';
export function BeforeAfterPrice({time}:{time:number}){
 const after=ease((time-board.events.compareAfter)/.4),conclusion=ease((time-board.events.compareConclude)/.3),pencil=ease((time-12.32)/.235);
 const happyClock=7.8+1.2*ease((time-board.events.compareAfter)/.6);
 return <svg data-landscape-scene data-stage="same-item-same-price" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="同一件衣服，讲解前199，讲解后仍是199；人物从有点贵变为挺划算，价格没变，判断变了">
  <defs><pattern id="compare-paper" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill={cream}/><rect width="1920" height="1080" fill="url(#compare-paper)"/>
  <path d="M0 945 Q770 903 1920 950 V1080 H0 Z" fill="#e9dec9"/><path d="M0 982 Q950 943 1920 984" fill="none" stroke="#d8cbb5" strokeWidth="3"/>
  <Text x={960} y={155} size={80}>同一件衣服</Text>
  <path d="M798 449 Q729 404 662 430" fill="none" stroke={ink} strokeWidth="4"/>
  <path d="M1122 449 Q1191 404 1258 430" fill="none" stroke={ink} strokeWidth="4" opacity={after}/>
  <g data-same-item transform="translate(960 465) scale(1.35)"><Coat/></g>
  <g data-before-price><PriceTag x={430} y={430} w={460} h={280} label="讲解前" value={199}/></g>
  <path d="M294 544 Q427 558 566 544" fill="none" stroke={teal} strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-pencil}/>
  <g data-after-price opacity={after} transform={`translate(${32*(1-after)} 0)`}><PriceTag x={1490} y={430} w={460} h={280} label="讲解后" value={199}/></g>
  <g data-before-person transform="translate(-165 -62) scale(.6)"><StoryShopper time={1.8} clock={time}/></g>
  <g data-after-person opacity={after} transform={`translate(${1155+32*(1-after)} -62) scale(.6)`}><StoryShopper time={happyClock} clock={time+.8}/></g>
  <g data-before-thought transform="translate(555 721)">
   <path d="M-139 -61 H139 Q153 -61 153 -47 V30 Q153 46 139 46 H-77 L-172 69 L-139 22 V-47 Q-139 -61 -124 -61 Z" fill={paper} stroke={ink} strokeWidth="4"/>
   <Text x={0} y={12} size={54}>有点贵</Text>
  </g>
  <g data-after-thought opacity={after} transform="translate(1350 721)">
   <path d="M-139 -61 H139 Q153 -61 153 -47 V22 L190 69 L83 46 H-139 Q-153 46 -153 30 V-47 Q-153 -61 -139 -61 Z" fill={paper} stroke={ink} strokeWidth="4"/>
   <Text x={0} y={12} size={54}>挺划算</Text>
  </g>
  <g opacity={after} stroke={teal} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round">
   <path d="M779 718 H1141" pathLength="1" strokeDasharray="1" strokeDashoffset={1-after}/><path d="M1112 695 L1141 718 L1112 741"/>
  </g>
  <g opacity={conclusion} transform={`translate(0 ${12*(1-conclusion)})`}><Text x={960} y={896} size={70}>价格没变，判断变了</Text></g>
 </svg>;
}

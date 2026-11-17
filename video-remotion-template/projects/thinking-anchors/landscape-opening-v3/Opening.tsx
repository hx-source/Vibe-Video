import React from 'react';
import {ease} from '../../../src/components/primitives';
import {AnchorLandscapeFocus} from '../landscape-final-v1/Decision';
import {Text,Coat,PriceTag} from '../landscape-opening-v2/Shapes';
import {StoryShopper} from './Actor';
import board from './board.json';
import {LiveHost} from './Host';
const ink='#25252b',cream='#fff8e9',paper='#fffdf5',coral='#ed795f',teal='#45b9ae';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export function AnchorLandscapeOpening({frame}:{frame:number}){
 if(!Number.isInteger(frame)||frame<0||frame>=720)throw Error('Opening frame outside 0–719');
 const t=frame/30,e=board.events;
 if(t>=e.match)return <AnchorLandscapeFocus frame={0}/>;
 const reveal=ease((t-e.reference)/.6),reality=ease((t-e.reality)/.65),explain=ease((t-e.explain)/.65),question=ease((t-e.question)/.8),inset=reveal*(1-reality);
 const memory=explain*(1-question),banner=reveal*(1-reality);
 const headline=t<12?board.hook:t<17?'价格没变，判断变了':t<20?'“原价”成了参照':t<21?'锚定效应':'该拿什么比？';
 const doubt=1-ease((t-3.7)/.3),delight=ease((t-8)/.4)*(1-ease((t-11.6)/.4)),objectLabel=1-ease((t-21.6)/.6);
 const phase=t<4?'price-feels-high':t<8?'reference-revealed':t<12?'same-price-feels-cheap':t<17?'payment-unchanged':t<21?'reference-guides-judgment':'ask-what-to-compare';
 const matchedClock=mix(t-2/3,70/3,ease((t-21)/2));
 return <svg data-landscape-scene data-stage={phase} width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="直播间主播介绍199元的衣服，报出原价999后，买家从犹豫到心动；价格未变，引出锚定效应与该拿什么比">
  <defs><pattern id="focus-paper" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill={cream}/><rect width="1920" height="1080" fill="url(#focus-paper)"/>
  <path d="M0 945 Q770 903 1920 950 V1080 H0 Z" fill="#e9dec9"/><path d="M0 982 Q950 943 1920 984" fill="none" stroke="#d8cbb5" strokeWidth="3"/>
  <ellipse cx="1610" cy="1002" rx="240" ry="27" fill={ink} opacity=".08"/><ellipse cx="755" cy="948" rx="590" ry="30" fill={ink} opacity=".05"/>
  <Text x={t<12?960:820} y={165} size={t<12?76:76}>{headline}</Text>
  <g data-live-room opacity={1-reality}>
   <rect x="72" y="245" width="1120" height="650" rx="28" fill={ink} transform="translate(10 10)"/>
   <rect x="72" y="245" width="1120" height="650" rx="28" fill={paper} stroke={ink} strokeWidth="6"/>
   <path d="M100 245 H1164 Q1192 245 1192 273 V315 H72 V273 Q72 245 100 245" fill="#fce1d6" stroke={ink} strokeWidth="6"/>
   <circle cx="122" cy="281" r="10" fill={coral}/><Text x={222} y={294} size={34}>直播中</Text>
   <Text x={1002} y={294} size={34}>服装直播间</Text>
   <LiveHost time={t}/>
   <g data-host-speech opacity={reveal} transform={`translate(304 ${389-10*(1-reveal)})`}>
    <path d="M-196 -62 H196 Q212 -62 212 -46 V40 Q212 56 196 56 H-60 L-82 88 L-86 56 H-196 Q-212 56 -212 40 V-46 Q-212 -62 -196 -62 Z" fill={paper} stroke={ink} strokeWidth="4"/>
    <text x="0" y="-12" textAnchor="middle" fontSize="43" fontWeight="700" fill={ink}>原价 <tspan fill="#b54a35" fontSize="65">999</tspan></text>
    <Text x={0} y={39} size={40}>今天只要199！</Text>
   </g>
  </g>
  <g transform={`translate(${mix(434,329,reality)} ${mix(600,567,reality)}) scale(${mix(.72,1.42,reality)}) rotate(${-3*reality})`}><Coat/></g>
  <g opacity={objectLabel} data-object-label><Text x={mix(434,329,reality)} y={mix(790,825,reality)} size={mix(34,44,reality)}>{board.objectLabel}</Text></g>
  <path d="M408 466 Q459 397 625 405" fill="none" stroke={ink} strokeWidth="4" opacity={reality}/>
  <g opacity={memory} transform={`translate(835 ${287-22*question})`}>
   <rect x="-264" y="-68" width="528" height="136" rx="20" fill="#fce1d6" stroke={coral} strokeWidth="5" strokeDasharray="10 8"/>
   <Text x={-164} y={17} size={38} color="#a34d3c">参照</Text><Text x={58} y={37} size={96} color="#a34d3c">999</Text>
   <path d="M283 22 Q478 12 598 198" fill="none" stroke={coral} strokeWidth="6" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-ease((t-17.25)/.3)}/>
   <path d="M570 180 L598 198 L568 207" fill="none" stroke={coral} strokeWidth="6" strokeLinecap="round" opacity={ease((t-17.4)/.15)}/>
  </g>
  <g data-fixed-price><PriceTag x={835} y={570} w={610} h={404} label={t<12?'直播价':t<17?'付款金额':'本店到手'} value={199}/></g>
  <path d="M687 738 Q841 751 997 737" fill="none" stroke={teal} strokeWidth="8" strokeLinecap="round" opacity={reality*(1-explain)} pathLength="1" strokeDasharray="1" strokeDashoffset={1-ease((t-12.3)/.28)}/>
  <g transform="translate(706 -925) scale(1.1)"><StoryShopper time={t} clock={matchedClock}/></g>
  <g opacity={1-reality}><Text x={1555} y={1038} size={34}>正在看直播的你</Text></g>
  {[{label:'有点贵',p:doubt},{label:'好像挺划算',p:delight}].map(item=><g key={item.label} data-judgment={item.label} opacity={item.p} transform={`translate(1555 ${285+10*(1-item.p)})`}>
   <path d="M-195 -56 H195 Q215 -56 215 -36 V28 Q215 48 195 48 H-25 L-38 83 L-66 48 H-195 Q-215 48 -215 28 V-36 Q-215 -56 -195 -56 Z" fill={paper} stroke={ink} strokeWidth="4"/>
   <Text x={0} y={18} size={52}>{item.label}</Text>
  </g>)}
 </svg>;
}
export const openingScenes={'anchor-landscape-opening':AnchorLandscapeOpening};
export function validateOpening(){
 if(board.video.width!==1920||board.video.height!==1080||board.video.fps!==30||board.durationSeconds!==24||!openingScenes[board.sceneType as keyof typeof openingScenes])throw Error('Invalid opening scene configuration');
 let last=-1;for(const t of Object.values(board.events)){if(t<=last||t<0||t>=24||Math.abs(t*30-Math.round(t*30))>1e-6)throw Error('Invalid opening event');last=t;}
 for(const c of board.captions)if(c.from<0||c.to>24||c.to<=c.from||!c.text)throw Error('Invalid caption');
}

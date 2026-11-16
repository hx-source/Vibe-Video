import React from 'react';
import {ease} from '../../../src/components/primitives';
import {AnchorLandscapeFocus} from '../landscape-focus-v1/Decision';
import {Text,Coat,PriceTag} from './Shapes';
import {StoryShopper} from './Actor';
import board from './board.json';
const ink='#25252b',cream='#fff8e9',paper='#fffdf5',coral='#ed795f',teal='#45b9ae';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export function AnchorLandscapeOpening({frame}:{frame:number}){
 if(!Number.isInteger(frame)||frame<0||frame>=720)throw Error('Opening frame outside 0–719');
 const t=frame/30,e=board.events;
 if(t>=e.match)return <AnchorLandscapeFocus frame={0}/>;
 const reveal=ease((t-e.reference)/.6),reality=ease((t-e.reality)/.65),explain=ease((t-e.explain)/.65),question=ease((t-e.question)/.8),inset=reveal*(1-reality);
 const memory=explain*(1-question),banner=reveal*(1-reality),pop=ease(t/.45);
 let tagY=mix(570,657,inset),tagH=mix(404,344,inset),tagW=mix(610,550,inset);
 tagY=mix(tagY,706,memory);tagH=mix(tagH,300,memory);tagW=mix(tagW,480,memory);
 const headline=t<4?'199一件？有点贵。':t<8?'再听商家一句话……':t<12?'好像，挺划算？':t<17?'你付的，还是199':t<20?'拿999，判断199值不值':t<21?'锚定效应':'该拿什么比？';
 const phase=t<4?'price-feels-high':t<8?'reference-revealed':t<12?'same-price-feels-cheap':t<17?'payment-unchanged':t<21?'reference-guides-judgment':'ask-what-to-compare';
 const matchedClock=mix(t-2/3,70/3,ease((t-21)/2));
 return <svg data-landscape-scene data-stage={phase} width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="同一件衣服售价199，听到原价999后觉得划算，实际付款未变；引出锚定效应与该拿什么比">
  <defs><pattern id="focus-paper" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill={cream}/><rect width="1920" height="1080" fill="url(#focus-paper)"/>
  <path d="M0 945 Q770 903 1920 950 V1080 H0 Z" fill="#e9dec9"/><path d="M0 982 Q950 943 1920 984" fill="none" stroke="#d8cbb5" strokeWidth="3"/>
  <ellipse cx="1610" cy="1002" rx="240" ry="27" fill={ink} opacity=".08"/><ellipse cx="755" cy="948" rx="590" ry="30" fill={ink} opacity=".05"/>
  <Text x={820} y={177} size={t>=17&&t<20?68:76}>{headline}</Text>
  <g transform={`translate(329 567) scale(1.42) rotate(-3)`}><Coat/></g>
  <path d={`M408 466 Q459 397 ${625-30*inset} ${405+80*inset+70*memory}`} fill="none" stroke={ink} strokeWidth="4"/>
  <g opacity={banner} transform={`translate(835 ${349-60*(1-reveal)-65*reality}) rotate(${-4*(1-reveal)})`}>
   <path d="M-276 -86 H278 V86 H-276 Z" fill={ink} transform="translate(9 10)"/>
   <rect x="-276" y="-86" width="554" height="172" rx="13" fill="#fce1d6" stroke={ink} strokeWidth="5"/>
   <Text x={-164} y={21} size={42}>原价</Text><Text x={58} y={45} size={112}>999</Text>
   <path d="M-53 6 L170 -16" stroke={coral} strokeWidth="7" strokeLinecap="round" opacity={ease((t-5.2)/.35)}/>
  </g>
  <g opacity={memory} transform={`translate(835 ${405-22*question})`}>
   <path d="M-244 -119 H244 Q264 -119 264 -99 V95 Q264 115 244 115 H47 L18 154 L-4 115 H-244 Q-264 115 -264 95 V-99 Q-264 -119 -244 -119 Z" fill="#fce1d6" stroke={coral} strokeWidth="5" strokeDasharray="10 8"/>
   <Text x={0} y={-49} size={38} color="#a34d3c">参照</Text><Text x={0} y={73} size={125} color="#a34d3c">999</Text>
   <path d="M283 22 Q478 -12 598 80" fill="none" stroke={coral} strokeWidth="6" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-ease((t-17.25)/.3)}/>
   <path d="M571 60 L598 80 L566 88" fill="none" stroke={coral} strokeWidth="6" strokeLinecap="round" opacity={ease((t-17.4)/.15)}/>
  </g>
  <g transform={`translate(${24*(1-pop)} ${8*(1-pop)}) rotate(${-2*(1-pop)} 835 570)`}>
   <PriceTag x={835} y={tagY} w={tagW} h={tagH} label={t>=12&&t<17?'付款金额':'本店到手'} value={199}/>
  </g>
  <path d="M687 738 Q841 751 997 737" fill="none" stroke={teal} strokeWidth="8" strokeLinecap="round" opacity={reality*(1-explain)} pathLength="1" strokeDasharray="1" strokeDashoffset={1-ease((t-12.3)/.28)}/>
  <g transform="translate(706 -925) scale(1.1)"><StoryShopper time={t} clock={matchedClock}/></g>
 </svg>;
}
export const openingScenes={'anchor-landscape-opening':AnchorLandscapeOpening};
export function validateOpening(){
 if(board.video.width!==1920||board.video.height!==1080||board.video.fps!==30||board.durationSeconds!==24||!openingScenes[board.sceneType as keyof typeof openingScenes])throw Error('Invalid opening scene configuration');
 let last=-1;for(const t of Object.values(board.events)){if(t<=last||t<0||t>=24||Math.abs(t*30-Math.round(t*30))>1e-6)throw Error('Invalid opening event');last=t;}
 for(const c of board.captions)if(c.from<0||c.to>24||c.to<=c.from||!c.text)throw Error('Invalid caption');
}

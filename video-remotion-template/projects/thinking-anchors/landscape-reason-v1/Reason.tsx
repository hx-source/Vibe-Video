import React from 'react';
import {ease} from '../../../src/components/primitives';
import {Text,Coat,PriceTag} from '../landscape-opening-v2/Shapes';
import {StoryShopper} from '../landscape-opening-v6/Actor';
import {OpeningChapter} from '../landscape-opening-v9/Opening';
import {AnchorLandscapeFocus} from '../landscape-final-v1/Decision';
import board from './board.json';
const ink='#25252b',cream='#fff8e9',paper='#fffdf5',coral='#ed795f',teal='#45b9ae';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export function AnchorReason({frame}:{frame:number}){
 if(!Number.isInteger(frame)||frame<0||frame>=420)throw Error('Reason frame outside0–419');
 const t=frame/30,e=board.events;
 if(t<e.switch)return <OpeningChapter frame={599}/>;
 if(t>=e.match)return <AnchorLandscapeFocus frame={0}/>;
 const anchor=ease((t-e.anchor)/.23),arrow=ease((t-e.arrow)/.5),label=ease((t-e.label)/.25),flip=ease((t-e.question)/.35),happy=ease((t-e.judgment)/.4),bridge=ease((t-e.bridge)/.4);
 const heading=t<e.question?'值多少还没查，先拿999比':t<e.judgment?'关注的问题，悄悄换了':t<e.bridge?'比999便宜，就显得划算':'该拿什么比？';
 const thought=t<e.question?'值不值199？':t<e.question+.35&&flip<.5?'值不值199？':t<e.judgment?'比999便宜多少？':t<e.bridge?'好像挺划算':'它到底值多少？';
 const flipScale=t>=e.question&&t<e.question+.35?Math.abs(1-2*flip):1;
 const pointPose=mix(13.8,18.3,ease((t-e.anchor)/.7)),thinkingPose=mix(pointPose,13.8,ease((t-e.question)/.5));
 const poseTime=mix(mix(thinkingPose,9.2,happy),13.8,bridge),refOpacity=anchor*(1-bridge),clock=20+t;
 const stage=t<e.question?'anchor-enters-comparison':t<e.judgment?'question-shifts-to-relative-price':t<e.bridge?'same199-feels-cheap':'ask-for-independent-evidence';
 return <svg data-landscape-scene data-stage={stage} width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="999作为现成参照影响判断，思考从值不值199转向比999便宜多少，同样199显得划算，但仍需要独立依据">
  <defs><pattern id="reason-paper" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill={cream}/><rect width="1920" height="1080" fill="url(#reason-paper)"/>
  <path d="M0 945 Q770 903 1920 950 V1080 H0 Z" fill="#e9dec9"/><path d="M0 982 Q950 943 1920 984" fill="none" stroke="#d8cbb5" strokeWidth="3"/>
  <ellipse cx="1610" cy="1002" rx="240" ry="27" fill={ink} opacity=".08"/><ellipse cx="755" cy="948" rx="590" ry="30" fill={ink} opacity=".05"/>
  <Text x={820} y={177} size={76}>{heading}</Text>
  <g data-same-item transform="translate(329 567) scale(1.42) rotate(-3)"><Coat/></g>
  <Text x={329} y={825} size={40}>同一件衣服</Text>
  <path d="M408 466 Q459 397 625 405" fill="none" stroke={ink} strokeWidth="4"/>
  <g data-fixed-price><PriceTag x={835} y={570} w={610} h={404} label="实际售价" value={199}/></g>
  <g data-anchor-price opacity={refOpacity} transform={`translate(${835-210*(1-anchor)} ${287+18*(1-anchor)}) rotate(${-7*(1-anchor)})`}>
   <rect x="-264" y="-68" width="528" height="136" rx="20" fill="#fce1d6" stroke={coral} strokeWidth="5" strokeDasharray="10 8"/>
   <Text x={-131} y={13} size={label>.5?38:32} color="#a34d3c">{label>.5?'现成参照':'主播说的原价'}</Text>
   <Text x={130} y={37} size={96} color="#a34d3c">999</Text>
  </g>
  <g opacity={refOpacity} fill="none" stroke={coral} strokeWidth="6" strokeLinecap="round">
   <path d="M1118 287 Q1230 225 1320 284" pathLength="1" strokeDasharray="1" strokeDashoffset={1-arrow}/><path d="M1292 267 L1320 284 L1292 296" opacity={arrow}/>
  </g>
  <g data-buyer transform="translate(706 -925) scale(1.1)"><StoryShopper time={poseTime} clock={clock}/></g>
  <g data-thinking transform={`translate(1555 285) scale(1 ${flipScale})`}>
   <path d="M-195 -56 H195 Q215 -56 215 -36 V28 Q215 48 195 48 H-25 L-38 83 L-66 48 H-195 Q-215 48 -215 28 V-36 Q-215 -56 -195 -56 Z" fill={paper} stroke={ink} strokeWidth="4"/>
   <Text x={0} y={18} size={thought==='比999便宜多少？'?43:48}>{thought}</Text>
  </g>
  <g opacity={happy*(1-bridge)}><path d="M1392 350 Q1556 362 1714 349" fill="none" stroke={teal} strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-happy}/></g>
  <g opacity={bridge} transform={`translate(0 ${14*(1-bridge)})`}><Text x={835} y={911} size={66}>便宜 ≠ 值得买</Text></g>
 </svg>;
}

import React from 'react';
import {ease} from '../../../src/components/primitives';
import {Person} from '../scenes/OpeningActors';
import board from './storyboard.json';

const ink='#25252b',cream='#fff8e9',paper='#fffdf5',coral='#ed795f',mint='#e3f4ec',teal='#45b9ae',yellow='#ffe59c';
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const pop=(p:number)=>{const q=Math.max(0,Math.min(1,p));return 1+2.70158*(q-1)**3+1.70158*(q-1)**2;};
function Txt({x=0,y=0,size=64,children,color=ink,opacity=1}:{x?:number;y?:number;size?:number;children:React.ReactNode;color?:string;opacity?:number}){
 return <text x={x} y={y} fontSize={size} textAnchor="middle" fontWeight="700" fill={color} opacity={opacity}>{children}</text>;
}
function Coat({x,y,scale,opacity=1}:{x:number;y:number;scale:number;opacity?:number}){
 return <g opacity={opacity} transform={`translate(${x} ${y}) scale(${scale})`} stroke={ink} strokeWidth="6" strokeLinejoin="round"><path d="M-52 -83 L-111 -42 L-74 13 L-45 -5 V116 H58 V-5 L85 13 L120 -42 L61 -83 L24 -62 H-13 Z" fill={coral}/><path d="M-52 -83 Q-11 -14 61 -83 M8 -60 V110" fill="none"/>{[-5,35,75].map(v=><circle key={v} cx="22" cy={v} r="4" fill={ink}/>)}</g>;
}
function Tag({w,h,fill=paper,children}:{w:number;h:number;fill?:string;children:React.ReactNode}){
 return <><path d={`M${-w/2+22} ${-h/2+14} H${w/2-18} L${w/2+10} ${-h/2+44} V${h/2-10} Q${w/2+10} ${h/2+14} ${w/2-14} ${h/2+14} H${-w/2+38} Q${-w/2+14} ${h/2+14} ${-w/2+14} ${h/2-10} V${-h/2+38} Q${-w/2+14} ${-h/2+14} ${-w/2+38} ${-h/2+14} Z`} fill={ink}/><path d={`M${-w/2+24} ${-h/2} H${w/2-28} L${w/2} ${-h/2+28} V${h/2-24} Q${w/2} ${h/2} ${w/2-24} ${h/2} H${-w/2+24} Q${-w/2} ${h/2} ${-w/2} ${h/2-24} V${-h/2+24} Q${-w/2} ${-h/2} ${-w/2+24} ${-h/2} Z`} fill={fill} stroke={ink} strokeWidth="6"/>{children}</>;
}
function Thought({p}:{p:number}){
 return <g data-focus="judgement" opacity={Math.min(1,p)} transform={`translate(490 1030) scale(${lerp(.85,1,p)})`}>
  <path d="M-318 -104 Q-369 -91 -354 -38 Q-388 10 -350 56 Q-351 106 -290 110 H283 Q349 117 354 68 Q395 24 357 -24 Q375 -95 310 -104 Q270 -142 223 -111 H-218 Q-270 -142 -318 -104 Z" fill={yellow} stroke={ink} strokeWidth="6"/>
  <ellipse cx="94" cy="153" rx="25" ry="18" fill={yellow} stroke={ink} strokeWidth="5"/><circle cx="62" cy="202" r="11" fill={yellow} stroke={ink} strokeWidth="4"/>
  <Txt y={36} size={103}>省了800！</Txt>
 </g>;
}
export function AnchorPortraitOpening({frame}:{frame:number}){
 const time=frame/30,e=board.events;
 const drop=ease((time-e.drop)/.45),happy=ease((time-e.happy)/.45),check=ease((time-e.check)/.45),other=ease((time-e.other)/.45),compare=ease((time-e.compare)/.50);
 const strike=ease((time-e.strike)/.24),sale=ease((time-e.drop-.21)/.24),thoughtOpacity=ease((time-e.happy-.22)/.25)*(1-check);
 const label=ease((time-e.check-.14)/.31),newHeadline=ease((time-e.compare-.15)/.35);
 const tagX=lerp(490,285,check)-35*compare,tagY=lerp(900,665,happy)+50*check+90*compare,tagScale=lerp(1,.64,happy)-.21*check-.03*compare;
 const stage=time<e.happy?'price':time<e.check?'judgement':time<e.other?'question':time<e.compare?'new-evidence':'reconsider';
 const newX=lerp(660,490,other)+185*compare,newY=1030+80*(1-other)-225*compare,newScale=lerp(1,.63,compare);
 const delight=happy*(1-check),surprise=other*.78;
 return <svg data-portrait-scene data-stage={stage} width="1080" height="1920" viewBox="0 0 1080 1920" role="img" aria-label="漫画直播间：999划掉降到199，觉得省了800；发现另一家同款同条件189，重新比较199和189，追问刚才在和谁比">
  <defs><pattern id="portrait-dots" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.35" fill={ink} opacity=".055"/></pattern><radialGradient id="portrait-wash"><stop stopColor={yellow} stopOpacity=".55"/><stop offset="1" stopColor={cream} stopOpacity="0"/></radialGradient></defs>
  <rect width="1080" height="1920" fill={cream}/><rect width="1080" height="1920" fill="url(#portrait-dots)"/>
  <ellipse cx="490" cy="1000" rx="520" ry="680" fill="url(#portrait-wash)" opacity={.25+.75*delight}/>
  <g data-headline="hook" opacity={1-ease((time-e.happy+.15)/.3)}><Txt x={490} y={300} size={81}>降价，就赚了？</Txt><path d="M315 335 Q493 354 666 335" stroke={coral} strokeWidth="8" strokeLinecap="round" fill="none"/></g>
  <g opacity={check*(1-ease((time-e.compare)/.14))} transform={`translate(0 ${18*(1-check)})`}><Txt x={490} y={300} size={81}>另一家呢？</Txt></g>
  <g data-headline="reconsider" opacity={newHeadline} transform={`translate(0 ${18*(1-newHeadline)})`}><Txt x={490} y={270} size={76}>你刚才，</Txt><Txt x={490} y={380} size={88}>在和谁比？</Txt></g>
  <Coat x={490} y={lerp(505,445,check)} scale={lerp(1.15,.85,check)} opacity={(1-happy*(1-check))*(1-ease((time-e.compare+.3)/.3))}/>
  <g data-object="live-price" transform={`translate(${tagX} ${tagY}) scale(${tagScale}) rotate(${lerp(-3,-6,check)})`}>
   <Tag w={760} h={450} fill={drop>.5?mint:paper}>
    <g opacity={1-strike}><Txt y={-145} size={43}>标注原价</Txt></g>
    <g data-object="anchor-999" opacity={1-ease((time-e.check)/.12)} transform={`translate(0 ${-150*drop}) scale(${1-.66*drop})`}>
     <Txt y={65} size={225}>999</Txt>
     <path d="M-255 30 L255 -88" stroke={coral} strokeWidth="14" fill="none" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-strike} opacity={strike}/>
    </g>
    <g data-object="sale-199" opacity={sale} transform={`translate(0 ${22*(1-sale)}) scale(${.94+.06*sale})`}>
     <Txt y={lerp(-60,-100,label)} size={lerp(43,78,label)} opacity={ease((time-e.drop-.33)/.12)}>{check>.5?'刚才那家':'到手价'}</Txt>
     <Txt y={155} size={225}>199</Txt>
    </g>
   </Tag>
  </g>
  <Thought p={thoughtOpacity*pop((time-e.happy-.22)/.42)}/>
  <g data-object="other-price" opacity={other} transform={`translate(${newX} ${newY}) scale(${newScale}) rotate(${lerp(3,2,compare)})`}>
   <Tag w={760} h={350} fill={mint}>
    <Txt y={lerp(-105,-95,compare)} size={lerp(43,64,compare)}>{time>=e.compare?'另一家':'同款同条件 · 到手价'}</Txt>
    <Txt y={116} size={225} color="#207b72">189</Txt>
   </Tag>
  </g>
  <g data-object="price-difference" opacity={ease((time-e.compare-.12)/.3)}>
   <path d="M250 971 V1006 H675 V971" fill="none" stroke={teal} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-ease((time-e.compare-.10)/.3)}/>
   <Txt x={490} y={1133} size={70} opacity={ease((time-e.compare-.52)/.25)}>相差10元</Txt>
  </g>
  <g data-character transform={`translate(0 ${12*Math.sin(Math.min(1,Math.max(0,(time-e.happy)/.5))*Math.PI)*(1-check)})`}>
   <Person x={490} y={1370} scale={1.55} pose={delight} surprise={surprise} tilt={-5*check}/>
   <g opacity={delight} transform="translate(674 1280) rotate(10)"><path d="M0 -9 C-28 -44 -54 -8 -28 18 L0 45 L28 18 C54 -8 28 -44 0 -9 Z" fill={coral} stroke={ink} strokeWidth="4"/></g>
   <g opacity={surprise} fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round" transform="translate(663 1265)"><path d="M-16 -14 Q-19 -47 13 -47 Q49 -45 33 -18 L13 2 V15"/><path d="M13 37 v1" strokeWidth="10"/></g>
  </g>
 </svg>;
}

// Explicit project-scoped scene registry; never falls back to a landscape scene.
export const portraitScenes={'anchor-portrait-opening':AnchorPortraitOpening};

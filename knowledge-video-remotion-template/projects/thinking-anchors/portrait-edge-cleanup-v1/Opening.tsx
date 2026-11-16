import React from 'react';
import {ease} from '../../../src/components/primitives';
import board from '../portrait-opening-v2/storyboard.json';

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
 return <g data-focus="judgement" opacity={Math.min(1,p)} transform={`translate(420 1110) scale(${lerp(.90,1,p)})`}>
  <path d="M-290 -104 Q-343 -92 -331 -36 Q-364 10 -326 55 Q-329 110 -271 110 H271 Q328 117 332 68 Q365 25 333 -25 Q348 -97 291 -104 Q253 -136 210 -111 H-204 Q-253 -139 -290 -104 Z" fill={yellow} stroke={ink} strokeWidth="6"/>
  <ellipse cx="248" cy="154" rx="24" ry="17" fill={yellow} stroke={ink} strokeWidth="5"/><circle cx="280" cy="194" r="10" fill={yellow} stroke={ink} strokeWidth="4"/>
  <Txt y={36} size={102}>省了800！</Txt>
 </g>;
}

function Shopper({happy,check,surprise,time,opacity}:{happy:number;check:number;surprise:number;time:number;opacity:number}){
 const delight=happy*(1-check),handX=lerp(628,542,delight),handY=lerp(1476,1400,delight);
 const blink=(time%3.9)>3.77,breath=2.5*Math.sin(time*2.0);
 return <g data-character opacity={opacity} stroke={ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
  <path d={`M649 1740 Q655 ${1432+breath} 771 1427 Q895 ${1435+breath} 936 1740 Z`} fill={teal}/>
  <path d={`M700 1490 Q650 1535 ${handX+18} ${handY+70}`} fill="none" strokeWidth="14"/>
  <path d="M874 1485 Q920 1515 930 1462" fill="none" strokeWidth="12"/>
  <g transform={`translate(${handX} ${handY}) rotate(${lerp(10,-4,delight)})`}>
   <path d="M-18 48 Q-25 22 -22 2 L-22 -59 Q-22 -74 -8 -66 L0 -12 Q12 -32 25 -14 L43 19 Q64 39 43 65 L18 84 Z" fill="#f1c4a0" strokeWidth="5"/>
  </g>
  <rect x="752" y="1385" width="40" height="64" rx="15" fill="#f1c4a0"/>
  <g transform={`rotate(${-6*surprise} 775 1320)`}>
   <ellipse cx="775" cy="1320" rx="77" ry="88" fill="#f1c4a0"/>
   <path d="M699 1305 Q689 1201 774 1195 Q863 1197 852 1303 L826 1261 Q765 1283 726 1257 L718 1309 Z" fill={ink}/>
   {blink?<path d="M739 1318 h11 M801 1318 h11"/>:<><path d={`M745 ${1317-6*surprise} v10 M802 ${1317-6*surprise} v10`}/><path d={`M728 ${1288-10*surprise} l32 -6 M786 ${1282-10*surprise} l32 5`} strokeWidth="4"/></>}
   {surprise>.45?<ellipse cx="775" cy="1364" rx="11" ry="15" fill={ink}/>:<path d={`M755 1357 Q775 ${1376+10*delight} 797 1356`} fill="none" strokeWidth="5"/>}
  </g>
  <g opacity={delight} transform="translate(877 1149) rotate(12)"><path d="M0 -9 C-26 -41 -50 -8 -26 16 L0 41 L26 16 C50 -8 26 -41 0 -9 Z" fill={coral} strokeWidth="4"/></g>
  <g opacity={surprise} fill="none" transform="translate(892 1156)"><path d="M-15 -12 Q-17 -40 10 -40 Q42 -38 27 -14 L10 3 V14"/><path d="M10 35 v1" strokeWidth="9"/></g>
 </g>;
}

function Phone({time,happy,check,other,compare}:{time:number;happy:number;check:number;other:number;compare:number}){
 const pull=ease((time-board.events.drop)/1.3),zoom=1+.08*pull-.035*check,lift=-65*happy*(1-check)+90*compare;
 const header=1-ease((time-board.events.compare+.25)/.18);
 return <g data-context="shopping-phone" opacity={1-.52*compare} transform={`translate(${470*(1-zoom)} ${900*(1-zoom)+lift}) scale(${zoom})`}>
  <ellipse cx="474" cy="1510" rx="415" ry="69" fill={ink} opacity=".11"/>
  <rect x="107" y="355" width="768" height="1130" rx="76" fill={ink}/>
  <rect x="90" y="337" width="768" height="1130" rx="76" fill={paper} stroke={ink} strokeWidth="8"/>
  <rect x="358" y="357" width="230" height="30" rx="15" fill={ink}/>
  <g clipPath="url(#phone-screen)">
   <rect x="125" y="420" width="698" height="990" fill="#f6e8dc"/>
   <path d="M125 1152 L823 1000 V1410 H125 Z" fill={mint}/>
   <g opacity={header}><circle cx="166" cy="449" r="9" fill={other>.5?teal:coral}/><Txt x={257} y={462} size={36}>{other>.5?'另一家':'直播间'}</Txt><path d="M723 447 h48 M735 460 h36" stroke={ink} strokeWidth="5" strokeLinecap="round" opacity=".35"/></g>
   <g transform={`translate(${-720*other} 0)`} opacity={1-.84*happy*(1-check)}>
    <path d="M273 524 H675 M474 524 V541 M474 541 L410 573 H538 Z" stroke={ink} strokeWidth="5" fill="none" opacity=".45"/>
    <Coat x={474} y={686} scale={1.52}/>
   </g>
   <g transform={`translate(${720*(1-other)} 0)`}>
    <path d="M514 544 H753 M631 544 V561 M631 561 L575 590 H687 Z" stroke={ink} strokeWidth="5" fill="none" opacity=".4"/>
    <Coat x={631} y={704} scale={1.23}/>
   </g>
   <g opacity={(1-check)*header}>
    <rect x="240" y="1310" width="393" height="86" rx="27" fill={coral} stroke={ink} strokeWidth="5"/>
    <Txt x={426} y={1368} size={42}>立即买</Txt>
   </g>
  </g>
 </g>;
}
export function AnchorPortraitOpening({frame}:{frame:number}){
 const time=frame/30,e=board.events;
 const drop=ease((time-e.drop)/.45),happy=ease((time-e.happy)/.45),check=ease((time-e.check)/.45),other=ease((time-e.other)/.45),compare=ease((time-e.compare)/.50);
 const strike=ease((time-e.strike)/.24),sale=ease((time-e.drop-.21)/.24),thoughtOpacity=ease((time-e.happy-.22)/.25)*(1-check);
 const label=ease((time-e.check-.14)/.31),newHeadline=ease((time-e.compare-.15)/.35);
 const tagX=470-45*happy-135*check-10*compare,tagY=1070-315*happy-100*check+275*compare,tagScale=1+.05*drop-.25*happy-.35*check+.05*compare;
 const stage=time<e.happy?'price':time<e.check?'judgement':time<e.other?'question':time<e.compare?'new-evidence':'reconsider';
 const newX=lerp(650,480,other)+210*compare,newY=1090+80*(1-other)-160*compare,newScale=lerp(1,.62,compare);
 const delight=happy*(1-check),surprise=other*.78;
 return <svg data-portrait-scene data-stage={stage} width="1080" height="1920" viewBox="0 0 1080 1920" role="img" aria-label="漫画直播间：999划掉降到199，觉得省了800；发现另一家同款同条件189，重新比较199和189，追问刚才在和谁比">
  <defs><pattern id="portrait-dots" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.35" fill={ink} opacity=".055"/></pattern><radialGradient id="portrait-wash"><stop stopColor={yellow} stopOpacity=".55"/><stop offset="1" stopColor={cream} stopOpacity="0"/></radialGradient><clipPath id="phone-screen"><rect x="125" y="420" width="698" height="990" rx="34"/></clipPath></defs>
  <rect width="1080" height="1920" fill={cream}/><rect width="1080" height="1920" fill="url(#portrait-dots)"/>
  <path d="M0 1567 Q470 1510 1080 1588 V1920 H0 Z" fill="#e9ddc9"/>
  <path d="M0 1567 Q470 1510 1080 1588 M140 1920 L376 1550 M776 1920 L641 1550 M0 1727 H1080" fill="none" stroke={ink} strokeWidth="3" opacity=".1"/>

  <ellipse cx="474" cy="900" rx="560" ry="850" fill="url(#portrait-wash)" opacity={.25+.75*delight}/>
  <Phone {...{time,happy,check,other,compare}}/>
  <g data-headline="hook" opacity={1-ease((time-e.happy+.15)/.3)}><Txt x={490} y={244} size={85}>降价，就赚了？</Txt><path d="M315 278 Q493 299 666 278" stroke={coral} strokeWidth="8" strokeLinecap="round" fill="none"/></g>
  <g opacity={check*(1-ease((time-e.compare)/.14))} transform={`translate(0 ${18*(1-check)})`}><Txt x={490} y={244} size={85}>另一家呢？</Txt></g>
  <g data-headline="reconsider" opacity={newHeadline} transform={`translate(0 ${18*(1-newHeadline)})`}><Txt x={490} y={228} size={72}>你刚才，</Txt><Txt x={490} y={330} size={84}>在和谁比？</Txt></g>
  <g data-object="live-price" transform={`translate(${tagX} ${tagY}) scale(${tagScale}) rotate(${lerp(-3,-7,check)+3*compare})`}>
   <Tag w={700} h={450} fill={drop>.5?mint:paper}>
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
   <Tag w={700} h={400} fill={mint}>
    <Txt y={lerp(-105,-95,compare)} size={lerp(43,64,compare)}>{time>=e.compare?'另一家':'同款同条件 · 到手价'}</Txt>
    <Txt y={116} size={225} color="#207b72">189</Txt>
   </Tag>
  </g>
  <g data-object="price-difference" opacity={ease((time-e.compare-.12)/.3)}>
   <path d={`M${lerp(290,280,compare)} ${lerp(760,1082,compare)} C${lerp(290,280,compare)} ${lerp(840,1140,compare)},${lerp(480,690,compare)} ${lerp(810,1140,compare)},${lerp(480,690,compare)} ${lerp(860,1082,compare)}`} fill="none" stroke={teal} strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-ease((time-e.compare-.10)/.3)}/>
   <Txt x={480} y={1242} size={73} opacity={ease((time-e.compare-.52)/.25)}>相差10元</Txt>
  </g>
  <Shopper {...{happy,check,surprise,time}} opacity={1}/>
 </svg>;
}

// Explicit project-scoped scene registry; never falls back to a landscape scene.
export const portraitScenes={'anchor-portrait-opening':AnchorPortraitOpening};

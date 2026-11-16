import React from 'react';
import type {Segment} from '../../../src/types';
import {ease} from '../../../src/components/primitives';
import {Coffee} from './AnchorLifeScene';

const ink='#25252b',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
function T({x,y,children,size=30,bold=false,color=ink,anchor='middle'}:{x:number;y:number;children:React.ReactNode;size?:number;bold?:boolean;color?:string;anchor?:'start'|'middle'|'end'}){
 return <text x={x} y={y} fontSize={size} fontWeight={bold?700:400} textAnchor={anchor} fill={color}>{children}</text>;
}
function Talk({x,y,w,lines,opacity=1}:{x:number;y:number;w:number;lines:string[];opacity?:number}){
 const h=lines.length===1?108:148;
 return <g opacity={opacity}><path d={`M${x+22} ${y} H${x+w-22} Q${x+w} ${y} ${x+w} ${y+22} V${y+h-22} Q${x+w} ${y+h} ${x+w-22} ${y+h} H${x+w*.42} L${x+w*.32} ${y+h+30} L${x+w*.35} ${y+h} H${x+22} Q${x} ${y+h} ${x} ${y+h-22} V${y+22} Q${x} ${y} ${x+22} ${y} Z`} fill={paper} stroke={ink} strokeWidth="5" strokeLinejoin="round"/>{lines.map((line,i)=><T key={i} x={x+w/2} y={y+h/2+13+(i-(lines.length-1)/2)*47} size={lines.length===1?34:32} bold>{line}</T>)}</g>;
}
function Person({x,y,color=teal,pose=0,surprise=0,tilt=0,scale=1.12}:{x:number;y:number;color?:string;pose?:number;surprise?:number;tilt?:number;scale?:number}){
 return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
  <path d="M-69 112 Q-64 32 0 29 Q63 32 69 112 Z" fill={color}/><path d={`M-54 60 L-89 ${49-24*pose} L-109 ${43-57*pose} M54 60 L89 ${47-28*pose} L109 ${38-50*pose}`} fill="none"/>
  <rect x="-10" y="13" width="20" height="29" rx="8" fill="#f1c4a0"/>
  <g transform={`rotate(${tilt} 0 -18)`}><ellipse cy="-20" rx="43" ry="50" fill="#f1c4a0"/><path d="M-43 -27 Q-46 -77 0 -77 Q46 -74 43 -26 L28 -46 Q-7 -34 -27 -49 L-31 -24 Z" fill={ink}/><path d={`M-17 ${-20-surprise*4} v6 M16 ${-20-surprise*4} v6`} strokeWidth="4"/><path d={`M-25 ${-36-surprise*8} l18 -4 M8 ${-40-surprise*8} l18 4`} strokeWidth="3"/>{surprise>.5?<ellipse cy="8" rx="7" ry="9" fill={ink}/>:<path d="M-10 4 Q0 15 11 4" fill="none" strokeWidth="4"/>}</g>
  <g opacity={surprise}><path d="M-66 -64 L-80 -78 M64 -65 L79 -80" stroke={coral} strokeWidth="5"/></g>
 </g>;
}
function Price({x,y,value,color=coral,p=1,opacity=1}:{x:number;y:number;value:string;color?:string;p?:number;opacity?:number}){
 return <g transform={`translate(${x} ${y+14*(1-p)}) rotate(${-7+3*p}) scale(${.94+.06*p})`} opacity={opacity*p}>
  <path d="M-117 -53 H110 L137 0 L110 51 H-117 Z" fill={color} stroke={ink} strokeWidth="5"/><T x={0} y={17} size={46} bold>{value}</T>
 </g>;
}
function Hand({x,y,opacity}:{x:number;y:number;opacity:number}){
 return <g data-payment-hand transform={`translate(${x} ${y}) scale(.6)`} opacity={opacity} stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M0 82 V-13 Q3 -32 18 -24 L26 21 V-63 Q30 -83 43 -68 L51 -5 Q65 -30 78 -12 L91 1 Q112 -13 123 8 L148 71 Q138 119 83 133 L45 142 Z" fill="#f1c4a0"/></g>;
}

export function AnchorOpening({segment,time}:{segment:Segment;time:number}){
 const e=segment.events;
 const entry=ease(time/.45),offer=ease((time-e.offer)/.45),counter=ease((time-e.counter)/.38);
 const acceptedAt=e.counter+1.4,accepted=ease((time-acceptedAt)/.42),joy=ease((time-e.celebrate)/.45),question=ease((time-e.question)/.30);
 const reach=ease((time-(e.celebrate+1.2))/1.45),withdraw=ease((time-e.question)/.5);
 const rightLines=time>=e.question?['等等，','它真的值 2000 吗？']:time>=e.celebrate?['少花 400，赚到了！']:['1600，行不行？'];
 const nod=time>=acceptedAt&&time<acceptedAt+.65?5*Math.sin(Math.PI*(time-acceptedAt)/.65):0;
 return <svg data-fullbleed-scene width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label="卖家开价2000元，买家还到1600元，觉得省下400元，付款前开始怀疑开价是否有依据">
  <defs><pattern id="opening-dots" width="27" height="27" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill={ink} opacity=".055"/></pattern><radialGradient id="opening-wash"><stop stopColor="#cfece0" stopOpacity=".65"/><stop offset="1" stopColor="#fff8e9" stopOpacity="0"/></radialGradient></defs>
  <rect width="1920" height="1080" fill="#fff8e9"/><rect width="1920" height="1080" fill="url(#opening-dots)"/>
  <g opacity={entry}>
   <T x={100} y={116} size={49} bold anchor="start">砍掉 400 元，真的省了吗？</T>
   <g transform="translate(1653 93) rotate(-5)"><rect x="-118" y="-34" width="236" height="67" rx="7" fill={paper} stroke={coral} strokeWidth="4"/><T x={0} y={13} size={24} color="#bc503e" bold>剧情示例</T></g>
   {['卖家报价','买家还价','准备付款'].map((label,i)=><g key={label}><circle cx={130+i*600} cy="195" r="16" fill={[offer,counter,joy][i]>.5?teal:paper} stroke={ink} strokeWidth="3"/><T x={165+i*600} y={207} size={28} bold anchor="start">{label}</T>{i<2&&<path d={`M355 ${195} H660`} transform={`translate(${i*600} 0)`} stroke={ink} strokeWidth="3" strokeDasharray="5 9" opacity=".25"/>}</g>)}
   <ellipse cx="877" cy="622" rx="390" ry="282" fill="url(#opening-wash)"/>
   <path d="M155 943 H1780" stroke={ink} strokeWidth="3" opacity=".13"/>
   <T x={878} y={858} size={26} color="#666258">二手咖啡机</T>
   <Coffee x={865} y={610+15*(1-entry)} scale={1.18}/>
   <Person x={270} y={805+12*(1-entry)} color={coral} pose={offer*.45} tilt={nod}/>
   <Person x={1710} y={805+12*(1-entry)} pose={joy*(1-question)*.68} surprise={question} tilt={-4*question}/>
   <Talk x={100} y={280} w={540} lines={time>=acceptedAt?['行，就 1600。']:['这台 2000 元。']} opacity={offer}/>
   <g transform={`translate(0 ${10*(1-counter)})`}><Talk x={1210} y={280} w={600} lines={rightLines} opacity={counter}/></g>
   <g opacity={offer*(1-question*.2)}><T x={1090} y={421} size={24} color="#666258">卖家开价</T><Price x={1090} y={489} value="¥ 2000" p={offer} opacity={1-accepted*.30}/></g>
   <g opacity={accepted}><T x={1090} y={617} size={24} color="#666258">谈成价格</T><Price x={1090} y={684} value="¥ 1600" color={teal} p={accepted}/></g>
   <g data-savings opacity={joy} transform={`translate(0 ${12*(1-joy)})`}>
    <rect x="1232" y="472" width="340" height="118" rx="15" fill={question>.5?paper:mint} stroke={question>.5?coral:ink} strokeWidth="4"/>
    <T x={1402} y={510} size={25} color="#666258">{time>=e.question?'买便宜了？':'觉得自己省了'}</T>
    <T x={1402} y={570} size={time>=e.question?32:43} bold>{time>=e.question?'还不能确定':'400 元'}</T>
   </g>
   <g data-payment-phone opacity={joy} transform={`translate(${22*(1-joy)} ${16*(1-joy)})`}>
    <rect x="1250" y="611" width="300" height="324" rx="28" fill={ink}/><rect x="1240" y="600" width="300" height="324" rx="28" fill={paper} stroke={ink} strokeWidth="5"/>
    <path d="M1358 618 H1422" stroke={ink} strokeWidth="6" strokeLinecap="round"/>
    <T x={1390} y={670} size={26} color="#666258">{time>=e.question?'先停一下':'待付款'}</T>
    <T x={1390} y={747} size={49} bold>¥ 1600</T>
    <rect data-payment-button x="1260" y="826" width="260" height="66" rx="12" fill={question>.5?paper:teal} stroke={ink} strokeWidth="3"/>
    <T x={1390} y={870} size={31} bold>{time>=e.question?'先别付款':'确认付款'}</T>
   </g>
   <Hand x={mix(1570,1480,reach)+80*withdraw} y={mix(914,854,reach)+22*withdraw} opacity={ease((time-(e.celebrate+.95))/.3)}/>
  </g>
 </svg>;
}

import React from 'react';
import type {Segment} from '../../../src/types';
import {ease} from '../../../src/components/primitives';

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


export {T,Talk,Person,Hand};

import React from 'react';
const ink='#25252b',cream='#fff8e9',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export function Text({x,y,size=64,color=ink,children}:{x:number;y:number;size?:number;color?:string;children:React.ReactNode}){
 return <text x={x} y={y} fontSize={size} textAnchor="middle" fontWeight="700" fill={color}>{children}</text>;
}
export function Coat(){
 return <g stroke={ink} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
  <path d="M0 -112 V-125 Q0 -139 12 -139 Q28 -139 22 -122 M0 -112 L-63 -83 H61 Z" fill="none"/>
  <path d="M-52 -83 L-111 -42 L-74 13 L-45 -5 V116 H58 V-5 L85 13 L120 -42 L61 -83 L24 -62 H-13 Z" fill={coral}/>
  <path d="M-52 -83 Q-11 -14 61 -83 M8 -60 V110" fill="none"/>
 </g>;
}
export function PriceTag({x,y,w,h,label,value}:{x:number;y:number;w:number;h:number;label:string;value:number}){
 return <g transform={`translate(${x} ${y})`} data-price={value}>
  <path d={`M${-w/2+20} ${-h/2+12} H${w/2-34} L${w/2+10} ${-h/2+56} V${h/2-12} Q${w/2+10} ${h/2+12} ${w/2-14} ${h/2+12} H${-w/2+24} Q${-w/2+12} ${h/2+12} ${-w/2+12} ${h/2-12} V${-h/2+32} Z`} fill={ink}/>
  <path d={`M${-w/2+20} ${-h/2} H${w/2-44} L${w/2} ${-h/2+44} V${h/2-24} Q${w/2} ${h/2} ${w/2-24} ${h/2} H${-w/2+24} Q${-w/2} ${h/2} ${-w/2} ${h/2-24} V${-h/2+24} Q${-w/2} ${-h/2} ${-w/2+24} ${-h/2} Z`} fill={mint} stroke={ink} strokeWidth="6"/>
  <circle cx={w/2-40} cy={-h/2+58} r="9" fill={paper} stroke={ink} strokeWidth="4"/>
  <Text x={0} y={-h*.23} size={w>450?48:36}>{label}</Text>
  <Text x={0} y={h*.29} size={h*.60}>{value}</Text>
 </g>;
}

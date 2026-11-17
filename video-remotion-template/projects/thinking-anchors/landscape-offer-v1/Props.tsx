import React from 'react';
const ink='#25252b',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f',paper='#fffdf5';
export function Camera({scratch=0}:{scratch?:number}){
 return <g stroke={ink} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
  <path d="M-170 -92 H-81 L-51 -133 H48 L76 -92 H170 Q189 -92 189 -73 V98 Q189 119 168 119 H-168 Q-189 119 -189 98 V-73 Q-189 -92 -170 -92 Z" fill={mint}/>
  <path d="M-175 -91 H172 V-42 H-175 Z" fill="#d5d9d3"/>
  <rect x="-161" y="-128" width="54" height="35" rx="7" fill={coral}/><rect x="100" y="-81" width="55" height="22" rx="5" fill={paper}/>
  <circle cx="17" cy="26" r="83" fill={ink}/><circle cx="17" cy="26" r="64" fill={teal}/><circle cx="17" cy="26" r="40" fill="#31555a"/><path d="M-5 0 Q19 -20 42 1" stroke={paper} strokeWidth="8" fill="none"/>
  <path d="M-154 24 L-121 40 M-158 43 L-124 59 M-150 66 L-126 76" stroke={coral} strokeWidth="5" opacity={scratch}/>
 </g>;
}
export function Charger(){return <g stroke={ink} strokeWidth="5" strokeLinejoin="round" fill="none" strokeLinecap="round"><rect x="-70" y="-78" width="140" height="133" rx="17"/><path d="M-24 -78 V-107 M24 -78 V-107 M0 55 V94 Q0 121 36 120 H82"/><path d="M-21 -25 H21 M-21 -1 H21" strokeWidth="3"/></g>;}

import React from 'react';
import {ease} from '../../../src/components/primitives';
const ink='#25252b',skin='#f1c4a0',coral='#ed795f';
export function LiveHost({time}:{time:number}){
 const quote=ease((time-4)/.6),speaking=quote*(1-ease((time-8)/.4));
 const sway=2*Math.sin(time*2.4),hx=415-24*quote,hy=510-6*quote,blink=time%4.3>4.16;
 return <g data-presenter data-host-talking={speaking>.1?'yes':'no'} stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
  <path d={`M124 837 L148 646 Q166 611 216 608 Q278 603 306 642 L335 837 Z`} fill={coral}/>
  <path d="M184 619 L215 673 L252 615 M215 673 L224 831" fill="none" strokeWidth="4"/>
  <path d={`M294 653 Q354 668 ${hx} ${hy}`} fill="none" strokeWidth="13"/>
  <g transform={`translate(${hx} ${hy}) rotate(${-16-30*quote})`}>
   <path d="M-14 8 L-15 -27 Q-15 -39 -5 -35 L0 -8 L18 -18 Q31 -22 34 -8 L34 11 Q32 31 14 31 L-10 24 Z" fill={skin}/>
  </g>
  <path d={`M153 654 Q110 684 118 ${735+sway}`} fill="none" strokeWidth="12"/>
  <ellipse cx="118" cy={735+sway} rx="15" ry="22" fill={skin}/>
  <rect x="200" y="577" width="36" height="48" rx="13" fill={skin}/>
  <g transform={`translate(0 ${sway}) rotate(${-3-2*quote} 220 531)`}>
   <ellipse cx="220" cy="531" rx="64" ry="78" fill={skin}/>
   <path d="M156 518 Q139 444 211 440 Q291 431 286 525 L265 478 Q207 498 177 479 L173 524 Z" fill={ink}/>
   {blink?<path d="M188 529 h11 M241 529 h11"/>:<path d="M194 527 v9 M247 527 v9"/>}
   <path d="M180 508 L208 505 M233 505 L261 509" fill="none" strokeWidth="4"/>
   {speaking>.1?<ellipse cx="221" cy="561" rx="12" ry={5+7*(.5+.5*Math.sin(time*22))} fill="#914d43" strokeWidth="3"/>:<path d="M202 559 Q220 578 240 557" fill="none" strokeWidth="4"/>}
   <path d="M157 512 Q148 484 159 465 M154 518 L154 550 Q153 568 179 568" fill="none" strokeWidth="7"/>
   <rect x="147" y="515" width="14" height="31" rx="6" fill="#e3f4ec" strokeWidth="3"/>
   <circle cx="183" cy="568" r="6" fill={ink} stroke="none"/>
  </g>
  <text x="219" y="808" textAnchor="middle" fontSize="30" fontWeight="700" fill={ink} stroke="none">主播</text>
 </g>;
}

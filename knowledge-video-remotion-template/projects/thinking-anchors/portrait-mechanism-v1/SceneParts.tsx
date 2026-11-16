import React from 'react';
const ink='#25252b',teal='#45b9ae',coral='#ed795f',paper='#fffdf5';
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
// Frozen drawing primitives from the accepted portrait-opening-v2 scene.
export function Txt({x=0,y=0,size=64,children,color=ink,opacity=1}:{x?:number;y?:number;size?:number;children:React.ReactNode;color?:string;opacity?:number}){
 return <text x={x} y={y} fontSize={size} textAnchor="middle" fontWeight="700" fill={color} opacity={opacity}>{children}</text>;
}

export function Tag({w,h,fill=paper,children}:{w:number;h:number;fill?:string;children:React.ReactNode}){
 return <><path d={`M${-w/2+22} ${-h/2+14} H${w/2-18} L${w/2+10} ${-h/2+44} V${h/2-10} Q${w/2+10} ${h/2+14} ${w/2-14} ${h/2+14} H${-w/2+38} Q${-w/2+14} ${h/2+14} ${-w/2+14} ${h/2-10} V${-h/2+38} Q${-w/2+14} ${-h/2+14} ${-w/2+38} ${-h/2+14} Z`} fill={ink}/><path d={`M${-w/2+24} ${-h/2} H${w/2-28} L${w/2} ${-h/2+28} V${h/2-24} Q${w/2} ${h/2} ${w/2-24} ${h/2} H${-w/2+24} Q${-w/2} ${h/2} ${-w/2} ${h/2-24} V${-h/2+24} Q${-w/2} ${-h/2} ${-w/2+24} ${-h/2} Z`} fill={fill} stroke={ink} strokeWidth="6"/>{children}</>;
}

export function Shopper({happy,check,surprise,time,opacity}:{happy:number;check:number;surprise:number;time:number;opacity:number}){
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

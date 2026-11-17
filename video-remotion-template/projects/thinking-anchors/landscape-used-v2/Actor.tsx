import React from 'react';
import {ease} from '../../../src/components/primitives';
import board from './board.json';
const ink='#25252b',skin='#f1c4a0',teal='#45b9ae',coral='#ed795f';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const states=[
 {at:0,dx:0,dy:0,headX:0,headY:0,tilt:7,hx:660,hy:1542,angle:32,finger:.05,mouth:1380,brow:0},
 {at:board.events.switch,dx:-8,dy:-5,headX:-10,headY:-8,tilt:-4,hx:640,hy:1450,angle:-10,finger:.2,mouth:1368,brow:.2},
 {at:board.events.test,dx:-27,dy:-14,headX:-27,headY:-17,tilt:-11,hx:575,hy:1370,angle:-50,finger:.8,mouth:1358,brow:.45},
 {at:board.events.missing,dx:-18,dy:-8,headX:-17,headY:-9,tilt:-5,hx:600,hy:1390,angle:-43,finger:.8,mouth:1358,brow:.5},
 {at:board.events.match,dx:-12,dy:-8,headX:-17,headY:-11,tilt:-5,hx:620,hy:1300,angle:-35,finger:1,mouth:1363,brow:.2},
 {at:board.events.range,dx:-10,dy:-8,headX:-13,headY:-9,tilt:-8,hx:730,hy:1410,angle:-18,finger:.65,mouth:1358,brow:.3}
];
export function storyPose(time:number){
 let pose={...states[0]};for(let i=1;i<states.length;i++){const next=states[i],p=ease((time-next.at)/.65);for(const key of Object.keys(next) as (keyof typeof next)[])if(key!=='at')pose[key]=mix(pose[key],next[key],p);}
 return pose;
}
export function UsedShopper({time,clock}:{time:number;clock:number}){
 const p=storyPose(time),{dx,dy,hx,hy}=p,breath=2.5*Math.sin(clock*2);
 const handRadians=p.angle*Math.PI/180,wristX=hx+18*Math.cos(handRadians)-70*Math.sin(handRadians),wristY=hy+18*Math.sin(handRadians)+70*Math.cos(handRadians);
 const happy=0,neutral=0,blink=(clock%3.9)>3.77||(time>12.27&&time<12.4),tip=-12-54*p.finger;
 return <g data-character data-acting={time<board.events.test?'inspect-quote':time<board.events.match?'check-item':time<board.events.range?'point-at-records':'think-about-reference'} stroke={ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
  <path d={`M649 1740 Q${655+dx} ${1432+dy+breath} ${771+dx} ${1427+dy} Q${895+dx} ${1435+dy+breath} 936 1740 Z`} fill={teal}/>
  <path d={`M${700+dx} ${1490+dy} Q${650-45*happy} ${1535-75*happy} ${wristX} ${wristY}`} fill="none" strokeWidth="14"/>
  <path d={`M${874+dx} ${1485+dy} Q${920+dx} 1515 930 1462`} fill="none" strokeWidth="12"/>
  <ellipse cx="930" cy="1462" rx="14" ry="21" fill={skin} strokeWidth="5" opacity={1-neutral}/>
  <rect x={752+dx} y={1385+dy} width="40" height="64" rx="15" fill={skin}/>
  <g data-acting-head transform={`translate(${p.headX} ${p.headY}) rotate(${p.tilt} 775 1320)`}>
   <ellipse cx="775" cy="1320" rx="77" ry="88" fill={skin}/>
   <path d="M699 1305 Q689 1201 774 1195 Q863 1197 852 1303 L826 1261 Q765 1283 726 1257 L718 1309 Z" fill={ink}/>
   {blink?<path d="M739 1318 h11 M801 1318 h11"/>:<path d={`M745 ${1317-1.836*neutral} v10 M802 ${1317-1.836*neutral} v10`}/>}
   <path d={`M728 ${mix(1288-13*p.brow,1284.94,neutral)} l32 ${-6+17*p.brow} M786 ${mix(1282+3*p.brow,1278.94,neutral)} l32 ${5-16*p.brow}`} strokeWidth="4" fill="none"/>
   <path d={`M755 1357 Q775 ${p.mouth} 797 1356`} fill="none" strokeWidth="5"/>
  </g>
  <g data-acting-hand transform={`translate(${hx} ${hy}) rotate(${p.angle})`}>
   <path d={`M-18 48 Q-25 22 -22 2 L-22 ${tip} Q-22 ${tip-15} -8 ${tip-7} L0 -12 Q12 -32 25 -14 L43 19 Q64 39 43 65 L18 84 Z`} fill={skin} strokeWidth="5"/>
  </g>
  <g opacity={happy} transform={`translate(910 ${1150-16*happy}) rotate(12) scale(${.8+.2*happy})`}><path d="M0 -9 C-26 -41 -50 -8 -26 16 L0 41 L26 16 C50 -8 26 -41 0 -9 Z" fill={coral} strokeWidth="4"/></g>
 </g>;
}

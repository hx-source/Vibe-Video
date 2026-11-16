import React from 'react';
import {ease} from '../../../src/components/primitives';
import {Shopper} from '../portrait-mechanism-v1/SceneParts';
import board from './board.json';

const ink='#25252b',teal='#45b9ae',skin='#f1c4a0';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const pulse=(time:number,start:number,duration:number)=>{const p=Math.max(0,Math.min(1,(time-start)/duration));return Math.sin(Math.PI*p);};
export function actorPose(time:number,clock:number){
 const e=board.events,active=ease((time-e.search)/.55),form=ease((time-e.need-.25)/.4);
 const reach=ease((time-e.history+.12)/.45)*(1-ease((time-e.conditions)/.45));
 const condition=ease((time-e.conditions)/.45)*(1-ease((time-e.need)/.4));
 const thinking=ease((time-e.need)/.5)*(1-ease((time-e.choice)/.42));
 const withdraw=ease((time-e.choice)/.55),turn=pulse(time,e.other,.8),compareNod=pulse(time,e.compare+.12,.6),budgetNod=pulse(time,e.budget+.1,.65);
 const lean=(.55+.35*reach+.1*condition)*(1-withdraw);
 const dx=-18*lean*active,dy=-13*lean*active;
 let hx=628,hy=1476,handAngle=10,finger=mix(1,.24,active);
 hx=mix(hx,595+24*turn,reach);hy=mix(hy,1210-20*turn-19*compareNod,reach);handAngle=mix(handAngle,-12-13*turn,reach);finger=mix(finger,1,reach);
 hx=mix(hx,610,condition);hy=mix(hy,1360,condition);handAngle=mix(handAngle,-25,condition);finger=mix(finger,.9,condition);
 const headX=-27*lean*active,headY=-19*lean*active;
 hx=mix(hx,755+headX,thinking);hy=mix(hy,1420+headY,thinking);handAngle=mix(handAngle,-18,thinking);finger=mix(finger,.65,thinking);
 hx=mix(hx,660,withdraw);hy=mix(hy,1542,withdraw);handAngle=mix(handAngle,32,withdraw);finger=mix(finger,.05,withdraw);
 let gazeX=-4.5,gazeY=-5;
 if(time>=e.other){gazeX=-5.8;gazeY=-1.5;}
 if(time>=e.conditions){gazeX=-6.5;gazeY=2.5;}
 if(time>=e.need){gazeX=-3.5;gazeY=-5;}
 if(time>=e.budget){gazeX=-5;gazeY=0;}
 gazeX=mix(gazeX,0,withdraw);gazeY=mix(gazeY,0,withdraw);
 const tilt=mix(-1.836,-7*lean-6*thinking+7*withdraw+6*compareNod+5*budgetNod,active);
 const blink=(clock%3.9)>3.77||(time>e.need+.45&&time<e.need+.60);
 return {active,form,reach,condition,thinking,withdraw,lean,dx,dy,hx,hy,handAngle,finger,headX,headY,gazeX,gazeY,tilt,blink,compareNod,budgetNod,action:time<e.history?'look-up':time<e.other?'point-history':time<e.conditions?'follow-comparison':time<e.need?'indicate-conditions':time<e.choice?'think-at-chin':'withdraw-and-relax'};
}
export function AnimatedShopper({time,clock}:{time:number;clock:number}){
 const p=actorPose(time,clock);
 if(p.active===0)return <Shopper happy={0} check={1} surprise={.306*(1-p.form)} time={clock} opacity={1}/>;
 const {active,thinking,withdraw,dx,dy,hx,hy}=p;
 const breath=2.5*Math.sin(clock*2),leftX=700+dx,leftY=1490+dy;
 const elbowX=mix(650,590,p.reach*.85+p.condition*.7)+22*thinking,elbowY=mix(1535,1370,p.reach)+15*thinking;
 const rightX=mix(930,914,active)+8*withdraw,rightY=mix(1462,1568,active)+27*withdraw;
 const tip=-12-54*p.finger;
 const mouth=mix(1376,1360,thinking)+4*withdraw-5*p.reach;
 return <g data-character data-action={p.action} data-gaze={`${p.gazeX},${p.gazeY}`} stroke={ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
  <path d={`M649 1740 Q${655+dx} ${1432+dy+breath} ${771+dx} ${1427+dy} Q${895+dx} ${1435+dy+breath} 936 1740 Z`} fill={teal}/>
  <path d={`M${leftX} ${leftY} Q${elbowX} ${elbowY} ${hx+18} ${hy+70}`} fill="none" strokeWidth="14"/>
  <path d={`M${874+dx} ${1485+dy} Q${920+dx} ${mix(1515,1560,active)} ${rightX} ${rightY}`} fill="none" strokeWidth="12"/>
  <g opacity={active} transform={`translate(${rightX} ${rightY}) rotate(${-10+23*withdraw})`}><ellipse rx="14" ry="21" fill={skin} strokeWidth="5"/><path d="M-4 7 L-3 16 M4 6 L5 15" strokeWidth="2"/></g>
  <rect x={752+dx} y={1385+dy} width="40" height="64" rx="15" fill={skin}/>
  <g data-acting-head transform={`translate(${p.headX} ${p.headY}) rotate(${p.tilt} 775 1320)`}>
   <ellipse cx="775" cy="1320" rx="77" ry="88" fill={skin}/>
   <path d="M699 1305 Q689 1201 774 1195 Q863 1197 852 1303 L826 1261 Q765 1283 726 1257 L718 1309 Z" fill={ink}/>
   {p.blink?<path d="M735 1318 Q746 1324 756 1318 M793 1318 Q804 1324 814 1318" strokeWidth="4" fill="none"/>:<>
    <path d={`M745 ${1317-6*.306*(1-p.form)} v10 M802 ${1317-6*.306*(1-p.form)} v10`}/>
   </>}
   <path d={`M728 ${1285-6*thinking} l32 ${-6+4*thinking} M786 ${1279+2*thinking} l32 ${5-6*thinking}`} strokeWidth="4" fill="none"/>
   <path d={`M755 1357 Q775 ${mouth} 797 1356`} fill="none" strokeWidth="5"/>
  </g>
  <g data-acting-hand transform={`translate(${hx} ${hy}) rotate(${p.handAngle})`}>
   <path d={`M-18 48 Q-25 22 -22 2 L-22 ${tip} Q-22 ${tip-15} -8 ${tip-7} L0 -12 Q12 -32 25 -14 L43 19 Q64 39 43 65 L18 84 Z`} fill={skin} strokeWidth="5"/>
   <path d="M11 17 L23 38 M27 19 L35 37" strokeWidth="2.5" opacity={active}/>
  </g>
 </g>;
}

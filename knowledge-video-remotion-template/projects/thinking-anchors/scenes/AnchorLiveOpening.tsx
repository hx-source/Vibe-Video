import React from 'react';
import type {Segment} from '../../../src/types';
import {ease} from '../../../src/components/primitives';
import {T,Talk,Person,Hand} from './OpeningActors';

const ink='#25252b',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
function Coat(){
 return <g transform="translate(825 780) scale(.8)" stroke={ink} strokeWidth="5" strokeLinejoin="round"><path d="M-52 -83 L-111 -42 L-74 13 L-45 -5 V116 H58 V-5 L85 13 L120 -42 L61 -83 L24 -62 H-13 Z" fill={coral}/><path d="M-52 -83 Q-11 -14 61 -83 M8 -60 V110" fill="none"/>{[-5,35,75].map(v=><circle key={v} cx="22" cy={v} r="4" fill={ink}/>)}</g>;
}
function Heart({x,y,p}:{x:number;y:number;p:number}){
 return <g opacity={Math.sin(Math.PI*p)*.65} transform={`translate(${x} ${y-60*p}) scale(.6)`}><path d="M0 12 C-65 -20 -40 -65 0 -38 C40 -65 65 -20 0 12 Z" fill={coral} stroke={ink} strokeWidth="4"/></g>;
}
export function AnchorLiveOpening({segment,time}:{segment:Segment;time:number}){
 const e=segment.events,price=time<e.drop?999:time<e.sale?599:199;
 const phaseAt=time<e.drop?0:time<e.sale?e.drop:e.sale;
 const priceEntry=ease((time-phaseAt)/.28),sale=ease((time-e.sale)/.35),pay=ease((time-e.pay)/.45),pause=ease((time-e.pause)/.3);
 const reach=ease((time-e.reach)/1.5),withdraw=ease((time-e.pause)/.5),cover=ease((time-e.cover)/.5),compare=ease((time-e.compare)/.35);
 const hostLines=time<e.drop?['这件原价 999！']:time<e.sale?['先降到 599！']:['今天，只要 199！'];
 const viewerLines=time>=e.pause?['等等，','199 本身划算吗？']:time>=e.sale?['少花 800，想买！']:time>=e.drop?['599……再看看。']:['999？有点贵……'];
 const heartP=(time-(e.sale+.2))/1.1;
 return <svg data-fullbleed-scene width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label="虚构直播间先报999元，再降到599和199元；观众觉得少花800而准备下单，随后遮住原价、准备核查同款实际售价">
  <defs><pattern id="live-dots" width="27" height="27" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill={ink} opacity=".055"/></pattern><clipPath id="live-original-mask"><rect x="730" y="387" width="310" height="59" rx="10"/></clipPath></defs>
  <rect width="1920" height="1080" fill="#fff8e9"/><rect width="1920" height="1080" fill="url(#live-dots)"/>
  <T x={100} y={116} size={49} bold anchor="start">从 999 降到 199，你心动了吗？</T>
  <g transform="translate(1653 93) rotate(-5)"><rect x="-118" y="-34" width="236" height="67" rx="7" fill={paper} stroke={coral} strokeWidth="4"/><T x={0} y={13} size={24} color="#bc503e" bold>剧情示例</T></g>
  {['先报原价','不断降价','准备下单'].map((label,i)=><g key={label}><circle cx={130+i*600} cy="195" r="16" fill={[1,sale,pay][i]>.5?teal:paper} stroke={ink} strokeWidth="3"/><T x={165+i*600} y={207} size={28} bold anchor="start">{label}</T>{i<2&&<path d={`M${355+i*600} 195 H${660+i*600}`} stroke={ink} strokeWidth="3" strokeDasharray="5 9" opacity=".25"/>}</g>)}
  <rect x="113" y="285" width="1008" height="680" rx="30" fill={ink}/><rect x="100" y="273" width="1008" height="680" rx="30" fill={paper} stroke={ink} strokeWidth="5"/>
  <path d="M103 361 H1106" stroke={ink} strokeWidth="3"/>
  <rect x="145" y="301" width="100" height="39" rx="10" fill={coral}/><T x={195} y={330} size={23} bold>直播</T><T x={285} y={331} size={26} bold anchor="start">好物直播间</T>
  <g opacity={1-pause*.42}>
   <Talk x={147} y={390} w={500} lines={hostLines}/>
   <Person x={360} y={805} color={coral} pose={.35+.35*sale} scale={1.17}/>
   <Coat/>
   <T x={825} y={919} size={23} color="#666258">同一件外套</T>
  </g>
  <rect x="704" y="380" width="355" height="211" rx="20" fill={time>=e.sale?mint:'#fff3e1'} stroke={ink} strokeWidth="4"/>
  <g opacity={1-cover}>
   <T x={882} y={425} size={25} color="#666258">{time>=e.drop?'标注原价 ¥ 999':'主播报价'}</T>
   {time>=e.drop&&<path d="M922 413 H993" stroke={coral} strokeWidth="3"/>}
  </g>
  <g clipPath="url(#live-original-mask)"><g transform={`translate(${330*(1-cover)} 0)`} opacity={cover>0?1:0}><rect x="730" y="387" width="310" height="59" rx="10" fill={paper} stroke={ink} strokeWidth="2"/></g></g>
  <g opacity={ease((time-e.cover-.5)/.2)}><T x={882} y={427} size={27} bold>先遮住原价</T></g>
  <g data-live-price transform={`translate(${882*(1-(.94+.06*priceEntry))} ${535*(1-(.94+.06*priceEntry))}) scale(${.94+.06*priceEntry})`}>
   <T x={882} y={535} size={78} bold>¥ {price}</T>
  </g>
  <g opacity={compare} transform={`translate(0 ${10*(1-compare)})`}><rect x="708" y="610" width="347" height="69" rx="12" fill={mint} stroke={ink} strokeWidth="3"/><T x={881} y={654} size={25} bold>查同款 · 比到手价</T></g>
  <Talk x={1208} y={280} w={600} lines={viewerLines}/>
  <Person x={1690} y={825} pose={sale*(1-pause)*.65} surprise={pause*.7} tilt={-4*pause}/>
  {[0,1,2].map(i=><Heart key={i} x={1620+i*69} y={587-i*24} p={Math.max(0,Math.min(1,heartP-i*.14))}/>)}
  <g data-payment-phone opacity={pay} transform={`translate(${20*(1-pay)} ${13*(1-pay)})`}>
   <rect x="1243" y="488" width="360" height="365" rx="25" fill={ink}/><rect x="1230" y="475" width="360" height="365" rx="25" fill={paper} stroke={ink} strokeWidth="5"/>
   <T x={1410} y={537} size={27} color="#666258">{time>=e.pause?'先停一下':'准备下单'}</T>
   <T x={1410} y={633} size={60} bold>¥ 199</T>
   <T x={1410} y={686} size={25} color="#666258">{time>=e.pause?'便宜，要有比较依据':'比“原价”少了 800'}</T>
   <rect data-payment-button x="1260" y="728" width="300" height="70" rx="12" fill={pause>.5?paper:teal} stroke={ink} strokeWidth="3"/>
   <T x={1410} y={775} size={32} bold>{time>=e.pause?'先查价格':'立即购买'}</T>
  </g>
  <Hand x={mix(1635,1518,reach)+90*ease((time-e.pause-.25)/.35)} y={mix(900,754,reach)+150*ease((time-e.pause)/.35)} opacity={ease((time-(e.reach-.3))/.3)}/>
 </svg>;
}

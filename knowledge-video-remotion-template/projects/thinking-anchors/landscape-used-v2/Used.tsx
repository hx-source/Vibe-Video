import React from 'react';
import {ease} from '../../../src/components/primitives';
import {LiveDecision} from '../landscape-decision-v1/Decision';
import {Text,PriceTag} from '../landscape-opening-v2/Shapes';
import {UsedShopper} from './Actor';
import board from './board.json';
const ink='#25252b',cream='#fff8e9',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
function Camera({scratch=0}:{scratch?:number}){
 return <g stroke={ink} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
  <path d="M-170 -92 H-81 L-51 -133 H48 L76 -92 H170 Q189 -92 189 -73 V98 Q189 119 168 119 H-168 Q-189 119 -189 98 V-73 Q-189 -92 -170 -92 Z" fill={mint}/>
  <path d="M-175 -91 H172 V-42 H-175 Z" fill="#d5d9d3"/>
  <rect x="-161" y="-128" width="54" height="35" rx="7" fill={coral}/><rect x="100" y="-81" width="55" height="22" rx="5" fill={paper}/>
  <circle cx="17" cy="26" r="83" fill={ink}/><circle cx="17" cy="26" r="64" fill={teal}/><circle cx="17" cy="26" r="40" fill="#31555a"/><path d="M-5 0 Q19 -20 42 1" stroke={paper} strokeWidth="8" fill="none"/>
  <path d="M-154 24 L-121 40 M-158 43 L-124 59 M-150 66 L-126 76" stroke={coral} strokeWidth="5" opacity={scratch}/>
 </g>;
}
function Charger(){return <g stroke={ink} strokeWidth="5" strokeLinejoin="round" fill="none" strokeLinecap="round"><rect x="-70" y="-78" width="140" height="133" rx="17"/><path d="M-24 -78 V-107 M24 -78 V-107 M0 55 V94 Q0 121 36 120 H82"/><path d="M-21 -25 H21 M-21 -1 H21" strokeWidth="3"/></g>;}
function Magnifier({x,y,p}:{x:number;y:number;p:number}){return <g opacity={p} transform={`translate(${x} ${y})`} stroke={ink} strokeWidth="7" strokeLinecap="round"><circle r="63" fill="#fffdf5" fillOpacity=".12"/><path d="M44 44 L105 105" strokeWidth="17"/><path d="M44 44 L105 105" stroke={coral} strokeWidth="8"/></g>;}
function Record({value,index,p,retire=0}:{value:number;index:number;p:number;retire?:number}){
 return <g data-sale={value} opacity={p*(1-retire)} transform={`translate(${897+55*(1-p)-30*retire} ${577+45*(1-p)-100*retire})`}>
  <path d="M-284 -169 H292 V178 L263 156 L234 178 L205 156 L176 178 L147 156 L118 178 L89 156 L60 178 L31 156 L2 178 L-27 156 L-56 178 L-85 156 L-114 178 L-143 156 L-172 178 L-201 156 L-230 178 L-259 156 L-284 178 Z" fill={ink}/>
  <path d="M-294 -179 H282 V168 L253 146 L224 168 L195 146 L166 168 L137 146 L108 168 L79 146 L50 168 L21 146 L-8 168 L-37 146 L-66 168 L-95 146 L-124 168 L-153 146 L-182 168 L-211 146 L-240 168 L-269 146 L-294 168 Z" fill={paper} stroke={ink} strokeWidth="5"/>
  <Text x={-15} y={-95} size={38}>已成交 {index}/3</Text><path d="M-242 -59 H225" stroke={ink} strokeWidth="3" strokeDasharray="8 8" opacity=".3"/>
  <Text x={-10} y={113} size={179} color="#207b72">{value}</Text>
  <g transform="translate(215 -124) rotate(10)"><rect x="-44" y="-23" width="88" height="46" rx="6" fill={mint} stroke={teal} strokeWidth="3"/><Text x={0} y={10} size={26} color="#207b72">示例</Text></g>
 </g>;
}
export function AnchorLandscapeUsed({frame}:{frame:number}){
 if(!Number.isInteger(frame)||frame<0||frame>=540)throw Error('Used scene frame outside 0–539');
 const t=frame/30,e=board.events;if(t<e.switch)return <LiveDecision frame={539}/>;
 const enter=ease((t-e.switch)/.65),test=ease((t-e.test)/.35),inspect=ease((t-e.inspect)/.4),missing=ease((t-e.missing)/.4),search=ease((t-e.match)/.45),range=ease((t-e.range)/.5),compare=ease((t-e.compare)/.4);
 const checking=inspect*(1-search),scratch=inspect,quoteStage=1-test;
 const cameraX=mix(mix(329,600,test),300,search),cameraScale=mix(mix(1.12,1.65,test),1.08,search);
 const heading=t<e.test?'二手砍价，也先找依据':t<e.inspect?'先试基本功能':t<e.match?'再看磨损和配件':t<e.range?'查已成交，别只看挂牌':t<e.compare?'成交记录，给出参照':'结合实物，再判断开价';
 const filterTimes=[e.match,e.condition,e.parts];
 const stage=t<e.test?'seller-quote':t<e.inspect?'test-basic-functions':t<e.missing?'inspect-wear':t<e.match?'inspect-accessories':t<e.sale1?'match-comparables':t<e.range?'read-completed-sales':'compare-reference';
 return <svg data-landscape-scene data-stage={stage} width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="二手相机开价800，检查磨损和缺充电器，查同款成色配件相近的示例成交620、650、680，结合状况判断价格">
  <defs><pattern id="used-paper" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill={cream}/><rect width="1920" height="1080" fill="url(#used-paper)"/>
  <path d="M0 945 Q770 903 1920 950 V1080 H0 Z" fill="#e9dec9"/><path d="M0 982 Q950 943 1920 984" fill="none" stroke="#d8cbb5" strokeWidth="3"/>
  <ellipse cx="1610" cy="1002" rx="240" ry="27" fill={ink} opacity=".08"/><ellipse cx="755" cy="948" rx="590" ry="30" fill={ink} opacity=".05"/>
  
  <g opacity={1}>
   <Text x={820} y={177} size={t<e.test||t>=e.match&&t<e.range?68:76}>{heading}</Text>
   <g data-same-camera transform={`translate(${cameraX} 568) scale(${cameraScale})`}><Camera scratch={scratch}/><circle cx={145} cy={-62} r={7} fill={teal} stroke={ink} strokeWidth={3} opacity={test}/><circle cx={17} cy={26} r={64} fill={paper} opacity={.8*Math.max(0,1-Math.abs((t-e.shutter-.1)/.1))}/></g>
   <Text x={cameraX} y={842} size={44}>二手相机</Text>
   <g opacity={quoteStage}><PriceTag x={835} y={570+35*(1-enter)} w={610} h={404} label="卖家开价" value={board.quote}/></g>
   <g opacity={test*(1-inspect)}><Text x={1090} y={515} size={58} color="#207b72">能开机 ✓</Text><g opacity={ease((t-e.shutter)/.25)}><Text x={1090} y={646} size={58} color="#207b72">能拍照 ✓</Text></g></g>
   <g opacity={checking}>
    <g opacity={1-missing}>
     <Magnifier x={cameraX-136*cameraScale} y={568+43*cameraScale} p={inspect}/>
     <path d="M439 625 Q720 572 900 570" fill="none" stroke={coral} strokeWidth="5"/>
     <Text x={1070} y={590} size={58}>外壳有磨损</Text>
    </g>
    <g opacity={missing}>
     <g transform="translate(1050 535) scale(1.18)" opacity=".55" strokeDasharray="10 9"><Charger/></g>
     <path d="M984 475 L1115 609 M1115 475 L984 609" stroke={coral} strokeWidth="8" strokeLinecap="round"/>
     <Text x={1050} y={785} size={65}>缺充电器</Text>
    </g>
   </g>
   <g opacity={search*(1-range)}>
    {['同款','成色相近','配件相近'].map((label,i)=>{const p=ease((t-filterTimes[i])/.26);return <g key={label} opacity={p} transform={`translate(${582+i*224} ${308+16*(1-p)})`}>
     <rect x="-100" y="-40" width="205" height="79" rx="18" fill={mint} stroke={teal} strokeWidth="4"/><Text x={0} y={15} size={i===0?38:34}>{label}</Text>
    </g>;})}
    {board.sales.map((value,i)=><Record key={value} value={value} index={i+1} p={ease((t-[e.sale1,e.sale2,e.sale3][i])/.35)} retire={i===2?0:ease((t-[e.sale2,e.sale3][i])/.18)}/>)}
   </g>
   <g opacity={range} transform={`translate(0 ${20*(1-range)})`}>
    <g opacity={compare} transform="translate(1090 325)"><rect x="-152" y="-88" width="304" height="176" rx="18" fill="#eee9df" stroke="#8d8b83" strokeWidth="4"/><Text x={0} y={-36} size={31} color="#6e6d67">卖家开价</Text><Text x={0} y={61} size={103} color="#6e6d67">800</Text></g>
    <Text x={855} y={480} size={44}>示例成交参考</Text><Text x={855} y={675} size={145} color="#207b72">620—680</Text>
    <path d="M500 720 Q825 735 1167 720" stroke={teal} strokeWidth="8" strokeLinecap="round" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1-range}/>
    <g opacity={compare}><Text x={855} y={845} size={49}>还要结合磨损、配件</Text></g>
   </g>
   <g transform={`translate(${mix(751,706,enter)} -925) scale(1.1)`}><UsedShopper time={t} clock={52+t}/></g>
  </g>
 </svg>;
}
export const usedScenes={'anchor-landscape-used':AnchorLandscapeUsed};
export function validateUsed(){
 if(board.video.width!==1920||board.video.height!==1080||board.video.fps!==30||board.durationSeconds!==18||!usedScenes[board.sceneType as keyof typeof usedScenes])throw Error('Invalid used scene');
 let last=-1;for(const t of Object.values(board.events)){if(t<=last||t<0||t>=18)throw Error('Invalid event order');last=t;}
 if(board.sales.length!==3||Math.min(...board.sales)!==620||Math.max(...board.sales)!==680)throw Error('Invalid sample sales');
}

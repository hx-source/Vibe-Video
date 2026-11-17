import React from 'react';
import type {Segment} from '../../../src/types';
import {ease} from '../../../src/components/primitives';
import {Coffee} from './AnchorLifeScene';
import {AnchorEvidenceMotion} from './AnchorEvidenceMotion';
import {RegroupStage,type RegroupVariant} from './RegroupStage';

const ink='#25252b',paper='#fffdf5',teal='#45b9ae',coral='#ed795f';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
function Txt({x,y,children,size=30,anchor='start',color=ink,bold=false}:{x:number;y:number;children:React.ReactNode;size?:number;anchor?:'start'|'middle'|'end';color?:string;bold?:boolean}){
  return <text x={x} y={y} fill={color} fontSize={size} fontWeight={bold?700:400} textAnchor={anchor}>{children}</text>;
}
function Speech({x,y,w,text,opacity=1}:{x:number;y:number;w:number;text:string;opacity?:number}){
  return <g opacity={opacity}>
    <path d={`M${x+20} ${y} H${x+w-20} Q${x+w} ${y} ${x+w} ${y+20} V${y+88} Q${x+w} ${y+110} ${x+w-22} ${y+110} H${x+w*.36} L${x+w*.27} ${y+146} L${x+w*.29} ${y+110} H${x+20} Q${x} ${y+110} ${x} ${y+90} V${y+20} Q${x} ${y} ${x+20} ${y} Z`} fill={paper} stroke={ink} strokeWidth="5" strokeLinejoin="round"/>
    <Txt x={x+w/2} y={y+70} anchor="middle" size={34} bold>{text}</Txt>
  </g>;
}
function Actor({time,checking,comparing,settled}:{time:number;checking:number;comparing:number;settled:number}){
  const surprised=checking*(1-comparing),look=comparing*(1-settled),tilt=-5*surprised+5*look;
  const pointX=mix(360,398,comparing),pointY=mix(765,814,comparing);
  const blink=(time%3.7)>3.52;
  return <g stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M121 954 Q125 837 211 835 Q295 839 298 954 Z" fill={teal}/>
    <path d="M140 884 L103 848 L90 798" fill="none"/>
    <path d={`M280 876 Q${mix(325,348,comparing)} ${mix(819,842,comparing)} ${pointX} ${pointY}`} fill="none"/>
    <circle cx={pointX} cy={pointY} r="10" fill="#f1c4a0"/>
    <rect x="197" y="818" width="28" height="41" rx="9" fill="#f1c4a0"/>
    <g transform={`rotate(${tilt} 211 793)`}>
      <ellipse cx="211" cy="793" rx="53" ry="61" fill="#f1c4a0"/>
      <path d="M159 782 Q154 716 211 720 Q269 723 266 783 L246 754 Q200 769 177 748 L171 784 Z" fill={ink}/>
      {blink?<path d="M184 792 h8 M227 792 h8"/>:<><path d={`M188 ${790-6*surprised} v7 M231 ${790-6*surprised} v7`}/><path d={`M180 ${774-9*surprised} l18 -4 M221 ${770-9*surprised} l18 4`} strokeWidth="3"/></>}
      {surprised>.4?<ellipse cx="211" cy="821" rx="8" ry="11" fill={ink}/>:<path d={`M198 819 Q211 ${826+9*settled} 225 818`} fill="none" strokeWidth="4"/>}
    </g>
    <g opacity={surprised}><path d="M113 731 l-19 -20 M104 759 l-28 -3 M300 738 l19 -20" stroke={coral} strokeWidth="6"/></g>
  </g>;
}

export function UsedEvidenceRegroup({segment,time,variant}:{segment:Segment;time:number;variant:RegroupVariant}){
  if(time<segment.events.range)return <AnchorEvidenceMotion {...{segment,time}}/>;
  const e=segment.events;
  const checking=ease((time-e.condition)/.45),missing=ease((time-e['accessory-check'])/.4);
  const comparing=ease((time-e.records)/.65),converge=ease((time-e.range)/(e.settle-e.range));
  const settled=ease((time-e.settle)/.4),entry=ease((time-e.reveal)/.5);
  const scale=mix(1.16,.93,comparing),coffeeX=mix(485,459,comparing),coffeeY=mix(558,602,comparing);
  const lensTravel=ease((time-e['accessory-check'])/.75);
  const lensX=mix(coffeeX-106*scale,731,lensTravel),lensY=mix(coffeeY+3*scale,699,lensTravel);
  const lensOpacity=ease((time-e.inspect)/.35)*(1-ease((time-e.records+.3)/.5));
  const phase=time<e.condition?0:time<e['accessory-check']?1:time<e.records?2:3;
  const phrases=['2000 元？先看看。','咦？这里有磨损。','配件也没齐？','查查同款的成交价。'];
  const phraseAt=[e.reveal,e.condition,e['accessory-check'],e.records][phase];
  const speechScale=1+.035*Math.sin(Math.min(1,(time-phraseAt)/.45)*Math.PI);
  const finalX=[1110,1390,1670],originalY=[452,574,696];
  const priceMoveX=ease(converge/.6),priceMoveY=ease((converge-.4)/.6);
  return <svg data-fullbleed-scene width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label="人物检查咖啡机，发现磨损和缺少配件，滑看成交记录，重新形成价格判断">
    <defs>
      <pattern id="motion-dots" width="27" height="27" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill={ink} opacity=".055"/></pattern>
      <radialGradient id="motion-wash"><stop stopColor="#cfece0" stopOpacity=".8"/><stop offset="1" stopColor="#fff8e9" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="#fff8e9"/><rect width="1920" height="1080" fill="url(#motion-dots)"/>
    <ellipse cx="487" cy="618" rx="435" ry="350" fill="url(#motion-wash)"/>
    <g opacity={entry}>
      <Txt x={100} y={116} size={52} bold>2000 元，凭什么？</Txt>
      <g transform={`translate(1630 92) rotate(${mix(-13,-5,entry)}) scale(${mix(1.25,1,entry)})`}>
        <rect x="-116" y="-34" width="232" height="67" rx="7" fill={paper} stroke={coral} strokeWidth="4"/>
        <Txt x={0} y={13} anchor="middle" size={25} color="#bc503e" bold>剧情示例</Txt>
      </g>
      {[['看商品',0],['查成交',comparing],['再判断',settled]].map(([label,p],i)=><g key={String(label)}>
        <circle cx={130+i*600} cy="195" r="16" fill={i===0?teal:mix(0,1,Number(p))>.5?teal:paper} stroke={ink} strokeWidth="3"/>
        <Txt x={165+i*600} y={207} size={28} bold>{label}</Txt>
        {i<2&&<path d={`M${340+i*600} 195 H${660+i*600}`} stroke={ink} strokeWidth="3" strokeDasharray="5 9" opacity=".25"/>}
      </g>)}
    </g>
    <g transform={`translate(0 ${18*(1-entry)})`} opacity={entry}>
      <Coffee x={coffeeX} y={coffeeY} scale={scale} scratches={checking}/>
      <ellipse cx={coffeeX} cy={coffeeY+153*scale} rx={165*scale} ry="16" fill={ink} opacity=".08"/>
      <g transform={`translate(745 461) rotate(${mix(-8,4,converge)})`} opacity={mix(1,.32,converge)}>
        <path d="M-107 -51 H105 L131 0 L105 48 H-107 Z" fill={coral} stroke={ink} strokeWidth="5"/>
        <Txt x={2} y={17} anchor="middle" size={43} bold>¥ 2000</Txt>
        <path d="M-92 31 L110 -33" stroke={ink} strokeWidth="6" strokeLinecap="round" strokeDasharray="220" strokeDashoffset={220*(1-converge)}/>
      </g>
      <g opacity={checking*(1-comparing*.7)}>
        <path d={`M${coffeeX-106*scale} ${coffeeY+52*scale} Q310 694 349 748`} stroke={coral} strokeWidth="3" fill="none" strokeDasharray="6 7"/>
        <g transform={`translate(352 789) rotate(-5)`}><rect x="-65" y="-37" width="130" height="59" rx="9" fill={paper} stroke={coral} strokeWidth="3"/><Txt x={0} y={3} anchor="middle" size={27} color="#bc503e" bold>磨损</Txt></g>
      </g>
      <g opacity={missing*(1-comparing*.7)}>
        <g transform="translate(731 699)" stroke={ink} strokeWidth="4"><path d="M-30 -24 H27 L20 22 H-22 Z M-40 28 H39" fill="none" strokeDasharray="6 6"/><path d="M28 -12 H69" strokeDasharray="6 6"/></g>
        <path d="M693 668 L772 737 M774 666 L694 736" stroke={coral} strokeWidth="5" strokeLinecap="round"/>
        <Txt x={732} y={804} size={28} color="#bc503e" anchor="middle" bold>少配件</Txt>
      </g>
      <g opacity={lensOpacity} transform={`translate(${lensX} ${lensY}) rotate(-23)`}>
        <path d="M-37 39 L-98 102" stroke={ink} strokeWidth="17" strokeLinecap="round"/>
        <circle r="55" fill="#fffdf5" fillOpacity=".28" stroke={ink} strokeWidth="7"/>
        <circle r="45" fill="none" stroke={coral} strokeWidth="3"/><path d="M-29 -24 Q-9 -42 13 -34" fill="none" stroke={paper} strokeWidth="7" strokeLinecap="round"/>
      </g>
      <Actor {...{time,checking,comparing,settled}}/>
    </g>
    <RegroupStage time={time-segment.events.range+8} variant={variant}/>
    <g opacity={entry} transform={`translate(${440*(1-speechScale)} ${322*(1-speechScale)}) scale(${speechScale})`}>
      <Speech x={100} y={278} w={680} text={time>=e.settle?'结合成色、配件再谈价。':phrases[phase]}/>
    </g>
  </svg>;
}

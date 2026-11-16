import React from 'react';
import {ease} from '../../../src/components/primitives';

export type RegroupVariant='ruler'|'outline'|'summary';
const ink='#25252b',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae';
const values=[1100,1200,1300],ys=[452,574,696];
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
function T({x,y,children,size=30,bold=false,anchor='start',color=ink}:{x:number;y:number;children:React.ReactNode;size?:number;bold?:boolean;anchor?:'start'|'middle'|'end';color?:string}){
 return <text data-regroup-text x={x} y={y} fill={color} fontSize={size} fontWeight={bold?700:400} textAnchor={anchor}>{children}</text>;
}
function Price({value,x,y,p=0,width=218}:{value:number;x:number;y:number;p?:number;width?:number}){
 return <g transform={`translate(${x} ${y})`}>
  <rect x={-width/2} y={-53+14*p} width={width} height={80-12*p} rx="14" fill={p>.5?paper:mint} stroke={ink} strokeWidth={3*p}/>
  <T x={0} y={2} size={42-6*p} anchor="middle" bold>¥ {value}</T>
 </g>;
}
function Records({opacity,prices=true}:{opacity:number;prices?:boolean}){
 return <g opacity={opacity}>
  <rect x="1006" y="341" width="778" height="481" rx="29" fill={ink}/>
  <rect x="992" y="329" width="778" height="481" rx="29" fill={paper} stroke={ink} strokeWidth="5"/>
  <T x={1032} y={373} size={26} bold>同款 · 成色相近</T><path d="M1006 392 H1755" stroke={ink} strokeWidth="3"/>
  {values.map((value,i)=><g key={value}>
   <rect x="1021" y={ys[i]-51} width="718" height="102" rx="13" fill={mint} stroke={ink} strokeWidth="3"/>
   <T x={1051} y={ys[i]-15} size={26} bold>成交记录 {String.fromCharCode(65+i)}</T>
   <T x={1051} y={ys[i]+28} size={22} color="#666258">同款 · 成色相近</T>
   {prices&&<Price value={value} x={1620} y={ys[i]}/>}
  </g>)}
 </g>;
}

export function RegroupStage({time,variant}:{time:number;variant:RegroupVariant}){
 const t=time-8;
 if(variant==='outline'){
  const line=ease((t-.10)/.85),result=ease((t-1.04)/.40);
  return <g data-regroup-variant={variant}>
   <Records opacity={1}/>
   <rect x="1494" y="391" width="257" height="348" rx="20" fill={teal} fillOpacity={.09*line}/>
   <rect x="1494" y="391" width="257" height="348" rx="20" fill="none" stroke={teal} strokeWidth="7" pathLength="1" strokeDasharray="1" strokeDashoffset={1-line}/>
   <g opacity={result} transform={`translate(0 ${14*(1-result)})`}>
    <path d="M1620 750 V820" fill="none" stroke={teal} strokeWidth="4" strokeDasharray="6 6"/>
    <rect x="1040" y="843" width="700" height="124" rx="18" fill={mint} stroke={ink} strokeWidth="4"/>
    <T x={1390} y={883} size={25} anchor="middle" bold>可比成交区间</T>
    <T x={1390} y={940} size={44} anchor="middle" bold>¥ 1100–1300</T>
   </g>
  </g>;
 }
 if(variant==='summary'){
  const card=ease((t-.08)/.48),range=ease((t-.86)/.46);
  return <g data-regroup-variant={variant}>
   <Records opacity={1-ease(t/.14)} prices={false}/>
   <g opacity={card} transform={`translate(0 ${12*(1-card)})`}>
    <rect x="1007" y="377" width="790" height="480" rx="28" fill={ink}/>
    <rect x="995" y="365" width="790" height="480" rx="28" fill={paper} stroke={ink} strokeWidth="5"/>
    <g opacity={ease((t-.35)/.18)}><T x={1390} y={435} size={31} anchor="middle" bold>三笔可比成交</T></g>
    <path d="M1020 464 H1760" stroke={ink} strokeWidth="3"/>
    <T x={1390} y={627} size={25} color="#666258" anchor="middle">同款 · 成色相近</T>
    <g opacity={range} transform={`translate(${1390*(1-(.95+.05*range))} ${730*(1-(.95+.05*range))}) scale(${.95+.05*range})`}>
     <rect x="1087" y="662" width="606" height="104" rx="18" fill={mint}/>
     <T x={1390} y={734} size={62} anchor="middle" bold>¥ 1100–1300</T>
    </g>
    <T x={1390} y={806} size={27} anchor="middle" bold>可比成交区间</T>
   </g>
   {values.map((value,i)=>{
    const p=ease((t-.04-i*.08)/.46);
    return <Price key={value} value={value} x={lerp(1620,[1190,1390,1590][i],p)} y={lerp(ys[i],548,p)-18*Math.sin(Math.PI*p)} p={p} width={lerp(218,164,p)}/>;
   })}
  </g>;
 }
 const axis=ease((t-.08)/.30),finish=ease((t-1.35)/.36);
 return <g data-regroup-variant="ruler">
  <Records opacity={1-ease(t/.14)} prices={false}/>
  <g opacity={axis}>
   <T x={1390} y={340} size={30} anchor="middle" bold>把可比价格，放到同一把尺上</T>
   <path d="M1085 720 H1695" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round"/>
   {[1110,1390,1670].map(x=><path key={x} d={`M${x} 706 V739`} stroke={ink} strokeWidth="4"/>)}
  </g>
  <path d="M1110 720 H1670" fill="none" stroke={teal} strokeWidth="24" strokeLinecap="round" opacity={finish*.55}/>
  {values.map((value,i)=>{
   const p=ease((t-.12-i*.31)/.44),land=ease((t-.56-i*.31)/.12);
   const x=lerp(1620,[1110,1390,1670][i],p),y=lerp(ys[i],650,p)-35*Math.sin(Math.PI*p);
   return <g key={value}>
    <Price value={value} x={x} y={y} p={p} width={lerp(218,174,p)}/>
    <g opacity={land}><path d={`M${[1110,1390,1670][i]} 683 V708`} stroke={ink} strokeWidth="3"/><circle cx={[1110,1390,1670][i]} cy="720" r="9" fill={teal} stroke={ink} strokeWidth="3"/></g>
   </g>;
  })}
  <g opacity={finish}>
   <path d="M1110 772 V794 H1670 V772" fill="none" stroke={teal} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
   <T x={1390} y={852} size={31} anchor="middle" bold>可比成交区间：¥1100–1300</T>
  </g>
 </g>;
}

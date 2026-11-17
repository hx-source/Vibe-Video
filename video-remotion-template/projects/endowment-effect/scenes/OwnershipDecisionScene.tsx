import React from 'react';
import type {Segment,VisualStyle} from '../../../src/types';

const ease=(n:number)=>{const x=Math.max(0,Math.min(1,n));return x*x*(3-2*x);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;

// A single persistent person and cup. The two lower panels retain the two
// decisions, not two people or experimentally measured valuation amounts.
export function OwnershipDecisionScene({segment,time,visual:v}:{segment:Segment;time:number;visual:VisualStyle}){
 const c=v.colors,e=segment.events;
 const at=(t:number,d=.5)=>ease((time-t)/d);
 const buyNo=at(e['buy-refusal'],.4),own=at(e.own,.8),sale=at(e.loss,.35);
 const sellNo=at(e['sale-refusal'],.45),result=at(e.result,.45);
 const gift=at(e.own-.2,.25)*(1-at(e.loss-.3,.3));
 const cupX=mix(1035,865,own)+50*at(e.loss,.6)*(1-sellNo);
 const cupY=535-24*Math.sin(Math.PI*own)-8*Math.sin(Math.PI*sellNo);
 const phase=time<e.own?0:time<e.loss?1:2;
 const skin='#e7c6a7',ink='#433a3b',shirt='#414b66';
 const txt=(x:number,y:number,text:string,size=28,color=c.text,anchor:'start'|'middle'|'end'='start',weight=400)=><text data-fit x={x} y={y} textAnchor={anchor} fill={color} fontSize={size} fontWeight={weight}>{text}</text>;
 function Mug({x,y,scale=1,tag=false,opacity=1}:{x:number;y:number;scale?:number;tag?:boolean;opacity?:number}){
  return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
   <path d="M68 -39H89Q142 -39 140 9Q139 60 72 52" fill="none" stroke={c.primary} strokeWidth="14"/>
   <path d="M-83 -70H82L69 73Q66 96 1 98Q-65 96 -69 73Z" fill={c.primary} stroke="#f3dba3" strokeWidth="2"/>
   <ellipse cy="-70" rx="82" ry="17" fill="#292638" stroke="#f3dba3" strokeWidth="3"/>
   <path d="M-45 -38V52" stroke="#fff4d4" opacity=".52" strokeWidth="10" strokeLinecap="round"/>
   <path d="M-12 5Q-26 -11 -14 -18Q-5 -24 0 -13Q7 -25 17 -18Q29 -7 0 15Z" fill="#a98037" opacity=".65"/>
   {tag&&<><rect x="-48" y="23" width="96" height="40" rx="11" fill={c.accent}/>{txt(0,52,'我的',27,c.background,'middle',700)}</>}
  </g>;
 }
 function Money({x,y,scale=1}:{x:number;y:number;scale?:number}){
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
   <rect x="-66" y="-40" width="132" height="80" rx="12" fill="#203d43" stroke="#82bdb2" strokeWidth="3"/>
   <path d="M-51 -16Q-39 -16 -39 -29H39Q39 -16 51 -16V16Q39 16 39 29H-39Q-39 16 -51 16Z" fill="none" stroke="#82bdb2" opacity=".35"/>
   {txt(0,13,'¥30',34,'#b4e2cb','middle',700)}
  </g>;
 }
 function Exchange({x,y,rejected,progress,color}:{x:number;y:number;rejected:number;progress:number;color:string}){
  const flow=(time*.7)%1;
  return <g transform={`translate(${x} ${y})`}>
   <path d="M-51 0H51 M39 -10L51 0 39 10" fill="none" stroke={color} strokeOpacity={.3+.45*(1-rejected)} strokeWidth="3" strokeLinecap="round"/>
   {progress>0&&rejected<1&&<circle cx={-45+90*flow} r="4" fill={color} opacity={progress*(1-rejected)}/>}
   <g opacity={rejected} transform={`scale(${.7+.3*rejected})`}><circle r="17" fill={c.panel} stroke={c.accent} strokeWidth="2"/><path d="M-8 8L8 -8" stroke={c.accent} strokeWidth="3" strokeLinecap="round"/></g>
  </g>;
 }
 // A fixed-length two-joint arm reaches the handle without rubber-like scaling.
 const wristX=mix(796,cupX+113,own),wristY=mix(462,cupY+13,own);
 const sx=690,sy=495,dx=wristX-sx,dy=wristY-sy,len=165;
 const distance=Math.min(len*2-.01,Math.hypot(dx,dy));
 const angle=Math.atan2(dy,dx)+Math.acos(distance/(2*len));
 const elbowX=sx+len*Math.cos(angle),elbowY=sy+len*Math.sin(angle);
 const emotion=buyNo*(1-own)+sellNo;
 const speech=phase===0?'30元？有点贵。':phase===1?'是我的了。':sellNo>.2?'30元？不卖。':'卖掉？';
 return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}} data-decision-scene data-stage={phase}>
  <defs>
   <radialGradient id="decision-halo"><stop stopColor="#394054" stopOpacity=".55"/><stop offset="1" stopColor={c.background} stopOpacity="0"/></radialGradient>
   <linearGradient id="decision-paper" x2="0" y2="1"><stop stopColor="#222a40"/><stop offset="1" stopColor="#141b2d"/></linearGradient>
  </defs>
  <rect width="1920" height="1080" fill={c.background}/>
  <ellipse cx="950" cy="490" rx="920" ry="550" fill="url(#decision-halo)"/>
  {Array.from({length:28},(_,i)=><circle key={i} cx={60+(i*397)%1800} cy={30+(i*173)%680} r={i%4===0?1.7:.8} fill={c.primary} opacity=".2"/>)}
  {txt(100,64,'思考，快与慢 / 禀赋效应',21,c.muted)}
  {txt(1820,64,'生活示意 · 30元为假设金额',20,c.muted,'end')}
  {txt(100,152,'买时嫌贵，卖时舍不得。',58,c.text,'start',700)}
  {txt(1815,147,'同一个人 · 同一只杯子 · 同样30元',26,c.muted,'end')}

  <g data-stage-path>
   <path d="M170 220H1750" stroke={c.line} strokeWidth="2"/>
   {['想买它','获赠杯子','有人收购'].map((label,i)=>{
    const x=170+i*790,active=phase>=i,color=i===0?c.primary:i===1?c.success:c.accent;
    return <g key={label}><circle cx={x} cy="220" r="16" fill={active?color:c.panel} stroke={active?color:c.line} strokeWidth="2"/>{txt(x,226,String(i+1),17,active?c.background:c.muted,'middle',700)}<rect x={x-88} y="241" width="176" height="43" rx="15" fill={phase===i?c.panel:c.background}/>{txt(x,271,label,26,active?color:c.muted,'middle',phase===i?700:400)}</g>;
   })}
  </g>

  <ellipse cx="620" cy="673" rx="190" ry="20" fill="#000" opacity=".16"/>
  <ellipse cx={cupX+8} cy="651" rx="125" ry="16" fill={c.primary} opacity={.1+own*.04}/>
  <path d="M460 681H1175" stroke={c.line} strokeWidth="2"/>

  <g data-person>
   <path d="M550 461Q498 476 490 640Q595 673 714 640Q704 482 656 461Z" fill={shirt} stroke="#73819b" strokeWidth="3"/>
   <path d="M585 445V481Q606 502 629 481V445" fill={skin}/>
   <path d="M556 476L599 519 641 478" fill="none" stroke={c.primary} strokeWidth="3"/>
   <path d="M514 502Q475 571 511 626L553 643" fill="none" stroke="#74809a" strokeWidth="24" strokeLinecap="round"/>
   <path d="M514 502Q475 571 511 626L553 643" fill="none" stroke={shirt} strokeWidth="18" strokeLinecap="round"/>
   <ellipse cx="558" cy="643" rx="17" ry="12" fill={skin}/>
   <g transform={`rotate(${-3*emotion} 606 404)`}>
    <ellipse cx="605" cy="404" rx="61" ry="70" fill={skin} stroke="#efddbd" strokeWidth="2"/>
    <path d="M544 401Q526 327 586 322Q641 304 668 354L664 401 647 370Q624 379 603 356Q577 382 551 369Z" fill="#303343"/>
    <path d={`M574 ${392+emotion*3}L590 389 M623 389L639 ${392+emotion*3}`} stroke={ink} strokeWidth="3" strokeLinecap="round"/>
    <ellipse cx="583" cy="404" rx="4" ry="5" fill={ink}/><ellipse cx="632" cy="404" rx="4" ry="5" fill={ink}/>
    <path d="M607 409l-4 13h7" fill="none" stroke="#a47866" strokeWidth="2"/>
    <path d={`M590 440Q605 ${453-16*emotion} 621 439`} fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round"/>
   </g>
   <path d={`M${sx} ${sy}L${elbowX} ${elbowY}L${wristX} ${wristY}`} fill="none" stroke="#7c899f" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round"/>
   <path d={`M${sx} ${sy}L${elbowX} ${elbowY}L${wristX} ${wristY}`} fill="none" stroke={shirt} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
  </g>

  <g transform={`translate(${cupX} ${cupY})`} data-main-cup data-owned={own.toFixed(3)}>
   <Mug x={0} y={0} scale={.86}/>
   <g opacity={gift} transform={`translate(0 ${-80-34*(1-own)})`}>
    <path d="M0 4Q-58 -37 -53 -10Q-40 12 0 4Q56 -38 51 -9Q37 14 0 4" fill="none" stroke={c.accent} strokeWidth="7"/>
    <path d="M0 4L-20 30 M0 4L24 28" fill="none" stroke={c.accent} strokeWidth="6"/>
   </g>
   <g opacity={own} transform={`translate(0 ${16*(1-own)})`}><rect x="-67" y="109" width="134" height="43" rx="21" fill={c.accent}/>{txt(0,139,'我的',27,c.background,'middle',700)}</g>
  </g>
  <g transform={`translate(${wristX} ${wristY})`}>
   <ellipse rx="13" ry={mix(23,15,own)} fill={skin} transform={`rotate(${mix(-30,20,own)})`}/>
   <path d={own>.5?'M-6 -7Q-17 -16 -18 -6':'M-7 -10L-15 -19'} fill="none" stroke={skin} strokeWidth="8" strokeLinecap="round"/>
  </g>

  <g data-speech>
   <rect x="730" y="309" width="450" height="102" rx="25" fill={c.panel} stroke={phase===2?c.accent:c.primary} strokeWidth="2"/>
   <path d="M754 404L703 431 783 411" fill={c.panel} stroke={phase===2?c.accent:c.primary} strokeWidth="2"/>
   <path d="M756 405L780 406" stroke={c.panel} strokeWidth="6"/>
   {txt(954,374,speech,36,c.text,'middle',700)}
  </g>

  <g data-offer>
   <rect x="1270" y="331" width="450" height="310" rx="28" fill="url(#decision-paper)" stroke={phase===2?c.accent:phase===1?c.success:c.line} strokeWidth="2"/>
   {txt(1495,390,phase===0?'店里的报价':phase===1?'杯子送给你':'现在有人出价',28,phase===1?c.success:c.muted,'middle')}
   {phase===1?<>
    <g opacity={gift}><rect x="1455" y="428" width="80" height="73" rx="7" fill={c.success} fillOpacity=".2" stroke={c.success} strokeWidth="3"/><path d="M1495 426V505 M1452 449H1538 M1495 427Q1450 388 1463 423L1495 427Q1540 388 1527 423Z" fill="none" stroke={c.success} strokeWidth="4"/></g>
    {txt(1495,557,'免费获赠',40,c.success,'middle',700)}
   </>:<>
    {txt(1495,499,'¥30',92,c.primary,'middle',700)}
    {txt(1495,561,phase===0?'买这只杯子':'卖给我，可以吗？',29,c.text,'middle')}
   </>}
   <g opacity={phase===2?sellNo:phase===0?buyNo:0}><rect x="1569" y="596" width="120" height="49" rx="12" fill={c.accent}/>{txt(1629,631,phase===2?'不卖':'不买',28,c.background,'middle',700)}</g>
  </g>

  <g data-decision-record>
   <rect x="100" y="736" width="820" height="250" rx="25" fill={c.panel} stroke={phase===0?c.primary:c.line} strokeWidth="2"/>
   <rect x="1000" y="736" width="820" height="250" rx="25" fill={c.panel} stroke={sale>.1?c.accent:c.line} strokeWidth="2"/>
   <path d="M140 802H880 M1040 802H1780" stroke={c.line} strokeWidth="1"/>
   {txt(140,781,'拥有前 · 买入',29,c.primary,'start',700)}
   {txt(1040,781,'拥有后 · 卖出',29,sale>.1?c.accent:c.muted,'start',700)}
   <g>
    <Money x={242} y={873}/><Mug x={527} y={866} scale={.4}/>
    <Exchange x={382} y={873} rejected={buyNo} progress={1-own} color={c.primary}/>
    {txt(242,955,'付30元',26,c.muted,'middle')}{txt(535,955,'得到杯子',26,c.muted,'middle')}
    <g opacity={buyNo} transform={`translate(${15*(1-buyNo)} 0)`}>
     {txt(764,873,'嫌贵',35,c.text,'middle',700)}
     {txt(764,921,'不买',26,c.accent,'middle')}
    </g>
   </g>
   <g opacity={.22+.78*sale}>
    <Mug x={1137} y={866} scale={.4} tag/><Money x={1430} y={873}/>
    <Exchange x={1290} y={873} rejected={sellNo} progress={sale} color={c.accent}/>
    {txt(1145,955,'交出我的杯子',26,c.muted,'middle')}{txt(1430,955,'收30元',26,c.muted,'middle')}
    <g opacity={sellNo} transform={`translate(${15*(1-sellNo)} 0)`}>
     {txt(1688,873,'舍不得',35,c.text,'middle',700)}
     {txt(1688,921,'不卖',26,c.accent,'middle')}
    </g>
   </g>
   <g opacity={own*(1-sale)}><path d="M949 848V900 M934 885L949 900 964 885" fill="none" stroke={c.success} strokeWidth="3"/></g>
  </g>
  <g opacity={result} transform={`translate(0 ${10*(1-result)})`}>
   <rect x="390" y="1010" width="186" height="45" rx="22" fill={c.primary} fillOpacity=".13"/>
   {txt(483,1042,'禀赋效应',28,c.primary,'middle',700)}
   {txt(610,1044,'一旦成了“我的”，放弃就更难。',33,c.text,'start',700)}
  </g>
 </svg>;
}

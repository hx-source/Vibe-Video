import React from 'react';
import type {Segment} from '../../../src/types';
import {ease} from '../../../src/components/primitives';

const ink='#25252b',cream='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
type Props={segment:Segment;time:number};
function T({x,y,children,size=30,color=ink,weight=400,anchor='start',opacity=1}:{x:number;y:number;children:React.ReactNode;size?:number;color?:string;weight?:number;anchor?:'start'|'middle'|'end';opacity?:number}){
  return <text x={x} y={y} fontSize={size} fontWeight={weight} fill={color} textAnchor={anchor} opacity={opacity}>{children}</text>;
}
function Panel({x,y,w,h,fill=cream}:{x:number;y:number;w:number;h:number;fill?:string}){
  return <g><path d={`M${x+12} ${y+13} L${x+w+10} ${y+6} L${x+w+5} ${y+h+12} L${x+6} ${y+h+16} Z`} fill={ink}/><path d={`M${x} ${y} L${x+w} ${y-6} L${x+w-5} ${y+h} L${x-5} ${y+h+4} Z`} fill={fill} stroke={ink} strokeWidth="5" strokeLinejoin="round"/><path d={`M${x} ${y} L${x+w} ${y-6} L${x+w-5} ${y+h} L${x-5} ${y+h+4} Z`} fill="url(#life-dots)"/></g>;
}
function Bubble({x,y,w,h,lines,fill=cream}:{x:number;y:number;w:number;h:number;lines:string[];fill?:string}){
  return <g><path d={`M${x+20} ${y} H${x+w-20} Q${x+w} ${y} ${x+w} ${y+20} V${y+h-20} Q${x+w} ${y+h} ${x+w-20} ${y+h} H${x+w*.45} L${x+w*.36} ${y+h+27} L${x+w*.38} ${y+h} H${x+20} Q${x} ${y+h} ${x} ${y+h-20} V${y+20} Q${x} ${y} ${x+20} ${y} Z`} fill={fill} stroke={ink} strokeWidth="5" strokeLinejoin="round"/>{lines.map((s,i)=><T key={s} x={x+w/2} y={y+h/2+(i-(lines.length-1)/2)*43+10} anchor="middle" size={lines.length>1?29:31} weight={i===0?700:400}>{s}</T>)}</g>;
}
function Character({x,y,scale=1,color=teal,pose=0}:{x:number;y:number;scale?:number;color?:string;pose?:number}){
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-70 112 Q-62 31 0 30 Q64 31 70 112 Z" fill={color}/>
    <path d={`M-55 60 L-94 ${48-38*pose} L-111 ${40-64*pose} M55 60 L88 ${50-22*pose} L109 ${41-50*pose}`} fill="none"/>
    <path d="M-110 -24 l-10 -5 M109 -9 l13 -4" fill="none" opacity={pose}/>
    <rect x="-10" y="12" width="20" height="29" rx="8" fill="#f1c4a0"/>
    <ellipse cy="-21" rx="43" ry="49" fill="#f1c4a0"/>
    <path d="M-43 -27 Q-45 -76 0 -77 Q45 -72 43 -27 L28 -46 Q-5 -33 -27 -49 L-32 -23 Z" fill={ink}/>
    <path d="M-15 -20 v5 M15 -20 v5 M-9 5 Q0 13 9 5" fill="none" strokeWidth="4"/>
  </g>;
}
export function Coffee({x,y,scale=1,scratches=0}:{x:number;y:number;scale?:number;scratches?:number}){
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={ink} strokeWidth="5" strokeLinejoin="round">
    <path d="M-117 -125 L108 -130 L123 120 H-126 Z" fill="#b9d4d1"/>
    <rect x="-112" y="-119" width="214" height="72" rx="8" fill="#f4e9d2"/>
    <circle cx="-60" cy="-83" r="14" fill={coral}/><circle cx="-13" cy="-83" r="14" fill={teal}/>
    <circle cx="57" cy="-83" r="19" fill={cream}/><path d="M57 -96 V-83 L67 -79" fill="none" strokeWidth="3"/>
    <rect x="-88" y="-34" width="165" height="125" rx="6" fill="#526c6b"/>
    <path d="M-21 -31 V-4 H35" fill="none" strokeWidth="13"/><path d="M30 -3 H116" strokeWidth="12" strokeLinecap="round"/>
    <path d="M-44 40 H40 V64 Q34 85 0 85 Q-35 84 -41 65 Z" fill={cream}/><path d="M40 45 Q71 38 65 62 Q62 78 40 72" fill="none"/>
    <path d="M-102 97 H94" strokeWidth="7"/><path d="M-139 120 H139 V140 H-139 Z" fill={ink}/>
    <g opacity={scratches} stroke={coral} strokeWidth="7" strokeLinecap="round"><path d="M-114 -14 L-93 8 M-118 4 L-104 18"/><circle cx="-106" cy="3" r="38" fill="none"/></g>
  </g>;
}
function PriceTag({x,y,price,color=coral,cross=0}:{x:number;y:number;price:string;color?:string;cross?:number}){
  return <g transform={`translate(${x} ${y}) rotate(-3)`}><path d="M-110 -44 H106 L124 -7 L106 42 H-110 Z" fill={color} stroke={ink} strokeWidth="5"/><T x={0} y={16} anchor="middle" size={45} weight={700}>{price}</T><path d="M-93 24 L101 -24" stroke={ink} strokeWidth="6" strokeLinecap="round" opacity={cross}/></g>;
}
function Shirt({x,y,scale=1}:{x:number;y:number;scale?:number}){
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={ink} strokeWidth="5" strokeLinejoin="round"><path d="M-52 -83 L-111 -42 L-74 13 L-45 -5 V116 H58 V-5 L85 13 L120 -42 L61 -83 L24 -62 L-13 -62 Z" fill={coral}/><path d="M-52 -83 Q-11 -14 61 -83 M8 -60 V110" fill="none"/><circle cx="22" cy="-5" r="4" fill={ink}/><circle cx="22" cy="35" r="4" fill={ink}/><circle cx="22" cy="75" r="4" fill={ink}/></g>;
}
function RecordRow({y,label,detail,price,opacity=1}:{y:number;label:string;detail:string;price:string;opacity?:number}){
  return <g opacity={opacity}><rect x="817" y={y} width="935" height="67" rx="11" fill={cream} stroke={ink} strokeWidth="3"/><T x={845} y={y+43} size={26}>{label}</T><T x={1165} y={y+43} size={24} color="#666258">{detail}</T><T x={1715} y={y+46} size={38} weight={700} anchor="end">{price}</T></g>;
}
function Evidence({segment,time}:Props){
  const ev=segment.events,show=(name:string,d=.5)=>ease((time-ev[name])/d);
  const condition=show('condition'),records=show('records'),range=show('range',2),settled=show('settle');
  return <>
    <Panel x={120} y={280} w={600} h={520}/><Panel x={780} y={280} w={1020} h={520} fill={mint}/>
    <T x={153} y={328} size={27} weight={700}>先检查商品</T><T x={813} y={328} size={27} weight={700}>同款 · 成色相近 · 实际成交</T>
    <Coffee x={322} y={506} scale={.9} scratches={condition}/>
    <PriceTag x={558} y={386} price="¥ 2000" cross={range}/>
    <g opacity={show('inspect')}><circle cx={214} cy={510} r="44" fill="none" stroke={coral} strokeWidth="5"/><path d="M181 544 L153 576" stroke={ink} strokeWidth="11" strokeLinecap="round"/></g>
    <g opacity={condition}>
      <path d="M221 553 L192 649" stroke={coral} strokeWidth="3" strokeDasharray="6 6"/>
      <T x={160} y={697} size={27} weight={700}>机身磨损</T>
      <g transform="translate(389 701)" stroke={ink} strokeWidth="4"><path d="M-21 -26 H23 V5 H-21 Z" fill="none" strokeDasharray="5 5"/><path d="M-31 13 H34" strokeDasharray="5 5"/></g>
      <T x={309} y={758} size={27} weight={700}>缺少配件</T>
    </g>
    <Character x={594} y={655} scale={.78} pose={condition*.7}/>
    <g opacity={show('condition')}><Bubble x={488} y={506} w={202} h={66} lines={['先查一查']}/></g>
    {[1100,1200,1300].map((price,i)=><RecordRow key={price} y={366+i*85} label={`成交记录 ${String.fromCharCode(65+i)}`} detail="相近成色" price={`¥ ${price}`} opacity={ease((time-ev.records-i*.25)/.5)}/>)}
    <g opacity={range} transform={`translate(0 ${12*(1-range)})`}>
      <path d="M819 641 L1750 637 L1744 770 L815 775 Z" fill={teal} stroke={ink} strokeWidth="4"/>
      <T x={851} y={684} size={27} weight={700}>参考区间</T>
      <T x={1283} y={745} size={58} anchor="middle" weight={700}>¥ 1100—1300</T>
      <path d="M1069 759 Q1300 774 1520 756" fill="none" stroke={cream} strokeWidth="7" strokeLinecap="round" opacity={settled}/>
    </g>
    <path d="M719 449 Q752 420 781 449 L771 434 M781 449 L762 451" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" opacity={records}/>
  </>;
}

export function AnchorLifeScene({segment,time}:Props){
  const mode=segment.props.mode,ev=segment.events;
  const a=(name:string,d=.5)=>ease((time-ev[name])/d);
  let body:React.ReactNode;
  if(mode==='evidence')body=<Evidence {...{segment,time}}/>;
  else if(mode==='deal')body=<>
    <Panel x={120} y={293} w={790} h={490}/><Panel x={1020} y={293} w={790} h={490} fill={mint}/>
    <T x={154} y={339} size={26} weight={700}>卖家先报价</T><T x={1055} y={339} size={26} weight={700}>买家开始还价</T>
    <Coffee x={340} y={558} scale={.86}/><Character x={748} y={650} color={coral} pose={.4}/>
    <g opacity={a('offer')}><Bubble x={511} y={373} w={337} h={107} lines={['这台 2000 元']}/></g>
    <Character x={1243} y={649} pose={a('celebrate')}/>
    <g opacity={a('counter')}><Bubble x={1363} y={380} w={370} h={110} lines={['1600，行不行？']}/></g>
    <g opacity={a('celebrate')*(1-a('question'))}><PriceTag x={1571} y={631} color={teal} price="省了 400"/></g>
    <g opacity={a('question')}><Bubble x={1373} y={566} w={359} h={124} lines={['它凭什么', '值 2000？']}/></g>
  </>;
  else if(mode==='trap'){
    const x=950+360*a('pull',1.7);
    body=<><Panel x={120} y={293} w={1680} h={490} fill={mint}/>
      <Character x={366} y={655} color={coral}/><PriceTag x={363} y={423} price="¥ 2000"/>
      <Character x={1602} y={655} pose={.4}/>
      <g opacity={a('thought')}><Bubble x={725} y={353} w={620} h={99} lines={['“比 2000 便宜，就算赚了？”']}/></g>
      <line x1="686" y1="621" x2="1450" y2="621" stroke={ink} strokeWidth="5"/>
      {[1200,1600,2000].map((v,i)=><g key={v}><line x1={710+i*350} x2={710+i*350} y1="609" y2="634" stroke={ink} strokeWidth="4"/><T x={710+i*350} y={681} size={28} anchor="middle">{v}</T></g>)}
      <g opacity={a('anchor')}><path d="M1410 495 V620" stroke={coral} strokeWidth="5" strokeDasharray="8 8"/><T x={1410} y={481} size={29} anchor="middle" color="#bc503e">报价变成起点</T></g>
      <circle cx={x} cy="568" r="20" fill={teal} stroke={ink} strokeWidth="4"/><path d={`M${x} 568 Q1380 520 1410 508`} fill="none" stroke={coral} strokeWidth="4"/>
      <T x={x} y={540} size={27} anchor="middle">估计被牵动</T>
    </>;
  }
  else if(mode==='rewind')body=<>
    <Panel x={120} y={293} w={1680} h={490}/>
    <g opacity={a('reset')}><path d="M300 415 L250 450 L300 485 Z M360 415 L310 450 L360 485 Z" fill={coral} stroke={ink} strokeWidth="4"/><T x={304} y={535} size={28} anchor="middle">回到开价前</T></g>
    <Coffee x={657} y={559} scale={.86}/><Character x={1044} y={657} pose={a('ask')*.7}/>
    <g opacity={a('ask')}><Bubble x={1190} y={373} w={502} h={141} lines={['这个报价，', '有什么依据？']}/></g>
    <g opacity={a('target')}><path d="M1196 593 L1685 585 L1675 731 L1192 736 Z" fill={mint} stroke={ink} strokeWidth="4"/><T x={1438} y={647} size={31} anchor="middle" weight={700}>主动寻找反证</T><T x={1438} y={701} size={25} anchor="middle">检查成色、配件、成交记录</T></g>
  </>;
  else if(mode==='reprice')body=<>
    <Panel x={120} y={293} w={790} h={490} fill={mint}/><Panel x={1020} y={293} w={790} h={490}/>
    <T x={159} y={340} size={28} weight={700}>先有独立依据</T>
    <g opacity={a('reason')}><path d="M215 385 L806 379 L798 660 L207 665 Z" fill={cream} stroke={ink} strokeWidth="4"/><T x={248} y={435} size={29}>同款成交：1100—1300</T><T x={248} y={498} size={29}>这台：磨损、缺少配件</T><T x={248} y={570} size={29}>结合条件，确定自己的目标</T><path d="M246 602 H751" stroke={teal} strokeWidth="10" strokeLinecap="round"/></g>
    <Character x={1225} y={658} pose={a('offer')*.7}/>
    <g opacity={a('offer')}><Bubble x={1361} y={377} w={366} h={117} lines={['按这个成色，', '我出 1200 元']}/></g>
    <g opacity={a('reply')}><T x={1510} y={590} size={29} anchor="middle">根据依据谈价格</T></g>
    <g opacity={a('exit')}><rect x="1362" y="654" width="366" height="81" rx="15" fill={teal} stroke={ink} strokeWidth="4"/><T x={1545} y={706} size={28} anchor="middle" weight={700}>也可以换一家</T></g>
  </>;
  else if(mode==='shop')body=<>
    <Panel x={120} y={293} w={790} h={490}/><Panel x={1020} y={293} w={790} h={490} fill={mint}/>
    <T x={154} y={339} size={27} weight={700}>商品详情页</T><Shirt x={323} y={536} scale={.85}/>
    <g opacity={a('old')}><T x={668} y={425} size={28} anchor="middle">标注原价</T><T x={668} y={492} size={52} anchor="middle">¥ 999</T><path d="M568 473 L767 448" stroke={coral} strokeWidth="5"/></g>
    <g opacity={a('sale')}><PriceTag x={670} y={634} price="¥ 199" color={teal}/></g>
    <Character x={1240} y={652} pose={a('joy')*(1-a('pause'))}/>
    <g opacity={a('joy')*(1-a('pause'))}><Bubble x={1367} y={380} w={365} h={120} lines={['便宜这么多，', '赶紧买！']}/></g>
    <g opacity={a('pause')}><Bubble x={1354} y={391} w={394} h={133} lines={['等等，原价 999', '有依据吗？']}/><T x={1524} y={668} size={30} anchor="middle" weight={700}>先暂停付款</T></g>
  </>;
  else if(mode==='compare')body=<>
    <Panel x={120} y={293} w={600} h={490}/><Panel x={780} y={293} w={1020} h={490} fill={mint}/>
    <T x={153} y={339} size={27} weight={700}>同一件外套</T><Shirt x={323} y={518} scale={.77}/>
    <g opacity={1-a('hide')}><T x={560} y={420} size={27} anchor="middle">原价 999</T></g>
    <PriceTag x={554} y={514} price="¥ 199" color={teal}/>
    <T x={813} y={339} size={27} weight={700}>比较实际价格和购买条件</T>
    <RecordRow y={374} label="近期常态售价" detail="同款" price="¥ 219" opacity={a('history')}/>
    <RecordRow y={460} label="其他店到手价" detail="同款同条件" price="¥ 189" opacity={a('others')}/>
    <RecordRow y={546} label="本店到手价" detail="同款同条件" price="¥ 199" opacity={a('others')}/>
    <g opacity={a('decision')}><Bubble x={824} y={657} w={922} h={81} lines={['再结合自己的需要、预算，决定买不买']}/></g>
    <Character x={577} y={677} scale={.62} pose={a('settle')*.5}/>
  </>;
  else body=<>
    <Panel x={120} y={293} w={1680} h={490} fill={mint}/><Character x={361} y={633} scale={1.05} pose={a('result')}/>
    {[['问依据','这个数字怎么来的？','first'],['找反证','哪些信息不支持它？','second'],['再比较','用独立依据作判断','third']].map(([title,detail,event],i)=><g key={event} opacity={a(event)} transform={`translate(${634+i*372} ${366+12*(1-a(event))})`}><path d="M0 0 L330 -6 L324 314 L-5 320 Z" fill={cream} stroke={ink} strokeWidth="4"/><circle cx="162" cy="70" r="35" fill={i===1?coral:teal} stroke={ink} strokeWidth="3"/><T x={162} y={81} size={32} anchor="middle" weight={700}>{i+1}</T><T x={162} y={163} size={40} weight={700} anchor="middle">{title}</T><T x={162} y={232} size={24} anchor="middle">{detail}</T></g>)}
  </>;
  return <svg width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label={segment.intent}>
    <defs><pattern id="life-dots" width="23" height="23" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.5" fill={ink} opacity=".065"/></pattern></defs>
    <g opacity={ease((time-ev.reveal)/.35)}>{body}</g>
  </svg>;
}

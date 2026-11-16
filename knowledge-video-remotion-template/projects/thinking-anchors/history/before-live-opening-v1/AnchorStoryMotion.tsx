import React from 'react';
import type {Segment} from '../../../src/types';
import {ease} from '../../../src/components/primitives';
import {Coffee} from './AnchorLifeScene';
import {AnchorOpening} from './AnchorOpening';

const ink='#25252b',paper='#fffdf5',teal='#45b9ae',coral='#ed795f';
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
function Text({x,y,children,size=30,anchor='start',color=ink,bold=false}:{x:number;y:number;children:React.ReactNode;size?:number;anchor?:'start'|'middle'|'end';color?:string;bold?:boolean}){
  return <text x={x} y={y} fontSize={size} textAnchor={anchor} fill={color} fontWeight={bold?700:400}>{children}</text>;
}
function Talk({x,y,w,lines,opacity=1,color=paper}:{x:number;y:number;w:number;lines:string[];opacity?:number;color?:string}){
  const h=lines.length===1?106:143;
  return <g opacity={opacity}><path d={`M${x+22} ${y} H${x+w-22} Q${x+w} ${y} ${x+w} ${y+22} V${y+h-22} Q${x+w} ${y+h} ${x+w-22} ${y+h} H${x+w*.42} L${x+w*.32} ${y+h+31} L${x+w*.35} ${y+h} H${x+22} Q${x} ${y+h} ${x} ${y+h-22} V${y+22} Q${x} ${y} ${x+22} ${y} Z`} fill={color} stroke={ink} strokeWidth="5" strokeLinejoin="round"/>{lines.map((s,i)=><Text key={i} x={x+w/2} y={y+h/2+13+(i-(lines.length-1)/2)*47} anchor="middle" size={lines.length===1?34:32} bold={i===0}>{s}</Text>)}</g>;
}
function Person({x,y,scale=1,color=teal,pose=0,surprise=0,tilt=0}:{x:number;y:number;scale?:number;color?:string;pose?:number;surprise?:number;tilt?:number}){
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-69 112 Q-64 32 0 29 Q63 32 69 112 Z" fill={color}/><path d={`M-54 60 L-89 ${49-24*pose} L-109 ${43-57*pose} M54 60 L89 ${47-28*pose} L109 ${38-50*pose}`} fill="none"/>
    <rect x="-10" y="13" width="20" height="29" rx="8" fill="#f1c4a0"/>
    <g transform={`rotate(${tilt} 0 -18)`}><ellipse cy="-20" rx="43" ry="50" fill="#f1c4a0"/><path d="M-43 -27 Q-46 -77 0 -77 Q46 -74 43 -26 L28 -46 Q-7 -34 -27 -49 L-31 -24 Z" fill={ink}/><path d={`M-17 ${-20-surprise*4} v6 M16 ${-20-surprise*4} v6`} strokeWidth="4"/><path d={`M-25 ${-36-surprise*8} l18 -4 M8 ${-40-surprise*8} l18 4`} strokeWidth="3"/>{surprise>.5?<ellipse cy="8" rx="7" ry="9" fill={ink}/>:<path d="M-10 4 Q0 15 11 4" fill="none" strokeWidth="4"/>}</g>
    <g opacity={surprise}><path d="M-66 -64 L-80 -78 M-71 -39 L-94 -39 M64 -65 L79 -80" stroke={coral} strokeWidth="5"/></g>
  </g>;
}
function Price({x,y,value,color=coral,scale=1,rotation=-4,opacity=1}:{x:number;y:number;value:string;color?:string;scale?:number;rotation?:number;opacity?:number}){
  return <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`} opacity={opacity}><path d="M-117 -53 H110 L137 0 L110 51 H-117 Z" fill={color} stroke={ink} strokeWidth="5"/><Text x={0} y={17} anchor="middle" size={46} bold>{value}</Text></g>;
}
function Coat({x,y,scale=1}:{x:number;y:number;scale?:number}){
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={ink} strokeWidth="5" strokeLinejoin="round"><path d="M-52 -83 L-111 -42 L-74 13 L-45 -5 V116 H58 V-5 L85 13 L120 -42 L61 -83 L24 -62 H-13 Z" fill={coral}/><path d="M-52 -83 Q-11 -14 61 -83 M8 -60 V110" fill="none"/>{[-5,35,75].map(v=><circle key={v} cx="22" cy={v} r="4" fill={ink}/>)}</g>;
}
function Sheet({x,y,w,h,children,color=paper}:{x:number;y:number;w:number;h:number;children?:React.ReactNode;color?:string}){
  return <g><path d={`M${x+10} ${y+10} L${x+w+7} ${y+5} L${x+w+2} ${y+h+11} L${x+6} ${y+h+15} Z`} fill={ink}/><path d={`M${x} ${y} L${x+w} ${y-5} L${x+w-5} ${y+h} L${x-4} ${y+h+4} Z`} fill={color} stroke={ink} strokeWidth="4"/>{children}</g>;
}
function Phone({x,y,w,h,children}:{x:number;y:number;w:number;h:number;children?:React.ReactNode}){
  return <g><rect x={x+12} y={y+12} width={w} height={h} rx="32" fill={ink}/><rect x={x} y={y} width={w} height={h} rx="32" fill={paper} stroke={ink} strokeWidth="5"/><path d={`M${x+w*.4} ${y+20} H${x+w*.6}`} stroke={ink} strokeWidth="7" strokeLinecap="round"/>{children}</g>;
}
function Book({x,y,scale=1}:{x:number;y:number;scale?:number}){
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M-100 -133 L90 -151 L106 130 L-92 143 Z" fill={coral} stroke={ink} strokeWidth="5"/><path d="M-83 -128 L-72 136" stroke={ink} strokeWidth="4"/><Text x={3} y={-39} size={31} anchor="middle" bold>思考，</Text><Text x={3} y={13} size={31} anchor="middle" bold>快与慢</Text><path d="M-53 58 H58 M-52 75 H38" stroke={paper} strokeWidth="7" strokeLinecap="round"/></g>;
}
function Hand({x,y,rotation=0,opacity=1}:{x:number;y:number;rotation?:number;opacity?:number}){
  return <g transform={`translate(${x} ${y}) rotate(${rotation})`} opacity={opacity} stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M0 82 V-13 Q3 -32 18 -24 L26 21 V-63 Q30 -83 43 -68 L51 -5 Q65 -30 78 -12 L91 1 Q112 -13 123 8 L148 71 Q138 119 83 133 L45 142 Z" fill="#f1c4a0"/></g>;
}
function Steps({labels,progress}:{labels:string[];progress:number[]}){
  return <g>{labels.map((s,i)=><g key={s}><circle cx={130+i*600} cy="195" r="16" fill={progress[i]>.5?teal:paper} stroke={ink} strokeWidth="3"/><Text x={165+i*600} y={207} size={28} bold>{s}</Text>{i<2&&<path d={`M${355+i*600} 195 H${660+i*600}`} stroke={ink} strokeWidth="3" strokeDasharray="5 9" opacity=".25"/>}</g>)}</g>;
}

export function AnchorStoryMotion({segment,time}:{segment:Segment;time:number}){
  if(segment.props.mode==='deal')return <AnchorOpening {...{segment,time}}/>;
  const e=segment.events,mode=segment.props.mode;
  const a=(key:string,d=.5)=>ease((time-e[key])/d),entry=a('reveal');
  let title=segment.props.title,labels=['看见问题','换个角度','作出判断'],progress=[1,0,0],body:React.ReactNode;
  if(mode==='deal'){
    progress=[1,a('counter'),a('question')];labels=['看见报价','开始还价','准备付款'];
    const counter=a('counter'),joy=a('celebrate'),question=a('question');
    body=<>
      <Person x={278} y={766+15*(1-entry)} scale={1.2} color={coral} pose={a('offer')*.5}/><Person x={1620} y={766+15*(1-entry)} scale={1.2} pose={joy*(1-question)} surprise={question}/>
      <Coffee x={925} y={570} scale={1.18}/>
      <Talk x={100} y={279} w={584} lines={['这台 2000 元。']} opacity={a('offer')}/>
      <Talk x={1230} y={279} w={586} lines={['1600，行不行？']} opacity={counter}/>
      <g transform={`translate(0 ${22*(1-a('offer'))})`}><Price x={1110} y={573} value="¥ 2000" opacity={a('offer')}/></g>
      <g opacity={joy*(1-question)} transform={`translate(0 ${16*(1-joy)})`}><Sheet x={1352} y={552} w={386} h={142} color="#e3f4ec"><Text x={1545} y={639} size={45} anchor="middle" bold>“省了 400！”</Text></Sheet></g>
      <g opacity={joy*(1-question)}>{Array.from({length:12},(_,i)=>{const q=Math.min(1,(time-e.celebrate)/1.5),angle=i*Math.PI/6;return <path key={i} d={`M${1620+Math.cos(angle)*(60+q*140)} ${610+Math.sin(angle)*(60+q*100)+q*40} l10 7`} stroke={i%2?teal:coral} strokeWidth="6" opacity={1-q*.5}/>;})}</g>
      <Talk x={668} y={810} w={650} lines={['砍掉 400，真的省了吗？']} opacity={question}/>
    </>;
  }else if(mode==='trap'){
    title='先出现的价格，成了起点';labels=['先报一个数','围着它还价','判断被牵动'];progress=[a('anchor'),a('thought'),a('pull')];
    const pull=a('pull',1.6),px=lerp(965,1135,pull),py=lerp(690,647,pull);
    body=<>
      <Person x={303} y={788} scale={1.3} pose={.4} surprise={a('result')*.7} tilt={-5*a('thought')}/>
      <Talk x={100} y={280} w={870} lines={['我怎么总在算，便宜了多少？']} opacity={a('thought')}/>
      <Price x={1400} y={390} value="¥ 2000" scale={1.2} opacity={a('anchor')}/>
      <g opacity={a('anchor')} stroke={coral} fill="none" strokeWidth="7" strokeLinecap="round"><path d="M1400 453 V523 M1356 493 Q1400 556 1444 493 M1376 505 L1353 491 L1353 518 M1424 505 L1447 491 L1447 518"/></g>
      <path d={`M${px+35} ${py-38} Q${1270+5*Math.sin(time*3)*(1-pull)} 515 1400 469`} fill="none" stroke={ink} strokeWidth="4" opacity={a('thought')}/>
      <Price x={px} y={py} value="¥ 1600" color={teal} rotation={lerp(6,-4,pull)} opacity={a('thought')}/>
      <g opacity={a('result')}><Sheet x={1260} y={704} w={450} h={100} color="#e3f4ec"><Text x={1485} y={770} size={38} anchor="middle" bold>锚定效应</Text></Sheet></g>
      <Talk x={788} y={860} w={963} lines={['先问：这件东西，到底值多少？']} opacity={a('result')}/>
    </>;
  }else if(mode==='rewind'){
    title='回到开价前，先找反证';labels=['倒回去','问依据','找反证'];progress=[a('reset'),a('ask'),a('target')];
    const back=a('reset',1.3),ask=a('ask'),target=a('target');
    body=<>
      <g transform={`translate(290 415) rotate(${-360*back})`} opacity={back*(1-target)} stroke={ink} strokeWidth="4"><circle r="91" fill="#e3f4ec"/><path d="M0 -65 A65 65 0 1 1 -63 10 M-63 10 L-79 -15 M-63 10 L-40 -1" fill="none" strokeWidth="7"/></g>
      <Coffee x={lerp(985,1004,back)} y={565} scale={.96}/>
      <Price x={lerp(1380,1535,back)} y={lerp(470,390,back)} value="¥ 2000" opacity={1-back}/>
      <g transform={`translate(${22*(1-target)} 0)`} opacity={target}><Book x={343} y={684}/></g>
      <Person x={743} y={810} scale={1.15} pose={target*.6} tilt={-4*ask}/>
      <Talk x={1100} y={282} w={668} lines={['这个报价，有什么依据？']} opacity={ask}/>
      <g opacity={target}><Sheet x={1215} y={565} w={510} h={276} color="#e3f4ec"><Text x={1470} y={630} anchor="middle" size={35} bold>找反对它的理由</Text><Text x={1274} y={706} size={29}>检查成色</Text><Text x={1274} y={777} size={29}>核对成交</Text><path d="M1252 725 H1651" stroke={ink} strokeWidth="3" strokeDasharray="400" strokeDashoffset={400*(1-target)}/></Sheet></g>
    </>;
  }else if(mode==='reprice'){
    title='让依据，变成自己的报价';labels=['看可比记录','结合成色','选择怎么谈'];progress=[a('reason'),a('offer'),a('exit')];
    const move=a('offer',1.2),arc=move*Math.PI;
    body=<>
      <Person x={1395} y={816} scale={1.18} pose={a('offer')*.65} tilt={-3*a('reply')}/>
      <g opacity={a('reason')}><Text x={650} y={350} anchor="middle" size={31} bold>同款、相近成色的成交记录</Text>
        <path d="M245 602 H1050 M245 577 V625 M1050 577 V625" fill="none" stroke={teal} strokeWidth="8" strokeLinecap="round"/>
        <Text x={650} y={405} size={29} anchor="middle">结合这台的磨损、配件情况</Text>
        {[1100,1200,1300].map((v,i)=><Price key={v} x={i===1?lerp(650,1435,move):350+i*300} y={i===1?480+205*Math.sin(arc)+80*move:480} value={`¥ ${v}`} color={i===1?teal:paper} rotation={i===1?-4+8*move:0} scale={.87}/>)}
      </g>
      <Talk x={1110} y={282} w={660} lines={['按这个成色，我出——']} opacity={a('offer')}/>
      <g opacity={a('exit')} transform={`translate(${25*(1-a('exit'))} 0)`}><Sheet x={414} y={770} w={666} h={130} color="#e3f4ec"><Text x={747} y={848} size={34} bold anchor="middle">也可以换一家，或者不成交。</Text></Sheet></g>
    </>;
  }else if(mode==='shop'){
    title='“原价 999”，让我急着下单';labels=['看到划线价','觉得便宜','先暂停付款'];progress=[a('old'),a('joy'),a('pause')];
    const pause=a('pause'),joy=a('joy'),reach=a('joy',1.3)*(1-pause);
    body=<>
      <Phone x={206} y={296} w={760} h={620}><Text x={248} y={358} size={27} bold>商品详情</Text><Coat x={467} y={604} scale={1.2}/>
        <g opacity={a('old')}><Text x={779} y={444} size={26} anchor="middle">标注原价</Text><Text x={779} y={509} size={49} anchor="middle">¥ 999</Text><path d="M675 493 L882 463" stroke={coral} strokeWidth="5"/></g>
        <g opacity={a('sale')} transform={`translate(0 ${18*(1-a('sale'))})`}><Price x={774} y={690} value="¥ 199" color={teal} scale={.91}/></g>
      </Phone>
      <Person x={1510} y={822} scale={1.2} pose={joy*(1-pause)} surprise={pause} tilt={-4*pause}/>
      <Talk x={1110} y={298} w={669} lines={pause>.5?['先等等，','“原价”有依据吗？']:['“便宜 800，赶紧买！”']} opacity={joy}/>
      <g transform={`translate(0 ${11*(1-joy)})`} opacity={joy}><rect x="1195" y="570" width="560" height="107" rx="18" fill={pause>.5?'#e3f4ec':coral} stroke={ink} strokeWidth="4"/><Text x={1475} y={638} anchor="middle" size={34} bold>{pause>.5?'暂停付款':'确认付款'}</Text></g>
      <Hand x={lerp(1715,1558,reach)} y={lerp(780,666,reach)} rotation={-28} opacity={reach}/>
    </>;
  }else if(mode==='compare'){
    title='把折扣，换成实际价格来比';labels=['核对常态价','比较到手价','再决定'];progress=[a('history'),a('others'),a('decision')];
    const others=a('others',1.2),decision=a('decision');
    const ownX=lerp(663,1310,others),ownY=480+140*Math.sin(others*Math.PI)+70*others;
    body=<>
      <Coat x={411} y={538} scale={1.13}/><Person x={363} y={834} scale={.96} pose={a('settle')*.6}/>
      <g opacity={1-a('hide')}><Text x={663} y={360} anchor="middle" size={30}>原价 999</Text><path d="M578 345 H749" stroke={coral} strokeWidth="4"/></g>
      <Price x={ownX} y={ownY} value="¥ 199" color={teal} scale={.88} rotation={-4+4*others}/>
      <g opacity={a('history')} transform={`translate(${30*(1-a('history'))} 0)`}><Sheet x={920} y={340} w={245} h={253}><Text x={1042} y={402} size={24} anchor="middle" bold>近期常态价</Text><Text x={1042} y={546} size={45} anchor="middle" bold>¥ 219</Text></Sheet></g>
      <g opacity={a('others')} transform={`translate(${30*(1-a('others'))} 0)`}><Sheet x={1488} y={340} w={280} h={253}><Text x={1628} y={402} size={24} anchor="middle" bold>其他店到手价</Text><Text x={1628} y={546} size={45} anchor="middle" bold>¥ 189</Text></Sheet></g>
      <g opacity={others}><Text x={1310} y={402} size={24} anchor="middle" bold>本店到手价</Text><path d="M985 655 H1715" stroke={teal} strokeWidth="6" strokeLinecap="round"/><Text x={1350} y={717} size={27} anchor="middle">核对同款、同条件</Text></g>
      <g opacity={decision}><Sheet x={525} y={766} w={308} h={115} color="#e3f4ec"><Text x={679} y={838} anchor="middle" size={30} bold>预算 ≤ 200</Text></Sheet><Talk x={927} y={790} w={842} lines={['我需要吗？到手价合适吗？']}/></g>
    </>;
  }else{
    title='问依据，找反证，再比较';labels=['问依据','找反证','再比较'];progress=[a('first'),a('second'),a('third')];
    const done=a('result');
    body=<>
      <Person x={307} y={806} scale={1.23} pose={done*.8}/>
      <path d="M869 705 L1130 698 L1168 941 L843 941 Z" fill={teal} stroke={ink} strokeWidth="5"/><path d="M909 715 Q896 628 995 629 Q1094 627 1091 713" fill="none" stroke={ink} strokeWidth="8"/>
      {['first','second','third'].map((event,i)=>{const p=a(event,1),x=lerp(698+i*409,999,p),y=lerp(425,820,p),s=lerp(1,.42,p),gone=1-ease((time-e[event]-.9)/.22);return <g key={event} transform={`translate(${x} ${y}) scale(${s}) rotate(${(1-p)*(-8+i*9)})`} opacity={gone}>
        {i===0?<g stroke={ink} strokeWidth="6"><circle r="61" fill={paper}/><path d="M-42 44 L-105 109" strokeWidth="17" strokeLinecap="round"/><path d="M-24 -22 Q-3 -38 24 -21" fill="none" stroke={teal}/></g>:i===1?<g><rect x="-70" y="-75" width="140" height="165" fill={paper} stroke={ink} strokeWidth="5"/><path d="M-44 -25 H40 M-44 15 H40 M-44 55 H40" stroke={teal} strokeWidth="8"/><path d="M-51 -49 L50 65 M53 -49 L-48 64" stroke={coral} strokeWidth="6"/></g>:<g stroke={ink} strokeWidth="5"><path d="M-89 -35 H88 V39 H-89 Z" fill={paper}/>{[-60,-30,0,30,60].map(v=><path key={v} d={`M${v} -33 V${v===0?13:-7}`}/>)}</g>}
      </g>;})}
      <Talk x={100} y={286} w={680} lines={['下次，我先检查一下。']} opacity={done}/>
      <g opacity={done}><Book x={1454} y={682} scale={.65}/><Text x={1454} y={839} size={25} anchor="middle" bold>锚定效应 · 生活化改编</Text><Text x={1454} y={892} size={22} anchor="middle">练习减少影响，方法也有边界。</Text></g>
    </>;
  }
  return <svg data-fullbleed-scene width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label={segment.intent}>
    <defs><pattern id="story-motion-dots" width="27" height="27" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill={ink} opacity=".055"/></pattern></defs>
    <rect width="1920" height="1080" fill="#fff8e9"/><rect width="1920" height="1080" fill="url(#story-motion-dots)"/>
    <g opacity={entry}><Text x={100} y={116} size={49} bold>{title}</Text><g transform="translate(1653 93) rotate(-5)"><rect x="-118" y="-34" width="236" height="67" rx="7" fill={paper} stroke={coral} strokeWidth="4"/><Text x={0} y={13} anchor="middle" size={24} color="#bc503e" bold>{mode==='trap'?'机制示意':'剧情示例'}</Text></g><Steps {...{labels,progress}}/></g>
    <g opacity={entry}>{body}</g>
  </svg>;
}

import React from 'react';
import type {Segment,Theme,VisualStyle} from '../../../src/types';
import {ease} from '../../../src/components/primitives';
import {STYLE_PRESETS} from '../../../src/visual/styles.mjs';
import {matchingState} from './matching-model.mjs';


const stars=Array.from({length:160},(_,i)=>({x:((i*673+29)%1880)+20,y:(i*359+41)%850,r:i%11===0?2.1:.65+(i%3)*.35,phase:i*1.71}));
function Portrait({x,y,label,color,female=false,variant=0,active=0,opacity=1,visual}:{x:number;y:number;label:string;color:string;female?:boolean;variant?:number;active?:number;opacity?:number;visual:VisualStyle}){
 const GOLD=visual.colors.primary,PAPER=visual.colors.text;
 return <g transform={`translate(${x} ${y})`} opacity={opacity}>
   {visual.illustration==='node'?<>
    <rect x="-84" y="-85" width="168" height="188" rx="26" fill={visual.colors.panel} stroke={active>.2?color:visual.colors.line} strokeWidth="2.5"/>
    <circle cy="-8" r="49" fill={color} fillOpacity=".13"/>
    <text data-fit y="10" textAnchor="middle" fill={visual.colors.text} fontSize={label.length>1?34:52} fontWeight="700">{label}</text>
    <circle cx="0" cy="72" r="5" fill={active>.2?color:visual.colors.line}/>
   </>:<>

   <ellipse cy="12" rx="88" ry="104" fill={visual.colors.panel} stroke={color} strokeOpacity={.22+active*.6} strokeWidth="1.5"/>
   <ellipse cy="12" rx="95" ry="112" fill="none" stroke={color} strokeOpacity={active*.5} strokeDasharray="2 10"/>
   <ellipse cy="100" rx="66" ry="8" fill={color} opacity=".06"/>
   {female&&<path d="M-36 -35 Q-43 -80 0 -82 Q45 -78 37 -28 L48 40 -43 40Z" fill="#222035"/>}
   <path d={female?'M-18 18 Q-52 30 -59 97 L59 97 Q52 30 18 18Z':'M-18 18 Q-63 33 -62 97 L62 97 Q59 33 18 18Z'} fill={color} opacity=".88"/>
   <path d="M-17 14 L-17 33 Q0 48 17 33 L17 14" fill="#cda98c"/>
   <ellipse cy="-28" rx="33" ry="42" fill="#e7c6a2"/>
   <path d={female?'M-34 -22 Q-43 -75 -5 -76 Q38 -80 36 -25 Q15 -40 5 -60 Q-7 -33 -34 -22Z':variant?'M-34 -25 Q-47 -69 -10 -75 Q21 -88 38 -49 L34 -21 20 -43 Q-12 -36 -25 -48Z':'M-34 -18 Q-47 -65 -13 -75 Q21 -82 35 -58 L36 -21 24 -46 Q-7 -36 -27 -44Z'} fill={female?'#2e2532':'#182437'}/>
   <path d="M-14 -25 h5 M10 -25 h5" stroke="#493a37" strokeWidth="3" strokeLinecap="round"/>
   <path d={active>.3?'M-7 -8 Q0 -2 8 -8':'M-6 -7 Q0 -4 6 -7'} fill="none" stroke="#9e655c" strokeWidth="2" strokeLinecap="round"/>
   {female?<><path d="M-21 35 L0 63 22 35" fill="none" stroke="#f5d2b8" strokeWidth="3"/><circle cx="0" cy="66" r="4" fill={GOLD}/><path d="M-37 -51 Q-19 -86 18 -64" fill="none" stroke={GOLD} strokeWidth="2"/><circle cx="-27" cy="-62" r="4" fill={GOLD}/></>:<><path d="M-19 29 L0 46 -12 62 -30 35 M19 29 L0 46 13 62 31 35" fill="#e0d8c8"/><path d="M-2 46 L5 46 9 83 0 95 -7 83Z" fill="#354057"/></>}
   </>}
   <rect x="-27" y="122" width="54" height="40" rx="12" fill={color} fillOpacity=".13" stroke={color} strokeOpacity=".5"/>
   <text data-fit x="0" y="150" fill={PAPER} textAnchor="middle" fontSize={25*visual.fontScale}>{label}</text>
   {visual.illustration==='sketch'&&<ellipse cx="2" cy="14" rx="91" ry="106" fill="none" stroke={visual.colors.muted} strokeWidth="1" strokeDasharray="90 4 180 6" opacity=".5"/>}
 </g>;
}
function Thread({from,to,progress=1,opacity=1,color,bend=0,dashed=false,visual}:{from:[number,number];to:[number,number];progress?:number;opacity?:number;color:string;bend?:number;dashed?:boolean;visual:VisualStyle}){
 const [x,y]=from,[xx,yy]=to;const d=`M${x} ${y} C${x+230} ${y+bend} ${xx-230} ${yy+bend} ${xx} ${yy}`;
 return <g opacity={opacity}>
   <path d={d} fill="none" stroke={color} strokeWidth="14" opacity={visual.glow?.13:0} filter="url(#thread-glow)" pathLength="1" strokeDasharray={`${progress} 1`}/>
   <path d={d} fill="none" stroke={color} strokeWidth={visual.lineWidth} strokeLinecap="round" pathLength="1" strokeDasharray={dashed?'.009 .018':`${progress} 1`}/>
   {!dashed&&progress>.99&&<><circle cx={xx} cy={yy} r="5" fill={color}/><circle cx={x} cy={y} r="4" fill={color}/></>}
 </g>;
}
export function MoonMatchScene({segment,time,visual:chosen}:{segment:Segment;time:number;theme:Theme;visual?:VisualStyle|null}){
 const visual=(chosen??{...STYLE_PRESETS['night-story'],id:'night',styleId:'night-story'}) as VisualStyle;
 const GOLD=visual.colors.primary,PAPER=visual.colors.text,RED=visual.colors.accent,BLUE=visual.background==='night'?'#86b7ce':visual.colors.primary;
 const e=segment.events,p=(key:string,d=.45)=>ease((time-e[key])/d),state=matchingState(time,e);
 const enter=p('enter',.7),prefs=p('preferences'),replace=p('replace',.4),retry=p('retry',.6),settle=p('settle',.45);
 const oldOpacity=1-replace,challenge=p('challenger',.6),first=p('first',.6),compare=p('compare',.3);
 const activeA=first*oldOpacity,activeB=replace;
 const step=time<e.first?'偏好顺序':time<e.challenger?'01 / 先到，暂留':time<e.replace?'02 / 比较偏好':time<e.retry?'03 / 换成更喜欢的':'04 / 继续邀请';
 return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
 <defs>
   <radialGradient id="sky"><stop stopColor={visual.colors.panel}/><stop offset=".65" stopColor={visual.colors.background}/><stop offset="1" stopColor={visual.colors.background}/></radialGradient>
   <radialGradient id="moon-halo"><stop stopColor="#d9d0b2" stopOpacity=".18"/><stop offset="1" stopColor="#d9d0b2" stopOpacity="0"/></radialGradient>
   <linearGradient id="mount" x2="0" y2="1"><stop stopColor="#263250"/><stop offset="1" stopColor="#11182e"/></linearGradient>
   <linearGradient id="bottom" x2="0" y2="1"><stop stopColor="#080d1d" stopOpacity="0"/><stop offset="1" stopColor="#080d1d"/></linearGradient>
   <filter id="thread-glow"><feGaussianBlur stdDeviation="8"/></filter>
 </defs>
 <rect width="1920" height="1080" fill={visual.colors.background}/>
 {visual.background==='night'&&<> <rect width="1920" height="1080" fill="url(#sky)"/>
 <ellipse cx="1000" cy="410" rx="610" ry="480" fill="#445578" opacity=".04" transform={`rotate(${-18+time*.3} 1000 410)`}/>
 {stars.map((s,i)=><circle key={i} cx={s.x} cy={s.y-time*(i%3)*.6} r={s.r} fill={i%5?PAPER:GOLD} opacity={.1+.32*(.5+.5*Math.sin(time*.5+s.phase))}/>)}
 <circle cx="1634" cy="162" r="155" fill="url(#moon-halo)"/><circle cx="1634" cy="162" r="36" fill="#dfdac3" opacity=".95"/>
 <circle cx="1622" cy="152" r="9" fill="#c9c6b3" opacity=".35"/><circle cx="1646" cy="174" r="6" fill="#c9c6b3" opacity=".3"/>
 <path d="M0 902 L140 836 242 876 411 774 560 854 714 811 900 928 1100 844 1201 885 1357 763 1500 831 1620 785 1771 890 1920 822 V1080 H0Z" fill="url(#mount)" opacity=".58"/>
 <path d="M0 984 L186 893 358 957 526 884 707 973 865 928 1075 1002 1262 907 1450 958 1618 871 1800 954 1920 925 V1080 H0Z" fill="#0d1428"/>
 <rect y="860" width="1920" height="220" fill="url(#bottom)"/>
 </>}
 {visual.background==='grid'&&<>
  {Array.from({length:35},(_,i)=><line key={'v'+i} x1={i*60} x2={i*60} y1="0" y2="1080" stroke={visual.colors.line} strokeOpacity=".22"/>)}
  {Array.from({length:19},(_,i)=><line key={'h'+i} x1="0" x2="1920" y1={i*60} y2={i*60} stroke={visual.colors.line} strokeOpacity=".22"/>)}
  <rect x="180" y="355" width="1560" height="480" rx="30" fill={visual.colors.panel} fillOpacity=".68"/>
 </>}
 {visual.background==='paper'&&<>
  <rect x="35" y="35" width="1850" height="1010" rx="4" fill="none" stroke={visual.colors.line}/>
  {stars.map((s,i)=><path key={i} d={`M${s.x} ${s.y} h${2+i%9}`} stroke={visual.colors.muted} opacity={visual.texture}/>) }
  <path d="M98 284 Q940 274 1812 283 M102 289 Q930 279 1810 287" fill="none" stroke={visual.colors.line}/>
 </>}
 <g opacity={enter}>
  <text data-fit x="105" y="85" fill={GOLD} fontSize={17*visual.fontScale} letterSpacing="5">关系的数学</text>
  <path d="M105 108 H220" stroke={GOLD} strokeOpacity=".4"/>
  <text data-fit x="105" y="185" fill={PAPER} fontSize={58*visual.fontScale} letterSpacing="8" fontWeight={visual.titleWeight}>月老的算法</text>
  <text data-fit x="105" y="231" fill={visual.colors.muted} fontSize={22*visual.fontScale} letterSpacing="3">先来的，就一定会被留下吗？</text>
  <text data-fit x="1770" y="85" fill={visual.colors.muted} textAnchor="end" fontSize={17*visual.fontScale} letterSpacing="2">STABLE MATCHING</text>
  <line x1="105" y1="272" x2="1815" y2="272" stroke={GOLD} strokeOpacity=".16"/>
 </g>
 <g opacity={enter} transform={`translate(0 ${22*(1-enter)})`}>
  <text data-fit x="530" y="329" textAnchor="middle" fill={visual.colors.muted} fontSize={19*visual.fontScale} letterSpacing="5">发出邀请</text>
  <text data-fit x="1390" y="329" textAnchor="middle" fill={visual.colors.muted} fontSize={19*visual.fontScale} letterSpacing="5">暂留一位</text>
  <Thread visual={visual} color={RED} from={[625,435]} to={[1295,435]} progress={first} opacity={first*oldOpacity} bend={64}/>
  <Thread visual={visual} from={[625,725]} to={[1295,435]} progress={challenge} opacity={challenge} color={replace>.5?RED:GOLD} bend={-30}/>
  <Thread visual={visual} color={RED} from={[625,435]} to={[1295,725]} progress={retry} opacity={retry} bend={34}/>
  {replace>0&&replace<1&&<circle cx="960" cy="484" r={12+70*replace} fill="none" stroke={GOLD} opacity={1-replace}/>}
  <Portrait visual={visual} x={530} y={435} label="甲" color={BLUE} active={activeA+retry}/>
  <Portrait visual={visual} x={530} y={725} label="乙" color={visual.background==='night'?'#a6b59c':visual.colors.success} variant={1} active={activeB}/>
  <Portrait visual={visual} x={1390} y={435} label="小青" color={visual.colors.success} female active={first}/>
  <Portrait visual={visual} x={1390} y={725} label="小桃" color={visual.colors.accent} female variant={1} active={retry}/>
  <g opacity={prefs}>
   <text data-fit x="230" y="423" fill={visual.colors.muted} fontSize={19*visual.fontScale} letterSpacing="2">邀请顺序</text>
   <text data-fit x="230" y="466" fill={retry>.4?visual.colors.muted:GOLD} fontSize={26*visual.fontScale}>青</text><text x="280" y="466" fill={visual.colors.muted} fontSize={23*visual.fontScale}>›</text><text data-fit x="320" y="466" fill={retry>.4?GOLD:visual.colors.muted} fontSize={26*visual.fontScale}>桃</text>
   {retry>.1&&<path d="M225 457 L263 457" stroke={RED} strokeWidth="2" opacity={retry}/>}
   <text data-fit x="230" y="713" fill={visual.colors.muted} fontSize={19*visual.fontScale} letterSpacing="2">邀请顺序</text>
   <text data-fit x="230" y="756" fill={GOLD} fontSize={26*visual.fontScale}>青</text><text x="280" y="756" fill={visual.colors.muted} fontSize={23*visual.fontScale}>›</text><text data-fit x="320" y="756" fill={visual.colors.muted} fontSize={26*visual.fontScale}>桃</text>
   <text data-fit x="1570" y="404" fill={visual.colors.muted} fontSize={19*visual.fontScale} letterSpacing="2">更喜欢谁</text>
   <rect x="1558" y="423" width="56" height="51" rx="10" fill={GOLD} fillOpacity={.06+compare*.16} stroke={GOLD} strokeOpacity={compare*.7}/>
   <text data-fit x="1586" y="459" textAnchor="middle" fill={GOLD} fontSize={26*visual.fontScale}>乙</text><text x="1633" y="459" fill={visual.colors.muted} fontSize={23*visual.fontScale}>›</text><text data-fit x="1687" y="459" textAnchor="middle" fill={visual.colors.muted} fontSize={26*visual.fontScale}>甲</text>
   <text data-fit x="1570" y="694" fill={visual.colors.muted} fontSize={19*visual.fontScale} letterSpacing="2">更喜欢谁</text>
   <text data-fit x="1586" y="749" textAnchor="middle" fill={GOLD} fontSize={26*visual.fontScale}>甲</text><text x="1633" y="749" fill={visual.colors.muted} fontSize={23*visual.fontScale}>›</text><text data-fit x="1687" y="749" textAnchor="middle" fill={visual.colors.muted} fontSize={26*visual.fontScale}>乙</text>
  </g>
  <g opacity={first*(1-compare)}>
    <rect x="865" y="408" width="190" height="48" rx="24" fill={visual.colors.panel} stroke={RED} strokeOpacity=".3"/>
    <text data-fit x="960" y="440" fill={PAPER} fontSize={22*visual.fontScale} textAnchor="middle">暂留甲</text>
  </g>
  <g opacity={compare*(1-settle)}>
   <rect x="852" y="351" width="216" height="48" rx="24" fill={visual.colors.panel} stroke={GOLD} strokeOpacity=".35"/>
   <text data-fit x="960" y="383" textAnchor="middle" fill={GOLD} fontSize={22*visual.fontScale}>{state.selected==='b'?'改为暂留乙':'乙，比甲更优先'}</text>
  </g>
  <g opacity={retry*(1-settle)}><text data-fit x="850" y="745" fill={PAPER} fontSize={22*visual.fontScale}>甲，继续下一位</text></g>
 </g>
 <g opacity={enter*(1-settle)}>
  <rect x="794" y="829" width="332" height="51" rx="25" fill={visual.colors.panel} stroke={GOLD} strokeOpacity=".22"/>
  <text data-fit x="960" y="862" textAnchor="middle" fill={GOLD} fontSize={22*visual.fontScale} letterSpacing="2">{step}</text>
 </g>
 <g opacity={settle} transform={`translate(0 ${10*(1-settle)})`}>
  <path d="M669 873 H790 M1130 873 H1251" stroke={GOLD} strokeOpacity=".38"/>
  <text data-fit x="960" y="885" textAnchor="middle" fill={GOLD} fontSize={30*visual.fontScale} letterSpacing="4">甲 · 小桃　　乙 · 小青</text>
 </g>
 <text data-fit x="105" y="1036" fill={visual.colors.muted} fontSize={15*visual.fontScale} letterSpacing="2">两人示例 / 偏好仅为演示</text>
 <g opacity=".5">{Array.from({length:5},(_,i)=><circle key={i} cx={1700+i*20} cy="1030" r="3" fill={time/10>i/5?GOLD:'#35415b'}/>)}</g>
 </svg>;
}

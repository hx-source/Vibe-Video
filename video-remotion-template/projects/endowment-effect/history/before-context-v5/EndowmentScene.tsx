import React from 'react';
import type {Segment,Theme,VisualStyle} from '../../../src/types';
import {STYLE_PRESETS} from '../../../src/visual/styles.mjs';

const smooth=(v:number)=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x);};

// One continuous, unchanged cup; the transfer of ownership changes its frame of reference.
export function EndowmentScene({segment,time,visual:chosen}:{segment:Segment;time:number;theme:Theme;visual?:VisualStyle|null}){
 const v=(chosen??{...STYLE_PRESETS['paper-sketch'],id:'paper',styleId:'paper-sketch'}) as VisualStyle;
 const c=v.colors,night=v.background==='night',paper=v.background==='paper';
 const e=segment.events,p=(key:string,d=.7)=>smooth((time-e[key])/d);
 const own=p('own'),loss=p('loss'),result=p('result'),intro=p('reveal');
 const gain=smooth((time-e.reveal-.8)/1.4);
 const attempt=smooth((time-e.loss)/.65),pull=smooth((time-e.loss-1.1)/.85);
 const grip=smooth((time-e.loss-.12)/.45);
 const ownedX=1175;
 const cupX=(920-200*gain)*(1-own)+ownedX*own-135*attempt*(1-pull);
 const cupY=(paper?555:550)-30*Math.sin(Math.PI*own)-12*Math.sin(Math.PI*pull);
 const w=v.lineWidth;
 const txt=(x:number,y:number,text:string,size=28,color=c.text,anchor:'start'|'middle'|'end'='start',weight=400)=><text data-fit x={x} y={y} textAnchor={anchor} fill={color} fontSize={size*v.fontScale} fontWeight={weight}>{text}</text>;
 const person=(x:number,y:number,owner:boolean)=><g transform={`translate(${x} ${y})`}>
   {v.illustration==='node'?<><rect x="-68" y="-70" width="136" height="136" rx="24" fill={c.panel} stroke={owner?c.accent:c.primary} strokeWidth={w}/>{txt(0,10,owner?'已拥有':'未拥有',27,owner?c.accent:c.primary,'middle',700)}</>:<>
   <path d="M-66 110 Q-65 22 0 22 Q65 22 66 110" fill={c.panel} stroke={owner?c.accent:c.primary} strokeWidth={w}/>
   <path d={owner?`M${-33-9*loss} ${46+10*loss} Q${-11+10*loss} ${87-28*loss} ${32+9*loss} ${44+12*loss}`:'M-33 46 Q-11 87 32 44'} fill="none" stroke={owner?c.accent:c.primary} strokeWidth={w}/>
   <ellipse cy="-24" rx="42" ry="49" fill={paper?'#ead6b6':'#d9bda1'} stroke={c.text} strokeWidth={w}/>
   <path d="M-43 -23 Q-52 -82 3 -78 Q53 -76 43 -20 L26 -44 -15 -39 -28 -50Z" fill={c.text}/>
   <path d="M-19 -22 h8 M12 -22 h8" stroke={c.text} strokeWidth="4" strokeLinecap="round"/>
   <path d={owner?`M-12 ${4+3*loss} Q0 ${13-15*loss} 13 ${4+3*loss}`:'M-12 4 Q0 13 13 4'} fill="none" stroke={c.text} strokeWidth="3"/>
   {paper&&<path d="M-71 109 Q-67 19 1 18 Q70 28 71 109" fill="none" stroke={c.muted} opacity=".35" strokeWidth="1.5"/>}
   </>}
 </g>;
 return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
   <defs>
     <radialGradient id="endowment-light"><stop stopColor={c.primary} stopOpacity=".14"/><stop offset="1" stopColor={c.background} stopOpacity="0"/></radialGradient>
     <pattern id="endowment-grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke={c.line} strokeOpacity=".23" strokeWidth="1"/></pattern>
     <pattern id="endowment-grain" width="17" height="19" patternUnits="userSpaceOnUse"><path d="M2 3h2 M11 13h3" stroke={c.primary} strokeOpacity={v.texture} strokeWidth="1"/></pattern>
     <marker id="endowment-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5 0 10" fill="none" stroke={c.primary} strokeWidth="1.8"/></marker>
     <marker id="loss-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5 0 10" fill="none" stroke={c.accent} strokeWidth="1.8"/></marker>
   </defs>
   <rect width="1920" height="1080" fill={c.background}/>
   {night?<><ellipse cx="960" cy="490" rx="780" ry="620" fill="url(#endowment-light)"/>{Array.from({length:40},(_,i)=><circle key={i} cx={80+(i*397)%1770} cy={30+(i*173)%820} r={i%4===0?1.8:1} fill={c.primary} opacity=".25"/>)}<path d="M0 881Q420 780 920 870T1920 840V1080H0Z" fill={c.panel} opacity=".45"/></>:paper?<><rect width="1920" height="1080" fill="url(#endowment-grain)"/><g transform="rotate(-1 510 565)"><rect x="137" y="282" width="675" height="526" rx="4" fill={c.line} opacity=".2"/><rect x="130" y="274" width="675" height="526" rx="4" fill={c.panel}/><path d="M161 315H775 M161 759H775" stroke={c.line}/></g><g transform="rotate(1 1410 565)"><rect x="1117" y="282" width="675" height="526" fill={c.line} opacity=".2"/><rect x="1110" y="274" width="675" height="526" fill={c.panel}/><path d="M1140 315H1755 M1140 759H1755" stroke={c.line}/></g></>:<><rect width="1920" height="1080" fill="url(#endowment-grid)"/><rect x="120" y="288" width="650" height="520" rx="24" fill={c.panel} stroke={c.line} strokeWidth="2"/><rect x="1150" y="288" width="650" height="520" rx="24" fill={c.panel} stroke={c.line} strokeWidth="2"/></>}
   {txt(110,83,'思考，快与慢   /   27   禀赋效应',22,c.muted)}
   {txt(1810,83,'机制示意 · 非实验数据',20,c.muted,'end')}
   {txt(110,185,'杯子没变，“我的”改变了判断。',56,c.text,'start',v.titleWeight)}
   <g opacity={intro}>
     {txt(445,353,'拥有前',31,c.primary,'middle',700)}
     <g opacity={own}>{txt(1475,353,'拥有后',31,c.accent,'middle',700)}</g>
     {person(445,489,false)}
     <g opacity={own} transform={`translate(${24*(1-own)} 0)`}>{person(1475,489,true)}</g>
     <g opacity={1-own}>
       <path d="M960 436Q812 355 650 430" fill="none" stroke={c.primary} strokeWidth={w} pathLength="1" strokeDasharray={`${gain} 1`} markerEnd={gain>.98?'url(#endowment-arrow)':undefined}/>
       <g transform={`translate(592 ${615-24*gain})`} opacity={gain}><circle r="23" fill={c.primary} fillOpacity=".13"/><path d="M-9 0H9 M0 -9V9" stroke={c.primary} strokeWidth="3"/></g>
     </g>
     <ellipse cx="1325" cy="545" rx="284" ry="220" fill={c.accent} fillOpacity={own*.025} stroke={c.accent} strokeOpacity={own*(.1+.2*loss)} strokeWidth="2" strokeDasharray="5 12"/>
     <g opacity={attempt*(1-pull)*.7} transform={`translate(${ownedX} 550)`}>
       <path d="M-83 -70H82L69 73Q66 96 1 98Q-65 96 -69 73Z M68 -39H89Q142 -39 140 9Q139 60 72 52" fill="none" stroke={c.accent} strokeWidth="3" strokeDasharray="7 9"/>
     </g>
     <g opacity={loss}>
       <path d="M1160 415Q1065 365 955 415" fill="none" stroke={c.accent} strokeWidth="3" strokeDasharray="7 8" markerEnd="url(#loss-arrow)" opacity={1-pull*.65}/>
       <g opacity={pull} transform="translate(1058 388)"><circle r="19" fill={c.background}/><path d="M-9 -9L9 9 M-9 9L9 -9" stroke={c.accent} strokeWidth="3" strokeLinecap="round"/></g>
       {txt(1058,340,'卖出',24,c.accent,'middle')}
     </g>
     <g opacity={grip} data-cup-grip>
       <path d={`M1440 542Q1390 610 ${cupX+136} ${cupY+18}`} fill="none" stroke={c.accent} strokeWidth="9" strokeLinecap="round"/>
       <path d={`M1510 545Q1462 652 ${cupX+45} ${cupY+99}`} fill="none" stroke={c.accent} strokeWidth="9" strokeLinecap="round"/>
       <circle cx={cupX+136} cy={cupY+18} r="10" fill={paper?'#ead6b6':'#d9bda1'}/>
       <ellipse cx={cupX+45} cy={cupY+99} rx="14" ry="8" fill={paper?'#ead6b6':'#d9bda1'}/>
     </g>
     <g transform={`translate(${cupX} ${cupY-16*Math.sin(Math.PI*own)})`}>
       <ellipse cy="106" rx="122" ry="19" fill={c.primary} opacity=".1"/>
       <path d="M68 -39H89Q142 -39 140 9Q139 60 72 52" fill="none" stroke={c.primary} strokeWidth="14"/>
       <path d="M-83 -70H82L69 73Q66 96 1 98Q-65 96 -69 73Z" fill={night?'#e1c487':paper?'#ede0bd':'#dbe9f6'} stroke={c.primary} strokeWidth={w+1}/>
       <ellipse cy="-70" rx="82" ry="17" fill={c.panel} stroke={c.primary} strokeWidth={w}/>
       <path d="M-45 -38V52" stroke={night?'#fff4d4':'#ffffff'} strokeOpacity=".5" strokeWidth="10" strokeLinecap="round"/>
       <path d="M-12 5Q-26 -11 -14 -18Q-5 -24 0 -13Q7 -25 17 -18Q29 -7 0 15Z" fill={night?'#b68d46':c.primary} opacity=".5"/>
       <g opacity={own} transform={`translate(0 ${-52*(1-own)})`}><rect x="-70" y="126" width="140" height="43" rx={paper?3:21} fill={c.accent}/>{txt(0,156,'我的',24,c.background,'middle',700)}</g>
     </g>
     {txt(445,710,'得到',34,c.primary,'middle')}
     <g opacity={loss} transform={`translate(0 ${12*(1-loss)})`}>
       {txt(1475,710,pull>.75?'舍不得':'失去',34,c.accent,'middle',700)}
     </g>
   </g>
   <g opacity={result} transform={`translate(0 ${14*(1-result)})`}>
     <path d="M445 786Q960 850 1475 786" fill="none" stroke={c.line} strokeWidth="2"/>
     {txt(960,896,'损失的分量，可能比得到更重。',35,c.text,'middle',700)}
   </g>
 </svg>;
}

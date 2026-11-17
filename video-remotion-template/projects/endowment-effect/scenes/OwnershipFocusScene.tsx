import React from 'react';
import type {Segment,VisualStyle} from '../../../src/types';

const ease=(n:number)=>{const x=Math.max(0,Math.min(1,n));return x*x*(3-2*x);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;

// The comparison unfolds in time. One continuous person and cup carry the
// story; no overview, duplicated prices, or parallel explanatory panels.
export function OwnershipFocusScene({segment,time,visual:v}:{segment:Segment;time:number;visual:VisualStyle}){
 const c=v.colors,e=segment.events;
 const at=(t:number,d=.5)=>ease((time-t)/d);
 const buyNo=at(e['buy-refusal'],.45),own=at(e.own,.75);
 const attempt=at(e.loss,.65),sellNo=at(e['sale-refusal'],.65),result=at(e.result,.5);
 const gift=at(e.own,.22)*(1-at(e.loss-.3,.3));
 const tag=at(e.own+.4,.15);
 const phase=time<e.own?0:time<e.loss?1:2;
 const cupX=mix(1080+40*buyNo,1010,own)+125*attempt*(1-sellNo)-35*sellNo;
 const cupY=620-18*Math.sin(Math.PI*own)-7*Math.sin(Math.PI*sellNo);
 const skin='#c9b59e',ink='#433c3d',shirt='#2c374d',outline='#53627b';
 const txt=(x:number,y:number,text:string,size=28,color=c.text,anchor:'start'|'middle'|'end'='middle',weight=400)=><text data-fit x={x} y={y} textAnchor={anchor} fill={color} fontSize={size} fontWeight={weight}>{text}</text>;

 // Fixed-length arm: the hand grasps the near side of the cup. Its geometry
 // follows the same ownership/withdrawal events as the existing audio.
 const wristX=mix(828-25*buyNo,cupX-112,own);
 const wristY=mix(581-24*Math.sin(Math.PI*buyNo),cupY+43,own);
 const sx=752,sy=615,dx=wristX-sx,dy=wristY-sy,len=165;
 const distance=Math.min(len*2-.01,Math.hypot(dx,dy));
 const angle=Math.atan2(dy,dx)+Math.acos(distance/(2*len));
 const elbowX=sx+len*Math.cos(angle),elbowY=sy+len*Math.sin(angle);
 const emotion=buyNo*(1-own)+sellNo;
 const title=phase===0?'30元，买它？':phase===1?'免费送给你':'30元，卖它？';
 const reaction=phase===0?'嫌贵':phase===2?'舍不得':'';
 const reactionOpacity=phase===0?buyNo*(1-at(e.own-.2,.2)):phase===2?sellNo:0;

 return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}} data-decision-scene data-stage={phase} data-focus="cup">
  <defs>
   <radialGradient id="focus-halo"><stop stopColor="#383238" stopOpacity=".65"/><stop offset="1" stopColor={c.background} stopOpacity="0"/></radialGradient>
   <linearGradient id="focus-cup" x1="0" x2="1"><stop stopColor="#edd69f"/><stop offset=".56" stopColor={c.primary}/><stop offset="1" stopColor="#c9a664"/></linearGradient>
  </defs>
  <rect width="1920" height="1080" fill={c.background}/>
  <ellipse cx="990" cy="580" rx="660" ry="450" fill="url(#focus-halo)"/>

  <g data-question>{txt(960,239,title,60,phase===1?c.primary:c.text,'middle',700)}</g>

  <ellipse cx="700" cy="797" rx="200" ry="20" fill="#000" opacity=".16"/>
  <ellipse cx={cupX+15} cy="797" rx="190" ry="18" fill={c.primary} opacity=".07"/>

  <g data-person>
   <g transform="translate(62 120)">
    <path d="M550 461Q498 476 490 640Q595 673 714 640Q704 482 656 461Z" fill={shirt} stroke={outline} strokeWidth="3"/>
    <path d="M585 445V481Q606 502 629 481V445" fill={skin}/>
    <path d="M556 476L599 519 641 478" fill="none" stroke={outline} strokeWidth="3"/>
    <path d="M514 502Q475 571 511 626L553 643" fill="none" stroke={outline} strokeWidth="24" strokeLinecap="round"/>
    <path d="M514 502Q475 571 511 626L553 643" fill="none" stroke={shirt} strokeWidth="18" strokeLinecap="round"/>
    <ellipse cx="558" cy="643" rx="17" ry="12" fill={skin}/>
    <g transform={`rotate(${-4*emotion} 606 404)`}>
     <ellipse cx="605" cy="404" rx="61" ry="70" fill={skin} stroke="#d2c2ad" strokeWidth="2"/>
     <path d="M544 401Q526 327 586 322Q641 304 668 354L664 401 647 370Q624 379 603 356Q577 382 551 369Z" fill="#2b3041"/>
     <path d={`M574 ${392+emotion*3}L590 389 M623 389L639 ${392+emotion*3}`} stroke={ink} strokeWidth="3" strokeLinecap="round"/>
     <ellipse cx="583" cy="404" rx="4" ry="5" fill={ink}/><ellipse cx="632" cy="404" rx="4" ry="5" fill={ink}/>
     <path d="M607 409l-4 13h7" fill="none" stroke="#967d6b" strokeWidth="2"/>
     <path d={`M590 440Q605 ${453-16*emotion} 621 439`} fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round"/>
    </g>
   </g>
   <path d={`M${sx} ${sy}L${elbowX} ${elbowY}L${wristX} ${wristY}`} fill="none" stroke={outline} strokeWidth="25" strokeLinecap="round" strokeLinejoin="round"/>
   <path d={`M${sx} ${sy}L${elbowX} ${elbowY}L${wristX} ${wristY}`} fill="none" stroke={shirt} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
  </g>

  <g opacity={attempt*(1-sellNo)*.45} data-sale-direction>
   <path d="M1320 618H1440 M1424 602L1440 618 1424 634" stroke={c.muted} strokeWidth="3" fill="none" strokeLinecap="round"/>
  </g>

  <g data-main-cup data-owned={tag.toFixed(3)} data-cup-x={cupX.toFixed(3)} transform={`translate(${cupX} ${cupY}) scale(1.55)`}>
   <path d="M68 -39H89Q142 -39 140 9Q139 60 72 52" fill="none" stroke={c.primary} strokeWidth="14"/>
   <path d="M-83 -70H82L69 73Q66 96 1 98Q-65 96 -69 73Z" fill="url(#focus-cup)" stroke="#f3dba3" strokeWidth="2"/>
   <ellipse cy="-70" rx="82" ry="17" fill="#252333" stroke="#f3dba3" strokeWidth="3"/>
   <path d="M-45 -38V52" stroke="#fff4d4" opacity=".5" strokeWidth="9" strokeLinecap="round"/>
   <path d="M-12 5Q-26 -11 -14 -18Q-5 -24 0 -13Q7 -25 17 -18Q29 -7 0 15Z" fill="#a98037" opacity=".65"/>
   <g opacity={gift} transform={`translate(0 ${-94-24*(1-own)})`} data-gift-ribbon>
    <path d="M0 4Q-58 -37 -53 -10Q-40 12 0 4Q56 -38 51 -9Q37 14 0 4" fill="none" stroke={c.accent} strokeWidth="6"/>
    <path d="M0 4L-20 30 M0 4L24 28" fill="none" stroke={c.accent} strokeWidth="5"/>
   </g>
   <g opacity={tag} transform={`translate(0 ${14*(1-tag)})`} data-owned-label>
    <rect x="-42" y="34" width="84" height="34" rx="9" fill={c.accent}/>
    {txt(0,59,'我的',23,c.background,'middle',700)}
   </g>
  </g>

  <g transform={`translate(${wristX} ${wristY})`} data-grip>
   <ellipse rx={mix(13,15,own)} ry={mix(25,19,own)} fill={skin} transform={`rotate(${mix(-15,12,own)})`}/>
   <path d={own>.5?'M5 -7Q15 -22 19 -8':'M-7 -10L-15 -20'} fill="none" stroke={skin} strokeWidth="8" strokeLinecap="round"/>
  </g>

  <g data-reaction opacity={reactionOpacity} transform={`translate(0 ${12*(1-reactionOpacity)})`}>
   {txt(960,900,reaction,76,phase===2?c.accent:c.primary,'middle',700)}
  </g>
  <g data-term opacity={result} transform={`translate(0 ${8*(1-result)})`}>
   {txt(960,963,'禀赋效应',30,c.muted)}
  </g>
 </svg>;
}

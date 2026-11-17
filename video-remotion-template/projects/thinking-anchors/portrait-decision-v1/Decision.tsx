import React from 'react';
import {ease} from '../../../src/components/primitives';
import {AnchorPortraitMechanism} from '../portrait-mechanism-v1/Mechanism';
import {Txt,Tag,Shopper} from '../portrait-mechanism-v1/SceneParts';
import data from './storyboard.json';

const ink='#25252b',cream='#fff8e9',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
function QuoteMemory({opacity}:{opacity:number}){
 return <g opacity={opacity}>
  <g transform="translate(505 760) scale(.82)"><path d="M-301 -150 H285 Q341 -150 341 -98 V97 Q341 150 285 150 H241 L278 204 L189 150 H-301 Q-341 150 -341 100 V-101 Q-341 -150 -301 -150 Z" fill="#fce1d6" stroke={coral} strokeWidth="6"/><Txt y={-65} size={44}>最初的报价</Txt><Txt y={100} size={180} color="#a34d3c">999</Txt></g>
  <circle cx="739" cy="1014" r="16" fill="#fce1d6" stroke={coral} strokeWidth="4"/><circle cx="761" cy="1144" r="9" fill="#fce1d6" stroke={coral} strokeWidth="3"/>
  <path d="M505 894 C505 940,375 918,375 958.75" fill="none" stroke={coral} strokeWidth="6" strokeDasharray="9 10"/>
 </g>;
}
function SearchIcon({x,y,scale=1}:{x:number;y:number;scale?:number}){
 return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={ink} strokeWidth="5" fill="none" strokeLinecap="round"><circle r="17"/><path d="M12 12 L31 31"/></g>;
}
function PriceRow({value,label,progress,retire=0,highlight=0}:{value:number;label:string;progress:number;retire?:number;highlight?:number}){
 return <g opacity={progress*(1-retire)} transform={`translate(${30*(1-progress)-40*retire} 0)`}>
  <rect x="170" y="843" width="640" height="155" rx="21" fill={ink}/><rect x="160" y="833" width="640" height="155" rx="21" fill={paper} stroke={ink} strokeWidth="5"/>
  <Txt x={323} y={890} size={40}>{label}</Txt><Txt x={656} y={954} size={105} color={value===189?'#207b72':ink}>{value}</Txt>
  <rect x="160" y="833" width="640" height="155" rx="21" fill="none" stroke={teal} strokeWidth="8" opacity={highlight} pathLength="1" strokeDasharray="1" strokeDashoffset={1-highlight}/>
 </g>;
}
function CoatIcon(){return <g transform="translate(266 850) scale(.68)" stroke={ink} strokeWidth="6" strokeLinejoin="round"><path d="M-52 -83 L-111 -42 L-74 13 L-45 -5 V116 H58 V-5 L85 13 L120 -42 L61 -83 L24 -62 H-13 Z" fill={coral}/><path d="M-52 -83 Q-11 -14 61 -83 M8 -60 V110" fill="none"/></g>;}
function Wallet(){return <g transform="translate(263 1075)" stroke={ink} strokeWidth="5" strokeLinejoin="round"><path d="M-69 -38 L51 -60 V-25" fill="#f1c4a0"/><rect x="-74" y="-30" width="148" height="107" rx="17" fill="#f1c4a0"/><path d="M28 -5 H83 V49 H28 Q12 49 12 29 V15 Q12 -5 28 -5 Z" fill={paper}/><circle cx="40" cy="22" r="7" fill={ink}/></g>;}
export function AnchorPortraitDecision({frame}:{frame:number}){
 const time=frame/30,e=data.events;if(time<e.search)return <AnchorPortraitMechanism frame={359}/>;
 const search=ease((time-e.search)/.85),title=ease((time-e.search-.14)/.3),legacy=1-ease((time-e.search)/.12),memory=1-ease((time-e.search)/.22);
 const history=ease((time-e.history)/.4),other=ease((time-e.other)/.4),retireHistory=ease((time-e.other)/.10),compared=ease((time-e.compare)/.45),conditions=ease((time-e.conditions)/.4),need=ease((time-e.need)/.5),budget=ease((time-e.budget)/.4),choice=ease((time-e.choice)/.45);
 const evidence=1-ease((time-e.need)/.22),form=ease((time-e.need-.25)/.4),searchPage=ease((time-e.search-.25)/.5);
 const cx=lerp(375,480,search),cy=lerp(1105,730,search),w=lerp(455,640,search),h=lerp(292.5,150,search),r=lerp(-3,0,search);
 const phase=time<e.history?'find-counterevidence':time<e.other?'check-history':time<e.conditions?'check-other-store':time<e.need?'match-conditions':time<e.choice?'personal-criteria':'keep-choice';
 const clock=2*359/30-.3+time-e.search;
 return <svg data-portrait-scene data-stage={phase} width="1080" height="1920" viewBox="0 0 1080 1920" role="img" aria-label="承接该拿什么比：先找反证、查同款近期常态价和其他店实际到手价，核对运费售后，再按需求与预算决定，也可以暂不买">
  <style>{`.decision-context>svg>g:not(.mechanism-context){display:none}`}</style>
  <rect width="1080" height="1920" fill={cream}/>
  <g className="decision-context" transform={`translate(0 ${-130*search})`}><AnchorPortraitMechanism frame={359}/></g>
  <g opacity={legacy}><Txt x={490} y={278} size={104}>锚定效应</Txt><Txt x={490} y={438} size={82}>该拿什么比？</Txt></g>
  <g opacity={title}>
   <Txt x={490} y={244} size={time>=e.need?84:90}>{time<e.conditions?'先找反证':time<e.need?'同款，还要同条件':time<e.choice?'查完价格，再决定':'按需决定'}</Txt>
   {time<e.conditions&&<Txt x={490} y={350} size={64}>199，也可能不便宜。</Txt>}
   {time>=e.conditions&&time<e.need&&<Txt x={490} y={350} size={64}>看实际到手价</Txt>}
  </g>
  <QuoteMemory opacity={memory}/>
  <g opacity={searchPage}>
   <rect x="112" y="490" width="724" height="1005" rx="35" fill="#f6eee0"/>
   <g opacity={evidence}>
    <rect x="160" y="543" width="640" height="86" rx="23" fill={paper} stroke={ink} strokeWidth="5"/>
    <SearchIcon x={202} y={580}/><Txt x={503} y={599} size={40}>查同款实际到手价</Txt>
   </g>
   <g opacity={form}>
    <Txt x={470} y={610} size={48}>下单前，问自己</Txt>
    <g transform={`translate(0 ${22*(1-form)})`}><rect x="171" y="758" width="600" height="194" rx="27" fill={ink}/><rect x="160" y="747" width="600" height="194" rx="27" fill={mint} stroke={ink} strokeWidth="5"/><CoatIcon/><Txt x={525} y={875} size={67}>真的需要？</Txt></g>
    <g opacity={budget} transform={`translate(0 ${20*(1-budget)})`}><rect x="171" y="990" width="600" height="194" rx="27" fill={ink}/><rect x="160" y="979" width="600" height="194" rx="27" fill={paper} stroke={ink} strokeWidth="5"/><Wallet/><Txt x={525} y={1106} size={67}>预算合适？</Txt></g>
    <g opacity={choice} transform={`translate(0 ${14*(1-choice)})`}><rect x="166" y="1320" width="450" height="100" rx="26" fill={mint} stroke={teal} strokeWidth="6"/><Txt x={389} y={1387} size={52}>先不急着买</Txt></g>
   </g>
  </g>
  <g opacity={evidence}>
   <g data-retained-199 transform={`translate(${cx} ${cy}) rotate(${r})`}>
    <g transform={`scale(${w/700} ${h/450})`}><Tag w={700} h={450} fill={mint}>{null}</Tag></g>
    <Txt x={lerp(0,-165,search)} y={lerp(-65,-24,search)} size={lerp(50.7,38,search)}>{search>.6?'本店到手':'到手价'}</Txt>
    <Txt x={lerp(0,178,search)} y={lerp(100.75,38,search)} size={lerp(146.25,96,search)}>199</Txt>
   </g>
   <PriceRow value={219} label="近期常态价" progress={history} retire={retireHistory}/>
   <PriceRow value={189} label="其他店到手" progress={other} highlight={compared}/>
   <g opacity={compared}>
    <path d="M789 748 H819 V941 H789" fill="none" stroke={teal} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-compared}/>
    <Txt x={452} y={1100} size={73}>相差10元</Txt>
   </g>
   <g opacity={conditions} transform={`translate(0 ${12*(1-conditions)})`}>
    {['同款','运费','售后'].map((text,i)=><g key={text} transform={`translate(${160+i*157} 1198)`}><rect width="145" height="76" rx="17" fill={mint} stroke={teal} strokeWidth="4"/><path d="M14 40 L23 50 L39 28" fill="none" stroke={teal} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><Txt x={88} y={51} size={34}>{text}</Txt></g>)}
   </g>
  </g>
  <g transform={`translate(${45*choice} 0)`}><Shopper happy={0} check={1} surprise={.306*(1-form)} time={clock} opacity={1}/></g>
 </svg>;
}
export const portraitDecisionScenes={'anchor-portrait-decision':AnchorPortraitDecision};

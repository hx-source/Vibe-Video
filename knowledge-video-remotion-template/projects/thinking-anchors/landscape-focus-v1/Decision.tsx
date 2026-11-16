import React from 'react';
import {ease} from '../../../src/components/primitives';
import {AnimatedShopper} from './Actor';
import board from './board.json';

const ink='#25252b',cream='#fff8e9',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
function Text({x,y,size=64,color=ink,children}:{x:number;y:number;size?:number;color?:string;children:React.ReactNode}){
 return <text x={x} y={y} fontSize={size} textAnchor="middle" fontWeight="700" fill={color}>{children}</text>;
}
function Coat(){
 return <g stroke={ink} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
  <path d="M0 -112 V-125 Q0 -139 12 -139 Q28 -139 22 -122 M0 -112 L-63 -83 H61 Z" fill="none"/>
  <path d="M-52 -83 L-111 -42 L-74 13 L-45 -5 V116 H58 V-5 L85 13 L120 -42 L61 -83 L24 -62 H-13 Z" fill={coral}/>
  <path d="M-52 -83 Q-11 -14 61 -83 M8 -60 V110" fill="none"/>
 </g>;
}
function PriceTag({x,y,w,h,label,value}:{x:number;y:number;w:number;h:number;label:string;value:number}){
 return <g transform={`translate(${x} ${y})`} data-price={value}>
  <path d={`M${-w/2+20} ${-h/2+12} H${w/2-34} L${w/2+10} ${-h/2+56} V${h/2-12} Q${w/2+10} ${h/2+12} ${w/2-14} ${h/2+12} H${-w/2+24} Q${-w/2+12} ${h/2+12} ${-w/2+12} ${h/2-12} V${-h/2+32} Z`} fill={ink}/>
  <path d={`M${-w/2+20} ${-h/2} H${w/2-44} L${w/2} ${-h/2+44} V${h/2-24} Q${w/2} ${h/2} ${w/2-24} ${h/2} H${-w/2+24} Q${-w/2} ${h/2} ${-w/2} ${h/2-24} V${-h/2+24} Q${-w/2} ${-h/2} ${-w/2+24} ${-h/2} Z`} fill={mint} stroke={ink} strokeWidth="6"/>
  <circle cx={w/2-40} cy={-h/2+58} r="9" fill={paper} stroke={ink} strokeWidth="4"/>
  <Text x={0} y={-h*.23} size={w>450?48:36}>{label}</Text>
  <Text x={0} y={h*.29} size={h*.60}>{value}</Text>
 </g>;
}
function Evidence({p,retire=0,value,label}:{p:number;retire?:number;value:number;label:string}){
 const x=1122+75*(1-p)-38*retire,y=552+50*(1-p)-95*retire;
 return <g opacity={p*(1-retire)} transform={`translate(${x} ${y}) rotate(${-5*(1-p)-4*retire})`} data-evidence={value}>
  <path d="M-170 -179 H180 V170 L160 153 L140 170 L120 153 L100 170 L80 153 L60 170 L40 153 L20 170 L0 153 L-20 170 L-40 153 L-60 170 L-80 153 L-100 170 L-120 153 L-140 170 L-170 153 Z" fill={ink}/>
  <path d="M-180 -191 H170 V158 L150 141 L130 158 L110 141 L90 158 L70 141 L50 158 L30 141 L10 158 L-10 141 L-30 158 L-50 141 L-70 158 L-90 141 L-110 158 L-130 141 L-150 158 L-180 141 Z" fill={paper} stroke={ink} strokeWidth="5"/>
  <Text x={-5} y={-104} size={36}>{label}</Text>
  <path d="M-140 -65 H130" stroke={ink} strokeWidth="3" strokeDasharray="8 8" opacity=".35"/>
  <Text x={-5} y={91} size={158} color={value===189?'#207b72':ink}>{value}</Text>
 </g>;
}
function Check({x,y,p}:{x:number;y:number;p:number}){
 return <g transform={`translate(${x} ${y})`} opacity={p}><circle r="30" fill={mint} stroke={teal} strokeWidth="4"/><path d="M-15 0 L-4 12 L18 -13" fill="none" stroke={teal} strokeWidth="6" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-p}/></g>;
}
function Shipping(){
 return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M-77 -49 L0 -86 L77 -49 V53 L0 92 L-77 53 Z" fill="#f1c4a0"/><path d="M-77 -49 L0 -11 L77 -49 M0 -11 V92 M-39 -67 L38 -30 V1" fill="none"/><path d="M22 47 L45 35" fill="none"/></g>;
}
function Service(){
 return <g stroke={ink} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"><path d="M0 -86 L73 -56 V1 Q74 63 0 99 Q-74 63 -73 1 V-56 Z" fill={mint}/><path d="M-30 4 A35 35 0 1 1 24 30 M-32 -15 V8 H-9" fill="none"/></g>;
}
function Wallet(){
 return <g stroke={ink} strokeWidth="4" strokeLinejoin="round"><path d="M-69 -38 L51 -60 V-25" fill="#f1c4a0"/><rect x="-74" y="-30" width="148" height="107" rx="17" fill="#f1c4a0"/><path d="M28 -5 H83 V49 H28 Q12 49 12 29 V15 Q12 -5 28 -5 Z" fill={paper}/><circle cx="40" cy="22" r="7" fill={ink}/></g>;
}
export function AnchorLandscapeFocus({frame}:{frame:number}){
 if(!Number.isInteger(frame)||frame<0||frame>=420)throw Error('Landscape focus frame outside 0–419');
 const t=frame/30,e=board.events,search=ease((t-e.search)/.55),history=ease((t-e.history)/.45),other=ease((t-e.other)/.4),retire=ease((t-e.other)/.18),compare=ease((t-e.compare)/.35),conditions=ease((t-e.conditions)/.35),need=ease((t-e.need)/.4),budget=ease((t-e.budget)/.35),choice=ease((t-e.choice)/.5);
 const priceStage=1-conditions,criteriaStage=conditions*(1-need),personalStage=need;
 const stage=t<e.history?'search-price':t<e.other?'check-history':t<e.conditions?'compare-store':t<e.need?'match-conditions':t<e.budget?'ask-need':t<e.choice?'ask-budget':'keep-choice';
 const heading=t<e.search?'该拿什么比？':t<e.conditions?'先查真实到手价':t<e.need?'同款，还要同条件':t<e.choice?'查完价格，再问自己':'决定权，留给自己';
 const question=t<e.budget?'真的需要？':t<e.choice?'预算合适？':'先不急着买';
 const clock=2*359/30-.3+t-e.search;
 return <svg data-landscape-scene data-stage={stage} width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="查真实到手价，核对同款、运费与售后，再按需要和预算决定，也可以先不买">
  <defs><pattern id="focus-paper" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill={cream}/><rect width="1920" height="1080" fill="url(#focus-paper)"/>
  <path d="M0 945 Q770 903 1920 950 V1080 H0 Z" fill="#e9dec9"/><path d="M0 982 Q950 943 1920 984" fill="none" stroke="#d8cbb5" strokeWidth="3"/>
  <ellipse cx="1610" cy="1002" rx="240" ry="27" fill={ink} opacity=".08"/>
  <ellipse cx="755" cy="948" rx={590-150*personalStage} ry="30" fill={ink} opacity=".05"/>
  <Text x={820} y={177} size={76}>{heading}</Text>
  <g data-focus="price-comparison" opacity={priceStage}>
   <g transform={`translate(329 567) scale(${1.42+.04*search}) rotate(${-3*(1-search)})`}><Coat/></g>
   <path d={`M408 466 Q459 397 ${mix(625,550,history)} ${mix(405,440,history)}`} fill="none" stroke={ink} strokeWidth="4"/>
   <PriceTag x={mix(835,708,history)} y={mix(570,553,history)} w={mix(610,365,history)} h={mix(404,326,history)} label="本店到手" value={199}/>
   <Evidence p={history} retire={retire} value={219} label="近期常态价"/>
   <Evidence p={other} value={189} label="其他店到手"/>
   <g opacity={compare} transform={`translate(925 ${833+18*(1-compare)})`}>
    <path d="M-190 -17 V0 H185 V-17" fill="none" stroke={teal} strokeWidth="6" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-compare}/>
    <Text x={0} y={73} size={52} color="#207b72">相差10元</Text>
   </g>
  </g>
  <g data-focus="comparable-conditions" opacity={criteriaStage}>
   <g transform="translate(329 567) scale(1.46)"><Coat/></g>
   <g transform={`translate(770 ${557+24*(1-conditions)}) scale(1.58)`}><Shipping/></g>
   <g transform={`translate(1168 ${555+24*(1-conditions)}) scale(1.52)`}><Service/></g>
   {[{x:329,text:'同款'},{x:770,text:'核对运费'},{x:1168,text:'核对售后'}].map((item,i)=>{
    const p=ease((t-e.conditions-i*.13)/.3);return <g key={item.text} opacity={p}>
     <Check x={item.x+93} y={728} p={p}/><Text x={item.x} y={843} size={52}>{item.text}</Text>
    </g>;
   })}
  </g>
  <g data-focus="personal-decision" opacity={personalStage}>
   <g opacity={1-budget} transform={`translate(${360-25*choice} 565) scale(${1.58-.12*choice}) rotate(${-4*choice})`}><Coat/></g>
   <g opacity={budget*(1-choice)} transform={`translate(360 560) scale(${1.95+.16*budget}) rotate(${-6*(1-budget)})`}><Wallet/></g>
   <g opacity={choice} transform={`translate(${320-70*choice} 567) scale(1.45)`}><Coat/></g>
   <g transform={`translate(0 ${12*(1-personalStage)})`}>
    <Text x={955} y={606} size={106}>{question}</Text>
    <path d="M671 640 Q958 651 1240 639" fill="none" stroke={teal} strokeWidth="9" strokeLinecap="round" opacity={choice} pathLength="1" strokeDasharray="1" strokeDashoffset={1-choice}/>
   </g>
  </g>
  <g data-actor-placement transform={`translate(${706+45*choice} -925) scale(1.1)`}><AnimatedShopper time={t} clock={clock}/></g>
 </svg>;
}
export const landscapeFocusScenes={'anchor-landscape-focus':AnchorLandscapeFocus};
export function validateLandscapeFocus(){
 if(board.video.width!==1920||board.video.height!==1080||board.video.fps!==30||board.durationSeconds!==14||!landscapeFocusScenes[board.sceneType as keyof typeof landscapeFocusScenes])throw Error('Invalid landscape focus board');
 for(const time of Object.values(board.events))if(time<0||time>=board.durationSeconds||Math.abs(time*30-Math.round(time*30))>1e-6)throw Error('Event outside frames');
}

import React from 'react';
import {ease} from '../../../src/components/primitives';
import {AnchorPortraitOpening} from './Opening';
import {Txt,Tag,Shopper} from '../portrait-mechanism-v1/SceneParts';
import data from '../portrait-mechanism-v1/storyboard.json';

const ink='#25252b',cream='#fff8e9',mint='#e3f4ec',coral='#ed795f',teal='#45b9ae',paper='#fffdf5';
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
function Memory({p,y,scale}:{p:number;y:number;scale:number}){
 return <g data-memory opacity={p}>
  <g transform={`translate(505 ${y}) scale(${scale})`}>
   <path d="M-301 -150 H285 Q341 -150 341 -98 V97 Q341 150 285 150 H241 L278 204 L189 150 H-301 Q-341 150 -341 100 V-101 Q-341 -150 -301 -150 Z" fill="#fce1d6" stroke={coral} strokeWidth="6"/>
   <Txt y={-65} size={44}>最初的报价</Txt><Txt y={100} size={180} color="#a34d3c">999</Txt>
  </g>
  <circle cx="739" cy="1014" r="16" fill="#fce1d6" stroke={coral} strokeWidth="4"/>
  <circle cx="761" cy="1144" r="9" fill="#fce1d6" stroke={coral} strokeWidth="3"/>
 </g>;
}
function ActualPrice({x,y,scale,rotate,label}:{x:number;y:number;scale:number;rotate:number;label:string}){
 return <g data-current-price transform={`translate(${x} ${y}) scale(${scale}) rotate(${rotate})`}>
  <Tag w={700} h={450} fill={mint}><Txt y={-100} size={78}>{label}</Txt><Txt y={155} size={225}>199</Txt></Tag>
 </g>;
}
function OtherPrice({opacity,y,scale}:{opacity:number;y:number;scale:number}){
 return <g data-comparable-price opacity={opacity} transform={`translate(690 ${y}) scale(${scale}) rotate(2)`}>
  <Tag w={700} h={400} fill={mint}><Txt y={-95} size={64}>另一家</Txt><Txt y={116} size={225} color="#207b72">189</Txt></Tag>
 </g>;
}
export function AnchorPortraitMechanism({frame}:{frame:number}){
 const time=frame/30,e=data.events;
 if(time<e.shift)return <AnchorPortraitOpening frame={359}/>;
 const shift=ease((time-e.shift)/.8),recall=ease((time-e.recall)/.45),feel=ease((time-e.feel)/.35),compared=ease((time-e.compare)/.6),concept=ease((time-e.concept)/.55),question=ease((time-e.question)/.30);
 const phase=time<e.compare?'reference':time<e.concept?'comparison':time<e.question?'concept':'question';
 const title=ease((time-e.shift-.14)/.32),legacy=1-ease((time-e.shift)/.12);
 const px=lerp(lerp(lerp(280,390,shift),280,compared),375,concept),py=lerp(lerp(lerp(930,1070,shift),930,compared),1105,concept),ps=lerp(lerp(lerp(.5,.78,shift),.5,compared),.65,concept);
 const memoryOpacity=recall*(1-compared)+concept,memoryY=lerp(630,760,concept),memoryScale=(.90+.1*recall)-.18*concept;
 const otherOpacity=(1-shift)+compared*(1-concept),otherY=930+120*shift*(1-compared),otherScale=lerp(lerp(.62,.55,shift),.62,compared);
 const sensation=feel*(1-ease((time-e.compare)/.18)),newComparison=ease((time-e.compare-.15)/.3)*(1-ease((time-e.concept)/.16));
 const clock=359/30+time-e.shift,surprise=lerp(lerp(.78,.15,feel),.68,compared)*(1-.55*concept);
 return <svg data-portrait-scene data-stage={phase} width="1080" height="1920" viewBox="0 0 1080 1920" role="img" aria-label="承接你刚才在和谁比：脑中999成为参照，199显得省800；换189比较则高10元，介绍锚定效应并追问判断依据">
  <style>{`.mechanism-context [data-object],.mechanism-context [data-focus],.mechanism-context [data-headline],.mechanism-context [data-character]{display:none}`}</style>
  <rect width="1080" height="1920" fill={cream}/>
  <g className="mechanism-context" transform={`translate(0 ${130*concept})`}><AnchorPortraitOpening frame={Math.floor(clock*30)}/></g>
  <g opacity={legacy}><Txt x={490} y={228} size={72}>你刚才，</Txt><Txt x={490} y={330} size={84}>在和谁比？</Txt></g>
  {time<e.concept&&<g opacity={title}>
   <Txt x={490} y={228} size={72}>{time<e.compare?'先来的数字，':'199 没变，'}</Txt>
   <Txt x={490} y={330} size={76}>{time<e.compare?'成了比较的参照。':'比较的对象变了。'}</Txt>
  </g>}
  <g opacity={concept}>
   <Txt x={490} y={278} size={104}>锚定效应</Txt>
   {time<e.question?<g opacity={1-question}><Txt x={490} y={391} size={60}>最初的数字，</Txt><Txt x={490} y={471} size={60}>可能成了参照。</Txt></g>:<g opacity={question}><Txt x={490} y={438} size={82}>该拿什么比？</Txt></g>}
  </g>
  <Memory p={memoryOpacity} y={memoryY} scale={memoryScale}/>
  <path d={`M505 ${lerp(791,894,concept)} C505 ${lerp(852,940,concept)},${px} ${lerp(850,918,concept)},${px} ${py-225*ps}`} fill="none" stroke={coral} strokeWidth="6" strokeDasharray="9 10" opacity={memoryOpacity}/>
  <g opacity={sensation} transform={`translate(0 ${10*(1-feel)})`}>
   <path d="M203 849 Q446 830 687 849" stroke="#ffe59c" strokeWidth="83" strokeLinecap="round" fill="none"/>
   <Txt x={448} y={872} size={76}>感觉省了800</Txt>
  </g>
  <ActualPrice x={px} y={py} scale={ps} rotate={lerp(-4,-3,shift)} label={shift>.5?'到手价':'刚才那家'}/>
  <OtherPrice opacity={otherOpacity} y={otherY} scale={otherScale}/>
  <g opacity={1-shift}>
   <path d="M280 1082 C280 1140,690 1140,690 1082" fill="none" stroke={teal} strokeWidth="7" strokeLinecap="round"/>
   <Txt x={480} y={1242} size={73}>相差10元</Txt>
  </g>
  <g opacity={newComparison}>
   <path d="M280 1082 C280 1140,690 1140,690 1082" fill="none" stroke={teal} strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-ease((time-e.compare-.15)/.3)}/>
   <Txt x={465} y={1242} size={82} opacity={ease((time-e.compare-.65)/.25)}>贵了10元</Txt>
  </g>
  <Shopper happy={0} check={1} surprise={surprise} time={clock} opacity={1}/>
 </svg>;
}

export const portraitMechanismScenes={'anchor-portrait-mechanism':AnchorPortraitMechanism};

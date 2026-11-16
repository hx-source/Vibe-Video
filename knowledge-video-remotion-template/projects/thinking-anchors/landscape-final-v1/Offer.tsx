import React from 'react';
import {ease} from '../../../src/components/primitives';
import {AnchorLandscapeUsed} from './Used';
import {Text,PriceTag} from '../landscape-opening-v2/Shapes';
import {Camera} from '../landscape-offer-v1/Props';
import {OfferShopper} from '../landscape-offer-v1/Actor';
import board from '../landscape-offer-v1/board.json';
const ink='#25252b',cream='#fff8e9',paper='#fffdf5',mint='#e3f4ec',teal='#45b9ae',coral='#ed795f';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
function Speech({x,y,p,speaker,text}:{x:number;y:number;p:number;speaker:string;text:string}){
 return <g opacity={p} transform={`translate(${x} ${y+14*(1-p)})`}>
  <path d="M-210 -87 H210 Q230 -87 230 -67 V52 Q230 72 210 72 H72 L95 111 L23 72 H-210 Q-230 72 -230 52 V-67 Q-230 -87 -210 -87 Z" fill={paper} stroke={ink} strokeWidth="4"/>
  <Text x={0} y={-32} size={30} color="#6e6d67">{speaker}</Text><Text x={0} y={37} size={53}>{text}</Text>
 </g>;
}
export function AnchorLandscapeOffer({frame}:{frame:number}){
 if(!Number.isInteger(frame)||frame<0||frame>=360)throw Error('Offer frame outside 0–359');
 const t=frame/30,e=board.events;if(t<e.switch)return <AnchorLandscapeUsed frame={419}/>;
 const enter=ease((t-e.switch)/.65),reference=ease((t-e.switch)/.9),reasons=ease((t-e.reasons)/.3),offer=ease((t-e.offer)/.55),refusal=ease((t-e.refusal)/.35),withdraw=ease((t-e.withdraw)/.65),choice=ease((t-e.choice)/.45);
 const evidence=1-refusal,heading=t<e.offer?'出价，先把依据说清楚':t<e.refusal?'结合依据，提出报价':t<e.withdraw?'对方不接受？':'不合适，可以不成交';
 const stage=t<e.offer?'explain-grounds':t<e.refusal?'make-offer':t<e.withdraw?'seller-declines':t<e.choice?'withdraw-offer':'keep-alternative';
 return <svg data-landscape-scene data-stage={stage} width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="承接620到680的示例成交参考和磨损缺配件，买家说明依据后出价630，卖家不接受，买家收回报价并选择再看看">
  <defs><pattern id="offer-paper" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill={cream}/><rect width="1920" height="1080" fill="url(#offer-paper)"/>
  <path d="M0 945 Q770 903 1920 950 V1080 H0 Z" fill="#e9dec9"/><path d="M0 982 Q950 943 1920 984" fill="none" stroke="#d8cbb5" strokeWidth="3"/>
  <ellipse cx="1610" cy="1002" rx="240" ry="27" fill={ink} opacity=".08"/><ellipse cx="755" cy="948" rx="590" ry="30" fill={ink} opacity=".05"/>
  <g opacity={0}><AnchorLandscapeUsed frame={419}/></g>
  <g opacity={1}>
   <Text x={820} y={177} size={74}>{heading}</Text>
   <g opacity={1-.55*choice} transform={`translate(${300-55*choice} 568) scale(1.08)`}><Camera scratch={1}/></g>
   <g opacity={1-.55*choice}><Text x={300-55*choice} y={842} size={44}>二手相机</Text></g>
   <g opacity={evidence}>
    <g transform={`translate(${mix(855,835,reference)} ${mix(675,310,reference)})`}>
     <rect x="-325" y="-62" width="650" height="125" rx="22" fill={mint} stroke={teal} strokeWidth="4" opacity={reference}/>
     <g opacity={reference}><Text x={0} y={-27} size={29}>示例成交参考</Text></g><Text x={0} y={mix(0,39,reference)} size={mix(145,70,reference)} color="#207b72">620—680</Text>
    </g>
    <g opacity={reasons}>
     <circle cx="556" cy="417" r="14" fill={coral}/><Text x={661} y={432} size={40}>有磨损</Text>
     <circle cx="915" cy="417" r="14" fill={coral}/><Text x={1041} y={432} size={40}>缺充电器</Text>
    </g>
   </g>
   <g data-proposed-offer opacity={offer*(1-withdraw)} transform={`translate(${mix(335,0,offer)+245*withdraw} ${mix(45,0,offer)+50*withdraw})`}>
    <PriceTag x={835} y={640} w={610-120*withdraw} h={346-65*withdraw} label="我愿出" value={board.offer}/>
    <g transform="translate(1048 558) rotate(10)"><rect x="-45" y="-24" width="90" height="48" rx="7" fill={paper} stroke={teal} strokeWidth="3"/><Text x={0} y={10} size={26} color="#207b72">示例</Text></g>
   </g>
   <Speech x={390} y={315} p={refusal*(1-ease((t-8.25)/.35))} speaker="卖家" text="这个价不卖"/>
   <Speech x={1535} y={290} p={withdraw*(1-ease((t-9.3)/.35))} speaker="买家" text="那我再看看"/>
   <g opacity={choice} transform={`translate(0 ${15*(1-choice)})`}>
    <Text x={855} y={620} size={106}>再看看，也可以</Text><path d="M500 672 Q850 688 1210 672" stroke={teal} strokeWidth="9" strokeLinecap="round" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1-choice}/>
   </g>
   <g transform={`translate(${706+60*withdraw} -925) scale(1.1)`}><OfferShopper time={t} clock={52+t}/></g>
  </g>
 </svg>;
}
export const offerScenes={'anchor-landscape-offer':AnchorLandscapeOffer};
export function validateOffer(){
 if(board.video.width!==1920||board.video.height!==1080||board.video.fps!==30||board.durationSeconds!==12||!offerScenes[board.sceneType as keyof typeof offerScenes])throw Error('Invalid offer scene');
 let last=-1;for(const t of Object.values(board.events)){if(t<=last||t<0||t>=12)throw Error('Invalid event order');last=t;}
 if(board.offer<board.referenceRange[0]||board.offer>board.referenceRange[1])throw Error('Example offer outside its stated reference');
}

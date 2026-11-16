import React from 'react';
import type {Segment} from '../../../src/types';
import {AnchorLiveDecision} from './AnchorLiveDecision';
import {UsedEvidenceRegroup} from './UsedEvidenceRegroup';
import {Coffee} from './AnchorLifeScene';
import {T,Talk,Person} from './OpeningActors';

const ink='#25252b',paper='#fffdf5',teal='#45b9ae',coral='#ed795f';
export const decisionHoldEvents={search:.3,history:1.25,other:2.55,compare:3.25,decision:5.3};

export function AnchorUsedEvidence({segment,time}:{segment:Segment;time:number}){
 if(time<.3)return <AnchorLiveDecision segment={{...segment,events:decisionHoldEvents}} time={239/30}/>;
 if(time>=segment.events['case-ready'])return <UsedEvidenceRegroup {...{segment,time}} variant="outline"/>;
 return <svg data-fullbleed-scene width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label="从直播间查同款，切换到二手咖啡机报价2000元，先看商品再查成交，把相同的核查方法用于砍价">
  <defs><pattern id="used-bridge-dots" width="27" height="27" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill={ink} opacity=".055"/></pattern></defs>
  <rect width="1920" height="1080" fill="#fff8e9"/><rect width="1920" height="1080" fill="url(#used-bridge-dots)"/>
  <T x={100} y={116} size={49} bold anchor="start">二手砍价，也先找依据</T>
  <g transform="translate(1653 93) rotate(-5)"><rect x="-118" y="-34" width="236" height="67" rx="7" fill={paper} stroke={coral} strokeWidth="4"/><T x={0} y={13} size={24} color="#bc503e" bold>剧情示例</T></g>
  {['看商品','查成交','再判断'].map((label,i)=><g key={label}><circle cx={130+i*600} cy="195" r="16" fill={i===0?teal:paper} stroke={ink} strokeWidth="3"/><T x={165+i*600} y={207} size={28} bold anchor="start">{label}</T>{i<2&&<path d={`M${340+i*600} 195 H${660+i*600}`} stroke={ink} strokeWidth="3" strokeDasharray="5 9" opacity=".25"/>}</g>)}
  <rect x="113" y="285" width="1008" height="680" rx="30" fill={ink}/><rect x="100" y="273" width="1008" height="680" rx="30" fill={paper} stroke={ink} strokeWidth="5"/>
  <path d="M103 361 H1106" stroke={ink} strokeWidth="3"/><T x={160} y={332} size={28} bold anchor="start">换个场景：二手咖啡机</T>
  <Coffee x={540} y={615} scale={1.25}/><T x={540} y={867} size={27} color="#666258">先检查商品，再核对成交</T>
  <Talk x={1208} y={280} w={600} lines={['先看商品，再查成交。']}/>
  <Person x={1690} y={825} pose={.25} surprise={0}/>
  <rect x="1243" y="688" width="360" height="175" rx="25" fill={ink}/><rect x="1230" y="675" width="360" height="175" rx="25" fill={paper} stroke={ink} strokeWidth="5"/>
  <T x={1410} y={712} size={25} color="#666258">卖家开价</T><T x={1410} y={798} size={60} bold>¥ 2000</T>
 </svg>;
}

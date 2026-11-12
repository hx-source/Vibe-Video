import React from 'react';
import {ease,clamp} from '../components/primitives';
import type {Segment,Theme} from '../types';
export function CycleScene({segment,time,theme}:{segment:Segment;time:number;theme:Theme}) {
  const steps=segment.props.steps??[],ratio=clamp(time/segment.durationSeconds),radius=175,circ=2*Math.PI*radius;
  return <>
    <svg width={1920} height={1080} style={{position:'absolute',inset:0}}>
      <circle cx={550} cy={550} r={radius} fill="none" stroke={theme.colors.line} strokeWidth={18}/>
      <circle cx={550} cy={550} r={radius} fill="none" stroke={theme.colors.primary} strokeWidth={18} strokeDasharray={`${circ*ratio} ${circ}`} transform="rotate(-90 550 550)" strokeLinecap="round"/>
      <text data-fit x={550} y={548} textAnchor="middle" fontSize={62} fontWeight={700} fill={theme.colors.primary}>{segment.props.centerLabel??'循环'}</text>
      <text data-fit x={550} y={600} textAnchor="middle" fontSize={26} fill={theme.colors.muted}>{segment.props.centerDetail??'进度示意'}</text>
    </svg>
    {steps.map((s,i)=>{const p=ease((time-segment.events[s.event])/.4);return <div key={i} data-fit style={{position:'absolute',left:880,top:355+i*115,width:820,maxHeight:100,padding:'18px 24px',boxSizing:'border-box',borderLeft:`5px solid ${theme.colors.primary}`,fontSize:32,lineHeight:1.5,opacity:p,transform:`translateX(${20*(1-p)}px)`}}>{s.label}</div>;})}
  </>;
}

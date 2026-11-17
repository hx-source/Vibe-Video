import React from 'react';
import type {Segment,Theme} from '../types';
import {Arrow,Node,ease,progress} from '../components/primitives';
import {sequenceState} from './sequence-model.mjs';
export function SequenceScene({segment,time,theme}:{segment:Segment;time:number;theme:Theme}) {
  const {nodes=[],messages=[]}=segment.props;
  const states=sequenceState(segment,time);
  const left=400,right=1520,top=395,gap=messages.length>3?94:135;
  return <>
    {nodes.map((n,i)=><Node key={n.id} x={i?right:left} y={230} label={n.label} state={states[n.id]} theme={theme}/>)}
    <svg width={1920} height={1080} style={{position:'absolute',inset:0}}>
      {[left,right].map(x=><line key={x} x1={x} x2={x} y1={355} y2={840} stroke={theme.colors.line} strokeWidth={2} strokeDasharray="6 9"/>)}
      {messages.map((m,i)=>{
        const start=segment.events[m.startEvent],end=segment.events[m.endEvent],p=progress(time,start,end),visible=ease((time-start)/.18),y=top+i*gap;
        const forward=m.from===nodes[0].id,x1=forward?left:right,x2=forward?right:left;
        const color=m.data?theme.colors.success:forward?theme.colors.primary:theme.colors.accent;
        return <g key={m.id} opacity={visible}>
          <Arrow x1={x1} x2={x2} y={y} color={color} amount={p}/>
          <text data-fit x={960} y={y-22} textAnchor="middle" fontSize={27} fontWeight={700} fill={color}>{m.label}</text>
          <text data-fit x={960} y={y+34} textAnchor="middle" fontSize={22} fill={theme.colors.muted}>{m.detail}</text>
          {p<1&&p>0&&<circle cx={x1+(x2-x1)*p} cy={y} r={9} fill={color}/>}
          {p===1&&<circle cx={x2} cy={y} r={8+5*(1-ease((time-end)/.35))} fill={color}/>}
        </g>;
      })}
    </svg>
  </>;
}

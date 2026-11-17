import React from 'react';
import {ease,clamp} from './primitives';

export type LabelTransitionParameters={from:number;out:number;turn:number;settle:number;returnFrom:number;to:number;soundAt:number;outgoingText?:string;incomingText?:string;fontSize?:number};
export function validateLabelTransition(p:LabelTransitionParameters){
 const times=[p.from,p.out,p.turn,p.settle,p.returnFrom,p.to];
 if(times.some(t=>!Number.isFinite(t))||times.some((t,i)=>i>0&&t<=times[i-1])||!Number.isFinite(p.soundAt)||p.soundAt<p.turn||p.soundAt>p.to||!Number.isFinite(p.fontSize??50)||(p.fontSize??50)<16||(p.fontSize??50)>72)throw Error('Invalid label transition parameters');
}
/** SVG group, centred at the origin; the caller owns its position and scene. */
export function LabelTransition({timeSeconds,parameters:p}:{timeSeconds:number;parameters:LabelTransitionParameters}){
 validateLabelTransition(p);const out=ease((timeSeconds-p.out)/(p.turn-p.out)),reveal=ease((timeSeconds-p.turn)/(p.settle-p.turn)),settle=clamp((timeSeconds-p.turn)/.45),returning=ease((timeSeconds-p.returnFrom)/(p.to-p.returnFrom));
 const scale=(.7+.3*reveal+.12*Math.sin(Math.PI*settle))*(1-returning)+returning;
 const color=(a:number,b:number)=>Math.round(a+(b-a)*returning).toString(16).padStart(2,'0'),ink='#'+color(32,163)+color(123,77)+color(114,60);
 const text=(value:string,size:number,fill:string)=><text x="0" y="13" fontSize={size} textAnchor="middle" fontWeight="700" fill={fill}>{value}</text>;
 return <>
  <g data-label-out opacity={1-out} transform={`translate(0 ${-22*out}) rotate(${-5*out}) scale(1 ${1-.85*out})`}>{text(p.outgoingText??'主播说的原价',32,'#a34d3c')}</g>
  <g data-label-in opacity={reveal} transform={`translate(0 ${18*(1-reveal)}) scale(${scale})`}>
   <rect x="-116" y="-48" width="232" height="96" rx="15" fill="#d7f3e8" stroke="#207b72" strokeWidth="4" opacity={1-returning}/>
   {text(p.incomingText??'现成参照',(p.fontSize??50)+(38-(p.fontSize??50))*returning,ink)}
  </g>
  <g data-label-focus opacity={Math.sin(Math.PI*clamp((timeSeconds-p.turn)/.7))*(1-returning)} stroke="#207b72" strokeWidth="5" strokeLinecap="round"><path d="M-126 -64 l-17 -16 M-136 -28 h-22 M119 -64 l12 -17"/></g>
 </>;
}

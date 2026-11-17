import React from 'react';
import type {Theme} from '../types';
export const clamp = (n:number) => Math.max(0,Math.min(1,n));
export const ease = (n:number) => { const x=clamp(n); return x*x*(3-2*x); };
export const progress = (t:number,start:number,end:number) => ease((t-start)/Math.max(.001,end-start));
export function Node({x,y,label,state,theme}:{x:number;y:number;label:string;state:string;theme:Theme}) {
  return <div style={{position:'absolute',left:x-210,top:y,width:420,textAlign:'center'}}>
    <div data-fit style={{fontSize:38,fontWeight:700,color:theme.colors.text}}>{label}</div>
    <div data-fit style={{marginTop:12,padding:'12px 14px',borderRadius:16,border:`1px solid ${theme.colors.line}`,background:theme.colors.panel,fontSize:24,color:theme.colors.primary}}>{state}</div>
  </div>;
}
export function Caption({text,theme}:{text?:string;theme:Theme}) {
  return <div style={{position:'absolute',left:100,right:100,bottom:58,minHeight:110,display:'flex',alignItems:'center',justifyContent:'center',borderTop:`1px solid ${theme.colors.line}`,paddingTop:20}}>
    <div data-fit data-caption style={{fontSize:37,lineHeight:1.55,textAlign:'center',maxWidth:1640,maxHeight:120,color:theme.colors.text}}>{text}</div>
  </div>;
}
export function Arrow({x1,x2,y,color,amount=1}:{x1:number;x2:number;y:number;color:string;amount?:number}) {
  const end=x1+(x2-x1)*clamp(amount),sign=Math.sign(x2-x1);
  return <g opacity={amount>0?1:0}>
    <line x1={x1} x2={end} y1={y} y2={y} stroke={color} strokeWidth={4} strokeLinecap="round"/>
    <path d={`M${end-sign*14},${y-9} L${end},${y} L${end-sign*14},${y+9}`} stroke={color} strokeWidth={4} fill="none" strokeLinejoin="round"/>
  </g>;
}

import React from 'react';
import type {Segment,Theme} from '../../../src/types';
import {ease} from '../../../src/components/primitives';

export function AnchoringScene({segment,time,theme}:{segment:Segment;time:number;theme:Theme}){
 const c=theme.colors, mode=segment.props.mode, p=ease((time-4)/2.5), appear=(t:number)=>ease((time-t)/.6);
 const panel:React.CSSProperties={position:'absolute',top:285,height:470,borderRadius:30,background:c.panel,border:`2px solid ${c.line}`,padding:44,boxSizing:'border-box'};
 const label:React.CSSProperties={fontSize:27,color:c.muted,letterSpacing:2};
 const x=(n:number)=>270+n*13.8;
 return <>
 {mode==='price'&&<>
  {[0,1].map(i=><div key={i} style={{...panel,left:170+i*820,width:760}}>
   <div style={label}>{i===0?'只看售价':'先看“原价”'}</div>
   <div style={{height:90,marginTop:30,fontSize:49,color:c.accent,opacity:i?appear(3):0,textDecoration:'line-through'}}>¥ 999</div>
   <div style={{fontSize:110,fontWeight:800,color:i?c.accent:c.primary}}>¥ 199</div>
   <div style={{fontSize:32,marginTop:12,opacity:appear(i?7:1)}}>{i?'“好像很划算”':'“值这个价吗？”'}</div>
  </div>)}
 </>}
 {mode==='pull'&&<>
  <div style={{position:'absolute',left:180,top:255,fontSize:35,color:c.muted}}>先出现的数值 → 参照点 → 后续估计</div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <line x1="270" x2="1650" y1="610" y2="610" stroke={c.line} strokeWidth="5"/>
   {[0,20,40,60,80,100].map(n=><g key={n}><line x1={x(n)} x2={x(n)} y1="597" y2="623" stroke={c.muted} strokeWidth="2"/><text x={x(n)} y="668" textAnchor="middle" fill={c.muted} fontSize="26">{n}</text></g>)}
   <line x1={x(80)} x2={x(80)} y1="386" y2="610" stroke={c.accent} strokeWidth="5" strokeDasharray="10 10"/>
   <line x1={x(40+24*p)} x2={x(80)} y1="535" y2="535" stroke={c.accent} strokeWidth="4" opacity=".5"/>
   <circle cx={x(40+24*p)} cy="535" r="23" fill={c.primary}/>
   <text x={x(80)} y="357" textAnchor="middle" fontSize="42" fontWeight="700" fill={c.accent}>锚：80</text>
   <text x={x(40+24*p)} y="475" textAnchor="middle" fontSize="34" fill={c.primary}>估计 {Math.round(40+24*p)}</text>
  </svg>
  <div style={{position:'absolute',top:733,left:180,right:180,textAlign:'center',fontSize:34,opacity:appear(8)}}>估计被拉向锚点 · 示意动画</div>
 </>}
 {mode==='experiment'&&<>
  {[{a:10,b:25,color:c.primary},{a:65,b:45,color:c.accent}].map((o,i)=><div key={i} style={{...panel,left:170+i*820,width:760}}>
   <div style={label}>第 {i+1} 组 · 随机数字</div>
   <div style={{fontSize:85,fontWeight:800,color:o.color,marginTop:12}}>{o.a}<span style={{fontSize:30,color:c.muted,marginLeft:28}}>先比较，再估计</span></div>
   <div style={{fontSize:25,marginTop:15,color:c.muted}}>非洲国家占联合国成员的比例</div>
   <div style={{marginTop:28,height:64,width:Math.max(1,o.b*11*ease((time-8)/1.2)),background:o.color,borderRadius:10}}/>
   <div style={{fontSize:46,color:o.color,opacity:appear(8),marginTop:12}}>中位数 {o.b}%</div>
  </div>)}
 </>}
 {mode==='reset'&&<>
  {['先独立估计','寻找外部证据','再比较报价'].map((s,i)=><div key={s} style={{...panel,left:160+i*550,width:500,opacity:appear(i*4),transform:`translateY(${20*(1-appear(i*4))}px)`}}>
   <div style={{fontSize:70,color:c.primary,fontWeight:800}}>0{i+1}</div>
   <div style={{fontSize:40,fontWeight:700,marginTop:25}}>{s}</div>
   <div style={{fontSize:29,lineHeight:1.8,color:c.muted,marginTop:24}}>{['写下预算和理由\n给自己一个起点','查看同类价格\n补充独立参照','价格是否合理？\n而非折扣有多大'][i].split('\n').map(t=><div key={t}>{t}</div>)}</div>
  </div>)}
 </>}
 {mode==='close'&&<>
  <div style={{position:'absolute',top:305,left:180,right:180,textAlign:'center'}}>
   <div style={{fontSize:32,letterSpacing:5,color:c.primary}}>ANCHORING EFFECT</div>
   <div style={{fontSize:78,fontWeight:800,lineHeight:1.65,marginTop:30}}>如果没见过那个数字，<br/>我会怎么判断？</div>
   <div style={{fontSize:34,color:c.accent,marginTop:35,opacity:appear(3.5)}}>让证据成为参照。</div>
  </div>
 </>}
 </>;
}

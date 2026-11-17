import React from 'react';
import type {Segment,Theme,VisualStyle} from '../../../src/types';
import {ease} from '../../../src/components/primitives';
import {AnchoringScene} from '../../anchoring-effect/scenes/AnchoringScene';

type Props={segment:Segment;time:number;theme:Theme;visual?:VisualStyle|null};
const ink='#25252b';
const groups=[{anchor:10,median:25},{anchor:65,median:45}];

function Wheel({x,y,anchor,time,color,start=.5,stop=3}:{x:number;y:number;anchor:number;time:number;color:string;start?:number;stop?:number}){
  const turn=(1-ease((time-start)/Math.max(.001,stop-start)))*650;
  return <g transform={`translate(${x} ${y})`}>
    <g transform={`rotate(${turn})`}>
      <circle r="99" fill="#fffdf5" stroke={ink} strokeWidth="6"/>
      {Array.from({length:8},(_,i)=>{
        const a=i*Math.PI/4,b=(i+1)*Math.PI/4;
        return <path key={i} d={`M0 0 L${93*Math.cos(a)} ${93*Math.sin(a)} A93 93 0 0 1 ${93*Math.cos(b)} ${93*Math.sin(b)} Z`} fill={i%2?color:'#fffdf5'} stroke={ink} strokeWidth="2"/>;
      })}
    </g>
    <circle r="59" fill="#fffdf5" stroke={ink} strokeWidth="4"/>
    <text y="19" textAnchor="middle" fontSize="54" fontWeight="700" fill={ink}>{anchor}</text>
    <path d="M-14 -117 L14 -117 L0 -92 Z" fill="#ef6953" stroke={ink} strokeWidth="4" strokeLinejoin="round"/>
  </g>;
}

function Person({x,y,color,time,flip=false}:{x:number;y:number;color:string;time:number;flip?:boolean}){
  const tilt=Math.sin(time*2)*(1-ease((time-3)/.6))*3;
  return <g transform={`translate(${x} ${y+tilt}) scale(${flip?-1:1} 1)`} stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-65 112 Q-62 35 0 31 Q62 35 66 112 Z" fill={color}/>
    <path d="M-52 60 L-91 26 L-111 -3 M52 60 L90 38 L104 9" fill="none"/>
    <path d="M-117 -8 L-109 -16 M-111 -3 L-123 -2 M103 9 L113 0" fill="none"/>
    <rect x="-10" y="17" width="20" height="26" rx="7" fill="#f1c4a0"/>
    <ellipse cy="-18" rx="42" ry="49" fill="#f1c4a0"/>
    <path d="M-42 -25 Q-46 -76 0 -76 Q45 -72 43 -24 L28 -45 Q-6 -34 -27 -49 L-32 -20 Z" fill={ink}/>
    <path d="M-15 -18 v5 M15 -18 v5 M-8 6 Q0 12 8 6" fill="none" strokeWidth="4"/>
  </g>;
}

function ComicStudy({time,segment}:Props){
  const ev=segment.events;
  const start=ev.reveal,stop=ev['wheel-stop']??3,compare=ev.compare??4,estimate=ev.estimate??8,settle=ev['estimate-settle']??9.2;
  const reveal=ease((time-start)/.6),result=ease((time-estimate)/Math.max(.001,settle-estimate));
  return <svg width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label="漫画实验室：两组转盘起点10和65，估计中位数25%和45%">
    <defs><pattern id="comic-dots" width="23" height="23" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.5" fill={ink} opacity=".08"/></pattern></defs>
    {groups.map((g,i)=>{
      const x=120+i*900,color=i?'#ed795f':'#45b9ae',paper=i?'#fff0d9':'#e3f4ec';
      return <g key={g.anchor} opacity={reveal} transform={`translate(${x} 293)`}>
        <path d="M12 13 L803 5 L798 502 L7 508 Z" fill={ink}/>
        <path d="M0 0 L790 -7 L785 488 L-5 495 Z" fill={paper} stroke={ink} strokeWidth="6" strokeLinejoin="round"/>
        <path d="M0 0 L790 -7 L785 488 L-5 495 Z" fill="url(#comic-dots)"/>
        <path d="M-5 0 L218 -2 L207 53 L-5 57 Z" fill={color} stroke={ink} strokeWidth="5"/>
        <text x="25" y="37" fontSize="27" fontWeight="700" fill={ink}>第 {i+1} 组</text>
        <text x="650" y="44" textAnchor="middle" fontSize="19" letterSpacing="2" fill={ink}>实验示意</text>
        <text x="168" y="106" textAnchor="middle" fontSize="25" fill={ink}>转盘给出的数字</text>
        <Wheel x={168} y={238} anchor={g.anchor} time={time} color={color} start={start} stop={stop}/>
        <path d="M145 340 L139 394 L196 394 L190 340" fill={color} stroke={ink} strokeWidth="5"/>
        <path d="M120 397 H214" stroke={ink} strokeWidth="6" strokeLinecap="round"/>
        <Person x={393} y={354} color={color} time={time} flip={i===1}/>
        <g opacity={ease((time-compare)/.5)}>
          <path d="M322 108 Q322 89 343 89 H696 Q718 89 718 110 V190 Q718 208 697 208 H456 L414 239 L422 208 H343 Q322 208 322 188 Z" fill="#fffdf5" stroke={ink} strokeWidth="5" strokeLinejoin="round"/>
          <text x="520" y="134" textAnchor="middle" fontSize="24" fontWeight="700" fill={ink}>非洲成员占比，</text>
          <text x="520" y="177" textAnchor="middle" fontSize="24" fill={ink}>比 {g.anchor}% 高还是低？</text>
        </g>
        <g opacity={result} transform={`translate(621 ${335+12*(1-result)})`}>
          <path d="M-102 -76 L-82 -95 L-69 -75 M91 -53 L116 -66 M85 31 L109 42" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round"/>
          <text y="8" textAnchor="middle" fontSize="83" fontWeight="700" fill={ink}>{g.median}%</text>
          <path d="M-103 28 Q0 39 104 26" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"/>
          <text y="80" textAnchor="middle" fontSize="23" fill={ink}>组内估计中位数</text>
        </g>
      </g>;
    })}
  </svg>;
}

function IsometricStudy({time}:Props){
  const result=ease((time-8)/1.2),reveal=ease((time-.5)/.7);
  return <svg width="1920" height="1080" style={{position:'absolute',inset:0}} role="img" aria-label="等距立体展台：相同尺度下的25%和45%估计柱体">
    <defs>
      <radialGradient id="iso-halo"><stop stopColor="#ffffff" stopOpacity=".9"/><stop offset="1" stopColor="#e9e5f7" stopOpacity="0"/></radialGradient>
      <linearGradient id="iso-wheel" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff"/><stop offset="1" stopColor="#e2def1"/></linearGradient>
      <linearGradient id="iso-teal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#50bcb1"/><stop offset="1" stopColor="#248a84"/></linearGradient>
      <linearGradient id="iso-purple" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ac92ed"/><stop offset="1" stopColor="#7957c3"/></linearGradient>
      <filter id="iso-shadow" x="-50%" y="-80%" width="200%" height="260%"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>
    {groups.map((g,i)=>{
      const cx=530+i*850,cy=720,h=g.median*4.5*result;
      const color=i?'#7957c3':'#248a84',side=i?'#63439e':'#1e706b',top=i?'#c3acf2':'#8ed8ce';
      const wx=cx-170,wy=491,bx=cx+133;
      return <g key={g.anchor} opacity={reveal}>
        <ellipse cx={cx} cy="515" rx="385" ry="300" fill="url(#iso-halo)"/>
        <text x={cx} y="287" textAnchor="middle" fill="#5e5677" fontSize="23" letterSpacing="5">GROUP 0{i+1}</text>
        <ellipse cx={cx+15} cy="780" rx="280" ry="36" fill="#bdb3d8" opacity=".5" filter="url(#iso-shadow)"/>
        <path d={`M${cx-340} 700 L${cx+35} 622 L${cx+350} 700 L${cx+350} 745 L${cx-15} 824 L${cx-340} 747 Z`} fill="#c8bfdf"/>
        <path d={`M${cx-15} 781 L${cx+350} 700 V745 L${cx-15} 824 Z`} fill="#b6a9d1"/>
        <path d={`M${cx-340} 700 L${cx+35} 622 L${cx+350} 700 L${cx-15} 781 Z`} fill="#f9f7ff" stroke="#d8d0e9" strokeWidth="2"/>
        <ellipse cx={wx+9} cy="691" rx="115" ry="23" fill="#d5cee5"/>
        <path d={`M${wx-27} 548 L${wx+27} 539 L${wx+42} 677 L${wx-42} 690 Z`} fill="#c5bbdc"/>
        <path d={`M${wx+27} 539 L${wx+43} 534 L${wx+58} 670 L${wx+42} 677 Z`} fill="#aaa0c4"/>
        <g transform={`translate(${wx} ${wy})`}>
          <ellipse cx="14" cy="8" rx="116" ry="126" fill={side}/>
          <ellipse rx="116" ry="126" fill="url(#iso-wheel)" stroke="#ffffff" strokeWidth="3"/>
          <g transform={`rotate(${(1-ease((time-.5)/2.5))*650})`}>
            {Array.from({length:12},(_,n)=>{
              const a=n*Math.PI/6;return <circle key={n} cx={98*Math.cos(a)} cy={107*Math.sin(a)} r={n%3===0?5:3} fill={color} opacity={n%3===0?1:.4}/>;
            })}
          </g>
          <text y="21" textAnchor="middle" fontSize="61" fontWeight="700" fill={color}>{g.anchor}</text>
          <path d="M-12 -133 L12 -133 L0 -111 Z" fill={color}/>
        </g>
        <text x={wx} y="340" textAnchor="middle" fill="#5e5677" fontSize="24">随机起点</text>
        <path d={`M${wx+111} 520 C${cx+3} 520 ${cx-12} 630 ${bx-77} 628`} fill="none" stroke={color} strokeWidth="3" strokeDasharray="7 9" opacity={ease((time-4)/.7)*.65}/>
        <g opacity={result}>
          <ellipse cx={bx+25} cy={cy-4} rx="110" ry="22" fill="#c7bddc" opacity=".45"/>
          <path d={`M${bx-75} ${cy-h} L${bx+75} ${cy-h} L${bx+75} ${cy} L${bx-75} ${cy} Z`} fill={`url(#iso-${i?'purple':'teal'})`}/>
          <path d={`M${bx+75} ${cy-h} L${bx+135} ${cy-h-35} L${bx+135} ${cy-35} L${bx+75} ${cy} Z`} fill={side}/>
          <path d={`M${bx-75} ${cy-h} L${bx-15} ${cy-h-35} L${bx+135} ${cy-h-35} L${bx+75} ${cy-h} Z`} fill={top}/>
          <text x={bx+28} y={cy-h-157} textAnchor="middle" fontSize="23" fill="#5e5677">组内估计中位数</text>
          <text x={bx+28} y={cy-h-56} textAnchor="middle" fontSize="65" fontWeight="700" fill={color}>{g.median}%</text>
        </g>
        <text x={cx} y="815" textAnchor="middle" fontSize="20" fill="#5e5677">先比较，再估计</text>
      </g>;
    })}
  </svg>;
}

export function AnchorStudyScene(props:Props){
  if(props.visual?.id==='comic')return <ComicStudy {...props}/>;
  if(props.visual?.id==='isometric')return <IsometricStudy {...props}/>;
  // Retained A uses exactly the existing scene and layout.
  return <AnchoringScene {...props}/>;
}

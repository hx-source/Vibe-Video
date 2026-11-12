import React from 'react';
import {Img,staticFile} from 'remotion';
import {ease,Arrow} from '../components/primitives';
import type {Segment,Theme} from '../types';
export function CardsScene({segment,time,theme,assets}:{segment:Segment;time:number;theme:Theme;assets:Record<string,string>}) {
  const cards=segment.props.cards??[], width=cards.length===1?1080:cards.length===2?720:500,gap=60,left=(1920-(cards.length*width+(cards.length-1)*gap))/2;
  return <>
    {segment.props.imageAsset&&<Img src={staticFile(assets[segment.props.imageAsset])} style={{position:'absolute',left:1300,top:240,width:400,height:160,objectFit:'contain'}}/>}
    {cards.map((card,i)=>{
      const p=ease((time-segment.events[card.event])/.5);
      return <div key={i} style={{position:'absolute',left:left+i*(width+gap),top:370+24*(1-p),width,height:300,boxSizing:'border-box',padding:'44px 40px',opacity:p,background:theme.colors.panel,border:`1px solid ${theme.colors.line}`,borderRadius:28,boxShadow:'0 16px 40px #00000008'}}>
        <div style={{fontSize:19,color:theme.colors.primary,letterSpacing:3,marginBottom:22}}>0{i+1}</div>
        <div data-fit style={{fontSize:40,fontWeight:700,lineHeight:1.35,maxHeight:110}}>{card.title}</div>
        <div data-fit style={{fontSize:28,color:theme.colors.muted,lineHeight:1.6,marginTop:20,maxHeight:94}}>{card.body}</div>
      </div>;
    })}
    <svg width={1920} height={1080} style={{position:'absolute',inset:0,pointerEvents:'none'}}>{cards.slice(1).map((c,i)=><Arrow key={i} x1={left+(i+1)*width+i*gap+12} x2={left+(i+1)*(width+gap)-12} y={520} color={theme.colors.primary} amount={ease((time-segment.events[c.event])/.5)}/>)}</svg>
  </>;
}

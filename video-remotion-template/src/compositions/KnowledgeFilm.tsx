import React,{useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import type {FilmProps} from '../types';
import {Scene} from '../scenes/registry';
import {Caption,ease} from '../components/primitives';
import {useFonts} from '../components/fonts';
import {AudioTrack} from '../audio/AudioTrack';
export function KnowledgeFilm(props:FilmProps){
  const {data}=props,frame=useCurrentFrame()+data.range.from,{timeline,theme}=data;
  const text=useMemo(()=>JSON.stringify([data.project.title,timeline.segments,timeline.captions,'无配乐预览 知识手记 时间压缩示意 准备中']),[data]);
  useFonts(text);
  const segment=timeline.segments.find(s=>frame>=s.startFrame&&frame<s.endFrame)??timeline.segments.at(-1)!;
  const time=frame/timeline.fps-segment.startSeconds;
  const caption=timeline.captions.find(c=>frame>=c.startFrame&&frame<c.endFrame);
  const opacity=ease(time/.22),visual=data.visual,scale=visual?.fontScale??1;
  if(segment.props.layout==='fullbleed')return <AbsoluteFill style={{background:theme.colors.background,fontFamily:'"Noto Sans SC", sans-serif',color:theme.colors.text,overflow:'hidden'}}>
    <div data-film data-frame={frame} style={{width:1920,height:1080,position:'absolute',left:0,top:0,transform:`scale(${data.project.video.width/1920})`,transformOrigin:'top left'}}>
      <Scene {...{segment,time,theme,assets:data.assets,visual}}/>
      {caption&&segment.props.captionPlacement!=='scene'&&<div data-caption data-fit style={{position:'absolute',left:130,right:130,bottom:65,height:60,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32*scale,letterSpacing:2,color:visual?.colors.text??'#eee4d0',textShadow:!visual||visual.background==='night'?'0 2px 15px #000':undefined}}>{caption.text}</div>}
    </div><AudioTrack {...props}/>
  </AbsoluteFill>;
  return <AbsoluteFill style={{background:theme.colors.background,fontFamily:'"Noto Sans SC", sans-serif',color:theme.colors.text,overflow:'hidden'}}>
    <div data-film data-frame={frame} style={{width:1920,height:1080,position:'absolute',left:0,top:0,transform:`scale(${data.project.video.width/1920})`,transformOrigin:'top left'}}>
      <div data-fit style={{position:'absolute',left:100,top:55,fontSize:20,letterSpacing:2,color:theme.colors.muted}}>KNOWLEDGE NOTES / 思考，快与慢</div>
      <div style={{position:'absolute',right:100,top:55,fontSize:19,color:theme.colors.muted}}>{String(timeline.segments.indexOf(segment)+1).padStart(2,'0')} / {String(timeline.segments.length).padStart(2,'0')}</div>
      <div data-fit style={{position:'absolute',left:100,top:115,right:100,maxHeight:90,fontSize:54*scale,fontWeight:visual?.titleWeight??700,lineHeight:1.4}}>{segment.props.title}</div>
      {data.audio.silent&&<div style={{position:'absolute',right:100,top:205,fontSize:18,color:theme.colors.muted}}>无配乐预览</div>}
      <div style={{position:'absolute',inset:0,opacity}}><Scene {...{segment,time,theme,assets:data.assets,visual}}/></div>
      {segment.props.note&&<div data-fit style={{position:'absolute',left:180,right:180,top:856,maxHeight:50,fontSize:24,textAlign:'center',color:theme.colors.muted}}>{segment.props.note}</div>}
      {segment.props.captionPlacement!=='scene'&&<Caption text={caption?.text} theme={theme}/>}
      <div style={{position:'absolute',bottom:0,left:0,width:1920*(frame+1)/timeline.durationInFrames,height:5,background:theme.colors.primary,opacity:.6}}/>
    </div>
    <AudioTrack {...props}/>
  </AbsoluteFill>;
}

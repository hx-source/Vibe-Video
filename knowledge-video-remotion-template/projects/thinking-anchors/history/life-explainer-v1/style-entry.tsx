import React from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Scene} from '../../src/scenes/registry';
import {Caption,ease} from '../../src/components/primitives';
import type {RenderData} from '../../src/types';

let root:Root;
(window as any).renderFrame=(data:RenderData,frame:number)=>{
  root??=createRoot(document.getElementById('root')!);
  const {timeline,theme,visual}=data,scale=visual?.fontScale??1;
  const segment=timeline.segments.find(s=>frame>=s.startFrame&&frame<s.endFrame)!;
  const time=frame/timeline.fps-segment.startSeconds;
  const caption=timeline.captions.find(c=>frame>=c.startFrame&&frame<c.endFrame);
  flushSync(()=>root.render(<div data-film style={{width:1920,height:1080,position:'relative',background:theme.colors.background,color:theme.colors.text,fontFamily:'"Noto Sans SC", sans-serif',overflow:'hidden'}}>
    <div data-fit style={{position:'absolute',left:100,top:55,fontSize:20,letterSpacing:2,color:theme.colors.muted}}>KNOWLEDGE NOTES / 思考，快与慢</div>
    <div style={{position:'absolute',right:100,top:55,fontSize:19,color:theme.colors.muted}}>{String(timeline.segments.indexOf(segment)+1).padStart(2,'0')} / {String(timeline.segments.length).padStart(2,'0')}</div>
    <div data-fit style={{position:'absolute',left:100,top:115,right:100,maxHeight:90,fontSize:54*scale,fontWeight:visual?.titleWeight??700,lineHeight:1.4}}>{segment.props.title}</div>
    {data.audio.silent&&<div style={{position:'absolute',right:100,top:205,fontSize:18,color:theme.colors.muted}}>无配乐预览</div>}
    <div style={{position:'absolute',inset:0,opacity:ease(time/.22)}}><Scene {...{segment,time,theme,assets:data.assets,visual}}/></div>
    <div data-fit style={{position:'absolute',left:180,right:180,top:856,maxHeight:50,fontSize:24,textAlign:'center',color:theme.colors.muted}}>{segment.props.note}</div>
    <Caption text={caption?.text} theme={theme}/>
    <div style={{position:'absolute',bottom:0,left:0,width:1920*(frame+1)/timeline.durationInFrames,height:5,background:theme.colors.primary,opacity:.6}}/>
  </div>));
};

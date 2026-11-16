import React from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {flushSync} from 'react-dom';
import type {RenderData} from '../../src/types';
import {AnchorEvidenceMotion} from './scenes/AnchorEvidenceMotion';
import {AnchorEvidenceRegroup} from './scenes/AnchorEvidenceRegroup';
import type {RegroupVariant} from './scenes/RegroupStage';
let root:Root;
(window as any).renderRegroupFrame=(data:RenderData,frame:number,variant:RegroupVariant|'original')=>{
 root??=createRoot(document.getElementById('root')!);
 const segment=data.timeline.segments.find(s=>frame>=s.startFrame&&frame<s.endFrame)!;
 if(segment.id!=='evidence')throw Error('Regroup audition covers evidence chapter only');
 const time=frame/data.timeline.fps-segment.startSeconds;
 flushSync(()=>root.render(<div data-film style={{width:1920,height:1080,position:'relative',background:data.theme.colors.background,color:data.theme.colors.text,fontFamily:'"Noto Sans SC", sans-serif',overflow:'hidden'}}>
  {variant==='original'?<AnchorEvidenceMotion {...{segment,time}}/>:<AnchorEvidenceRegroup {...{segment,time,variant}}/>}
 </div>));
};

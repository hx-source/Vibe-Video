import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {AnchorPortraitOpening} from '../portrait-edge-cleanup-v1/Opening';
import {AnchorPortraitMechanism} from '../portrait-edge-cleanup-v1/Mechanism';
import {portraitDecisionScenes} from './Decision';
import data from '../portrait-decision-v1/storyboard.json';
const root=createRoot(document.getElementById('root')!);
const Scene=portraitDecisionScenes[data.sceneType as keyof typeof portraitDecisionScenes];
if(!Scene||data.video.width!==1080||data.video.height!==1920)throw Error('Invalid portrait decision scene');
(window as any).renderPortrait=(frame:number)=>{
 if(!Number.isInteger(frame)||frame<0||frame>=1140)throw Error('Invalid full portrait frame');
 flushSync(()=>root.render(<div style={{width:1080,height:1920,overflow:'hidden',background:'#fff8e9',fontFamily:'"Noto Sans SC",sans-serif'}}>{frame<360?<AnchorPortraitOpening frame={frame}/>:frame<720?<AnchorPortraitMechanism frame={frame-360}/>:<Scene frame={frame-720}/>}</div>));
};

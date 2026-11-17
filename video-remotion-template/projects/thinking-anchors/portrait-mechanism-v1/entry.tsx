import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {AnchorPortraitOpening} from '../portrait-opening-v2/Opening';
import {portraitMechanismScenes} from './Mechanism';
import data from './storyboard.json';
const root=createRoot(document.getElementById('root')!);
const Scene=portraitMechanismScenes[data.sceneType as keyof typeof portraitMechanismScenes];
if(!Scene||data.video.width!==1080||data.video.height!==1920)throw Error('Invalid portrait scene');
(window as any).renderPortrait=(frame:number)=>{
 if(!Number.isInteger(frame)||frame<0||frame>=720)throw Error('Invalid full portrait frame');
 flushSync(()=>root.render(<div style={{width:1080,height:1920,overflow:'hidden',background:'#fff8e9',fontFamily:'"Noto Sans SC",sans-serif'}}>{frame<360?<AnchorPortraitOpening frame={frame}/>:<Scene frame={frame-360}/>}</div>));
};

import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {portraitScenes} from './Opening';
import data from './storyboard.json';

const root=createRoot(document.getElementById('root')!);
const Scene=portraitScenes[data.sceneType as keyof typeof portraitScenes];
if(!Scene||data.video.width!==1080||data.video.height!==1920)throw Error('Unknown native portrait scene');
(window as any).renderPortrait=(frame:number)=>{
 if(!Number.isInteger(frame)||frame<0||frame>=360)throw Error('Invalid portrait frame');
 flushSync(()=>root.render(<div style={{width:1080,height:1920,overflow:'hidden',background:'#fff8e9',fontFamily:'"Noto Sans SC",sans-serif'}}><Scene frame={frame}/></div>));
};

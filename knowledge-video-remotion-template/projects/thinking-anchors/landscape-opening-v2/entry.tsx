import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {openingScenes,validateOpening} from './Opening';
import {AnchorLandscapeFocus,validateLandscapeFocus} from '../landscape-focus-v1/Decision';
import board from './board.json';
validateOpening();validateLandscapeFocus();
const Scene=openingScenes[board.sceneType as keyof typeof openingScenes],root=createRoot(document.getElementById('root')!);
(window as any).renderLandscape=(frame:number)=>{
 if(!Number.isInteger(frame)||frame<0||frame>=1140)throw Error('Full landscape frame outside 0–1139');
 flushSync(()=>root.render(<div style={{width:1920,height:1080,overflow:'hidden',fontFamily:'"Noto Sans SC",sans-serif'}}>{frame<720?<Scene frame={frame}/>:<AnchorLandscapeFocus frame={frame-720}/>}</div>));
};

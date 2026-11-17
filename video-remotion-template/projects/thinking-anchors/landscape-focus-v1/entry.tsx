import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {landscapeFocusScenes,validateLandscapeFocus} from './Decision';
import board from './board.json';
validateLandscapeFocus();
const Scene=landscapeFocusScenes[board.sceneType as keyof typeof landscapeFocusScenes];
const root=createRoot(document.getElementById('root')!);
(window as any).renderLandscape=(frame:number)=>flushSync(()=>root.render(<div style={{width:1920,height:1080,overflow:'hidden',fontFamily:'"Noto Sans SC",sans-serif'}}><Scene frame={frame}/></div>));

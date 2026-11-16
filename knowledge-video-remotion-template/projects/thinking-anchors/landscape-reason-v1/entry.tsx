import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {OpeningChapter} from '../landscape-opening-v9/Opening';
import {AnchorReason} from './Reason';
import {AnchorLandscapeFocus} from '../landscape-final-v1/Decision';
const root=createRoot(document.getElementById('root')!);
(window as any).renderLandscape=(f:number)=>{if(!Number.isInteger(f)||f<0||f>=1440)throw Error('Frame outside0–1439');flushSync(()=>root.render(<div style={{width:1920,height:1080,overflow:'hidden',fontFamily:'"Noto Sans SC",sans-serif'}}>{f<600?<OpeningChapter frame={f}/>:f<1020?<AnchorReason frame={f-600}/>:<AnchorLandscapeFocus frame={f-1020}/>}</div>));};

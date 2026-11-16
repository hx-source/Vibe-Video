import React from 'react';
import {Composition,registerRoot,useCurrentFrame} from 'remotion';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import {OpeningChapter} from '../landscape-opening-v9/Opening';
import {AnchorReason} from './Reason';
const Film=()=>{const f=useCurrentFrame();return <div style={{width:1920,height:1080,fontFamily:'"Noto Sans SC",sans-serif'}}>{f<600?<OpeningChapter frame={f}/>:<AnchorReason frame={f-600}/>}</div>;};
registerRoot(()=> <Composition id="AnchorsFirst34" component={Film} width={1920} height={1080} fps={30} durationInFrames={1020}/>);

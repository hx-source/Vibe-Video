import React from 'react';
import {Composition,registerRoot,useCurrentFrame} from 'remotion';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import {AnchorLandscapeOpening} from './Opening';
import {AnchorLandscapeFocus} from '../landscape-focus-v1/Decision';
const Film=()=>{const f=useCurrentFrame();return <div style={{width:1920,height:1080,fontFamily:'"Noto Sans SC",sans-serif'}}>{f<720?<AnchorLandscapeOpening frame={f}/>:<AnchorLandscapeFocus frame={f-720}/>}</div>;};
registerRoot(()=> <Composition id="AnchorsLandscapeFirst38" component={Film} width={1920} height={1080} fps={30} durationInFrames={1140}/>);

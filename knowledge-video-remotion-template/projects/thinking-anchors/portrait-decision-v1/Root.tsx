import React from 'react';
import {Composition,registerRoot,useCurrentFrame} from 'remotion';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import {AnchorPortraitOpening} from '../portrait-opening-v2/Opening';
import {AnchorPortraitMechanism} from '../portrait-mechanism-v1/Mechanism';
import {AnchorPortraitDecision} from './Decision';
const Film=()=>{const f=useCurrentFrame();return <div style={{width:1080,height:1920,fontFamily:'"Noto Sans SC",sans-serif'}}>{f<360?<AnchorPortraitOpening frame={f}/>:f<720?<AnchorPortraitMechanism frame={f-360}/>:<AnchorPortraitDecision frame={f-720}/>}</div>;};
registerRoot(()=> <Composition id="AnchorsPortraitFirst38" component={Film} width={1080} height={1920} fps={30} durationInFrames={1140}/>);

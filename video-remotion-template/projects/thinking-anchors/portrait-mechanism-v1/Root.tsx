import React from 'react';
import {Composition,registerRoot,useCurrentFrame} from 'remotion';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import {AnchorPortraitOpening} from '../portrait-opening-v2/Opening';
import {AnchorPortraitMechanism} from './Mechanism';
const Film=()=>{const f=useCurrentFrame();return <div style={{width:1080,height:1920,fontFamily:'"Noto Sans SC",sans-serif'}}>{f<360?<AnchorPortraitOpening frame={f}/>:<AnchorPortraitMechanism frame={f-360}/>}</div>;};
registerRoot(()=> <Composition id="AnchorsPortraitFirst24" component={Film} width={1080} height={1920} fps={30} durationInFrames={720}/>);

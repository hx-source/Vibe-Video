import React from 'react';
import {Composition,registerRoot,useCurrentFrame} from 'remotion';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import {AnchorLandscapeFocus} from './Decision';
const Film=()=> <div style={{width:1920,height:1080,fontFamily:'"Noto Sans SC",sans-serif'}}><AnchorLandscapeFocus frame={useCurrentFrame()}/></div>;
registerRoot(()=> <Composition id="AnchorsLandscapeFocus" component={Film} width={1920} height={1080} fps={30} durationInFrames={420}/>);

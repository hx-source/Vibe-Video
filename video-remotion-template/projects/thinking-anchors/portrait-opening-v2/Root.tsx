import React from 'react';
import {Composition,registerRoot,useCurrentFrame} from 'remotion';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import {AnchorPortraitOpening} from './Opening';

const Film=()=> <div style={{width:1080,height:1920,fontFamily:'"Noto Sans SC",sans-serif'}}><AnchorPortraitOpening frame={useCurrentFrame()}/></div>;
// Native portrait composition. Audio is mixed separately by the project renderer.
const Root=()=> <Composition id="AnchorsPortraitOpening" component={Film} width={1080} height={1920} fps={30} durationInFrames={360}/>;
registerRoot(Root);

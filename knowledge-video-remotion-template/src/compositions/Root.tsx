import React from 'react';
import {Composition} from 'remotion';
import {KnowledgeFilm} from './KnowledgeFilm';
import type {RenderData} from '../types';
import {defaultData} from './default';
export const Root=()=>{
  const data=defaultData as RenderData;
  return <Composition id="KnowledgeVideo" component={KnowledgeFilm} width={data.project.video.width} height={data.project.video.height} fps={data.timeline.fps} durationInFrames={data.range.durationInFrames} defaultProps={{data}}
    calculateMetadata={({props})=>({width:props.data.project.video.width,height:props.data.project.video.height,fps:props.data.timeline.fps,durationInFrames:props.data.range.durationInFrames})}/>;
};

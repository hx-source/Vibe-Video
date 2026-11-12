import React from 'react';
import {Html5Audio,staticFile} from 'remotion';
import type {FilmProps} from '../types';
export function AudioTrack({data,variant='A',track='mix'}:FilmProps){
  const source=data.audio.variants.find(v=>v.id===variant)?.tracks[track];
  return source?<Html5Audio src={staticFile(source)} trimBefore={data.range.from}/>:null;
}

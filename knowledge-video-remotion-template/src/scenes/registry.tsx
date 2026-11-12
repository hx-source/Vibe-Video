import React from 'react';
import type {Segment,Theme} from '../types';
import {CardsScene} from './CardsScene';
import {SequenceScene} from './SequenceScene';
import {CycleScene} from './CycleScene';
export function Scene({segment,time,theme,assets}:{segment:Segment;time:number;theme:Theme;assets:Record<string,string>}) {
  switch(segment.sceneType){
    case 'cards': return <CardsScene {...{segment,time,theme,assets}}/>;
    case 'sequence': return <SequenceScene {...{segment,time,theme}}/>;
    case 'cycle': return <CycleScene {...{segment,time,theme}}/>;
    default: throw new Error(`Unknown scene: ${segment.sceneType}`);
  }
}

import React from 'react';
import type {Segment,Theme,VisualStyle} from '../types';
import {CardsScene} from './CardsScene';
import {SequenceScene} from './SequenceScene';
import {CycleScene} from './CycleScene';
import {AnchoringScene} from '../../projects/anchoring-effect/scenes/AnchoringScene';
import {MoonMatchScene} from '../../projects/moon-match-sample/scenes/MoonMatchScene';
import {AnchorStudyScene} from '../../projects/thinking-anchors/scenes/AnchorStudyScene';
import {AnchorLifeScene} from '../../projects/thinking-anchors/scenes/AnchorLifeScene';
import {AnchorUsedEvidence as AnchorEvidenceMotion} from '../../projects/thinking-anchors/scenes/AnchorUsedEvidence';
import {AnchorStoryMotion} from '../../projects/thinking-anchors/scenes/AnchorStoryMotion';
export function Scene({segment,time,theme,assets,visual}:{segment:Segment;time:number;theme:Theme;assets:Record<string,string>;visual?:VisualStyle|null}) {
  switch(segment.sceneType){
    case 'anchor-story-motion': return <AnchorStoryMotion {...{segment,time}}/>;
    case 'anchor-evidence-motion': return <AnchorEvidenceMotion {...{segment,time}}/>;
    case 'anchor-life': return <AnchorLifeScene {...{segment,time}}/>;
    case 'anchor-study': return <AnchorStudyScene {...{segment,time,theme,visual}}/>;
    case 'moon-match': return <MoonMatchScene {...{segment,time,theme,visual}}/>;
    case 'anchoring': return <AnchoringScene {...{segment,time,theme}}/>;
    case 'cards': return <CardsScene {...{segment,time,theme,assets}}/>;
    case 'sequence': return <SequenceScene {...{segment,time,theme}}/>;
    case 'cycle': return <CycleScene {...{segment,time,theme}}/>;
    default: throw new Error(`Unknown scene: ${segment.sceneType}`);
  }
}

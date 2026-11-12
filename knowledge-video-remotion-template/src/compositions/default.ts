import project from '../../templates/starter/project.json';
import storyboard from '../../templates/starter/storyboard.json';
import captions from '../../templates/starter/captions.json';
import theme from '../themes/paper.json';
import {compileTimeline} from '../timeline/compile.mjs';
import type {RenderData} from '../types';
const timeline=compileTimeline(project,storyboard,captions);
export const defaultData={project,timeline,theme,assets:{},audio:{silent:true,variants:[]},range:{from:0,to:timeline.durationInFrames,durationInFrames:timeline.durationInFrames}} as RenderData;

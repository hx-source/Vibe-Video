import React from 'react';
import {AnchorLandscapeOpening} from '../landscape-opening-v6/Opening';
export function OpeningChapter({frame}:{frame:number}){if(!Number.isInteger(frame)||frame<0||frame>=600)throw Error('Chapter frame outside0–599');return <AnchorLandscapeOpening frame={frame}/>;}

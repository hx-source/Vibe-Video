import React from 'react';
import {AnchorReason as PreviousReason} from '../landscape-reason-v1/Reason';
import {RevisedReason} from './ReasonCore';
export function AnchorReason({frame}:{frame:number}){return frame>=60&&frame<105?<RevisedReason frame={frame}/>:<PreviousReason frame={frame}/>;}

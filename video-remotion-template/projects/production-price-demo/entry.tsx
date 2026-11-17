import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {PriceComparison} from '../../src/components/PriceComparison';
import parameters from './parameters.json';
const root=createRoot(document.getElementById('root')!);
(window as any).renderPrice=(frame:number)=>{if(!Number.isInteger(frame)||frame<0||frame>=180)throw Error('Frame outside demo');flushSync(()=>root.render(<PriceComparison timeSeconds={frame/30} parameters={parameters}/>));};

import fs from 'node:fs';
import {editBeats,editorImpact} from './music-edit.mjs';
export function musicReviewHtml(analysis,overrides,fps,context={}){
  const safe=v=>JSON.stringify(v).replaceAll('<','\\u003c');
  const read=name=>fs.readFileSync(new URL(`./music-editor/${name}`,import.meta.url),'utf8');
  return read('index.html').replace('/*STYLE*/',()=>read('style.css')).replace('/*DATA*/',()=>`const analysis=${safe(analysis)},initial=${safe(overrides)},fps=${fps},context=${safe(context)};\n${editBeats.toString()}\n${editorImpact.toString()}`).replace('/*CLIENT*/',()=>read('client.js'));
}

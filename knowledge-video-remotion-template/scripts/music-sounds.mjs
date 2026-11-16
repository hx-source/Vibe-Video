import {soundFeatures} from './music-features.mjs';
export function validateSoundMetadata(sound){
  if(sound===undefined)return;
  if(!sound||typeof sound!=='object'||Array.isArray(sound))throw Error('Invalid sound metadata');
  if(sound.instrument!==undefined&&(typeof sound.instrument!=='string'||!sound.instrument.trim()))throw Error('Sound instrument must be a label');
  for(const field of ['attackSeconds','tailSeconds'])if(sound[field]!==undefined&&(!Number.isFinite(sound[field])||sound[field]<0))throw Error(`Invalid ${field}`);
  if(sound.durationSeconds!==undefined&&(!Number.isFinite(sound.durationSeconds)||sound.durationSeconds<=0))throw Error('Invalid sound durationSeconds');
  for(const field of ['loudnessLufs','truePeakDb'])if(sound[field]!==undefined&&sound[field]!==null&&!Number.isFinite(sound[field]))throw Error(`Invalid ${field}`);
  for(const field of ['tags','roles'])if(sound[field]!==undefined&&(!Array.isArray(sound[field])||sound[field].some(x=>typeof x!=='string')))throw Error(`Invalid sound ${field}`);
  if(sound.pitches!==undefined&&(!Array.isArray(sound.pitches)||sound.pitches.some(n=>!Number.isInteger(n)||n<0||n>127)))throw Error('Sound pitches use MIDI integers 0–127');
}
export function recommendSounds(assets,tonality,options={}){
  const key=tonality?.status==='candidate'?tonality:null,scale=key?(key.mode==='minor'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11]).map(x=>(x+key.root)%12):null;
  return assets.filter(a=>a.type==='audio'&&a.sound).filter(a=>!options.instrument||a.sound.instrument===options.instrument).filter(a=>!options.tag||a.sound.tags?.includes(options.tag)).map(a=>{
    validateSoundMetadata(a.sound);let score=0;const reasons=[];
    if(options.role&&a.sound.roles?.includes(options.role)){score+=2;reasons.push('用途标签匹配');}
    if(options.instrument){score+=2;reasons.push('乐器标签匹配');}
    if(options.tag){score+=1;reasons.push('音色标签匹配');}
    const notes=a.sound.pitches??[];if(scale&&notes.length){const fit=notes.filter(n=>scale.includes(n%12)).length/notes.length;score+=fit;reasons.push(fit===1?'标注音高位于候选音阶内，仍需试听':'部分音高在候选音阶外，需比较试听');}
    else reasons.push('调性或音高不确定，以混合试听判断');
    return {id:a.id,instrument:a.sound.instrument??'未标注',score,reasons,sound:a.sound,source:a.source,license:a.license,status:'candidate'};
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
export {soundFeatures};

// Pure editor operations are also embedded in the offline editor.
export function editBeats(beats,operation,duration,fps=30){
  const next=[...beats],index=operation.index;
  if(['move','remove'].includes(operation.type)&&(!Number.isInteger(index)||index<0||index>=next.length))throw Error('Select a valid beat');
  if(operation.type==='remove')next.splice(index,1);
  else if(operation.type==='move'||operation.type==='add'){
    let time=operation.time;if(operation.snap)time=Math.round(time*fps)/fps;
    if(!Number.isFinite(time)||time<0||time>=duration)throw Error('Beat outside source duration');
    if(operation.type==='move')next[index]=time;else next.push(time);
    next.sort((a,b)=>a-b);
  }else if(operation.type==='shift-range'){
    if(![operation.from,operation.to,operation.offset].every(Number.isFinite)||operation.from<0||operation.to<=operation.from||operation.to>duration)throw Error('Invalid edit range');
    for(let i=0;i<next.length;i++)if(next[i]>=operation.from&&next[i]<operation.to)next[i]+=operation.offset;
  }else if(operation.type==='tempo-range'){
    const {from,to,bpm}=operation;if(![from,to,bpm].every(Number.isFinite)||from<0||to<=from||to>duration||bpm<20||bpm>400)throw Error('Invalid tempo range');
    const region=[];for(let t=from;t<to;t+=60/bpm)region.push(t);return editBeats([...next.filter(t=>t<from||t>=to),...region].sort((a,b)=>a-b),{type:'validate'},duration,fps);
  }else if(operation.type!=='validate')throw Error('Unknown beat operation');
  if(!next.length||next.some((t,i)=>!Number.isFinite(t)||t<0||t>=duration||(i&&t-next[i-1]<.001)))throw Error('Beats overlap or leave source range');
  return next;
}
export function editorImpact(before,after,actions,music,fps){
  return actions.map(a=>{
    const old=before[a.beat],next=after[a.beat];const map=t=>t===undefined?null:Math.round((music.at+(t-music.sourceIn)/music.speed)*fps);
    return {event:a.event,segment:a.event.split('.')[0],soundId:a.soundId??null,beforeFrame:map(old),afterFrame:map(next),changed:map(old)!==map(next),outsideMusic:next===undefined||next<music.sourceIn||next>=music.sourceOut};
  }).filter(a=>a.changed||a.outsideMusic);
}

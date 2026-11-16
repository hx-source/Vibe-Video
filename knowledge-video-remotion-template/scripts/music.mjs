// Constant-tempo candidate detection. Downbeats are hypotheses, never listening approval.
import {createHash} from 'node:crypto';
export function analyzeSamples(samples,rate=8000){
  if(samples.length<rate*3||!samples.every(Number.isFinite))throw Error('Need at least three seconds of finite samples');
  const hop=Math.round(rate/100),energy=[],onsets=[];let peak=0,sum=0;
  for(let i=0;i<samples.length;i++){peak=Math.max(peak,Math.abs(samples[i]));sum+=samples[i]**2;}
  for(let i=0;i+hop<=samples.length;i+=hop){let s=0;for(let j=0;j<hop;j++)s+=samples[i+j]**2;energy.push(Math.sqrt(s/hop));}
  for(let i=0;i<energy.length;i++)onsets.push(Math.max(0,energy[i]-(energy[i-1]??0)));
  const strength=onsets.reduce((a,b)=>a+b,0);if(peak<1e-6||strength<1e-5)throw Error('No usable rhythmic transients; provide manual beat markers');
  const scores=[];
  for(let bpm=60;bpm<=180;bpm+=.25){const lag=6000/bpm;let s=0,norm=0;for(let i=Math.ceil(lag);i<onsets.length;i++){const j=i-lag,k=Math.floor(j),v=onsets[k]*(1-j+k)+(onsets[k+1]??0)*(j-k);s+=onsets[i]*v;norm+=onsets[i]**2;}scores.push({bpm,score:norm?s/norm:0});}
  scores.sort((a,b)=>b.score-a.score);
  // A bare pulse train is metrically ambiguous. Prefer a common tempo only among near ties.
  const best=scores.filter(x=>x.score>=scores[0].score*.98).sort((a,b)=>Math.abs(a.bpm-120)-Math.abs(b.bpm-120)||b.score-a.score)[0],period=60/best.bpm;
  let phase=0,phaseScore=-1;
  for(let offset=0;offset<period;offset+=.01){let s=0;for(let t=offset;t<samples.length/rate;t+=period){const i=Math.round(t*100);s+=Math.max(...onsets.slice(Math.max(0,i-1),i+2),0);}if(s>phaseScore){phaseScore=s;phase=offset;}}
  const beats=[];for(let t=phase;t<samples.length/rate;t+=period)beats.push(Number(t.toFixed(6)));
  const accents=Array.from({length:4},(_,p)=>beats.reduce((s,t,i)=>s+(i%4===p?(onsets[Math.round(t*100)]??0):0),0));
  const downbeatPhase=accents.indexOf(Math.max(...accents));
  return {duration:samples.length/rate,peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(sum/samples.length),bpm:best.bpm,confidence:Math.min(1,Math.max(0,best.score)),tempoCandidates:scores.filter((x,i,a)=>a.slice(0,i).every(y=>Math.abs(x.bpm-y.bpm)>3)).slice(0,5),beats,beatsPerBar:4,downbeatPhase,energy:energy.filter((_,i)=>i%50===0).map((rms,i)=>({at:i*.5,rms})),warnings:['Constant-tempo estimate; verify drift, half/double tempo and meter by listening.','4/4 downbeats are accent-based candidates, not detected musical meter.'],reviewStatus:'needs-listening'};
}
export const fingerprint=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beatGrid(analysis,overrides={}){
  if(overrides.sections!==undefined&&(!Array.isArray(overrides.sections)||overrides.sections.some(s=>!s||typeof s.label!=='string'||!s.label.trim()||!Number.isFinite(s.from)||!Number.isFinite(s.to)||s.from<0||s.to<=s.from||s.to>analysis.duration)))throw Error('Invalid music sections');
  const duration=analysis.duration,bpm=overrides.bpm??analysis.bpm,meter=overrides.beatsPerBar??analysis.beatsPerBar,phase=overrides.downbeatPhase??analysis.downbeatPhase;
  if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(bpm)||bpm<20||bpm>400||!Number.isInteger(meter)||meter<1||meter>16||!Number.isInteger(phase)||phase<0||phase>=meter)throw Error('Invalid beat grid');
  let beats=overrides.beats??analysis.beats;
  if(overrides.beats===undefined&&(overrides.bpm!==undefined||overrides.firstBeat!==undefined)){const first=overrides.firstBeat??analysis.beats[0];if(!Number.isFinite(first)||first<0||first>=duration)throw Error('Invalid firstBeat');beats=[];for(let t=first;t<duration;t+=60/bpm)beats.push(t);}
  if(!Array.isArray(beats)||!beats.length||beats.some((t,i)=>!Number.isFinite(t)||t<0||t>=duration||(i&&t<=beats[i-1])))throw Error('Beats must increase within source duration');
  return {bpm,beats:beats.map((sourceTime,index)=>({index,sourceTime,downbeat:index%meter===phase})),revision:fingerprint({source:analysis.source,beats,meter,phase})};
}
export function applyMusicTiming(board,sync,grid,fps){
  const result=structuredClone(board);let start=0;const seen=new Set();
  if(sync.schemaVersion!==1||!Array.isArray(sync.actions))throw Error('Invalid music-sync schema');
  if(sync.requiredEvents!==undefined&&(!Array.isArray(sync.requiredEvents)||sync.requiredEvents.some(e=>typeof e!=='string'||!sync.actions.some(a=>a.event===e&&a.key!==false))))throw Error('Required key event missing from music actions');
  const affected=sync.actions.filter(a=>a.revision!==grid.revision).map(a=>a.event);
  if(affected.length)throw Error(`Music revision changed: review ${affected.join(', ')} before updating revisions`);
  const {sourceIn,sourceOut,at,speed}=sync.music;
  if(![sourceIn,sourceOut,at,speed].every(Number.isFinite)||sourceIn<0||sourceOut<=sourceIn||at<0||speed<.5||speed>2)throw Error('Invalid music mapping');
  for(const action of sync.actions){
    if(seen.has(action.event)||!['start','impact','settle'].includes(action.landmark))throw Error('Duplicate event or invalid landmark');seen.add(action.event);
    if(action.revision!==grid.revision)throw Error(`Music revision changed: review ${action.event} before updating its revision`);
    const beat=grid.beats[action.beat];if(!beat||!Number.isInteger(action.beat)||beat.sourceTime<sourceIn||beat.sourceTime>=sourceOut)throw Error(`Beat outside music range: ${action.event}`);
    const target=Math.round((at+(beat.sourceTime-sourceIn)/speed)*fps)/fps;
    let found=false;start=0;
    for(const segment of result.segments){const prefix=segment.id+'.';if(action.event.startsWith(prefix)){const key=action.event.slice(prefix.length);if(!Object.hasOwn(segment.events,key))throw Error(`Unknown event ${action.event}`);const local=target-start;if(local<0||local>=segment.durationSeconds)throw Error(`Aligned event outside segment: ${action.event}`);segment.events[key]=local;found=true;break;}start+=segment.durationSeconds;}
    if(!found)throw Error(`Unknown event ${action.event}`);
  }
  return result;
}
export function checkMusicSync(sync,timeline,audio,grid){
  const issues=[];const music=audio.clips.find(c=>c.id===sync.music.clipId&&c.role==='music');
  if(!music||['sourceIn','sourceOut','at','speed'].some(k=>Math.abs(music[k]-sync.music[k])>1e-7))issues.push({code:'music-mapping-mismatch'});
  for(const action of sync.actions){
    const time=timeline.events[action.event];const beat=grid.beats[action.beat];const target=sync.music.at+(beat.sourceTime-sync.music.sourceIn)/sync.music.speed;
    if(Math.abs(time-target)>0.5/timeline.fps+1e-7)issues.push({code:'off-beat',event:action.event});
    if(action.key!==false){const effect=[...audio.clips,...audio.cues].find(c=>c.id===action.soundId&&c.role!=='music');const hit=action.soundOffset??0;
      if(!effect)issues.push({code:'missing-effect',event:action.event});
      else if(!Number.isFinite(hit)||hit<0||hit>=effect.duration||Math.abs(effect.at+hit-time)>0.5/timeline.fps+1e-7)issues.push({code:'effect-misaligned',event:action.event});}
  }
  return {revision:grid.revision,issues,reviewStatus:'needs-listening'};
}

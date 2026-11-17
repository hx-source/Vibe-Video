// Shared by browser preview, validation and audio compilation.
export function eventTime(value,config) {
  if(typeof value==='number'&&Number.isFinite(value))return value;
  if(value&&typeof value==='object'&&typeof value.event==='string') {
    const base=config.timeline.events?.[value.event],offset=value.offset??0;
    if(!Number.isFinite(base))throw Error(`Unknown content event: ${value.event}`);
    if(!Number.isFinite(offset))throw Error('Event offset must be finite');
    return base+offset;
  }
  throw Error('Time must be a finite number or {event, offset}');
}
export function resolveCaptions(captions,config) {
  return captions.map(s=>({...s,start:eventTime(s.start,config),end:eventTime(s.end,config)}));
}

export function compileAudioPlan(plan,config) {
  const total=config.video.duration;
  if(plan.schemaVersion!==1||plan.sampleRate!==44100||!Number.isFinite(plan.masterGain)||plan.masterGain<0)throw Error('Invalid audio plan header');
  const nonnegative=(v,name)=>{if(!Number.isFinite(v)||v<0)throw Error(`Invalid ${name}`);return v;};
  const span=(at,length,name)=>{if(at<0||!Number.isFinite(at)||length<=0||!Number.isFinite(length)||at+length>total+1e-7)throw Error(`${name} falls outside content duration`);};
  const ids=new Set();
  function id(value){if(typeof value!=='string'||!value||ids.has(value))throw Error(`Missing or duplicate audio id: ${value}`);ids.add(value);return value;}
  const clips=(plan.clips||[]).map(p=>{
    id(p.id);const at=eventTime(p.at,config),speed=p.speed??1;
    if(!Number.isFinite(speed)||speed<.5||speed>2)throw Error('Clip speed must be 0.5–2');
    if(typeof p.source!=='string'||!p.source)throw Error('Clip source required');
    nonnegative(p.sourceIn,'sourceIn');nonnegative(p.sourceOut,'sourceOut');
    const duration=(p.sourceOut-p.sourceIn)/speed;span(at,duration,p.id);
    const gain=nonnegative(p.gain??1,'clip gain'),fadeIn=nonnegative(p.fadeIn??0,'fadeIn'),fadeOut=nonnegative(p.fadeOut??0,'fadeOut');
    if(fadeIn+fadeOut>duration+1e-7)throw Error('Clip fades exceed clip duration');
    const envelope=(p.envelope||[]).map(k=>({at:nonnegative(k.at,'envelope time'),gain:nonnegative(k.gain,'envelope gain')}));
    if(envelope.some((k,i)=>k.at>duration+1e-7||(i&&k.at<=envelope[i-1].at)))throw Error('Envelope points must be ordered inside clip duration');
    return {...p,at,speed,duration,gain,fadeIn,fadeOut,envelope,maxTailPadding:nonnegative(p.maxTailPadding??0,'maxTailPadding')};
  });
  const cues=(plan.cues||[]).map(p=>({...p}));
  for(const rhythm of plan.rhythms||[]) {
    id(rhythm.id);const at=eventTime(rhythm.at,config);
    if(!Number.isFinite(rhythm.bpm)||rhythm.bpm<20||rhythm.bpm>300||!Number.isInteger(rhythm.beats)||rhythm.beats<1||rhythm.beats>10000)throw Error('Invalid rhythm');
    const every=rhythm.accentEvery??4;if(!Number.isInteger(every)||every<1)throw Error('Invalid accentEvery');
    for(let i=0;i<rhythm.beats;i++)cues.push({id:`${rhythm.id}:${i}`,at:at+i*60/rhythm.bpm,kind:'kick',duration:rhythm.hitDuration??.18,gain:i%every===0?(rhythm.accentGain??.12):(rhythm.gain??.05),frequency:rhythm.frequency??70});
  }
  const resolved=cues.map(p=>{
    id(p.id);const at=eventTime(p.at,config);span(at,p.duration,p.id);
    if(!['tone','kick'].includes(p.kind))throw Error('Cue kind must be tone or kick');
    const gain=nonnegative(p.gain,'cue gain'),frequency=p.frequency??440;
    if(!Number.isFinite(frequency)||frequency<=0||frequency>=22050)throw Error('Invalid cue frequency');
    return {...p,at,gain,frequency};
  });
  return {schemaVersion:1,duration:total,sampleRate:plan.sampleRate,masterGain:plan.masterGain,clips,cues:resolved};
}

export function envelopeGain(points,t) {
  if(!points.length)return 1;
  if(t<=points[0].at)return points[0].gain;
  for(let i=1;i<points.length;i++)if(t<=points[i].at){const a=points[i-1],b=points[i];return a.gain+(b.gain-a.gain)*(t-a.at)/(b.at-a.at);}
  return points.at(-1).gain;
}

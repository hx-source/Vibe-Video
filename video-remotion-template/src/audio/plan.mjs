import {compileAudioPlan as compileV1,eventTime} from './content.mjs';

export const AUDIO_ROLES=['music','start','end','transition','process','accent'];
const finite=(v,name,min=0,max=Infinity)=>{if(!Number.isFinite(v)||v<min||v>max)throw Error(`Invalid ${name}`);return v;};
const text=v=>typeof v==='string'&&v.trim().length>0;

// Roles describe intent, not sound identity. Every event may select a different asset.
export function compileAudioPlan(plan,config) {
  if(plan.schemaVersion===1)return compileV1(plan,config);
  if(plan.schemaVersion!==2)throw Error('Unsupported audio plan schemaVersion');
  const total=config.video.duration,warnings=[],disabled=[],ids=new Set();
  const buses=Object.fromEntries(AUDIO_ROLES.map(role=>[role,1]));
  for(const [role,gain] of Object.entries(plan.buses||{})){
    if(!AUDIO_ROLES.includes(role))throw Error(`Unknown audio bus: ${role}`);
    buses[role]=finite(gain,`bus ${role}`,0,4);
  }
  const policy={maxConcurrentEffects:2,maxProcessSeconds:1.5,...plan.reviewPolicy};
  if(!Number.isInteger(policy.maxConcurrentEffects)||policy.maxConcurrentEffects<1)throw Error('Invalid maxConcurrentEffects');
  finite(policy.maxProcessSeconds,'maxProcessSeconds',.01);
  function prepare(items){
    if(!Array.isArray(items))throw Error('Audio items must be arrays');
    return items.filter(item=>{
      if(!text(item.id)||ids.has(item.id))throw Error(`Missing or duplicate audio id: ${item.id}`);ids.add(item.id);
      if(!AUDIO_ROLES.includes(item.role))throw Error(`Unknown audio role: ${item.role}`);
      if(item.enabled!==undefined&&typeof item.enabled!=='boolean')throw Error('enabled must be boolean');
      const enabled=item.enabled??(item.role!=='process');
      if(!enabled){disabled.push({id:item.id,role:item.role,reason:item.role==='process'?'Process sound requires explicit enabled: true':'Disabled by project'});return false;}
      if(item.role!=='music'&&!text(item.purpose))throw Error(`Audio ${item.id} requires a content purpose`);
      if(item.role!=='music'&&!text(item.musicFit))warnings.push({code:'music-fit-unreviewed',id:item.id,message:'Record why this sound fits the music, then listen to the mixture.'});
      return true;
    });
  }
  const clips=prepare(plan.clips||[]),cues=prepare(plan.cues||[]),rhythms=prepare(plan.rhythms||[]);
  const base=compileV1({...plan,schemaVersion:1,clips,cues,rhythms},config);
  const source=new Map([...clips,...cues].map(x=>[x.id,x]));
  base.cues=base.cues.map(c=>{
    const original=source.get(c.id)||rhythms.find(r=>c.id.startsWith(r.id+':'));
    return {...c,role:original.role,purpose:original.purpose,musicFit:original.musicFit};
  });
  const ducks=(plan.ducking||[]).map(d=>{
    if(!text(d.id)||ids.has(d.id))throw Error(`Missing or duplicate ducking id: ${d.id}`);ids.add(d.id);
    const at=eventTime(d.at,config),attack=finite(d.attack??.08,'duck attack',.001),hold=finite(d.hold??.15,'duck hold'),release=finite(d.release??.3,'duck release',.001),gain=finite(d.gain??.7,'duck gain',0,1);
    if(at<0||at+hold+release>total+1e-7)throw Error(`Ducking ${d.id} falls outside content duration`);
    return {...d,at,attack,hold,release,gain};
  });
  const effects=[...base.clips,...base.cues].filter(c=>c.role!=='music');
  for(const c of effects){
    if(c.role==='process'&&c.duration>policy.maxProcessSeconds)warnings.push({code:'long-process',id:c.id,message:'Long process sound: check whether it competes with the music or adds useful information.'});
    if(['start','end','transition'].includes(c.role)&&c.duration>.8)warnings.push({code:'long-event',id:c.id,message:'Long event sound: review its tail against the next action.'});
  }
  const boundaries=effects.flatMap(c=>[{at:c.at,delta:1},{at:c.at+c.duration,delta:-1}]).sort((a,b)=>a.at-b.at||a.delta-b.delta);
  let active=0,maxActive=0;for(const b of boundaries){active+=b.delta;maxActive=Math.max(maxActive,active);}
  if(maxActive>policy.maxConcurrentEffects)warnings.push({code:'dense-effects',message:`Up to ${maxActive} effects overlap; review masking and attention.`});
  const music=base.clips.filter(c=>c.role==='music').sort((a,b)=>a.at-b.at);
  if(music.some(c=>c.speed!==1))warnings.push({code:'music-tempo',message:'Music tempo has been changed; listen for phrase and rhythm continuity.'});
  if(music.length>1)warnings.push({code:'music-edits',message:'Multiple music segments: review joins, phrase boundaries and continuity.'});
  return {...base,schemaVersion:2,buses,ducking:ducks,reviewPolicy:policy,warnings,disabled,maxConcurrentEffects:maxActive};
}

export function musicDuckGain(ducks,t){
  let result=1;
  for(const d of ducks||[]){
    let gain=1;
    if(t>=d.at-d.attack&&t<d.at)gain=1+(d.gain-1)*(t-d.at+d.attack)/d.attack;
    else if(t>=d.at&&t<d.at+d.hold)gain=d.gain;
    else if(t>=d.at+d.hold&&t<d.at+d.hold+d.release)gain=d.gain+(1-d.gain)*(t-d.at-d.hold)/d.release;
    result=Math.min(result,gain);
  }
  return result;
}

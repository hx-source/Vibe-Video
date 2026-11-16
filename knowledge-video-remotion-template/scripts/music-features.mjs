// Local rhythm, structural and tonal hypotheses. Scores express evidence, not approval.
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function rhythmFeatures(samples,rate,reference){
  const hop=Math.round(rate/100),env=[],onset=[];
  for(let i=0;i+hop<=samples.length;i+=hop){let e=0;for(let j=0;j<hop;j++)e+=samples[i+j]**2;env.push(Math.sqrt(e/hop));}
  for(let i=0;i<env.length;i++)onset.push(Math.max(0,env[i]-(env[i-1]??0)));
  const threshold=Math.max(...onset)*.045,peaks=[];
  for(let i=1;i<onset.length-1;i++)if(onset[i]>threshold&&onset[i]>=onset[i-1]&&onset[i]>onset[i+1])peaks.push({time:i/100,strength:onset[i]});
  const localTempo=[];
  for(let start=0;start<reference.duration;start+=3){
    const from=Math.max(0,Math.floor((start-1.5)*100)),to=Math.min(onset.length,from+600),scores=[];
    for(let bpm=50;bpm<=210;bpm+=.5){const lag=6000/bpm;let s=0,n=0;for(let i=from+Math.ceil(lag);i<to;i++){const j=i-lag,k=Math.floor(j);s+=onset[i]*((onset[k]??0)*(1-j+k)+(onset[k+1]??0)*(j-k));n+=onset[i]**2;}scores.push({bpm,score:n?s/n:0});}
    scores.sort((a,b)=>b.score-a.score);const previous=localTempo.at(-1)?.bpm??reference.bpm;
    const near=scores.filter(s=>s.score>=scores[0].score*.9).sort((a,b)=>Math.abs(Math.log(a.bpm/previous))-Math.abs(Math.log(b.bpm/previous)))[0];
    const evidence=peaks.filter(p=>p.time>=from/100&&p.time<to/100),bpm=near?.bpm??previous;
    localTempo.push({from:start,to:Math.min(reference.duration,start+3),bpm,confidence:clamp(near?.score??0,0,1),status:evidence.length<3?'weak':(near?.score??0)<.22?'uncertain':'candidate'});
  }
  const adaptive=[];let t=reference.beats[0]??0,guard=0;
  while(t<reference.duration&&guard++<5000){
    const region=localTempo.find(w=>t>=w.from&&t<w.to)??localTempo.at(-1),period=60/region.bpm;
    const candidates=peaks.filter(p=>Math.abs(p.time-t)<period*.28),max=Math.max(...candidates.map(p=>p.strength),1e-9);
    candidates.sort((a,b)=>(b.strength/max-Math.abs(b.time-t)/period)-(a.strength/max-Math.abs(a.time-t)/period));
    // Reacquire a transient after a pause instead of inventing beats through silence.
    const nextPeak=peaks.find(p=>p.time>t+.1);
    const selected=candidates[0]??(nextPeak&&nextPeak.time-t>period*.6?nextPeak:null),at=selected?.time??t;
    if(!adaptive.length||at-adaptive.at(-1)>.15)adaptive.push(Number(at.toFixed(6)));
    t=Math.max(t+.15,at+period);
  }
  const drift=localTempo.map(w=>{const inWindow=reference.beats.filter(t=>t>=w.from&&t<w.to);const residuals=inWindow.map(t=>{const p=peaks.filter(p=>Math.abs(p.time-t)<.4).sort((a,b)=>Math.abs(a.time-t)-Math.abs(b.time-t))[0];return p?Math.abs(p.time-t):null;}).filter(x=>x!==null);return {...w,meanDriftSeconds:residuals.length?mean(residuals):null,requiresReview:w.status!=='candidate'||mean(residuals)>.04};});
  const maxEnv=Math.max(...env),pauses=[];let quiet=null;
  for(let i=0;i<=env.length;i++){const low=i<env.length&&env[i]<maxEnv*.035;if(low&&quiet===null)quiet=i/100;if(!low&&quiet!==null){if(i/100-quiet>=Math.max(.8,60/reference.bpm*1.8))pauses.push({from:quiet,to:i/100,type:'pause',confidence:.7});quiet=null;}}
  const boundaries=[{at:0,type:'start',confidence:1}];
  for(let i=100;i<env.length-100;i+=25){const before=mean(env.slice(i-100,i)),after=mean(env.slice(i,i+100)),ratio=Math.abs(after-before)/Math.max(before,after,1e-8);if(ratio>.48&&(i/100-boundaries.at(-1).at)>1.5)boundaries.push({at:i/100,type:after>before?'energy-rise':'energy-fall',confidence:ratio});}
  for(const p of pauses)boundaries.push({at:p.to,type:'resume',confidence:p.confidence});
  boundaries.push({at:reference.duration,type:'end',confidence:1});boundaries.sort((a,b)=>a.at-b.at);
  const sections=boundaries.slice(0,-1).filter((b,i)=>boundaries[i+1].at>b.at).map((b,i)=>({id:`section-${i+1}`,from:b.at,to:boundaries[boundaries.indexOf(b)+1].at,label:b.type,confidence:b.confidence,status:'candidate'}));
  // Repetition is based on normalized energy contours, not semantic phrase recognition.
  const repeats=[];for(let a=0;a+400<env.length;a+=200){const x=Array.from({length:16},(_,i)=>mean(env.slice(a+i*25,a+(i+1)*25))),mx=mean(x),nx=Math.sqrt(x.reduce((s,v)=>s+(v-mx)**2,0));if(nx<.01)continue;for(let b=a+400;b+400<env.length;b+=200){const y=Array.from({length:16},(_,i)=>mean(env.slice(b+i*25,b+(i+1)*25))),my=mean(y),ny=Math.sqrt(y.reduce((s,v)=>s+(v-my)**2,0));const corr=x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0)/(nx*ny||1);if(corr>.94)repeats.push({from:a/100,similarTo:b/100,duration:4,confidence:corr});if(repeats.length>=24)break;}if(repeats.length>=24)break;}
  const meterCandidates=[3,4].map(meter=>{const accents=Array.from({length:meter},(_,p)=>adaptive.reduce((s,t,i)=>s+(i%meter===p?(onset[Math.round(t*100)]??0):0),0));return {beatsPerBar:meter,downbeatPhase:accents.indexOf(Math.max(...accents)),contrast:(Math.max(...accents)-Math.min(...accents))/(mean(accents)||1),status:'candidate'};}).sort((a,b)=>b.contrast-a.contrast);
  return {localTempo,drift,adaptiveBeats:adaptive,pauses,sections,repeats,meterCandidates,waveform:env.filter((_,i)=>i%5===0).map((amplitude,i)=>({at:i*.05,amplitude}))};
}

const noteNames=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function spectralPower(samples,start,rate,midi,n=2048){const f=440*2**((midi-69)/12),c=2*Math.cos(2*Math.PI*f/rate);let q0=0,q1=0,q2=0;for(let j=0;j<n;j++){const x=(samples[start+j]??0)*(.5-.5*Math.cos(2*Math.PI*j/(n-1)));q0=x+c*q1-q2;q2=q1;q1=q0;}return Math.max(0,q1*q1+q2*q2-c*q1*q2);}
const profiles={major:[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],minor:[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17]};
function keyEstimate(chroma){
  const sum=chroma.reduce((a,b)=>a+b,0),cm=mean(chroma),norm=Math.sqrt(chroma.reduce((s,v)=>s+(v-cm)**2,0)),scores=[];
  for(const [mode,profile] of Object.entries(profiles))for(let root=0;root<12;root++){const pm=mean(profile),pn=Math.sqrt(profile.reduce((s,v)=>s+(v-pm)**2,0));const score=chroma.reduce((s,v,i)=>s+(v-cm)*(profile[(i-root+12)%12]-pm),0)/(norm*pn||1);scores.push({root,tonic:noteNames[root],mode,score});}
  scores.sort((a,b)=>b.score-a.score);const gap=scores[0].score-scores[1].score,confidence=clamp(gap*4,0,1),status=sum<1e-5||norm/(sum||1)<.09||gap<.055?'uncertain':'candidate';
  return {status,confidence,...(status==='candidate'?{tonic:scores[0].tonic,root:scores[0].root,mode:scores[0].mode}:{}),candidates:scores.slice(0,3),chroma:chroma.map((v,i)=>({note:noteNames[i],weight:sum?v/sum:0}))};
}
export function tonalFeatures(samples,rate){
  const windows=[],total=Array(12).fill(0);
  for(let from=0;from<samples.length/rate;from+=8){const chroma=Array(12).fill(0);for(let t=from;t<Math.min(from+8,samples.length/rate);t+=.5)for(let midi=48;midi<=83;midi++)chroma[midi%12]+=spectralPower(samples,Math.round(t*rate),rate,midi);for(let i=0;i<12;i++)total[i]+=chroma[i];windows.push({from,to:Math.min(from+8,samples.length/rate),...keyEstimate(chroma)});}
  return {overall:keyEstimate(total),windows,method:'windowed-pitch-class-profile-v1',warning:'Tonal hypotheses only; percussion, chords and modulation can make estimates ambiguous.'};
}
export function soundFeatures(samples,rate){
  let peak=0,peakIndex=0;for(let i=0;i<samples.length;i++)if(Math.abs(samples[i])>peak){peak=Math.abs(samples[i]);peakIndex=i;}const threshold=peak*.08;let attack=null,last=0;
  for(let i=0;i<samples.length;i++)if(Math.abs(samples[i])>threshold){if(attack===null)attack=i/rate;last=i/rate;}
  attack??=0;
  const duration=samples.length/rate,from=Math.round(Math.min(attack+.04,duration/2)*rate),scores=[];
  for(let midi=36;midi<=96;midi++)scores.push({midi,power:spectralPower(samples,from,rate,midi)});scores.sort((a,b)=>b.power-a.power);
  const ratio=scores[0].power/(scores.reduce((s,x)=>s+x.power,0)||1);
  return {duration,attackSeconds:attack,tailSeconds:Math.max(0,last-peakIndex/rate),trailingSilenceSeconds:Math.max(0,duration-last),pitch:ratio>.2?{midi:scores[0].midi,note:noteNames[scores[0].midi%12],status:'candidate'}:{status:'uncertain'},instrument:{status:'requires-label'},reviewStatus:'needs-listening'};
}

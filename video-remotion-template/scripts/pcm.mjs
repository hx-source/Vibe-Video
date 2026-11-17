// Deterministic 44.1 kHz stereo PCM helpers shared by arrangement and review exports.
export function pcmWave(samples,rate=44100,gain=1){
  const pcm=Buffer.alloc(samples.length*2);let peak=0,clipped=0,sum=0;
  for(let i=0;i<samples.length;i++){
    const value=samples[i]*gain;
    if(!Number.isFinite(value))throw Error('Non-finite audio sample');
    peak=Math.max(peak,Math.abs(value));sum+=value*value;if(Math.abs(value)>1)clipped++;
    pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value))*32767),i*2);
  }
  if(clipped)throw Error(`Audio arrangement clips ${clipped} samples; reduce track/cue/master gain`);
  const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*4,28);h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);
  return {buffer:Buffer.concat([h,pcm]),peakDb:peak?20*Math.log10(peak):null,rmsDb:sum?10*Math.log10(sum/samples.length):null,clippedSamples:clipped};
}

export function waveSlice(bytes,from,to,rate=44100){
  const start=Math.round(from*rate)*4,end=Math.round(to*rate)*4;
  const data=bytes.subarray(44+start,44+end),h=Buffer.from(bytes.subarray(0,44));
  h.writeUInt32LE(36+data.length,4);h.writeUInt32LE(data.length,40);
  return Buffer.concat([h,data]);
}

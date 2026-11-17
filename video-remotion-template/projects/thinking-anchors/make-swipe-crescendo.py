"""A three-second, single-source friction gesture: soft entry, gradual weight,
then a rounded release. No additional taps, notes, brush repeats or room tail.
"""
import pathlib,json,wave,hashlib
import numpy as np
from scipy.signal import welch
from scipy.ndimage import gaussian_filter1d

project=pathlib.Path(__file__).resolve().parent;assets=project/'assets';rate=44100
source=assets/'sound-palettes/group-down-dry-v1.wav'
name='paper-crescendo-v1';target=assets/'sound-palettes'/(name+'.wav')
index_file=assets/'index.json';index=json.loads(index_file.read_text(encoding='utf-8-sig'))
if target.exists() or any(x['id']==name for x in index['items']):raise SystemExit('Candidate exists')
snapshot=project/'history/before-b-swipe-crescendo-v1/assets/index.json'
snapshot.parent.mkdir(parents=True,exist_ok=True)
if snapshot.exists():raise SystemExit('History exists')
snapshot.write_bytes(index_file.read_bytes())
with wave.open(str(source),'rb') as w:
 raw=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).mean(axis=1)/32768
freq,power=welch(raw[round(.025*rate):round(.35*rate)],fs=rate,nperseg=2048)
log_power=gaussian_filter1d(np.log(np.maximum(power,1e-15)),2.0)
length=rate*3;nfft=1<<int(np.ceil(np.log2(length+rate)))
shape=np.exp(.5*np.interp(np.fft.rfftfreq(nfft,1/rate),freq,log_power));shape[0]=0
rng=np.random.default_rng(314159)
carrier=np.fft.irfft(np.fft.rfft(rng.standard_normal(nfft))*shape,nfft)[rate//2:rate//2+length]
carrier/=np.sqrt(gaussian_filter1d(carrier*carrier,rate*.018)+1e-15)
carrier/=max(float(np.sqrt(np.mean(carrier*carrier))),1e-9)
def ease(x):x=np.clip(x,0,1);return x*x*(3-2*x)
t=np.arange(length)/rate;build=ease(t/2.8)
# A single smoothly opening filter develops material detail without mixing
# differently phased voices or adding a separate transition sound.
cutoff=3000+3200*build;pole=np.exp(-2*np.pi*cutoff/rate)
filtered=np.empty_like(carrier);previous=0.0
for i,x in enumerate(carrier):
 previous=pole[i]*previous+(1-pole[i])*x;filtered[i]=previous
filtered/=np.sqrt(gaussian_filter1d(filtered*filtered,rate*.020)+1e-15)
filtered/=max(float(np.sqrt(np.mean(filtered*filtered))),1e-9)
# Approximately 9.4 dB of gradual pressure increase. Entry and release are
# spread over 200/220 ms rather than the prior abrupt 25-ms edges.
pressure=.34+.66*build
envelope=pressure*ease(t/.20)*(1-ease((t-2.78)/.22))
a=filtered*envelope*.125
if abs(a).max()>.85:raise SystemExit('Unexpected peak')
with wave.open(str(target),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
 w.writeframes((np.column_stack([a,a])*32767).astype('<i2').tobytes())
index['items'].append({'id':name,'path':'sound-palettes/'+target.name,'type':'audio',
 'source':'Paper-spectrum resynthesis referenced to user-selected group-down-dry-v1.wav SHA256='+hashlib.sha256(source.read_bytes()).hexdigest()+'; one non-repeating three-second carrier; slow single-filter opening, gradual pressure crescendo, 200ms entry and 220ms release; no external contacts, music notes, echo or reverb',
 'license':'Underlying Kenney RPG Audio CC0; local paper-spectrum resynthesis',
 'sound':{'instrument':'single-source-crescendo-friction','pitches':[],'durationSeconds':3,
  'tags':['single-source','single-swipe','crescendo','smooth-entry','rounded-release','dry'],'roles':['process']}})
index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(target.with_suffix('.envelope.json')).write_text(json.dumps({'duration':3,'previewRange':[7,10],
 'entrySeconds':.20,'releaseSeconds':.22,'pressureBeforeRelease':[.34,1.0],
 'intendedPressureIncreaseDb':float(20*np.log10(1/.34)),'filterCutoffHz':[3000,6200],
 'design':'single light-to-firm progression, rounded exit; no repeated attacks or foreign accent layers',
 'humanListening':'not-performed'},indent=2),encoding='utf-8')
print(json.dumps({'asset':name,'duration':3,'peakDb':float(20*np.log10(abs(a).max())),'rmsDb':float(20*np.log10(np.sqrt(np.mean(a*a))))}))

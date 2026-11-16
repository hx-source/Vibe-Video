"""One uninterrupted paper-like swipe, with a single attack and release.
Spectral resynthesis avoids replaying grains and their multiple internal strokes.
This is explicitly a designed sound derived from the selected paper spectrum.
"""
import pathlib,json,wave,hashlib
import numpy as np
from scipy.signal import welch
from scipy.ndimage import gaussian_filter1d

project=pathlib.Path(__file__).resolve().parent;assets=project/'assets';rate=44100
source=assets/'sound-palettes/group-down-dry-v1.wav'
name='paper-single-swipe-v1';target=assets/'sound-palettes'/(name+'.wav')
index_file=assets/'index.json';index=json.loads(index_file.read_text(encoding='utf-8-sig'))
if target.exists() or any(x['id']==name for x in index['items']):raise SystemExit('Candidate exists; choose a new revision')
snapshot=project/'history/before-b-paper-single-swipe-v1/assets/index.json'
snapshot.parent.mkdir(parents=True,exist_ok=True)
if snapshot.exists():raise SystemExit('History exists')
snapshot.write_bytes(index_file.read_bytes())
with wave.open(str(source),'rb') as w:
 assert w.getframerate()==rate and w.getnchannels()==2
 raw=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).mean(axis=1)/32768

# Preserve the selected material's broad frequency profile, without repeating
# its waveform, transient pattern, or the previous grain loop. Smooth only narrow
# spectral details so the carrier remains a dry, broadband contact texture.
freq,power=welch(raw[round(.025*rate):round(.35*rate)],fs=rate,nperseg=2048)
log_power=gaussian_filter1d(np.log(np.maximum(power,1e-15)),2.0)
length=rate*2;nfft=1<<int(np.ceil(np.log2(length+rate)))
fft_freq=np.fft.rfftfreq(nfft,1/rate)
shape=np.exp(.5*np.interp(fft_freq,freq,log_power))
shape[0]=0
rng=np.random.default_rng(314159)
carrier=np.fft.irfft(np.fft.rfft(rng.standard_normal(nfft))*shape,nfft)
carrier=carrier[rate//2:rate//2+length]
# Stabilize the short-term carrier level before applying one global gesture.
local_rms=np.sqrt(gaussian_filter1d(carrier*carrier,rate*.018)+1e-15)
carrier/=local_rms
carrier/=max(float(np.sqrt(np.mean(carrier*carrier))),1e-9)
t=np.arange(length)/rate
def ease(x):x=np.clip(x,0,1);return x*x*(3-2*x)
envelope=(1-np.exp(-t/.030))*np.exp(-t/4.0)*(1-ease((t-1.91)/.09))
a=carrier*envelope
a*=.085/max(float(np.sqrt(np.mean(a*a))),1e-9)
if abs(a).max()>.40:a*=.40/abs(a).max()
with wave.open(str(target),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
 w.writeframes((np.column_stack([a,a])*32767).astype('<i2').tobytes())
index['items'].append({'id':name,'path':'sound-palettes/'+target.name,'type':'audio',
 'source':'Designed spectral resynthesis using the frequency profile of user-selected group-down-dry-v1.wav; source SHA256='+hashlib.sha256(source.read_bytes()).hexdigest()+'; seeded non-repeating carrier, stabilized local energy, one global attack/decay/release; not an unedited recorded swipe, not grain repetition; no reverb or echo',
 'license':'Underlying Kenney RPG Audio CC0; local resynthesis by make-paper-single-swipe.py',
 'sound':{'instrument':'single-gesture-paper-spectrum-resynthesis','pitches':[],'durationSeconds':2,
  'tags':['paper-like','dry','single-gesture','resynthesized','non-repeating'],'roles':['process']}})
index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'asset':name,'duration':2,'peakDb':float(20*np.log10(abs(a).max())),'rmsDb':float(20*np.log10(np.sqrt(np.mean(a*a))))}))

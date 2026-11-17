"""Articulate the same single-swipe carrier through pressure changes only.
No start/end contact sample is mixed in. Reproduce the exact seeded carrier from
make-paper-single-swipe.py and change only its smooth two-second gain contour.
"""
import pathlib,json,wave,hashlib
import numpy as np
from scipy.signal import welch
from scipy.ndimage import gaussian_filter1d

project=pathlib.Path(__file__).resolve().parent;assets=project/'assets';rate=44100
source=assets/'sound-palettes/group-down-dry-v1.wav'
name='paper-single-integrated-v1';target=assets/'sound-palettes'/(name+'.wav')
index_file=assets/'index.json';index=json.loads(index_file.read_text(encoding='utf-8-sig'))
if target.exists() or any(x['id']==name for x in index['items']):raise SystemExit('Candidate exists')
snapshot=project/'history/before-b-swipe-integrated-v1/assets/index.json'
snapshot.parent.mkdir(parents=True,exist_ok=True)
if snapshot.exists():raise SystemExit('History exists')
snapshot.write_bytes(index_file.read_bytes())
with wave.open(str(source),'rb') as w:
 raw=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).mean(axis=1)/32768
freq,power=welch(raw[round(.025*rate):round(.35*rate)],fs=rate,nperseg=2048)
log_power=gaussian_filter1d(np.log(np.maximum(power,1e-15)),2.0)
length=rate*2;nfft=1<<int(np.ceil(np.log2(length+rate)))
shape=np.exp(.5*np.interp(np.fft.rfftfreq(nfft,1/rate),freq,log_power));shape[0]=0
rng=np.random.default_rng(314159)
carrier=np.fft.irfft(np.fft.rfft(rng.standard_normal(nfft))*shape,nfft)[rate//2:rate//2+length]
carrier/=np.sqrt(gaussian_filter1d(carrier*carrier,rate*.018)+1e-15)
carrier/=max(float(np.sqrt(np.mean(carrier*carrier))),1e-9)
def ease(x):x=np.clip(x,0,1);return x*x*(3-2*x)
t=np.arange(length)/rate
# One uninterrupted pressure contour: a light initial grip, a steady body,
# gradually firmer friction near the end, and a tight release at the stop.
# Neither edge contains a new waveform, second brush attack, or impact layer.
pressure=.62+.10*(1-ease((t-.04)/.20))+.26*ease((t-1.65)/.30)
envelope=pressure*ease(t/.025)*(1-ease((t-1.975)/.025))
a=carrier*envelope*.125
if abs(a).max()>.85:raise SystemExit('Unexpected peak')
with wave.open(str(target),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
 w.writeframes((np.column_stack([a,a])*32767).astype('<i2').tobytes())
index['items'].append({'id':name,'path':'sound-palettes/'+target.name,'type':'audio',
 'source':'Same seeded paper-spectrum carrier as paper-single-swipe-v1, referenced to group-down-dry-v1.wav SHA256='+hashlib.sha256(source.read_bytes()).hexdigest()+'; only one continuous pressure/level envelope changes; no book-placement, tapping, glass, or other start/end sample is mixed into this gesture; no reverb or echo',
 'license':'Underlying Kenney RPG Audio CC0; local paper-spectrum resynthesis',
 'sound':{'instrument':'single-source-articulated-friction','pitches':[],'durationSeconds':2,
  'tags':['single-source','single-swipe','dry','pressure-envelope','no-impact-layer'],'roles':['process']}})
index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'asset':name,'duration':2,'peakDb':float(20*np.log10(abs(a).max())),'rmsDb':float(20*np.log10(np.sqrt(np.mean(a*a))))}))

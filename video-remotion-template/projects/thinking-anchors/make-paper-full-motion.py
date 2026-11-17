"""Extend the selected paper texture at native grain speed into one gesture.
No slow atempo, artificial room, echo, new instrument or noise generator is used.
"""
import pathlib,json,wave,hashlib
import numpy as np

project=pathlib.Path(__file__).resolve().parent;assets=project/'assets';rate=44100
source=assets/'sound-palettes/group-down-dry-v1.wav'
name='paper-full-motion-v1';target=assets/'sound-palettes'/(name+'.wav')
index_file=assets/'index.json';index=json.loads(index_file.read_text(encoding='utf-8-sig'))
if target.exists() or any(x['id']==name for x in index['items']):raise SystemExit('Candidate exists; choose a new revision')
snapshot=project/'history/before-b-paper-full-motion-v1/assets/index.json'
snapshot.parent.mkdir(parents=True,exist_ok=True)
if snapshot.exists():raise SystemExit('History exists')
snapshot.write_bytes(index_file.read_bytes())
with wave.open(str(source),'rb') as w:
 assert w.getframerate()==rate and w.getnchannels()==2
 raw=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).mean(axis=1)/32768

# Native-rate, windowed overlap-add of the sustained paper body. Randomized grain
# positions avoid looping the same isolated flip as a series of separate events.
rng=np.random.default_rng(271828)
total=rate*2;texture=np.zeros(total);weights=np.zeros(total)
grain=round(.115*rate);hop=round(.024*rate);window=np.hanning(grain)
body_start=round(.035*rate);body_end=round(.345*rate)
reference_rms=float(np.sqrt(np.mean(raw[body_start:body_end]**2)))
for at in range(-grain+hop,total,hop):
 k=int(rng.integers(body_start,body_end-grain+1));part=raw[k:k+grain].copy()
 part*=reference_rms/max(float(np.sqrt(np.mean(part*part))),1e-9)
 lo=max(0,at);hi=min(total,at+grain);sl=slice(lo-at,hi-at)
 texture[lo:hi]+=part[sl]*window[sl]
 weights[lo:hi]+=window[sl]**2
texture/=np.sqrt(np.maximum(weights,1e-9))
texture*=reference_rms/max(float(np.sqrt(np.mean(texture*texture))),1e-9)

# Retain the selected sample's original near-field contact at entry and exit.
edge=round(.075*rate)
blend=np.linspace(0,1,edge)
texture[:edge]=raw[:edge]*(1-blend)+texture[:edge]*blend
texture[-edge:]=texture[-edge:]*(1-blend)+raw[-edge:]*blend

# Follow the full two-dimensional movement, rather than beginning halfway down.
t=np.arange(total)/rate;u=np.clip(t/2,0,1);c=u*u*(3-2*u);dc=3*u*(1-u)
def derivative(v):return np.where((v>0)&(v<1),6*v*(1-v),0)
dx=derivative(c/.6)*dc/.6;dy=derivative((c-.4)/.6)*dc/.6
speed=np.mean([np.sqrt((x*dx)**2+(y*dy)**2) for x,y in [(510,292),(230,170),(50,48)]],axis=0)
envelope=.50+.50*np.sqrt(speed/max(float(speed.max()),1e-9))
a=texture*envelope
a*=.085/max(float(np.sqrt(np.mean(a*a))),1e-9)
a=.38*np.tanh(a/.38)
a[:882]*=np.linspace(0,1,882);a[-1764:]*=np.linspace(1,0,1764)
with wave.open(str(target),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
 w.writeframes((np.column_stack([a,a])*32767).astype('<i2').tobytes())
index['items'].append({'id':name,'path':'sound-palettes/'+target.name,'type':'audio',
 'source':'Derived only from user-selected group-down-dry-v1.wav; SHA256='+hashlib.sha256(source.read_bytes()).hexdigest()+'; native-rate overlapping grains extend its paper-friction body, preserving contact edges; level envelope follows the complete 8–10s label movement; no spatial processing',
 'license':'Underlying Kenney RPG Audio CC0; local processing by make-paper-full-motion.py',
 'sound':{'instrument':'continuous-dry-paper-friction','pitches':[],'durationSeconds':2,
  'tags':['paper','dry','continuous','native-grain-speed','group-motion'],'roles':['process']}})
index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'asset':name,'duration':2,'peakDb':float(20*np.log10(abs(a).max())),'rmsDb':float(20*np.log10(np.sqrt(np.mean(a*a))))}))

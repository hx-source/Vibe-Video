"""Original short motion music: warm portamento and connected minor arpeggio.
These are synthesized candidate gestures, not a sampled piano or an AI score.
"""
import pathlib,json,wave
import numpy as np

project=pathlib.Path(__file__).resolve().parent;assets=project/'assets';rate=44100
index_file=assets/'index.json';index=json.loads(index_file.read_text(encoding='utf-8-sig'))
snapshot=project/'history/before-b-musical-down-v1/assets/index.json'
if snapshot.exists():raise SystemExit('History exists; choose a new revision')
snapshot.parent.mkdir(parents=True,exist_ok=True);snapshot.write_bytes(index_file.read_bytes())
duration=1.10;t=np.arange(round(duration*rate))/rate
def hz(m):return 440*2**((m-69)/12)
def ease(x):x=np.clip(x,0,1);return x*x*(3-2*x)
def save(name,a,instrument,pitches,description):
 f=assets/'sound-palettes'/(name+'.wav')
 if f.exists():raise SystemExit('Candidate exists')
 a*=.085/max(float(np.sqrt(np.mean(a*a))),1e-9)
 if abs(a).max()>.28:a*=.28/abs(a).max()
 a[:441]*=np.linspace(0,1,441);a[-882:]*=np.linspace(1,0,882)
 with wave.open(str(f),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
  w.writeframes((np.column_stack([a,a])*32767).astype('<i2').tobytes())
 index['items'].append({'id':name,'path':'sound-palettes/'+f.name,'type':'audio',
  'source':'本期 make-musical-down-options.py 原创合成；'+description+'；无采样、噪声扫动、回声或混响；不是实录钢琴或完整AI配乐',
  'license':'本期原创程序乐音，无第三方采样',
  'sound':{'instrument':instrument,'pitches':pitches,'durationSeconds':len(a)/rate,
   'tags':['musical','warm','short','dry','original-synthesis'],'roles':['process','transition']}})
 return {'id':name,'duration':len(a)/rate,'pitches':pitches,'peak':float(abs(a).max())}

# The same smoothstep position curve drives the vertical movement and the pitch.
u=(8.85+t-8)/2;position=ease((ease(u)-.4)/.6)
midi=67+(60-67)*position
frequency=440*2**((midi-69)/12);phase=2*np.pi*np.cumsum(frequency)/rate
envelope=ease(t/.085)*(1-ease((t-(duration-.12))/.12))
glide=(np.sin(phase)+.20*np.sin(2*phase)+.055*np.sin(3*phase))*envelope
result=[save('musical-warm-glide-v1',glide,'warm-synth-portamento',[67,60],
 'G4到C4连续下行；音高随标签下移位置变化；中音区、缓起音、短收尾；所标音高为端点')]

# Three connected rounded key tones form a descending C-minor arpeggio. No sharp
# mallet transient, vibrato, ping-pong or extra low-frequency pop is introduced.
arp=np.zeros_like(t)
for midi,start in [(67,0),(63,.30),(60,.60)]:
 q=t-start;active=q>=0;local=np.maximum(0,q);phase=2*np.pi*hz(midi)*local
 env=ease(local/.050)*np.exp(-local/.28)*(1-ease((t-(duration-.10))/.10))
 sound=(np.sin(phase)+.16*np.sin(2*phase)*np.exp(-local/.20)+.035*np.sin(3*phase))*env
 arp+=np.where(active,sound,0)
result.append(save('musical-rounded-arp-v1',arp,'rounded-synth-key-arpeggio',[67,63,60],
 'G4、Eb4、C4三个圆润键音连奏下行；合成音色，不作真实乐器质感断言'))
index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result))

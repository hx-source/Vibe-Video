"""Make one soft, unpitched movement texture, shaped to the vertical tag speed."""
import json, pathlib, subprocess, wave, hashlib
import numpy as np

project=pathlib.Path(__file__).resolve().parent
assets=project/'assets'
ff=project.parents[1]/'node_modules/ffmpeg-static/ffmpeg.exe'
source=assets/'sound-palette-sources/rpg-audio/Audio/cloth1.ogg'
name='group-down-sweep-v1'
target=assets/'sound-palettes'/(name+'.wav')
index_file=assets/'index.json'
index=json.loads(index_file.read_text(encoding='utf-8-sig'))
if target.exists() or any(x['id']==name for x in index['items']):raise SystemExit('Preserve existing candidate; choose another name')
history=project/'history/before-b-group-down-v1/assets/index.json'
history.parent.mkdir(parents=True,exist_ok=True)
if history.exists():raise SystemExit('History already exists')
history.write_bytes(index_file.read_bytes())
raw=subprocess.check_output([str(ff),'-v','error','-i',str(source),'-af',
    'atempo=0.5748,apad,atrim=duration=1.15,highpass=f=600,lowpass=f=5000',
    '-ar','44100','-ac','1','-f','f32le','pipe:1'])
a=np.frombuffer(raw,dtype='<f4').astype(float)
rate=44100
a=np.pad(a,(0,max(0,round(1.15*rate)-len(a))))[:round(1.15*rate)]
local_t=8.85+np.arange(len(a))/rate
# Same nested smoothstep motion as AnchorEvidenceMotion: vertical motion starts
# when converge > .4, and its speed reaches zero at the 10-second settle event.
u=np.clip((local_t-8)/2,0,1)
converge=u*u*(3-2*u)
v=np.clip((converge-.4)/.6,0,1)
velocity=6*v*(1-v)*6*u*(1-u)/(2*.6)
envelope=(velocity/max(float(velocity.max()),1e-9))**.55
a*=.13/max(float(np.sqrt(np.mean(a*a))),1e-9)
a=.32*np.tanh(a/.32)*envelope
a*=.07/max(float(np.sqrt(np.mean(a*a))),1e-9)
if abs(a).max()>.45:a*=.45/abs(a).max()
with wave.open(str(target),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
    w.writeframes((np.column_stack([a,a])*32767).astype('<i2').tobytes())
metadata={'id':name,'path':'sound-palettes/'+target.name,'type':'audio',
    'source':'Kenney / RPG Audio / Audio/cloth1.ogg; https://kenney.nl/assets/rpg-audio; source SHA256='+hashlib.sha256(source.read_bytes()).hexdigest()+'; non-pitch-changing time stretch, 600–5000Hz filtering, level control and envelope shaped to tag downward velocity; approximate movement foley, not a recording of paper labels',
    'license':'Creative Commons Zero, CC0; original License.txt retained locally',
    'sound':{'instrument':'soft-friction-sweep','pitches':[],'durationSeconds':len(a)/rate,
        'tags':['sweep','friction','unpitched','group-motion'],'roles':['process','transition']}}
index['items'].append(metadata)
index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'asset':name,'duration':len(a)/rate,'rmsDb':float(20*np.log10(np.sqrt(np.mean(a*a)))),'peakDb':float(20*np.log10(abs(a).max()))}))

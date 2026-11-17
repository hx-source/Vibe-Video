"""A short paper brush for the price-tag movement, without a closing impact."""
import pathlib, subprocess, json, hashlib, wave
import numpy as np

project=pathlib.Path(__file__).resolve().parent
engine=project.parents[1]
source=project/'assets/sound-palette-sources/rpg-audio/Audio/bookFlip1.ogg'
target=project/'assets/sound-palettes/paper-slide-soft-v1.wav'
if target.exists():
    raise SystemExit('Candidate exists; preserve it and choose a new revision.')
raw=subprocess.check_output([str(engine/'node_modules/ffmpeg-static/ffmpeg.exe'),'-v','error','-i',str(source),
    '-af','atrim=start=0.10:end=0.50,asetpts=PTS-STARTPTS,highpass=f=250,lowpass=f=4800',
    '-ar','44100','-ac','1','-f','f32le','pipe:1'])
a=np.frombuffer(raw,dtype='<f4').astype(float)
# Use the page friction before the loud closing transient at about 0.55 seconds.
# Keep a modest body level; no synthetic tone or extra impact is added.
a*=.075/max(float(np.sqrt(np.mean(a*a))),1e-9)
a=.28*np.tanh(a/.28)
a[:1323]*=np.linspace(0,1,1323)
a[-2646:]*=np.linspace(1,0,2646)
stereo=np.column_stack([a,a])
with wave.open(str(target),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(44100)
    w.writeframes((stereo*32767).astype('<i2').tobytes())
metadata={'id':'paper-slide-soft-v1','path':'sound-palettes/'+target.name,'type':'audio',
    'source':'Kenney / RPG Audio / Audio/bookFlip1.ogg; https://kenney.nl/assets/rpg-audio; source SHA256='+hashlib.sha256(source.read_bytes()).hexdigest()+'; excerpt 0.10–0.50s, band filtering, gentle level control and fades; no closing transient',
    'license':'Creative Commons Zero, CC0; original License.txt retained in sound-palette-sources/rpg-audio',
    'sound':{'instrument':'paper-friction','pitches':[],'durationSeconds':len(a)/44100,
        'tags':['paper','friction','soft','nonmelodic'],'roles':['process','transition']}}
(target.with_suffix('.source.json')).write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'asset':str(target),'duration':len(a)/44100,'peakDb':float(20*np.log10(abs(a).max())), 'rmsDb':float(20*np.log10(np.sqrt(np.mean(a*a))))}))

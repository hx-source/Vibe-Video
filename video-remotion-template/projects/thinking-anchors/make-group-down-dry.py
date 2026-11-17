"""Short native-speed paper contact: retain body, with no stretch or spatial DSP."""
import json, pathlib, subprocess, wave, hashlib
import numpy as np

project=pathlib.Path(__file__).resolve().parent
assets=project/'assets';ff=project.parents[1]/'node_modules/ffmpeg-static/ffmpeg.exe'
name='group-down-dry-v1';target=assets/'sound-palettes'/(name+'.wav')
source=assets/'sound-palette-sources/rpg-audio/Audio/bookFlip2.ogg'
index_file=assets/'index.json';index=json.loads(index_file.read_text(encoding='utf-8-sig'))
if target.exists() or any(x['id']==name for x in index['items']):raise SystemExit('Preserve candidate; use another revision')
snapshot=project/'history/before-b-group-down-dry-v1/assets/index.json'
snapshot.parent.mkdir(parents=True,exist_ok=True)
if snapshot.exists():raise SystemExit('History exists')
snapshot.write_bytes(index_file.read_bytes())
raw=subprocess.check_output([str(ff),'-v','error','-i',str(source),'-af',
 'highpass=f=120,lowpass=f=7000,acompressor=threshold=0.015:ratio=3:attack=2:release=40',
 '-ar','44100','-ac','1','-f','f32le','pipe:1'])
a=np.frombuffer(raw,dtype='<f4').astype(float)
# Keep the native sample duration, body and texture. No atempo, echo, convolution,
# delay or stereo widening; the two output channels contain identical dry samples.
a*=.12/max(float(np.sqrt(np.mean(a*a))),1e-9)
a=.32*np.tanh(a/.32)
a[:441]*=np.linspace(0,1,441);a[-1764:]*=np.linspace(1,0,1764)
with wave.open(str(target),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(44100)
 w.writeframes((np.column_stack([a,a])*32767).astype('<i2').tobytes())
item={'id':name,'path':'sound-palettes/'+target.name,'type':'audio',
 'source':'Kenney / RPG Audio / Audio/bookFlip2.ogg; https://kenney.nl/assets/rpg-audio; source SHA256='+hashlib.sha256(source.read_bytes()).hexdigest()+'; native speed and duration, gentle band limiting and compression, gain and short fades; no spatial processing',
 'license':'Creative Commons Zero, CC0; original License.txt retained locally',
 'sound':{'instrument':'dry-paper-contact','pitches':[],'durationSeconds':len(a)/44100,
  'tags':['paper','dry','short','native-speed','mono'],'roles':['process','transition']}}
index['items'].append(item);index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'asset':name,'duration':len(a)/44100,'rmsDb':float(20*np.log10(np.sqrt(np.mean(a*a)))),'peakDb':float(20*np.log10(abs(a).max()))}))

"""One actual recorded pencil stroke, at native speed; no synthetic friction."""
import pathlib,json,wave,hashlib,subprocess
import numpy as np

project=pathlib.Path(__file__).resolve().parent;assets=project/'assets';rate=44100
ff=project.parents[1]/'node_modules/ffmpeg-static/ffmpeg.exe'
source=assets/'pencil-sources/802603-hq.mp3'
provenance=json.loads((assets/'pencil-sources/802603-source.json').read_text(encoding='utf-8'))
assert provenance['license']=='CC0 1.0'
name='pencil-underline-recorded-v1';target=assets/'sound-palettes'/(name+'.wav')
index_file=assets/'index.json';index=json.loads(index_file.read_text(encoding='utf-8-sig'))
if target.exists() or any(x['id']==name for x in index['items']):raise SystemExit('Preserve candidate; choose another revision')
snapshot=project/'history/before-b-pencil-underline-v1/assets/index.json'
snapshot.parent.mkdir(parents=True,exist_ok=True)
if snapshot.exists():raise SystemExit('History exists')
snapshot.write_bytes(index_file.read_bytes())
full=np.frombuffer(subprocess.check_output([str(ff),'-v','error','-i',str(source),'-af','highpass=f=180,lowpass=f=7500',
 '-ar',str(rate),'-ac','1','-f','f32le','pipe:1']),dtype='<f4').astype(float)
source_in=.55;source_out=.79
a=full[round(source_in*rate):round(source_out*rate)].copy()
# Include the first complete short stroke (main activity about 0.57–0.75s),
# not an arbitrary fragment of several strokes. Preserve native speed and body.
active=a[round(.02*rate):round(.20*rate)]
gain=min(.12/max(float(np.sqrt(np.mean(active*active))),1e-9),.55/max(float(abs(a).max()),1e-9))
a*=gain
a[:88]*=np.linspace(0,1,88);a[-220:]*=np.linspace(1,0,220)
with wave.open(str(target),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
 w.writeframes((np.column_stack([a,a])*32767).astype('<i2').tobytes())
index['items'].append({'id':name,'path':'sound-palettes/'+target.name,'type':'audio',
 'source':'Pencil - Drawing a Single Hard Line by JelloApocalypse; https://freesound.org/people/JelloApocalypse/sounds/802603/; public HQ preview MP3 SHA256='+hashlib.sha256(source.read_bytes()).hexdigest()+'; native-speed excerpt 0.55–0.79s, mild 180–7500Hz filtering, linear gain and 2/5ms fades; single actual recorded pencil stroke, no synthesis, repeats, echo or added impacts',
 'license':'CC0 1.0; author page and download provenance retained in assets/pencil-sources',
 'sound':{'instrument':'recorded-pencil-on-paper','pitches':[],'durationSeconds':len(a)/rate,
  'tags':['recorded','pencil','underline','single-stroke','short','native-speed'],'roles':['end','accent']}})
index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(target.with_suffix('.source.json')).write_text(json.dumps({**provenance,'sourceInSeconds':source_in,'sourceOutSeconds':source_out,'linearGain':gain,
 'processing':['180Hz highpass','7500Hz lowpass','linear gain','2ms entry fade','5ms exit fade'],
 'durationSeconds':len(a)/rate,'humanListening':'not-performed'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'asset':name,'duration':len(a)/rate,'peakDb':float(20*np.log10(abs(a).max())),'rmsDb':float(20*np.log10(np.sqrt(np.mean(a*a))))}))

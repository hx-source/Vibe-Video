"""A native-speed continuous two-second pencil recording, not a loop of a tap."""
import pathlib,json,wave,hashlib,subprocess
import numpy as np

project=pathlib.Path(__file__).resolve().parent;assets=project/'assets';rate=44100
ff=project.parents[1]/'node_modules/ffmpeg-static/ffmpeg.exe'
source=assets/'pencil-sources/809934-hq.mp3'
provenance=json.loads((assets/'pencil-sources/809934-source.json').read_text(encoding='utf-8'))
assert provenance['license']=='CC0 1.0'
name='pencil-continuous-recorded-v1';target=assets/'sound-palettes'/(name+'.wav')
index_file=assets/'index.json';index=json.loads(index_file.read_text(encoding='utf-8-sig'))
if target.exists() or any(x['id']==name for x in index['items']):raise SystemExit('Candidate exists')
snapshot=project/'history/before-b-pencil-follow-through-v1/assets/index.json'
snapshot.parent.mkdir(parents=True,exist_ok=True)
if snapshot.exists():raise SystemExit('History exists')
snapshot.write_bytes(index_file.read_bytes())
full=np.frombuffer(subprocess.check_output([str(ff),'-v','error','-i',str(source),'-af',
 'highpass=f=180,lowpass=f=7500,acompressor=threshold=0.005:ratio=3:attack=0.5:release=30',
 '-ar',str(rate),'-ac','1','-f','f32le','pipe:1']),dtype='<f4').astype(float)
source_in=2.5;source_out=4.5
a=full[round(source_in*rate):round(source_out*rate)].copy()
assert len(a)==2*rate
a*=.125/max(float(np.sqrt(np.mean(a*a))),1e-9)
a=.42*np.tanh(a/.42)
def ease(x):x=np.clip(x,0,1);return x*x*(3-2*x)
t=np.arange(len(a))/rate
# Native recording retains the pen's continuous material detail. A modest
# pressure rise and rounded edges fit the motion without replaying short strokes.
envelope=(.65+.35*ease(t/1.75))*ease(t/.045)*(1-ease((t-1.90)/.10))
a*=envelope
with wave.open(str(target),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
 w.writeframes((np.column_stack([a,a])*32767).astype('<i2').tobytes())
index['items'].append({'id':name,'path':'sound-palettes/'+target.name,'type':'audio',
 'source':'Pencil stroke long by Trtle.T; https://freesound.org/people/Trtle.T/sounds/809934/; public HQ preview MP3 SHA256='+hashlib.sha256(source.read_bytes()).hexdigest()+'; continuous native-speed excerpt 2.50–4.50s; mild band filtering, transient control, gain, modest pressure rise and 45/100ms fades; no repeated short stroke, time stretch, spectral resynthesis, echo or added impact',
 'license':'CC0 1.0; author page and download provenance retained in assets/pencil-sources',
 'sound':{'instrument':'continuous-recorded-pencil-on-paper','pitches':[],'durationSeconds':2,
  'tags':['recorded','pencil','continuous','native-speed','no-loop','dry-processing'],'roles':['process']}})
index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(target.with_suffix('.source.json')).write_text(json.dumps({**provenance,'sourceInSeconds':source_in,'sourceOutSeconds':source_out,
 'durationSeconds':2,'processing':['native-speed continuous excerpt','180–7500Hz band limiting','transient compression','gain and peak control','modest pressure rise','45/100ms edge fades'],
 'humanListening':'not-performed'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'asset':name,'duration':2,'peakDb':float(20*np.log10(abs(a).max())),'rmsDb':float(20*np.log10(np.sqrt(np.mean(a*a))))}))

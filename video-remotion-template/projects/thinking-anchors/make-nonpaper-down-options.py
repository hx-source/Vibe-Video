"""Two contrasting short alternatives for grouping labels; both avoid paper samples."""
import json,pathlib,subprocess,wave,hashlib
import numpy as np

project=pathlib.Path(__file__).resolve().parent;assets=project/'assets'
ff=project.parents[1]/'node_modules/ffmpeg-static/ffmpeg.exe';rate=44100
index_file=assets/'index.json';index=json.loads(index_file.read_text(encoding='utf-8-sig'))
snapshot=project/'history/before-b-nonpaper-down-v1/assets/index.json'
if snapshot.exists():raise SystemExit('History exists; choose a new revision')
snapshot.parent.mkdir(parents=True,exist_ok=True);snapshot.write_bytes(index_file.read_bytes())

def read(pack,name,filters):
 f=assets/'sound-palette-sources'/pack/'Audio'/(name+'.ogg')
 a=np.frombuffer(subprocess.check_output([str(ff),'-v','error','-i',str(f),'-af',filters,'-ar',str(rate),'-ac','1','-f','f32le','pipe:1']),dtype='<f4').astype(float)
 return a,{'pack':pack,'file':'Audio/'+name+'.ogg','sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'page':'https://kenney.nl/assets/'+pack}

def level(a,rms):
 return a*(rms/max(float(np.sqrt(np.mean(a*a))),1e-9))

def save(name,a,refs,instrument,tags):
 dest=assets/'sound-palettes'/(name+'.wav')
 if dest.exists():raise SystemExit('Candidate exists')
 a=.32*np.tanh(level(a,.12)/.32)
 a[:220]*=np.linspace(0,1,220);a[-882:]*=np.linspace(1,0,882)
 a=level(a,.095)
 if abs(a).max()>.40:a*=.40/abs(a).max()
 with wave.open(str(dest),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
  w.writeframes((np.column_stack([a,a])*32767).astype('<i2').tobytes())
 index['items'].append({'id':name,'path':'sound-palettes/'+dest.name,'type':'audio',
  'source':'Kenney CC0 sources: '+json.dumps(refs,ensure_ascii=False)+'; native-speed filtering, level control and short fades; mechanical option is an approximate designed foley, electronic option is an interface sound',
  'license':'Creative Commons Zero, CC0; source License.txt files retained locally',
  'sound':{'instrument':instrument,'pitches':[],'durationSeconds':len(a)/rate,'tags':tags,'roles':['process','transition']}})
 return {'id':name,'duration':len(a)/rate,'rmsDb':float(20*np.log10(np.sqrt(np.mean(a*a))))}

# A native-speed metal scrape with a small, damped latch at the end. The metal
# material gives a different vocabulary from the three preceding paper entries.
scrape,sref=read('rpg-audio','drawKnife1','highpass=f=180,lowpass=f=4200')
latch,lref=read('rpg-audio','metalLatch','highpass=f=220,lowpass=f=4200,acompressor=threshold=0.04:ratio=5:attack=0.5:release=25')
a=np.zeros(round(.48*rate));scrape=level(scrape,.08)
a[:min(len(a),len(scrape))]+=scrape[:len(a)]
part=latch[round(.012*rate):round(.105*rate)];part=level(part,.035)
k=round(.36*rate);a[k:k+len(part)]+=part
result=[save('group-mechanical-v1',a,[sref,lref],'damped-mechanical-slide',['mechanical','metal','short','dry','nonpaper'])]

# One short electronic closure cue, without a melody, long glide or spatial tail.
a,ref=read('interface-sounds','minimize_003','highpass=f=160,lowpass=f=4200')
result.append(save('group-electronic-v1',a,[ref],'electronic-interface-close',['electronic','short','dry','nonpaper','pitch-unconfirmed']))
index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result))

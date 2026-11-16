"""Package light contact + one unchanged swipe body + firmer dry settling contact."""
import pathlib,json,wave,hashlib,subprocess
import numpy as np

project=pathlib.Path(__file__).resolve().parent;assets=project/'assets';rate=44100
ff=project.parents[1]/'node_modules/ffmpeg-static/ffmpeg.exe'
name='paper-swipe-edged-v1';target=assets/'sound-palettes'/(name+'.wav')
index_file=assets/'index.json';index=json.loads(index_file.read_text(encoding='utf-8-sig'))
if target.exists() or any(x['id']==name for x in index['items']):raise SystemExit('Preserve existing candidate')
snapshot=project/'history/before-b-swipe-edge-accents-v1/assets/index.json'
snapshot.parent.mkdir(parents=True,exist_ok=True)
if snapshot.exists():raise SystemExit('History exists')
snapshot.write_bytes(index_file.read_bytes())
body_file=assets/'sound-palettes/paper-single-swipe-v1.wav'
with wave.open(str(body_file),'rb') as w:
 body=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).mean(axis=1)/32768
assert len(body)==rate*2

def contact(filename,length,highpass,desired_rms,peak_limit):
 source=assets/'sound-palette-sources/rpg-audio/Audio'/filename
 a=np.frombuffer(subprocess.check_output([str(ff),'-v','error','-i',str(source),'-af',
  f'highpass=f={highpass},lowpass=f=5000,acompressor=threshold=0.04:ratio=4:attack=0.5:release=20',
  '-ar',str(rate),'-ac','1','-f','f32le','pipe:1']),dtype='<f4').astype(float)
 peak=int(np.argmax(abs(a)));start=max(0,peak-round(.005*rate));n=round(length*rate)
 a=np.pad(a[start:start+n],(0,max(0,n-len(a[start:start+n]))))
 a*=desired_rms/max(float(np.sqrt(np.mean(a*a))),1e-9)
 a=peak_limit*np.tanh(a/peak_limit)
 a[:88]*=np.linspace(0,1,88);a[-529:]*=np.linspace(1,0,529)
 return a,{'file':filename,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceInSeconds':start/rate,'duration':length,'highpassHz':highpass}

head,hmeta=contact('bookPlace1.ogg',.055,500,.09,.22)
tail,tmeta=contact('bookPlace2.ogg',.090,260,.14,.36)
result=np.zeros(round(2.10*rate));result[:len(body)]=body
result[:len(head)]+=head
end=2*rate;result[end:end+len(tail)]+=tail
if abs(result).max()>.85:raise SystemExit('Unexpected peak; do not normalize the unchanged body')
with wave.open(str(target),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
 w.writeframes((np.column_stack([result,result])*32767).astype('<i2').tobytes())
metadata={'id':name,'path':'sound-palettes/'+target.name,'type':'audio',
 'source':'Composite designed action: unchanged paper-single-swipe-v1.wav body SHA256='+hashlib.sha256(body_file.read_bytes()).hexdigest()+'; light start and firmer end contacts from Kenney RPG Audio book placement samples, filtered and cut short; https://kenney.nl/assets/rpg-audio; contacts='+json.dumps([hmeta,tmeta])+'; no new brush repetitions, echo or room processing',
 'license':'Underlying Kenney RPG Audio CC0; local composite and spectral resynthesis',
 'sound':{'instrument':'paper-contact-swipe-settle','pitches':[],'durationSeconds':2.10,
  'tags':['dry','single-swipe','light-start','firmer-end','composite'],'roles':['process']}}
index['items'].append(metadata);index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
measure=lambda a:{'peakDb':float(20*np.log10(abs(a).max())),'rmsDb':float(20*np.log10(np.sqrt(np.mean(a*a))))}
(target.with_suffix('.components.json')).write_text(json.dumps({'bodyFile':body_file.name,'bodyRange':[0,2],'startRange':[0,.055],'endRange':[2,2.09],
 'startContact':measure(head),'endContact':measure(tail),'sourceContacts':[hmeta,tmeta],'note':'Complete audition contains both contacts and the single swipe body; old separate glass end cue must be replaced, not doubled.'},indent=2),encoding='utf-8')
print(json.dumps({'asset':name,'duration':2.1,'start':measure(head),'end':measure(tail)}))

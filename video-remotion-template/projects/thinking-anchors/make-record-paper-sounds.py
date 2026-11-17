"""Three short, dry page textures; no bass impacts, pitch ladder or synthetic pops."""
import json, pathlib, subprocess, wave, hashlib
import numpy as np

project=pathlib.Path(__file__).resolve().parent
ff=project.parents[1]/'node_modules/ffmpeg-static/ffmpeg.exe'
assets=project/'assets'
history=project/'history/before-b-record-entries-v1'
history.mkdir(parents=True,exist_ok=True)
index_file=assets/'index.json'
snapshot=history/'assets/index.json'
if snapshot.exists():raise SystemExit('History exists; use a new revision')
snapshot.parent.mkdir(parents=True,exist_ok=True);snapshot.write_bytes(index_file.read_bytes())
index=json.loads(index_file.read_text(encoding='utf-8-sig'))
for num,source_name,start,end in [(1,'bookFlip2',.04,.24),(2,'bookFlip3',.015,.195),(3,'bookFlip1',.28,.48)]:
    source=assets/'sound-palette-sources/rpg-audio/Audio'/(source_name+'.ogg')
    name='record-paper-'+str(num)+'-v1';dest=assets/'sound-palettes'/(name+'.wav')
    if dest.exists() or any(i['id']==name for i in index['items']):raise SystemExit('Candidate exists')
    b=subprocess.check_output([str(ff),'-v','error','-i',str(source),'-af',f'atrim=start={start}:end={end},asetpts=PTS-STARTPTS,highpass=f=350,lowpass=f=5800','-ar','44100','-ac','1','-f','f32le','pipe:1'])
    a=np.frombuffer(b,dtype='<f4').astype(float)
    a*=.12/max(float(np.sqrt(np.mean(a*a))),1e-9)
    a=.32*np.tanh(a/.32)
    a[:441]*=np.linspace(0,1,441);a[-1323:]*=np.linspace(1,0,1323)
    with wave.open(str(dest),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(44100)
        w.writeframes((np.column_stack([a,a])*32767).astype('<i2').tobytes())
    item={'id':name,'path':'sound-palettes/'+dest.name,'type':'audio',
        'source':f'Kenney / RPG Audio / Audio/{source_name}.ogg; https://kenney.nl/assets/rpg-audio; excerpt {start}–{end}s; band-filtered, levelled and faded; source SHA256='+hashlib.sha256(source.read_bytes()).hexdigest(),
        'license':'Creative Commons Zero, CC0; source License.txt retained locally',
        'sound':{'instrument':'short-paper-friction','pitches':[],'durationSeconds':len(a)/44100,
            'tags':['paper','short','dry','nonmelodic'],'roles':['accent','start']}}
    index['items'].append(item)
    print(name,'duration',len(a)/44100,'rmsDb',round(float(20*np.log10(np.sqrt(np.mean(a*a)))),2))
index_file.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

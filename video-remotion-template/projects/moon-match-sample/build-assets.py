"""Reproducible original 120 BPM music and soft event sounds. No downloaded samples."""
from pathlib import Path
import json, wave
import numpy as np

ROOT=Path(__file__).resolve().parent
ASSETS=ROOT/'assets'; ASSETS.mkdir(exist_ok=True)
RATE=44100
def save(name,signal):
    signal=np.clip(signal,-.97,.97)
    with wave.open(str(ASSETS/name),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE)
        w.writeframes((signal*32767).astype('<i2').tobytes())
def bell(midi,length=1.8):
    t=np.arange(int(length*RATE))/RATE;f=440*2**((midi-69)/12)
    s=sum(a*np.sin(2*np.pi*f*r*t)*np.exp(-t/tau) for r,a,tau in [(1,1,.65),(2,.27,.32),(3,.13,.18),(4.01,.035,.1)])
    return s*(1-np.exp(-t/.003))*np.minimum(1,(length-t)/.06)
def place(track,mono,at,gain=.1,pan=0):
    start=round(at*RATE);n=min(len(mono),len(track)-start)
    if n<=0:return
    track[start:start+n,0]+=mono[:n]*gain*np.sqrt((1-pan)/2)
    track[start:start+n,1]+=mono[:n]*gain*np.sqrt((1+pan)/2)
def room(s):
    dry=s.copy()
    for delay,gain in [(.083,.12),(.151,.09),(.247,.07),(.379,.045),(.523,.03)]:
        n=round(delay*RATE);s[n:]+=dry[:-n,::-1]*gain
    return s

music=np.zeros((12*RATE,2))
# D major / B minor / G major / A sus. Five short phrases with room to read.
chords=[[50,57,62,66],[47,54,59,62],[43,50,55,59],[45,52,57,62],[50,57,62,66],[50,57,62,66]]
melody=[74,78,81,78,74,73,71,74,78,74,71,69,74,78,79,78,76,73,69,73,74]
for k,notes in enumerate(chords):
    t=np.arange(3*RATE)/RATE
    env=(1-np.exp(-t/.25))*np.exp(-t/1.25)*np.minimum(1,(3-t)/.2)
    for j,note in enumerate(notes):
        f=440*2**((note-69)/12)
        pad=(np.sin(2*np.pi*f*t)+.17*np.sin(2*np.pi*f*2*t))*env
        place(music,pad,k*2,.033,(j-1.5)*.3)
for i,note in enumerate(melody):
    place(music,bell(note),i*.5,.14 if i%4==0 else .085,np.sin(i*1.2)*.35)
    if i%2==0:place(music,bell(chords[min(i//4,5)][0]+12,1.3),i*.5,.08,-.2)
# Quiet soft low pulse establishes a consistent half-second beat.
for i in range(21):
    t=np.arange(round(.17*RATE))/RATE
    pulse=np.sin(2*np.pi*(62*t-12*t*t))*np.exp(-t/ .043)*(1-np.exp(-t/.002))
    place(music,pulse,i*.5,.075 if i%4==0 else .038)
music=room(music);music*=1.55
music*=np.minimum(1,np.arange(len(music))/RATE/.06)[:,None]
music*=np.minimum(1,(12-np.arange(len(music))/RATE)/1.1)[:,None]
save('moonlight-score.wav',music)
items=[{'id':'moonlight-score','path':'moonlight-score.wav','type':'audio','source':'Original deterministic score; build-assets.py; 120 BPM, D major','license':'Original procedural audio created for this project; no third-party samples'}]
for name,note in [('enter',74),('preferences',78),('first',81),('challenger',78),('compare',83),('replace',81),('retry',78),('settle',86)]:
    s=np.zeros((round(.95*RATE),2));tone=bell(note,.8)
    place(s,tone,0,.45,-.1);place(s,bell(note-12,.8),.012,.08,.2)
    s=room(s);save(name+'.wav',s)
    items.append({'id':'match-'+name,'path':name+'.wav','type':'audio','source':'Original soft bell; build-assets.py','license':'Original procedural audio; no third-party samples','sound':{'instrument':'soft-bell','pitches':[note],'durationSeconds':.95,'attackSeconds':.004,'tailSeconds':.85,'tags':['light','spacious'],'roles':['accent','start','end','transition']}})
(ASSETS/'index.json').write_text(json.dumps({'schemaVersion':1,'items':items},ensure_ascii=False,indent=2),encoding='utf-8')
print('Created original score and 8 event sounds')

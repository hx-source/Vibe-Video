"""Prepare three contrasting audition palettes. Downloaded samples stay traceable.
No approved scene or formal audio plan is changed; synthetic sounds are labelled.
"""
import json, pathlib, hashlib, subprocess, wave
import numpy as np

ENGINE = pathlib.Path(__file__).resolve().parents[2]
PROJECT = pathlib.Path(__file__).resolve().parent
ASSETS = PROJECT / 'assets'
RAW = ASSETS / 'sound-palette-sources'
DEST = ASSETS / 'sound-palettes'
DEST.mkdir(exist_ok=True)
FF = ENGINE / 'node_modules/ffmpeg-static/ffmpeg.exe'
RATE = 44100
history = PROJECT / 'history/before-sound-palettes'
history.mkdir(parents=True, exist_ok=True)
for name in ['assets/index.json', 'sound-review.json', 'delivery-status.json', 'README.md']:
    dst = history / name
    if not dst.exists():
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes((PROJECT / name).read_bytes())

index = json.loads((ASSETS / 'index.json').read_text(encoding='utf-8-sig'))
items = []

def save(name, samples, source, instrument, tags):
    a = np.asarray(samples, dtype=float)
    if a.ndim == 1: a = np.column_stack([a, a])
    active = np.max(abs(a), axis=1) > max(.00001, abs(a).max() * .02)
    bounds = np.flatnonzero(active)
    rms = np.sqrt(np.mean(a[bounds[0]:bounds[-1]+1] ** 2)) if len(bounds) else 1
    # Common active RMS target; gentle peak control rather than matching peaks only.
    a = .60 * np.tanh(a * (.16 / max(rms, 1e-9)) / .60)
    fade = min(220, len(a)//4)
    a[:fade] *= np.linspace(0, 1, fade)[:, None]
    a[-fade:] *= np.linspace(1, 0, fade)[:, None]
    f = DEST / (name + '.wav')
    with wave.open(str(f), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes((np.clip(a, -1, 1) * 32767).astype('<i2').tobytes())
    items.append({'id':'palette-'+name, 'path':'sound-palettes/'+f.name, 'type':'audio',
                  'source':source, 'license':'CC0 / Kenney' if source.startswith('Kenney') else '本期原创程序音效，无第三方采样',
                  'sound':{'instrument':instrument,'pitches':[], 'durationSeconds':len(a)/RATE,
                           'tags':tags, 'roles':['accent','transition','process','end']}})
    return len(a)/RATE

def sample(name, pack, filename, instrument, tags, reverb=False):
    f = RAW / pack / 'Audio' / (filename+'.ogg')
    b = subprocess.check_output([str(FF), '-v','error','-i',str(f),'-ar',str(RATE),'-ac','1','-f','f32le','pipe:1'])
    a = np.frombuffer(b, dtype='<f4').astype(float)
    # Do not trim an attack; retain the original sample's timing and natural tail.
    if reverb:
        dry = a.copy(); a = np.pad(a, (0, round(RATE*.8)))
        for delay, gain in [(.071,.22),(.137,.15),(.223,.11),(.359,.065),(.521,.035)]:
            k = round(delay*RATE); a[k:k+len(dry)] += dry * gain
    return save(name,a, f'Kenney / {pack} / Audio/{filename}.ogg; https://kenney.nl/assets/{pack}; original SHA256={hashlib.sha256(f.read_bytes()).hexdigest()}; '+('added short delay tail; ' if reverb else '')+'active-RMS gain and gentle peak control', instrument,tags)

dur = {}
for name,pack,file,inst,tags,rev in [
 ('cloth-one','rpg-audio','cloth1','cloth-friction',['cloth','friction','nonmelodic'],False),
 ('cloth-two','rpg-audio','cloth2','cloth-friction',['cloth','friction','nonmelodic'],False),
 ('paper-long','rpg-audio','bookFlip2','paper-page',['paper','page','texture'],False),
 ('paper-short','rpg-audio','bookFlip3','paper-page',['paper','page','texture'],False),
 ('metal-detail','rpg-audio','metalClick','small-metal',['metal','object','detail'],False),
 ('comic-creak','rpg-audio','creak1','creaking-object',['creak','comic','texture'],False),
 ('comic-question','interface-sounds','question_001','interface-question',['question','comic','pitched'],False),
 ('comic-swipe','rpg-audio','cloth4','cloth-sweep',['cloth','sweep','motion'],False),
 ('glass-clue','interface-sounds','glass_001','glass-like-interface',['glass','clue','sparse'],True),
 ('glass-finish','interface-sounds','glass_004','glass-like-interface',['glass','tail','sparse'],True),
 ('quiet-sweep','rpg-audio','cloth3','cloth-sweep',['cloth','sweep','sparse'],False),
]: dur[name] = sample(name,pack,file,inst,tags,rev)

# A smooth rising whistle has a continuous pitch curve, unlike a bass pop.
t=np.arange(round(.74*RATE))/RATE
freq=480+630*(t/.74)**1.6
phase=2*np.pi*np.cumsum(freq)/RATE
env=np.sin(np.pi*t/.74)**1.8
whistle=(np.sin(phase+.18*np.sin(2*np.pi*6*t))+.10*np.sin(2*phase))*env
dur['comic-glide']=save('comic-glide',whistle,'本期 build-sound-palettes.py 原创连续滑音合成；不是录音素材','continuous-whistle',['whistle','glide','synthetic','comic'])

index['items']=[i for i in index['items'] if i['id'] not in {x['id'] for x in items}]+items
(ASSETS/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

base=json.loads((PROJECT/'audio-action-candidate.json').read_text(encoding='utf-8-sig'))
base['clips']=base['clips'][:1]
base['ducking']=[]
base['buses']['process']=1
base['qualityPolicy']['minEffectRelativeDb']=-12
base['qualityPolicy']['maxEffectRelativeDb']=8
fit='固定02配乐、截取位置与音量；候选音色与有音高声音的搭配待实际试听，不作调性已协调的断言'

# Same picture and music; deliberately different density and sonic vocabulary.
palettes=[
 ('a-tactile','生活拟音',[
  ('cloth-one',33.2,.85,'放大镜开始检查商品，轻擦材质', 'process'),
  ('metal-detail',34.05,.75,'发现机器表面细节','accent'),
  ('cloth-two',35.35,.82,'放大镜移向配件位置','transition'),
  ('paper-long',37.0,1.05,'成交记录滑入并翻看','process'),
  ('paper-short',37.68,.95,'翻到另一张可比记录','accent'),
  ('cloth-two',40.0,.9,'价格标签从卡片抽出','process'),
  ('paper-short',42.0,.8,'比较结果归组落定','end')]),
 ('b-comic','柔和漫画',[
  ('comic-question',34.0,.68,'发现瑕疵，冒出疑问','accent'),
  ('comic-creak',35.45,.85,'配件缺失时的轻微咯吱反应','accent'),
  ('comic-swipe',37.0,.82,'手势滑看记录','process'),
  ('paper-short',37.68,.75,'另一张记录翻出','accent'),
  ('comic-glide',40.1,.56,'价格标签升起并移动到比较线','process'),
  ('glass-clue',42.0,.7,'三笔价格完成归组','end')]),
 ('c-sparse','清脆留白',[
  ('glass-clue',34.05,.7,'发现第一条真实依据','accent'),
  ('paper-long',37.0,.8,'查成交记录，保留一次翻页','process'),
  ('quiet-sweep',40.0,.60,'价格开始归组，仅留一次轻扫','process'),
  ('glass-finish',42.0,.65,'可比区间确定，保留自然衰减与短空间尾音','end')])]

manifest={'rangeSeconds':[32,46],'music':'02_情感话题_故事讲述.m4a','musicGain':.64,
          'picture':'full-motion-v1/chapters/04-evidence.mp4','palettes':[],
          'humanListening':'not-performed','userApproval':'pending',
          'note':'三组音色和密度均为候选；未替换全片正式方案；不把合成滑音标为实录'}
for slug,title,cues in palettes:
    plan=json.loads(json.dumps(base))
    for i,(name,at,gain,purpose,role) in enumerate(cues):
        clip={'id':f'{slug}-{i+1}','source':'asset:palette-'+name,'role':role,
              'at':at,'sourceIn':0,'sourceOut':dur[name],'gain':gain,'fadeOut':.015,
              'purpose':purpose,'musicFit':fit}
        if role=='process':clip['enabled']=True
        plan['clips'].append(clip)
    filename='audio-palette-'+slug+'.json'
    (PROJECT/filename).write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    manifest['palettes'].append({'id':slug,'title':title,'audioPlan':filename,'effects':len(cues),'cues':plan['clips'][1:]})
(PROJECT/'sound-palette-candidates.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'assets':len(items),'palettes':[{k:p[k] for k in ['id','title','effects']} for p in manifest['palettes']]},ensure_ascii=False))

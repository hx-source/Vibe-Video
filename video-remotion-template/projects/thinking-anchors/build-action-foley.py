"""Original deterministic cartoon foley; alternate plan, no edits to the current mix."""
from pathlib import Path
import json
import wave
import shutil
import numpy as np

p=Path(__file__).resolve().parent
assets=p/'assets/action-foley';assets.mkdir(exist_ok=True)
history=p/'history/before-action-foley'
if not history.exists():
    history.mkdir(parents=True)
    for filename in ['audio-plan.json','assets/index.json','delivery-status.json']:
        dest=history/filename;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p/filename,dest)
rate=44100
rng=np.random.default_rng(2026111402)

def band(duration,low,high):
    n=round(duration*rate); raw=rng.normal(size=n)
    spectrum=np.fft.rfft(raw); f=np.fft.rfftfreq(n,1/rate)
    weight=(1-np.exp(-(f/max(1,low))**4))*np.exp(-(f/high)**6)
    result=np.fft.irfft(spectrum*weight,n=n)
    return result/max(1e-9,np.std(result))

def burst(t,at,attack,decay):
    dt=np.maximum(0,t-at)
    return (t>=at)*np.minimum(1,dt/attack)*np.exp(-dt/decay)

def create(kind,duration):
    t=np.arange(round(duration*rate))/rate
    lo=band(duration,90,1300);mid=band(duration,550,4200);hi=band(duration,1800,10000)
    if kind=='paper-pop':
        signal=(.70*mid+.28*hi)*burst(t,.006,.004,.060)+.22*hi*burst(t,.052,.003,.045)+.14*lo*burst(t,.005,.003,.045)
    elif kind=='paper-flip':
        signal=(.48*mid+.4*hi)*burst(t,.006,.014,.060)+(.40*mid+.28*hi)*burst(t,.083,.004,.047)
    elif kind=='card-slide':
        env=np.sin(np.pi*np.minimum(1,t/(duration-.035)))**1.6
        signal=(.58*mid+.16*hi)*env+.25*lo*burst(t,duration-.10,.003,.035)
    elif kind=='card-drag':
        env=np.minimum(1,t/.055)*np.minimum(1,(duration-t)/.16)
        pulse=.6+.18*np.sin(2*np.pi*(9*t+4*t*t))+.16*np.sin(2*np.pi*23*t)
        signal=(.45*mid+.10*hi)*env*pulse
    elif kind=='elastic-pull':
        env=np.minimum(1,t/.065)*np.minimum(1,(duration-t)/.14)
        creak=.45+.28*np.sin(2*np.pi*(11*t+7*t*t))+.16*np.sin(2*np.pi*32*t)
        signal=(.5*lo+.2*mid)*env*creak
    elif kind in ['wood-tap','soft-land','bag-drop']:
        decay={'wood-tap':.033,'soft-land':.056,'bag-drop':.07}[kind]
        signal=(.65*lo+.20*mid+.1*hi)*burst(t,.004,.002,decay)
        signal+=.24*np.sin(2*np.pi*175*t)*burst(t,.004,.002,.031)
        if kind=='bag-drop':signal+=.18*mid*burst(t,.046,.012,.058)
    elif kind=='ui-tap':
        signal=(.55*mid+.33*hi)*burst(t,.003,.0018,.023)+.21*lo*burst(t,.006,.002,.027)
    elif kind=='brake-stop':
        env=np.sin(np.pi*np.minimum(1,t/(duration-.045)))**1.4
        signal=(.55*mid+.13*lo)*env*(.8+.2*np.sin(2*np.pi*39*t))
        signal+=.23*mid*burst(t,duration-.08,.002,.022)
    elif kind in ['discovery-tick','glass-tap']:
        signal=.23*hi*burst(t,.004,.002,.045)
        for freq,decay,gain in [(1453,.072,.30),(2371,.044,.17),(3517,.031,.10)]:
            signal+=gain*np.sin(2*np.pi*freq*t)*burst(t,.004,.002,decay)
    elif kind=='scan-brush':
        signal=(.37*mid+.13*hi)*np.sin(np.pi*np.minimum(1,t/(duration-.025)))**1.7
    elif kind=='celebrate':
        signal=np.zeros_like(t)
        for at,gain in [(0,.6),(.085,.44),(.17,.34),(.265,.23)]:
            signal+=(.6*mid+.25*hi+.15*lo)*burst(t,at+.003,.002,.030)*gain
    elif kind=='rewind':
        env=np.sin(np.pi*np.minimum(1,t/(duration-.02)))**1.3
        signal=(.55*mid+.22*lo)*env*(.8+.2*np.sin(2*np.pi*(28*t-10*t*t)))
        signal+=.18*hi*burst(t,duration-.08,.001,.025)
    else:raise ValueError(kind)
    # Mild crest reduction gives short foley a body rather than only a tiny peak.
    signal=np.tanh(signal/max(1e-9,np.max(np.abs(signal)))*1.65)
    signal*=np.minimum(1,t/.002)*np.minimum(1,(duration-t)/.014)
    signal*=.70/max(1e-9,np.max(np.abs(signal)))
    signal-=np.mean(signal)
    stereo=np.column_stack((signal,signal*.965))
    filename=assets/(kind+'.wav')
    with wave.open(str(filename),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate)
        w.writeframes((stereo*32767).astype('<i2').tobytes())
    return {'peakDb':float(20*np.log10(np.max(np.abs(stereo)))),'rmsDb':float(10*np.log10(np.mean(stereo**2)))}

durations={'paper-pop':.28,'paper-flip':.28,'card-slide':.48,'card-drag':1.2,'elastic-pull':1.2,'wood-tap':.22,'soft-land':.30,'bag-drop':.31,'ui-tap':.16,'brake-stop':.36,'discovery-tick':.30,'glass-tap':.25,'scan-brush':.48,'celebrate':.45,'rewind':.65}
metrics={kind:create(kind,duration) for kind,duration in durations.items()}
index=json.loads((p/'assets/index.json').read_text(encoding='utf-8'))
index['items']=[a for a in index['items'] if not a['id'].startswith('foley-')]
for kind,duration in durations.items():
    index['items'].append({'id':'foley-'+kind,'path':'action-foley/'+kind+'.wav','type':'audio','source':'本期build-action-foley.py原创程序拟音；不是实录，也不是AI作曲','license':'本期原创，无第三方采样','sound':{'instrument':kind,'pitches':[],'durationSeconds':duration,'attackSeconds':.004,'tailSeconds':max(.01,duration-.08),'tags':['original','cartoon','action-foley','percussive'],'roles':['accent','start','end','transition','process']}})
(p/'assets/index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Each entry names the visible content event and, where needed, its landing offset.
specs=[
 ('deal.offer',.08,'paper-pop','accent',.72,'卖家报价气泡和价格贴纸出现'),
 ('deal.counter',.08,'paper-pop','accent',.72,'买家还价气泡出现'),
 ('deal.celebrate',.08,'celebrate','accent',.65,'省400的庆祝与纸屑散开'),
 ('deal.question',.02,'brake-stop','accent',.61,'庆祝停止，人物惊讶并反问'),
 ('trap.anchor',.08,'soft-land','accent',.76,'2000元报价贴纸落到判断起点'),
 ('trap.thought',.10,'card-slide','accent',.66,'1600元标签与牵引线出现'),
 ('trap.pull',.15,'elastic-pull','process',.72,'判断标签被报价牵住；短持续声表示牵引过程'),
 ('trap.pull',1.60,'wood-tap','end',.67,'牵引位置到达动画终点'),
 ('trap.result',.15,'paper-pop','accent',.64,'锚定效应标签落定'),
 ('rewind.reset',.02,'rewind','transition',.67,'回退图标旋转，重新回到开价前'),
 ('rewind.ask',.10,'paper-pop','accent',.68,'人物问报价依据'),
 ('rewind.target',.12,'paper-flip','accent',.69,'书本与检查便签展开'),
 ('evidence.inspect',.02,'scan-brush','process',.61,'放大镜开始扫描商品；短摩擦声表示检查'),
 ('evidence.condition',.06,'discovery-tick','accent',.69,'发现机身磨损并出现标记'),
 ('evidence.accessory-check',.03,'scan-brush','process',.57,'放大镜移动到配件位置'),
 ('evidence.accessory-check',.65,'ui-tap','accent',.69,'发现配件缺失，红叉与人物反应对应'),
 ('evidence.records',.02,'card-slide','accent',.64,'手指滑动，成交记录进入'),
 ('evidence.records',.20,'paper-flip','accent',.64,'第一张成交记录翻出'),
 ('evidence.records',.54,'paper-flip','accent',.64,'第二张成交记录翻出'),
 ('evidence.records',.88,'paper-flip','accent',.64,'第三张成交记录翻出'),
 ('evidence.range',.15,'card-drag','process',.68,'价格从记录取出，移动归组到比较线上'),
 ('evidence.settle',.02,'soft-land','end',.75,'可比成交区间归组完成'),
 ('reprice.reason',.10,'paper-flip','accent',.65,'参考成交价格出现'),
 ('reprice.offer',.08,'card-drag','process',.65,'把1200元从比较区拖到自己的报价位置'),
 ('reprice.offer',1.30,'soft-land','end',.72,'1200元报价完成移动并落定'),
 ('reprice.exit',.12,'paper-pop','accent',.61,'保留换一家或不成交的选择'),
 ('shop.old',.10,'paper-pop','accent',.68,'原价999标签出现'),
 ('shop.sale',.12,'soft-land','accent',.75,'199元到手价贴纸落下'),
 ('shop.joy',.10,'paper-pop','accent',.65,'赶紧下单的对话出现，手指靠近付款区'),
 ('shop.pause',.02,'brake-stop','accent',.66,'手指收回，付款冲动暂停'),
 ('shop.pause',.12,'ui-tap','accent',.65,'暂停付款按钮改变状态；不是付款成功音'),
 ('compare.hide',.03,'paper-flip','accent',.62,'收起原价数字'),
 ('compare.history',.12,'paper-flip','accent',.67,'近期常态售价记录进入'),
 ('compare.others',.10,'card-drag','process',.64,'把本店199元标签移到实际价格比较区'),
 ('compare.others',.16,'paper-flip','accent',.63,'其他店到手价进入比较'),
 ('compare.others',1.36,'soft-land','end',.70,'价格在比较区落定'),
 ('compare.decision',.12,'paper-flip','accent',.64,'翻出预算和需求便签'),
 ('compare.settle',.08,'ui-tap','end',.68,'完成比较，回到自己的购买判断'),
 ('close.first',.90,'glass-tap','end',.65,'放大镜收进袋子'),
 ('close.second',.90,'paper-flip','end',.65,'反证记录收进袋子'),
 ('close.third',.90,'wood-tap','end',.66,'比较尺收进袋子'),
 ('close.result',.12,'paper-pop','accent',.63,'书籍出处与结束对话出现'),
]
old=json.loads((p/'audio-plan.json').read_text(encoding='utf-8'))
plan={'schemaVersion':2,'sampleRate':44100,'masterGain':.9,'buses':{'music':1,'accent':1,'end':1,'start':1,'transition':1,'process':.9},'reviewPolicy':{'maxConcurrentEffects':2,'maxProcessSeconds':1.5},'qualityPolicy':{'targetLufs':-18,'lufsTolerance':3,'maxTruePeakDb':-1,'minEffectRelativeDb':-9,'maxEffectRelativeDb':6},'clips':[],'cues':[],'rhythms':[],'ducking':[]}
music=dict(old['clips'][0]);music['gain']=.64;plan['clips'].append(music)
coverage=[]
for n,(event,offset,kind,role,gain,purpose) in enumerate(specs,1):
    duration=durations[kind];at={'event':event,'offset':offset}
    clip={'id':f'foley-{n:02d}','role':role,'source':'asset:foley-'+kind,'sourceIn':0,'sourceOut':duration,'at':at,'gain':gain,'fadeOut':.014,'purpose':purpose,'musicFit':'非旋律性的纸张/物件/界面拟音，配合02连续配乐与局部避让；金属瞬态不作调性协调断言，实际混合听感待用户试听'}
    if role=='process':clip['enabled']=True
    plan['clips'].append(clip)
    plan['ducking'].append({'id':f'foley-space-{n:02d}','at':at,'attack':.045,'hold':min(duration,.32),'release':.22,'gain':.68 if role!='process' else .76})
    coverage.append({'id':clip['id'],'event':event,'offset':offset,'kind':kind,'role':role,'purpose':purpose,'duration':duration,'state':'candidate-needs-listening'})
(p/'audio-action-candidate.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(p/'action-foley-coverage.json').write_text(json.dumps({'baseFilm':'outputs/thinking-anchors/full-motion-v1/video.mp4','videoChange':False,'musicSourceChange':False,'musicGainBefore':.88,'musicGainCandidate':.64,'effects':coverage,'metrics':metrics,'humanListening':'not-performed'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Generated {len(durations)} original foley assets and {len(specs)} synchronized action cues. Formal audio plan unchanged.')

"""Build the accepted everyday-life content revision; preserve the prior input set."""
from pathlib import Path
import copy
import json
import shutil

p = Path(__file__).resolve().parent
def read(name): return json.loads((p/name).read_text(encoding='utf-8'))
def write(name, value): (p/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

history = p/'history/book-experiment-v1'
if not history.exists():
    history.mkdir(parents=True)
    for name in ['project.json','storyboard.json','captions.json','audio-plan.json','facts.md','review.json','production-plan.json','visual-plan.json','assets/index.json']:
        dest=history/name; dest.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(p/name,dest)

scenes = [
    ('deal',14,'砍掉 400 元，真的省了吗？',{'reveal':.3,'offer':1,'counter':5,'celebrate':8,'question':11},
     ['卖家开价 2000 元，你还到 1600 元。','你觉得自己省了 400，正准备付款。','可你怎么知道，它本来就值 2000？']),
    ('trap',10,'第一个数字，成了你的起点',{'reveal':.3,'anchor':1.2,'thought':3.5,'pull':6,'result':8},
     ['先出现的 2000 元，可能悄悄成了判断起点。','你一直想着“便宜了多少”，估计便容易围着它打转。']),
    ('rewind',8,'换一种谈法，再来一次',{'reveal':.2,'reset':1,'ask':3,'target':5.5},
     ['书中讨论的一个办法，是主动寻找反对锚点的理由。','回到这笔交易：有什么证据支持，或推翻 2000 元？']),
    ('evidence',14,'先找不支持这个报价的证据',{'reveal':.2,'inspect':1.2,'condition':2,'records':5,'range':8,'settle':10},
     ['先检查：机身有磨损，配件也不齐。','再查同款、成色相近的实际成交记录。','这些证据，能帮你重新判断合理的价格范围。']),
    ('reprice',12,'按查到的依据出价',{'reveal':.2,'reason':1,'offer':4,'reply':7,'exit':9.5},
     ['例如，查到的成交记录多在 1100 到 1300 元。','把成色和配件算进去，再决定自己的报价。','报价明显偏离依据时，可以换一家或放弃交易。']),
    ('shop',12,'“原价 999”，让 199 显得便宜',{'reveal':.3,'old':1,'sale':3,'joy':5,'pause':8},
     ['网购时，同样卖 199 元，前面多了一个“原价 999”。','你可能马上觉得：这次便宜了好多！','先问一句：这个“原价”，有依据吗？']),
    ('compare',12,'把折扣，换成真实价格来比',{'reveal':.3,'hide':1,'history':3,'others':5,'decision':8,'settle':10},
     ['查近期常态售价，也比较同款其他店的到手价。','再结合自己的需要和预算，判断 199 元值不值。','这样，你就多了几条独立依据来做决定。']),
    ('close',6,'下一次，先检查那个数字',{'reveal':.2,'first':.5,'second':2,'third':3.5,'result':4.5},
     ['问依据，找反证，再比较。练习减少锚定的影响。']),
]
segments=[]; captions=[]; total=0
notes={
    'deal':'生活情境为原创示例｜金额虚构',
    'trap':'《思考，快与慢》· 锚定效应｜机制示意',
    'rewind':'书中原则：寻找反对锚点的理由｜概念转述',
    'evidence':'反向思考的生活化应用｜商品与成交记录均为剧情设定',
    'reprice':'价格比较为生活化应用｜方法帮助减少影响，不保证消除偏差',
    'shop':'生活情境为原创示例｜划线价不自动证明商品价值',
    'compare':'查价、预算为书中原则的生活化应用｜金额虚构',
    'close':'依据《思考，快与慢》锚定相关讨论改编',
}
for sid,duration,title,events,lines in scenes:
    segments.append({'id':sid,'durationSeconds':duration,'intent':title,'sceneType':'anchor-life','events':events,'props':{'title':title,'mode':sid,'note':notes[sid]}})
    for i,line in enumerate(lines):
        a=round(i*duration/len(lines)*30)/30; b=round((i+1)*duration/len(lines)*30)/30
        captions.append({'id':f'{sid}-{i}','segmentId':sid,'start':a,'end':b,'text':line})
    total+=duration
write('storyboard.json',{'segments':segments}); write('captions.json',{'items':captions})
project=read('project.json'); project['title']='你真的买便宜了吗？｜锚定效应'
project['content']={'question':'砍价成功和大幅打折，为什么仍可能买贵？','takeaway':'问报价依据，主动找反证，再用可比信息和自己的目标作判断。'}; write('project.json',project)
brief=read('next-revision-brief.json'); sources=[{'title':s['title'],'reference':s['url']} for s in brief['research']['sources']]
changes={
 'deal':'同一台二手咖啡机，卖家2000元、买家1600元的气泡依次出现；庆祝后出现疑问。',
 'trap':'同一个2000元标签变成固定起点，买家的1600估计沿尺移动，关系线保留参照。',
 'rewind':'对话倒回开价前，买家取出检查清单，提出对报价依据的疑问。',
 'evidence':'同一咖啡机的磨损和缺失配件被标出；同款相近成色的1100/1200/1300元成交记录进入画面；2000报价被质疑，形成1100–1300的参考区间。',
 'reprice':'买家展示成色和成交依据，再提出1200元的剧情报价；显示另一家和离开交易的选择。',
 'shop':'同一外套先出现999划线价，再出现199到手价；买家暂停，检查原价依据。',
 'compare':'收起划线价，改看剧情中的近期常态价与其他店到手价；再和需求、预算比较。',
 'close':'把问依据、找反证、再比较三个动作落成便签，人物带着清单离开。',
}
production={'schemaVersion':1,'specification':{**project['video'],'narration':False,'captions':'zh-CN','targetDurationSeconds':total},'topic':{'title':project['title'],'audience':'普通消费者，无心理学专业背景','question':project['content']['question'],'takeaway':project['content']['takeaway']},'research':{'status':'verified','sources':sources,'boundaries':brief['content']['boundaries']},'outline':[{'segmentId':s['id'],'point':s['intent']} for s in segments],'scenePlan':[{'segmentId':s['id'],'sceneType':s['sceneType'],'purpose':s['intent'],'change':changes[s['id']]} for s in segments],'representative':{'from':34,'to':44,'stillTime':43,'reason':'验证二手砍价的应对方法：标出磨损与缺失配件→加入同款相近成色成交记录→形成有证据的价格区间。包含核心机制、漫画动作和关键音效，保留全片34–44秒时钟。'}}
write('production-plan.json',production)

shutil.copyfile(Path(brief['music']['path']),p/'assets/storytelling.m4a')
index=read('assets/index.json')
bed=next(a for a in index['items'] if a['id']=='anchors-bed')
bed.update({'path':'storytelling.m4a','source':'用户明确指定 D:/Documents/dy/音频/02_情感话题_故事讲述.m4a','license':'用户提供用于本期本地制作；公开传播权未核实'})
write('assets/index.json',index)
clips=[{'id':'continuous-bed','role':'music','source':'asset:anchors-bed','sourceIn':0,'sourceOut':total,'at':0,'speed':1,'gain':.88,'fadeIn':.45,'fadeOut':1.8}]
actions=[('deal.offer','bubble-pop',.1,'卖家报价气泡出现'),('deal.counter','bubble-pop',.1,'买家还价气泡出现'),('deal.question','wheel-stop',.05,'庆祝暂停并提出价格依据疑问'),('rewind.reset','wheel-stop',0,'回到报价起点，启动重新检查'),('evidence.condition','wheel-stop',.1,'磨损与配件缺失标记出现'),('evidence.records','bubble-pop',.1,'可比较的成交记录进入'),('evidence.settle','result-land',0,'有证据的价格区间落定'),('reprice.offer','bubble-pop',.1,'提出依据成色与成交记录的报价'),('shop.old','bubble-pop',.1,'划线价出现'),('shop.sale','bubble-pop',.1,'到手价出现'),('shop.pause','wheel-stop',0,'暂停付款，检查原价依据'),('compare.others','bubble-pop',.1,'其他店到手价进入比较'),('compare.settle','result-land',0,'结合需求与预算的判断落定'),('close.result','result-land',0,'三个应对动作收束')]
ducks=[]
for n,(event,asset,offset,purpose) in enumerate(actions):
    duration={'wheel-stop':.13,'bubble-pop':.16,'result-land':.23}[asset]; at={'event':event,'offset':offset}
    clips.append({'id':f'action-{n+1}','role':'end' if asset=='result-land' else 'accent','source':f'asset:{asset}','sourceIn':0,'sourceOut':duration,'at':at,'gain':.62 if asset=='result-land' else .55,'fadeOut':.012,'purpose':purpose,'musicFit':'与用户指定02音乐混合的短非旋律原创瞬态；轻微避让，实际听感待用户试听'})
    ducks.append({'id':f'space-{n+1}','at':at,'attack':.04,'hold':.13,'release':.22,'gain':.78})
write('audio-plan.json',{'schemaVersion':2,'sampleRate':44100,'masterGain':.9,'buses':{'music':1,'accent':1,'end':1,'start':1,'transition':1,'process':.5},'reviewPolicy':{'maxConcurrentEffects':2,'maxProcessSeconds':1.5},'clips':clips,'cues':[],'rhythms':[],'ducking':ducks})
review={'facts':{'state':'source-checked','sources':'《思考，快与慢》Anchors章；2000反向思考研究；2001谈判关注点研究','boundaries':brief['content']['boundaries']},'visual':{'selected':'comic','scope':'新生活案例版；等待新的代表样片反馈'},'audio':{'state':'user-selected-needs-mix-listening','music':brief['music']['path'],'humanListening':'not-performed'},'approval':{'style':'用户：选择新b漫画实验室','contentDirection':'用户：可以（双案例、书中应对方法、75–90秒建议）','sampleApproved':False,'sampleViewed':False,'sampleListened':False},'history':'原输入保留在history/book-experiment-v1，旧样片保留在outputs/thinking-anchors/sample-comic-v1'}
write('review.json',review)
brief['stage']='accepted-direction-in-production';brief['content']['selectedScenario']='二手砍价主故事 + 网购折扣延伸';brief['content']['note']='用户已回复可以；进入新版分镜与代表样片制作，尚未批准新样片';brief['music']['sourceRange']=[0,total];brief['nextStep']='交付新的34–44秒有声代表样片，再按真实反馈分段制作';write('next-revision-brief.json',brief)
(p/'facts.md').write_text('''# 你真的买便宜了吗？锚定效应生活案例版

## 知识依据

1. Daniel Kahneman, Thinking, Fast and Slow (2011)，第11章 Anchors。核实副本：https://cpcglobal.org/publications/Thinking%20Fast%20and%20Slow.pdf 。PDF第133页，原检索行3869–3884。主动寻找反对锚点的理由；对明显离谱的报价，不继续以该数字为谈判起点。片中使用原创中文转述，不引用书中原句。
2. Mussweiler, Strack & Pfeiffer (2000), Overcoming the Inevitable Anchoring Effect: Considering the Opposite Compensates for Selective Accessibility. https://journals.sagepub.com/doi/10.1177/01461672002611010 。在所测试的条件下，列举反对锚点的理由能减轻影响；不保证任何情境均有效。
3. Galinsky & Mussweiler (2001), First offers as anchors. https://pubmed.ncbi.nlm.nih.gov/11642352/ 。把注意力转向自己的目标或对方的替代选择，可改变所测谈判中首个报价的影响。

## 剧情和应用边界

二手咖啡机2000→1600、成交记录1100/1200/1300、按成色出价1200；外套原价999、到手199、日常售价和其他店价格，全部为剧情设定。不是实际市场采样，不代表当前行情，也不是书中实验数据。成交记录设定为同款、成色相近；现实中仍要比较配件、售后等条件，不能只看数字。

查成色、查成交记录、核对常态售价和同款到手价、形成目标区间，是对书中原则的生活化应用；不声称书中给出这份购物步骤。预算上限用于约束支出，不等同于商品公允价值。寻找反证是检验报价，不是预设所有报价都虚高。片中目标是减少锚定影响，不承诺完全消除。

## 制作范围

沿用已选comic漫画风格。新稿88秒、1920×1080/30fps、中文字幕，无旁白。采用用户指定02_情感话题_故事讲述.m4a原素材0–88秒、不变速；三个原有短噪声瞬态复用于具体动作，不是AI作曲。代表样片选全片34–44秒，聚焦“寻找反对报价的证据”，避免只验证问题而没有方法。尚未记录新样片观看、试听或认可。
''',encoding='utf-8')
print(f'Prepared {total}s life revision, {len(segments)} scenes, {len(captions)} captions. Previous inputs archived.')

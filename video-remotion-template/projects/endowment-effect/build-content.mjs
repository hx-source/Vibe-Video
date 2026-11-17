import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const write=(file,value)=>fs.writeFileSync(path.join(dir,file),JSON.stringify(value,null,2)+'\n');
const project=JSON.parse(fs.readFileSync(path.join(dir,'project.json'),'utf8'));
project.content={question:'为什么同一件东西，买时嫌贵，到手后却舍不得卖？',takeaway:'拥有会改变得失的参照点；判断去留时，试着从尚未拥有的角度重新估值，并保留真实的使用与情感价值。'};
write('project.json',project);
const cards=(id,duration,title,intent,items,note)=>({id,durationSeconds:duration,intent,sceneType:'cards',events:Object.fromEntries(items.map((item,i)=>['step-'+i,item[2]])),props:{title,note,cards:items.map(([title,body],i)=>({title,body,event:'step-'+i}))}});
const segments=[
 cards('question',16,'买的时候嫌贵，卖的时候舍不得。','先让同杯不同身份的矛盾发生；金额为虚构示例。',[
  ['还没拥有','30 元？有点贵。',0],['刚刚到手','60 元？也不想卖。',5],['同一只杯子','为什么一变成“我的”，心理价就变了？',10]
 ],'生活情境示意 · 金额为虚构，不是实验数据'),
 cards('experiment',18,'随机分到杯子的人，估值更高。','用经典实验说明，差异可以在没有长期使用回忆时出现。',[
  ['买者','$2.87\n最高愿付价格的中位数',0],['卖者','$7.12\n最低愿售价格的中位数',5],['选择者','$3.12\n在杯子与现金之间选择',10]
 ],'Kahneman、Knetsch、Thaler，1990，实验 6 · 77 名学生 · 美元'),
 {id:'mechanism',durationSeconds:18,intent:'保持同一只杯子，展示归属改变参照点，得到变成失去。',sceneType:'endowment',events:{reveal:0,own:2.5,loss:5.5,result:9},props:{title:'杯子没变，“我的”改变了判断。',mode:'ownership',layout:'fullbleed'}},
 cards('name',16,'这就是“禀赋效应”。','在机制之后给术语，区分拥有与长期感情，避免把使用价值全部当作偏差。',[
  ['拥有改变估值','同类物品，拥有者可能更不愿放手。',0],['一种经典解释','放弃已有之物，被体验为损失。',5],['不必相处很多年','随机刚拿到的杯子，也可能出现差异。',10]
 ],'损失厌恶是经典解释；效应强弱受情境与实验程序影响'),
 cards('boundary',12,'“不想卖”，也可能有好理由。','限定解释范围；不把真实情感价值或所有买卖价差诊断为偏差。',[
  ['真实价值','好用、有回忆，都可以成为保留的理由。',0],['识别边界','交易成本、信息和报价规则，也会影响买卖价差。',5]
 ],'买卖价差本身不足以单独证明禀赋效应'),
 cards('reset',14,'换个位置，重新问自己。','给出从未拥有角度的思考提示，以当下价值收束。',[
  ['假设它还不是我的','今天，我愿意花多少钱买回来？',0],['把理由说具体','我需要它的功能，还是它承载的回忆？',5],['重新决定去留','用今天的使用价值与情感价值来判断。',9]
 ],'这是一种重新审视的提示，不保证消除偏差')
];
write('storyboard.json',{segments});
const captionLines={
 question:[[0,4.6,'买杯子时，30 元你嫌贵。'],[5,9.6,'可它刚变成你的，60 元你也舍不得卖。'],[10,15.8,'杯子没变，为什么心理价变了？']],
 experiment:[[0,4.6,'研究者把学生随机分组，其中一组得到杯子。'],[5,9.6,'买者与卖者，对同类杯子给出了不同估值。'],[10,17.7,'还有一组，只需要在杯子和现金之间选择。']],
 mechanism:[[0,4.8,'还没拥有时，你想的是：得到一只杯子。'],[5.5,10.5,'已经拥有时，卖掉就成了：失去我的杯子。'],[11,17.7,'损失厌恶，是解释这种估值变化的经典思路。']],
 name:[[0,4.6,'仅仅拥有，就可能让你更不愿意放手。'],[5,9.6,'这种现象，被称为禀赋效应。'],[10,15.7,'它可以很快出现，不必等到物品积累了回忆。']],
 boundary:[[0,4.6,'但好用、有回忆，也确实是价值。'],[5,11.7,'不能把每次舍不得卖，都归结为禀赋效应。']],
 reset:[[0,4.6,'试着问：如果还没拥有，我愿意花多少买它？'],[5,8.7,'再把功能、回忆和交易成本分开想。'],[9,13.7,'从今天的需要出发，重新决定去留。']]
};
write('captions.json',{items:segments.flatMap(s=>captionLines[s.id].map(([start,end,text],i)=>({id:s.id+'-'+i,segmentId:s.id,start,end,text})))});
write('review.json',{schemaVersion:1,facts:{state:'sources-checked',note:'原始论文与后续方法研究已核实，详见 facts.md；未逐页核对中文版书籍。'},visual:{state:'pending',note:'仅核心机制片段实现三种风格；其余为内容结构，选定风格后细化。'},audio:{state:'pending',note:'当前三方案为静帧，无配乐；十秒有声样片待选择风格后制作。'}});
const representative={from:35,to:45,stillTime:44,reason:'全片 34–52 秒是核心机制段。35–45 秒覆盖杯子归属、得到到失去的视角变化与结论落定，能验证关键美术、主体连续性和后续音效。'};
const outline=segments.map(s=>({segmentId:s.id,point:s.intent}));
const changes=[
 '保持杯子外形：买者拒绝 30 元 → 归属交接 → 拥有者拒绝 60 元；不得画成市场涨价。',
 '随机分组 → 同类杯子 → 三组估值分别出现；横条从同一零点按金额比例绘制，单位美元，中位数标签常驻。',
 '未拥有的得到 → 同一只杯子被标为我的 → 拥有者面对放弃；人物/节点、关系线与杯子同步，而非只换字幕。',
 '沿用我的杯子与得失关系 → 给出禀赋效应术语 → 补充无需长期回忆；不重复第二个同构案例。',
 '杯子延续 → 分出功能、回忆、交易成本 → 说明高报价并非自动等于偏差；不使用对错印章。',
 '我的标签暂时移开 → 假设尚未拥有 → 回看功能与回忆 → 自己作去留判断。'
];
write('production-proposal.json',{
 schemaVersion:1,specification:{...project.video,narration:false,captions:'zh-CN',targetDurationSeconds:94},
 topic:{title:project.title,audience:'读过或没读过原书的普通中文观众',...project.content},
 research:{status:'verified',sources:[
 {title:'Kahneman, Knetsch & Thaler (1990), Experimental Tests of the Endowment Effect and the Coase Theorem',reference:'https://www.journals.uchicago.edu/doi/abs/10.1086/261737'},
 {title:'原始研究全文，实验 6，印刷页 1339',reference:'https://econreadinggroup.github.io/assets/Kahneman%20et%20al.%20(1990,%20JPE).pdf'},
 {title:'Plott & Zeiler (2011), 方法研究回复及实验程序影响',reference:'https://authors.library.caltech.edu/records/vs51x-4fg90'}
 ],boundaries:'依据《思考，快与慢》禀赋效应主题作原创解释；未声称逐字引用或逐页核对中译本。生活开头为虚构示例，实验数据为第6组77名学生、美元中位数；损失厌恶为经典解释，并非唯一已证实机制；不将所有不愿出售视为偏差。'},
 outline,scenePlan:segments.map((s,i)=>({segmentId:s.id,purpose:s.intent,change:changes[i],sceneType:s.sceneType,implementation:i===2?'三种实际风格已实现，动作待十秒样片验证':'内容结构已填写，专属画面待风格选择后实现',reading:'金额、物品与关键身份保持；字幕动作错开，最后结论在动作落定后稳定呈现。'})),
 representative,preflight:{core:'从同杯、同人拥有前后的矛盾切入；实验用随机分组检验拥有影响，不声称对同一个人作了反复测量。',progression:'生活问题→实验→参照点与得失→术语→边界→重新审视；不堆砌多种商品重复同一机制。',focus:'核心始终是杯子及归属，颜色固定区分得到与失去，物体形状和大小不随估值改变。',transitions:'由问题追问证据，再由证据追问原因，机制落定后命名，边界回应是否都不理性，最后给提示。',scope:'本轮只比较核心机制的三种静帧；全片场景与声音仍待后续制作，不登记用户认可。'}
});
write('candidates-proposal.json',{candidates:[
 {id:'night',styleId:'night-story',label:'A · 聚光叙事',rationale:'深蓝空间聚焦同一只杯子，左右人物呈现得到与失去，适合突出“舍不得”的心理变化。',motion:'杯子保持原位，归属标签落下，右侧人物与放弃关系出现，最后结论落定。'},
 {id:'clear',styleId:'clear-diagram',label:'B · 清晰图解',rationale:'两块浅色网格面板固定拥有前后的参照，编号式身份节点突出机制，适合快速读懂因果。',motion:'未拥有节点先出现，关系线连接杯子，已拥有节点接入，红色损失解释随后出现。'},
 {id:'paper',styleId:'paper-sketch',label:'C · 纸本手绘',rationale:'暖纸双页配简笔人物，像翻开读书笔记；朱红下划线把注意力留在“我的”与“失去”。',motion:'同杯连接两张纸页，我的标签落定后呈现右侧表情与朱红划线，保留足够阅读停留。'}
]});
console.log('已写入 94 秒内容结构、字幕、来源计划及三方案提案。');

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const read=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
const write=(f,v)=>fs.writeFileSync(path.join(dir,f),JSON.stringify(v,null,2)+'\n');
const storyboard=read('storyboard.json'),captions=read('captions.json'),audioPlan=read('audio-plan.json');
const s=storyboard.segments.find(s=>s.id==='mechanism');
s.events={reveal:0,'buy-refusal':1.2,own:4,loss:6,'sale-refusal':6.8,result:8.3};
s.intent='同一人物、杯子与30元：先嫌贵不买，免费获赠后不愿以30元卖出；下方保留两次交换判断，明确拥有造成的视角改变。';
s.props.title='买时嫌贵，卖时舍不得。';
s.props.note='思考，快与慢 禀赋效应 生活示意 30元为假设金额 同一个人 同一只杯子 同样30元 想买它 获赠杯子 有人收购 30元？有点贵。是我的了。30元？不卖。30元，卖给你？我的 店里的报价 杯子送给你 现在有人出价 免费获赠 ¥30 买这只杯子 卖给我，可以吗？不买 不卖 拥有前 买入 拥有后 卖出 付30元 得到杯子 嫌贵 交出我的杯子 收30元 舍不得 一旦成了“我的”，放弃就更难。';
captions.items=captions.items.filter(c=>c.segmentId!=='mechanism');
captions.items.push(
 {id:'mechanism-0',segmentId:'mechanism',start:0,end:3.8,text:'同一个人，30元买这只杯子，他嫌贵。'},
 {id:'mechanism-1',segmentId:'mechanism',start:4,end:5.9,text:'现在，这只杯子免费送给他。'},
 {id:'mechanism-2',segmentId:'mechanism',start:6,end:8.2,text:'有人出30元收购，他却不愿卖。'},
 {id:'mechanism-3',segmentId:'mechanism',start:8.3,end:17.7,text:'成为“我的”之后，放弃就更难。'}
);
const ownSound=audioPlan.clips.find(c=>c.id==='ownership-land');ownSound.purpose='同一只杯子移到同一人物手中，我的标签落定，提示免费获赠改变了归属';
const lossSound=audioPlan.clips.find(c=>c.id==='protect-cup');lossSound.at={event:'mechanism.sale-refusal',offset:0};lossSound.purpose='同一人拒绝30元收购并把杯子收回，短布料声跟随手臂回收';
const endSound=audioPlan.clips.find(c=>c.id==='meaning-settles');endSound.purpose='下方两次交换判断完整呈现，禀赋效应的简短结论落定';
write('context-v5-proposal.json',{storyboard,captions,audioPlan});
const plan=read('production-plan.json'),sp=plan.scenePlan.find(s=>s.segmentId==='mechanism');
sp.purpose=s.intent;sp.change='店内标价30元→同一人嫌贵→明示免费获赠→同一只杯子移到手中并落下我的标签→有人同价收购→人收回杯子并拒绝。下方两栏保留付钱换杯与交杯换钱的相反方向及判断。';
sp.implementation='A聚光叙事采用一个持续人物与杯子，上部具体情境、下部动态图解。人物手臂使用固定长度关节；无底部叙述字幕。';
sp.reading='买入3秒、获赠2秒、同价收购与拒绝2.3秒、比较结论2.7秒；下方第一栏保留，第二栏随收购显现。短对话与金额留在对应人物/物件旁，底部不滚动长句。';
plan.preflight.scope='用户反馈v4下方空旷且表达不明；本轮重构34–52秒机制段，并交35–45秒十秒样片。A配色与主要图元沿用，旧样片保留。';
plan.preflight.contextRevision={feedback:'下方的区域有点空旷，而且并不知道你在表达什么',diagnosis:'两个人之间转移杯子容易看成转交；拥有转变缺少明确原因；底部没有保留比较依据。',fix:'同人、同杯、同价，明确免费获赠。下方记录交换方向与决策，归属和得失有具体触发。',boundary:'30元为虚构生活例子；不声称实验对同一个人做了上述测量，也不把心理由图示定量化。'};
write('context-v5-production-proposal.json',plan);
console.log('已生成局部事件、字幕、音效与制作计划提案；尚未改正式配置。');

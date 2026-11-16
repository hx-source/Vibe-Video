import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {prepare} from '../../scripts/prepare.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),name=process.argv[2]??'used-evidence-v1';
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid revision');
const previous='outputs/thinking-anchors/live-decision-v2';
const accepted={status:'user-approved',rangeSeconds:[24,32],revision:'live-decision-v2',preview:previous+'/video.mp4',videoSha256:sha(path.join(ROOT,previous,'video.mp4')),continuity:previous+'/continuity-0-32.mp4',continuitySha256:sha(path.join(ROOT,previous,'continuity-0-32.mp4')),feedback:'这部分可以，接下来继续制作32到46秒，注意从前面的直播间查价自然过渡到二手砍价，讲清楚怎么检查商品、查成交记录来减少锚定效应的影响。',userApproval:true,viewedAndListenedNotSeparatelyRecorded:true,scope:'Delivered 24–32s only; subsequent segment and full film remain pending'};
const acceptanceFile=path.join(dir,'live-decision-v2-acceptance.json');if(!fs.existsSync(acceptanceFile))writeJson(acceptanceFile,accepted);
const ledger=json(path.join(dir,'segment-production.json'));Object.assign(ledger.segments.find(s=>s.id==='rewind'),{status:'approved',userApproved:true,revision:'live-decision-v2',feedback:accepted.feedback,approval:'live-decision-v2-acceptance.json'});writeJson(path.join(dir,'segment-production.json'),ledger);
const board=json(path.join(dir,'storyboard.json')),segment=board.segments.find(s=>s.id==='evidence');
Object.assign(segment.events,{'case-bridge':.3,'case-ready':1.8,reveal:.2,inspect:2.05,condition:2.7,'accessory-check':4,records:5.6,range:8.8,settle:10.8});
segment.intent='把直播间核查依据的方法用于二手砍价：检查成色配件，核对可比成交';segment.props.title='二手砍价，也先找依据';
writeJson(path.join(dir,'storyboard.json'),board);
const captions=json(path.join(dir,'captions.json'));
captions.items=[...captions.items.filter(c=>c.segmentId!=='evidence'),...[{start:0,end:1.8,text:'换到二手砍价，也先找依据。'},{start:1.8,end:5.6,text:'先检查：有磨损，配件也不齐。'},{start:5.6,end:8.8,text:'再查同款、成色相近的实际成交。'},{start:8.8,end:11.4,text:'例：可比成交1100–1300元。'},{start:11.4,end:14,text:'结合成色、配件谈价，减少报价牵引。'}].map((c,i)=>({id:'evidence-'+i,segmentId:'evidence',...c}))];
captions.items.sort((a,b)=>board.segments.findIndex(s=>s.id===a.segmentId)-board.segments.findIndex(s=>s.id===b.segmentId)||a.start-b.start);writeJson(path.join(dir,'captions.json'),captions);
const production=json(path.join(dir,'production-plan.json'));
production.outline.find(s=>s.segmentId==='evidence').point=segment.intent;
Object.assign(production.scenePlan.find(s=>s.segmentId==='evidence'),{purpose:segment.intent,change:'先保持上一段末帧，再明确切到二手咖啡机与2000元开价；放大镜检查磨损和缺配件，三条同款成色相近成交1100/1200/1300逐个出现，再用框线圈定成交区间，结合成色配件重新谈价。沿用既有漫画与圈定区间方案，增加案例桥接并按新动作重排声音。'});writeJson(path.join(dir,'production-plan.json'),production);
const factsPath=path.join(dir,'facts.md'),heading='## 二手砍价应用段32–46秒';
if(!fs.readFileSync(factsPath,'utf8').includes(heading))fs.appendFileSync(factsPath,`\n\n${heading}\n\n从直播间查同款自然转入另一个生活场景：二手咖啡机开价2000。检查磨损与缺配件，再核对同款、成色相近的实际成交记录1100、1200、1300，形成示例比较区间并结合本机状况谈价。金额、商品、成色与成交记录全部为剧情设定，不是市场采样。成交记录不是挂牌价；现实中还需核对型号、交易条件、配件、售后及记录可信度。\n\n方法是把注意转向可核查证据，寻找不支持最初报价的理由，不是预设任何报价都虚高。三个示例记录不能证明普遍公允价值，区间也不是自动报价公式；原2000标签的淡化/划除只表示不再把它当唯一参照，不表示已完全消除锚定。沿用本文件既有书第11章和considering the opposite研究的应用边界。\n\n保护已认可0–32秒；本轮仅重做32–46秒，旧检查场景及试片保留，新增桥接与新的全片时刻音效同步。46秒后将继续讲有依据的出价与不成交选择，尚待后续逐段制作。\n`);
const plan=json(path.join(dir,'audio-live-decision-v2.json'));
const replaced=new Set(['b-comic-1','b-lens-accessory','b-record-row-1','b-record-row-2','b-record-row-3','outline-draw']);
if(plan.clips.filter(c=>replaced.has(c.id)).length!==6)throw Error('Expected six historical evidence cues');
plan.clips=plan.clips.filter(c=>!replaced.has(c.id));
const cues=[
 {id:'used-bridge',asset:'palette-cloth-two',event:'case-bridge',offset:.08,duration:.4150793650793651,gain:.5,role:'transition',purpose:'从查衣服价格切到二手咖啡机场景，短物件切换声'},
 {id:'used-inspect',asset:'palette-metal-detail',event:'inspect',offset:.15,duration:.4458503401360544,gain:.65,role:'accent',purpose:'放大镜靠近机身检查磨损时的细小物件声'},
 {id:'used-accessory',asset:'palette-cloth-two',event:'accessory-check',offset:.4,duration:.4150793650793651,gain:.6,role:'process',purpose:'放大镜移到缺配件位置，短摩擦声跟随实际移动'},
 {id:'used-record-1',asset:'record-paper-1-v1',event:'records',offset:.10,duration:.20,gain:1.15,role:'accent',purpose:'成交记录A单独出现'},
 {id:'used-record-2',asset:'record-paper-2-v1',event:'records',offset:.44,duration:.18034013605442178,gain:1.3,role:'accent',purpose:'成交记录B单独出现'},
 {id:'used-record-3',asset:'record-paper-3-v1',event:'records',offset:.78,duration:.20931972789115647,gain:.95,role:'accent',purpose:'成交记录C单独出现'},
 {id:'used-range',asset:'regroup-draw-v1',event:'range',offset:.10,duration:.85,gain:.78,role:'process',purpose:'框线圈定三条成交记录价格，短铅笔录音跟随实际绘框'}
];
for(const c of cues)plan.clips.push({id:c.id,source:'asset:'+c.asset,at:{event:'evidence.'+c.event,offset:c.offset},sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,role:c.role,enabled:true,fadeOut:.012,purpose:c.purpose,musicFit:'02配乐按全片原时钟继续，0–32秒已认可混音保持；沿用此前检查与记录的物件/纸张音色，分别跟随镜头检查、三条记录和一次绘框，不叠持续滑音或新旋律；实际听感待用户反馈'});
const planName=`audio-${name}.json`;writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),output=reserveOutput(p.id,name);prepare(p,output,{from:32,to:46});
writeJson(path.join(output,'segment-plan.json'),{segmentId:'evidence',rangeSeconds:[32,46],duration:14,events:segment.events,cues,acceptedPrevious:accepted,previousSourceHashes:Object.fromEntries(['scenes/AnchorLiveOpening.tsx','scenes/AnchorLiveMechanism.tsx','scenes/AnchorLiveDecision.tsx','scenes/OpeningActors.tsx'].map(f=>[f,sha(path.join(dir,f))])),caseTransition:'直播间查价→二手咖啡机开价2000→检查磨损和配件→查同款成色相近的成交→形成可比区间',groupingVariant:'outline inherited from the last displayed regroup option; this new whole segment still pending',examplePrices:[1100,1200,1300],allPricesFictional:true,music:'02_情感话题_故事讲述.m4a',musicSpeed:1,noNarration:true,noFixedBottomExplanations:true,userApproval:false,assistantListening:'not-performed',nextSegment:'46–58秒：结合商品状况和成交依据出价，可比较其他选择或不成交'});
console.log(JSON.stringify({output,frames:420,range:[32,46]}));

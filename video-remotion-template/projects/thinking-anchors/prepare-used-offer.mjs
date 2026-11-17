import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {prepare} from '../../scripts/prepare.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),name=process.argv[2]??'used-offer-v1';
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid revision');
const previous='outputs/thinking-anchors/used-evidence-v1';
const accepted={status:'user-approved',rangeSeconds:[32,46],revision:'used-evidence-v1',preview:previous+'/video.mp4',videoSha256:sha(path.join(ROOT,previous,'video.mp4')),continuity:previous+'/continuity-0-46.mp4',continuitySha256:sha(path.join(ROOT,previous,'continuity-0-46.mp4')),feedback:'这部分可以，接下来继续制作46到58秒，注意衔接前面的成交区间和商品状况，讲清楚怎么依据这些信息出价，以及价格不合适时可以不成交。',userApproval:true,viewedAndListenedNotSeparatelyRecorded:true,scope:'Delivered 32–46s only; following segments and full film remain pending'};
const acceptanceFile=path.join(dir,'used-evidence-v1-acceptance.json');if(!fs.existsSync(acceptanceFile))writeJson(acceptanceFile,accepted);
const ledger=json(path.join(dir,'segment-production.json'));Object.assign(ledger.segments.find(s=>s.id==='evidence'),{status:'approved',userApproved:true,revision:'used-evidence-v1',feedback:accepted.feedback,approval:'used-evidence-v1-acceptance.json'});writeJson(path.join(dir,'segment-production.json'),ledger);
const board=json(path.join(dir,'storyboard.json')),segment=board.segments.find(s=>s.id==='reprice');
Object.assign(segment.events,{basis:.3,offer:3.1,reply:6,leave:8.5,choice:9.1});
segment.intent='结合可比成交、磨损与配件说明自己的报价，谈不拢也可以不成交';segment.props.title='依据讲清楚，价格不合适就不成交';
writeJson(path.join(dir,'storyboard.json'),board);
const captions=json(path.join(dir,'captions.json'));
captions.items=[...captions.items.filter(c=>c.segmentId!=='reprice'),...[{start:0,end:3.1,text:'参考成交区间，还要结合这台的成色与配件。'},{start:3.1,end:6,text:'例：说明商品状况后，提出1200元报价。'},{start:6,end:8.5,text:'卖家不接受，也不必急着加价。'},{start:8.5,end:12,text:'可以换一家，或暂时不买。'}].map((c,i)=>({id:'reprice-'+i,segmentId:'reprice',...c}))];
captions.items.sort((a,b)=>board.segments.findIndex(s=>s.id===a.segmentId)-board.segments.findIndex(s=>s.id===b.segmentId)||a.start-b.start);writeJson(path.join(dir,'captions.json'),captions);
const production=json(path.join(dir,'production-plan.json'));
production.outline.find(s=>s.segmentId==='reprice').point=segment.intent;
Object.assign(production.scenePlan.find(s=>s.segmentId==='reprice'),{purpose:segment.intent,change:'保持上段末帧后，重组1100–1300成交参考与磨损、缺配件两项依据；买家说明理由并提出1200示例报价，卖家不接受，买家收回报价，显示换一家或不买的选择。1200是剧情中的目标报价，不是取中点、按缺陷扣款的估值公式；没有付款成交。'});writeJson(path.join(dir,'production-plan.json'),production);
const factsPath=path.join(dir,'facts.md'),heading='## 二手出价与退出段46–58秒';
if(!fs.readFileSync(factsPath,'utf8').includes(heading))fs.appendFileSync(factsPath,`\n\n${heading}\n\n承接虚构成交区间1100–1300和本机磨损、缺配件，买家说明理由后提出1200元示例报价。1200只是剧情中的目标报价，不是由三笔成交取中点、给磨损或配件定额扣款算出的标准，也不证明公允价值。实际还需核对交易条件、商品性能、配件价值与记录可靠性，协商结果可以不同。\n\n卖家说这个价不卖后，买家没有为“砍价成功”急着加价，而是收回报价、选择再看看，也可以暂不购买。这是保留替代选择与不成交选择的生活化演示，不承诺只要不成交就完全避免锚定；方法是以自己的依据和约束做决定。沿用既有书第11章及谈判锚定研究的边界，不新增心理效应比例或真实交易数据。\n\n本轮只制作46–58秒，前0–46秒认可范围保留；58秒以后仍待逐段衔接。\n`);
const plan=json(path.join(dir,'audio-used-evidence-v1.json'));
const cues=[
 {id:'offer-basis',asset:'palette-paper-short',event:'basis',offset:.10,duration:.23061224489795917,gain:.75,role:'accent',purpose:'把已查成交区间与商品状况放在报价依据卡上'},
 {id:'offer-proposal',asset:'palette-paper-long',event:'offer',offset:.10,duration:.43045351473922905,gain:.7,role:'accent',purpose:'1200元示例报价卡出现，短纸张声跟随展开'},
 {id:'offer-reply',asset:'opening-ui-contact-v1',event:'reply',offset:.10,duration:.095,gain:1.8,role:'accent',purpose:'卖家回复这个价不卖，一次短消息提示'},
 {id:'offer-withdraw',asset:'palette-cloth-two',event:'leave',offset:.12,duration:.4150793650793651,gain:.55,role:'transition',purpose:'买家收回报价卡，短物件声跟随退出动作'},
 {id:'offer-closed',asset:'regroup-contact-v2',event:'leave',offset:.80,duration:.11,gain:2.1,role:'end',purpose:'这次不成交状态落定，保留换一家或不买的选择'}
];
for(const c of cues)plan.clips.push({id:c.id,source:'asset:'+c.asset,at:{event:'reprice.'+c.event,offset:c.offset},sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,role:c.role,fadeOut:.012,purpose:c.purpose,musicFit:'保持02配乐全片原速与时钟、已认可0–46秒混音；纸张、短界面、物件撤回与轻接触分别配具体动作，无新旋律、长扫动或混响；实际听感待反馈'});
const planName=`audio-${name}.json`;writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),output=reserveOutput(p.id,name);prepare(p,output,{from:46,to:58});
writeJson(path.join(output,'segment-plan.json'),{segmentId:'reprice',rangeSeconds:[46,58],duration:12,events:segment.events,cues,acceptedPrevious:accepted,previousSourceHashes:Object.fromEntries(['scenes/AnchorLiveOpening.tsx','scenes/AnchorLiveMechanism.tsx','scenes/AnchorLiveDecision.tsx','scenes/OpeningActors.tsx','scenes/AnchorUsedEvidence.tsx','scenes/UsedEvidenceRegroup.tsx','scenes/RegroupStage.tsx','scenes/AnchorEvidenceMotion.tsx'].map(f=>[f,sha(path.join(dir,f))])),examplePrices:{range:[1100,1300],buyerOffer:1200},allPricesFictional:true,offerIsIllustrativeNotFormula:true,dealCompleted:false,options:['换一家看看','也可以不买'],music:'02_情感话题_故事讲述.m4a',musicSpeed:1,noNarration:true,noFixedBottomExplanations:true,userApproval:false,assistantListening:'not-performed',nextSegment:'58秒以后仍待逐段制作，需承接保留选择这一落点'});
console.log(JSON.stringify({output,frames:360,range:[46,58]}));

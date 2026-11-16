import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {prepare} from '../../scripts/prepare.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),name=process.argv[2]??'live-decision-v1';
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid revision');
const previous='outputs/thinking-anchors/live-mechanism-v1';
const accepted={status:'user-approved',rangeSeconds:[14,24],revision:'live-mechanism-v1',preview:previous+'/video.mp4',videoSha256:sha(path.join(ROOT,previous,'video.mp4')),continuity:previous+'/continuity-0-24.mp4',continuitySha256:sha(path.join(ROOT,previous,'continuity-0-24.mp4')),feedback:'这部分可以，接下来继续制作24到32秒，注意衔接前面“该用什么作依据”的问题，讲清楚生活中怎么避免锚定效应。',userApproval:true,viewedAndListenedNotSeparatelyRecorded:true,scope:'Only the delivered 14–24s segment; does not approve the following segment or full film'};
const acceptedFile=path.join(dir,'live-mechanism-v1-acceptance.json');if(!fs.existsSync(acceptedFile))writeJson(acceptedFile,accepted);
const ledger=json(path.join(dir,'segment-production.json'));Object.assign(ledger.segments.find(s=>s.id==='trap'),{status:'approved',userApproved:true,revision:'live-mechanism-v1',feedback:accepted.feedback,approval:'live-mechanism-v1-acceptance.json'});writeJson(path.join(dir,'segment-production.json'),ledger);
const board=json(path.join(dir,'storyboard.json')),segment=board.segments.find(s=>s.id==='rewind');
Object.assign(segment.events,{search:.3,history:1.25,other:2.55,compare:3.25,decision:5.3});
segment.intent='回答判断依据：主动找反证，查同款可比价，再按需求预算决定';segment.props.title='别只看降价，先查可比价格';
writeJson(path.join(dir,'storyboard.json'),board);
const captions=json(path.join(dir,'captions.json'));
captions.items=[...captions.items.filter(c=>c.segmentId!=='rewind'),...[{start:0,end:3.25,text:'先找反证，核对同款同条件的可比价格。'},{start:3.25,end:5.3,text:'例：199比189高10元。'},{start:5.3,end:8,text:'有需要、预算合适，再决定买不买。'}].map((c,i)=>({id:'rewind-'+i,segmentId:'rewind',...c}))];
captions.items.sort((a,b)=>board.segments.findIndex(s=>s.id===a.segmentId)-board.segments.findIndex(s=>s.id===b.segmentId)||a.start-b.start);writeJson(path.join(dir,'captions.json'),captions);
const production=json(path.join(dir,'production-plan.json'));
production.outline.find(s=>s.segmentId==='rewind').point=segment.intent;
Object.assign(production.scenePlan.find(s=>s.segmentId==='rewind'),{purpose:segment.intent,change:'承接199贵不贵该用什么作依据：999参照退出，打开同款同条件查价界面；近期常态价219与他店到手价189逐条进入，189被圈出，与直播间199相差10元。最后按需求和预算作决定，不直接下单。价格为虚构示例；不把预算当公允价值，也不保证消除偏差。'});writeJson(path.join(dir,'production-plan.json'),production);
const factsPath=path.join(dir,'facts.md'),heading='## 直播间方法段24–32秒';
if(!fs.readFileSync(factsPath,'utf8').includes(heading))fs.appendFileSync(factsPath,`\n\n${heading}\n\n直接回答上一段“该用什么作依据”：主动寻找反对199便宜的理由；核对同款、同条件的近期常态价与其他店到手价，再结合需要和预算决定是否购买。示例中的常态价219与他店到手价189均为虚构，与原事实边界一致；默认已核对同款同规格、运费及售后等比较条件，不是现实行情或书中实验。199与189相差10，只说明例中可比报价差异，不能据此声称199必然不值或189就是公允价值。219也保留了支持优惠的比较信息，不预设所有促销都虚假。\n\n“找反证”沿用书第11章与Mussweiler等的considering the opposite原则；核对可比价格是生活化应用，不冒称书中购物步骤。需求与预算用于独立约束购买，不代替价值判断。方法帮助减少锚定影响，不保证完全消除。示意中999退出仅表示转移注意与补充依据，不表示删除记忆或消除偏差。\n\n32秒后的二手咖啡机段保留原试片；后续需要明确案例切换，才能连成整片。\n`);
const plan=json(path.join(dir,'audio-live-mechanism-v1.json'));
const cues=[
 {id:'decision-search',asset:'opening-ui-contact-v1',event:'search',offset:.08,duration:.095,gain:1.6,role:'accent',purpose:'从直播参照切到查同款界面，一次短界面声'},
 {id:'decision-history',asset:'record-paper-1-v1',event:'history',offset:.08,duration:.20,gain:1.15,role:'accent',purpose:'近期常态价219单独进入，纸张短声跟随这一条记录'},
 {id:'decision-other',asset:'record-paper-2-v1',event:'other',offset:.08,duration:.18034013605442178,gain:1.3,role:'accent',purpose:'其他店189元到手价随后单独进入，使用另一段纸张采样'},
 {id:'decision-compare',asset:'pencil-underline-recorded-v1',event:'compare',offset:.05,duration:.235,gain:.9,role:'accent',purpose:'圈出189元记录并显示相差10元，一次短铅笔录音对应绘框'}
];
for(const c of cues)plan.clips.push({id:c.id,source:'asset:'+c.asset,at:{event:'rewind.'+c.event,offset:c.offset},sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,role:c.role,fadeOut:.012,purpose:c.purpose,musicFit:'02配乐按原全片时钟继续，已认可0–24秒混音保持；短界面、纸张、绘框声各对应具体动作，无持续扫动、额外旋律或混响；混合听感待用户反馈'});
const planName=`audio-${name}.json`;writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),output=reserveOutput(p.id,name);prepare(p,output,{from:24,to:32});
writeJson(path.join(output,'segment-plan.json'),{segmentId:'rewind',rangeSeconds:[24,32],duration:8,events:segment.events,cues,acceptedPrevious:accepted,previousSourceHashes:Object.fromEntries(['scenes/AnchorLiveOpening.tsx','scenes/AnchorLiveMechanism.tsx','scenes/OpeningActors.tsx'].map(f=>[f,sha(path.join(dir,f))])),actualPrice:199,exampleComparables:{recentRegularPrice:219,otherStoreTotalPrice:189,otherStoreDifference:10},music:'02_情感话题_故事讲述.m4a',musicSpeed:1,noNarration:true,noFixedBottomExplanations:true,method:'主动找反证→核对同款同条件到手价→结合需求预算决定；只能帮助减少影响',allPricesFictional:true,userApproval:false,assistantListening:'not-performed',nextSegment:'32–46秒二手砍价需明确案例转换；现有已保留片段未在本轮重做'});
console.log(JSON.stringify({output,frames:240,range:[24,32]}));

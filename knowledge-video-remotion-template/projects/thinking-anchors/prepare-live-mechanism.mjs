import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {prepare} from '../../scripts/prepare.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),name=process.argv[2]??'live-mechanism-v1';
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid revision');
const openingOutput='outputs/thinking-anchors/opening-live-v2';
const accepted={status:'user-approved',rangeSeconds:[0,14],revision:'opening-live-v2',preview:openingOutput+'/video.mp4',videoSha256:sha(path.join(ROOT,openingOutput,'video.mp4')),feedback:'这个开头可以，接下来继续制作14到24秒的部分，注意和前面直播间降价的内容衔接起来。',userApproval:true,viewedAndListenedNotSeparatelyRecorded:true,scope:'Only the delivered opening; does not approve the next segment or full film'};
const acceptanceFile=path.join(dir,'opening-live-v2-acceptance.json');
if(!fs.existsSync(acceptanceFile))writeJson(acceptanceFile,accepted);
const ledger=json(path.join(dir,'segment-production.json'));
Object.assign(ledger.segments.find(s=>s.id==='deal'),{status:'approved',userApproved:true,revision:'opening-live-v2',feedback:accepted.feedback,approval:acceptanceFile});
writeJson(path.join(dir,'segment-production.json'),ledger);

const board=json(path.join(dir,'storyboard.json')),trap=board.segments.find(s=>s.id==='trap');
Object.assign(trap.events,{shift:.3,recall:1.2,compare:3.2,name:6.2,question:7.3});
trap.intent='直播间里的999，怎样成为判断199的参照';trap.props.title='199便宜吗，你在和谁比较？';
writeJson(path.join(dir,'storyboard.json'),board);
const captions=json(path.join(dir,'captions.json'));
captions.items=[...captions.items.filter(c=>c.segmentId!=='trap'),...[{start:0,end:3.2,text:'遮住屏幕上的999，心里却可能仍拿它当参照。'},{start:3.2,end:6.2,text:'只算少了800，还没核查这件衣服本身值多少。'},{start:6.2,end:10,text:'这就是锚定的影响：最初的数字可能成为判断的参照。'}].map((x,i)=>({id:'trap-'+i,segmentId:'trap',...x}))];
captions.items.sort((a,b)=>board.segments.findIndex(s=>s.id===a.segmentId)-board.segments.findIndex(s=>s.id===b.segmentId)||a.start-b.start);
writeJson(path.join(dir,'captions.json'),captions);
const production=json(path.join(dir,'production-plan.json'));
production.outline.find(s=>s.segmentId==='trap').point=trap.intent;
Object.assign(production.scenePlan.find(s=>s.segmentId==='trap'),{purpose:trap.intent,change:'承接已认可直播间末帧：同一衣服、主播、观众与遮住原价的界面继续存在；199保持不变，999作为脑中参照浮现，绘出999−199=800，再显示锚定效应并追问判断依据。'});
writeJson(path.join(dir,'production-plan.json'),production);
const facts=path.join(dir,'facts.md'),heading='## 直播间机制段14–24秒';
if(!fs.readFileSync(facts,'utf8').includes(heading))fs.appendFileSync(facts,`\n\n${heading}\n\n承接0–14秒的同一虚构直播间。999元标注原价作为脑中参照重新出现，199元实际报价不改变，999−199=800只展示算术差与比较方式，不证明真的省钱。参考数字可影响价格评价，但不保证人人如此；“脑中的参照”是机制示意，不是脑成像或对真实观众心理的测量。遮住原价不是自动消除偏差，后续还需查同款、同条件实际售价。依据沿用本文件的Thinking, Fast and Slow第11章与既有锚定研究，未加入新的效应比例或实验数据。\n\n本段先解释现象，末尾追问判断依据。原24秒以后的咖啡机章节尚未重做；下轮应从该问题进入查证方法，再给二手砍价一个明确的生活场景切换。\n`);
const plan=json(path.join(dir,'audio-opening-live-v2.json'));
const cues=[
 {id:'mechanism-shift',asset:'palette-cloth-two',event:'shift',offset:.08,duration:.4150793650793651,gain:.6,role:'transition',purpose:'下单面板缩为保持199元的实际价格卡，短物件移动声'},
 {id:'mechanism-recall',asset:'palette-paper-short',event:'recall',offset:.08,duration:.23061224489795917,gain:.75,role:'accent',purpose:'脑中999元参照卡浮现，一次短纸张声'},
 {id:'mechanism-comparison',asset:'pencil-underline-recorded-v1',event:'compare',offset:.05,duration:.235,gain:.9,role:'accent',purpose:'999−199=800的比较线绘出，真实短铅笔声跟随绘线'},
 {id:'mechanism-name',asset:'regroup-contact-v2',event:'name',offset:.30,duration:.11,gain:2.4,role:'end',purpose:'锚定效应标签落定，一次短接触声'}
];
for(const c of cues)plan.clips.push({id:c.id,source:'asset:'+c.asset,at:{event:'trap.'+c.event,offset:c.offset},sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,role:c.role,fadeOut:.012,purpose:c.purpose,musicFit:'02背景音乐按全片原时钟继续，保持用户认可的0–14秒PCM；物件、纸张、绘线和落定短声分别对应动作，不铺持续滑音；实际搭配待用户试听'});
const planName=`audio-${name}.json`;writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),output=reserveOutput(p.id,name);
prepare(p,output,{from:14,to:24});
writeJson(path.join(output,'segment-plan.json'),{segmentId:'trap',rangeSeconds:[14,24],duration:10,events:trap.events,cues,acceptedOpening:accepted,openingSourceHashes:Object.fromEntries(['scenes/AnchorLiveOpening.tsx','scenes/OpeningActors.tsx'].map(f=>[f,sha(path.join(dir,f))])),actualPriceUnchanged:199,referencePrice:999,music:'02_情感话题_故事讲述.m4a',musicSourceRange:[0,88],musicSpeed:1,noNarration:true,noFixedBottomExplanations:true,userApproval:false,assistantListening:'not-performed',nextSegment:'24–32s: continue from evidence question; existing coffee draft still needs a clear bridge'});
console.log(JSON.stringify({output,frames:300,range:[14,24]}));

import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {prepare} from '../../scripts/prepare.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),name=process.argv[2]??'opening-live-v1';
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid revision name');
const events={drop:1.8,sale:3.6,pay:4.8,reach:7,pause:10,cover:10.5,compare:11.3};
const board=json(path.join(dir,'storyboard.json')),opening=board.segments.find(s=>s.id==='deal');
Object.assign(opening.events,events);opening.intent='直播间从999降到199，为什么会心动？';opening.props.title='从999降到199，你心动了吗？';
writeJson(path.join(dir,'storyboard.json'),board);
const production=json(path.join(dir,'production-plan.json'));
production.outline.find(s=>s.segmentId==='deal').point=opening.intent;
Object.assign(production.scenePlan.find(s=>s.segmentId==='deal'),{purpose:opening.intent,change:'直播间同一件外套报价999→599→199；观众觉得少花800而准备下单，随后收回手指、遮住原价、查同款到手价。沿用漫画场内表达、无底部固定说明。'});
writeJson(path.join(dir,'production-plan.json'),production);
const factsPath=path.join(dir,'facts.md'),heading='## 直播间开头修订';
if(!fs.readFileSync(factsPath,'utf8').includes(heading))fs.appendFileSync(factsPath,`\n\n${heading}\n\n用户选择直播间报价作为开头0–14秒的生活切口。同一件虚构外套由主播声称原价999，再报599、199；800仅为999减199的算术差，不证明真实节省或公允价值。没有实际平台、主播、行情或观众行为数据，不推断所有观众都会心动，也不把所有直播促销认定为欺骗。\n\n遮住原价后核查同款、同条件到手价，是主动寻找反对锚点理由的生活化做法，不声称书中提供直播购物操作清单或保证消除偏差。后续14–24秒应先承接999/199的机制，再引入二手砍价；旧后半段目前保留，整片衔接仍待制作。\n\n开场结构参考TikTok官方SMB Creative Playbook（https://ads.tiktok.com/business/library/TikTok_SMB_Creative_Playbook_2025.pdf）的前3–6秒钩子与后续内容相关原则。该资料是广告创作指南，不能证明本片会成为爆款。相关公开视频仅核对公开文案与页面信息，没有完成逐镜观看，未复制其素材或台词。\n`);
const captions=json(path.join(dir,'captions.json'));
captions.items=[...[{start:0,end:1.8,text:'主播先报：这件原价999元。'},{start:1.8,end:3.6,text:'从999降到599。'},{start:3.6,end:7,text:'再降到199，觉得少花了800。'},{start:7,end:10,text:'你心动了，正准备下单。'},{start:10,end:14,text:'先等等：遮住原价，查同款的实际到手价。'}].map((x,i)=>({id:'deal-'+i,segmentId:'deal',...x})),...captions.items.filter(c=>c.segmentId!=='deal')];
writeJson(path.join(dir,'captions.json'),captions);
const plan=json(path.join(dir,'audio-regroup-outline-v1.json'));
const cues=[
 {id:'live-quote',asset:'palette-paper-short',at:.08,duration:.23061224489795917,gain:.55,role:'start',purpose:'首屏展示主播报价999，短纸质标签声；原音乐开头较安静，采用较低增益'},
 {id:'live-drop',asset:'opening-ui-contact-v1',at:1.85,duration:.095,gain:2,role:'accent',purpose:'报价从999切为599，配一次短界面声'},
 {id:'live-sale',asset:'palette-paper-long',at:3.68,duration:.43045351473922905,gain:.7,role:'accent',purpose:'199元价格卡切入，与前一段短界面声形成区分'},
 {id:'live-payment',asset:'palette-cloth-two',at:4.88,duration:.4150793650793651,gain:.65,role:'transition',purpose:'下单界面出现，短物件滑动声对应界面进入'},
 {id:'live-pause',asset:'opening-ui-contact-v1',at:10.08,duration:.095,gain:1.5,role:'accent',purpose:'观众停住下单手指，按钮转为先查价格'},
 {id:'live-cover',asset:'palette-paper-short',at:10.64,duration:.23061224489795917,gain:.8,role:'transition',purpose:'纸片遮住999元标注原价，短声落在遮挡动作的中段'}
];
for(const c of cues)plan.clips.push({id:c.id,source:'asset:'+c.asset,at:c.at,sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,role:c.role,fadeOut:.012,purpose:c.purpose,musicFit:'保留02故事讲述音乐0–88秒原速、gain0.64；短纸张、界面和物件声跟随可见动作，无新增旋律、连续扫动或混响；实际混合听感待用户反馈'});
const planName=`audio-${name}.json`;writeJson(path.join(dir,planName),plan);
const p=loadProject('thinking-anchors',{audioPlan:planName}),output=reserveOutput(p.id,name);
prepare(p,output,{from:0,to:14});
writeJson(path.join(output,'opening-plan.json'),{kind:'live-sale',scope:[0,14],title:'从999降到199，你心动了吗？',summary:'999 → 599 → 199 → 觉得少花800、准备下单 → 停住手指、遮住原价、查同款到手价',style:'comic',music:'02_情感话题_故事讲述.m4a',narration:false,events,cues,burnedBottomExplanations:false,knowledgeBoundary:'全部商品、报价与角色均为虚构。原价999是主播声称的参照，未经核实，不代表真实价值；799等其他信息未加入。情境只演示锚定可能造成的影响，不证明所有观众都会心动或所有直播降价都是套路。遮住原价后查同款到手价是对寻找反证原则的生活化应用，不保证彻底消除偏差。',nextSegmentNeedsContinuityReview:true,nextSegmentNote:'旧14–24秒仍用咖啡机2000/1600展示机制；下一段制作需先承接本段999/199，再引入二手砍价实例，避免无解释切换商品。',sourceReferences:[{title:'TikTok SMB Creative Playbook: 前3–6秒建立与正文相关的钩子；广告创作指南，不等于知识视频效果保证',url:'https://ads.tiktok.com/business/library/TikTok_SMB_Creative_Playbook_2025.pdf'},{title:'Thinking, Fast and Slow, Chapter 11: 锚定与主动寻找反对锚点的理由；既有facts核实记录',url:'https://cpcglobal.org/publications/Thinking%20Fast%20and%20Slow.pdf'}],userChoice:'直播间报价：从“原价999”一路降到199，为什么会心动',userApproval:false,assistantListening:'not-performed'});
console.log(JSON.stringify({output,frames:420,range:[0,14]}));

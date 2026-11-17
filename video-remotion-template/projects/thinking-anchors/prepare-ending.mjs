import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson,reserveOutput} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {prepare} from '../../scripts/prepare.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),name=process.argv[2]??'ending-v1',history=path.join(dir,'history/before-ending-v1');
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid revision');
const previous='outputs/thinking-anchors/used-offer-v1';
const retained={status:'retained-for-complete-preview',rangeSeconds:[0,58],preview:previous+'/video.mp4',videoSha256:sha(path.join(ROOT,previous,'video.mp4')),continuity:previous+'/continuity-0-58.mp4',continuitySha256:sha(path.join(ROOT,previous,'continuity-0-58.mp4')),feedback:'可以，那就继续制作58秒之后的收尾，把前面两个案例的方法总结清楚，做好后先给我看一下效果。',continuationAuthorized:true,separateApprovalOf46to58NotRecorded:true,fullFilmApproval:false};
const retentionFile=path.join(dir,'used-offer-v1-continuation.json');if(!fs.existsSync(retentionFile))writeJson(retentionFile,retained);
const original=json(path.join(history,'storyboard.json'));
writeJson(path.join(history,'retired-tail.json'),{reason:'网购折扣案例已移到开头；按用户同意的方案在58秒后直接总结，完整试看片改为70秒',segments:original.segments.slice(5)});
const board=json(path.join(dir,'storyboard.json'));
board.segments=board.segments.filter(s=>!['shop','compare','close'].includes(s.id));
const ending={id:'close',durationSeconds:12,intent:'把两个案例归纳为问依据、找反证、比较可比信息、按需决定',sceneType:'anchor-story-motion',events:{reveal:.2,first:.5,second:2,third:3.5,result:4.5,ask:.3,counter:2,compare:3.7,decide:5.4,takeaway:7},props:{title:'先找依据，再做决定',mode:'close',note:'《思考，快与慢》锚定相关原则的生活化应用；方法帮助减少影响',layout:'fullbleed',captionPlacement:'scene'}};
board.segments.push(ending);writeJson(path.join(dir,'storyboard.json'),board);
const captions=json(path.join(dir,'captions.json'));
captions.items=[...captions.items.filter(c=>!['shop','compare','close'].includes(c.segmentId)),...[{start:0,end:3.7,text:'问报价依据，主动找反证。'},{start:3.7,end:7,text:'比较可比信息，再按需要和预算决定。'},{start:7,end:12,text:'便宜多少，要看它和谁比；买不买，要看自己的依据。'}].map((c,i)=>({id:'close-'+i,segmentId:'close',...c}))];writeJson(path.join(dir,'captions.json'),captions);
const production=json(path.join(dir,'production-plan.json'));production.specification.targetDurationSeconds=70;
production.outline=production.outline.filter(s=>!['shop','compare','close'].includes(s.segmentId));production.outline.push({segmentId:'close',point:ending.intent});
production.scenePlan=production.scenePlan.filter(s=>!['shop','compare','close'].includes(s.segmentId));production.scenePlan.push({segmentId:'close',sceneType:ending.sceneType,purpose:ending.intent,change:'保持58秒前最后画面，再并排回看直播间原价/到手价和二手开价/成交区间，四步方法按问依据、找反证、比可比价、按需决定依次点亮，最后两张案例卡退场，书本与结语出现；配乐在最后1.5秒淡出。'});writeJson(path.join(dir,'production-plan.json'),production);
const plan=json(path.join(dir,'audio-used-offer-v1.json')),bed=plan.clips.find(c=>c.id==='continuous-bed');
if(!bed||bed.sourceIn!==0||bed.speed!==1)throw Error('Expected continuous original music');
bed.sourceOut=70;bed.fadeOut=1.5;
const cues=[
 {id:'ending-recap',asset:'palette-cloth-two',event:'ask',offset:.10,duration:.4150793650793651,gain:.5,role:'transition',purpose:'两张生活案例回顾卡进入'},
 {id:'ending-counter',asset:'record-paper-1-v1',event:'counter',offset:.08,duration:.20,gain:1,role:'accent',purpose:'查证信息出现，回扣主动找反证'},
 {id:'ending-compare',asset:'pencil-underline-recorded-v1',event:'compare',offset:.05,duration:.235,gain:.9,role:'accent',purpose:'同款到手价和可比成交信息下方比较线绘出'},
 {id:'ending-decision',asset:'opening-ui-contact-v1',event:'decide',offset:.08,duration:.095,gain:1.6,role:'accent',purpose:'需求、预算与可以不买的选择卡出现'},
 {id:'ending-takeaway',asset:'palette-paper-short',event:'takeaway',offset:.35,duration:.23061224489795917,gain:.6,role:'transition',purpose:'案例卡收起，书本和结语进入，留出结尾阅读时间'}
];
for(const c of cues)plan.clips.push({id:c.id,source:'asset:'+c.asset,at:{event:'close.'+c.event,offset:c.offset},sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,role:c.role,fadeOut:.012,purpose:c.purpose,musicFit:'02配乐保持原速、起点和前58秒混音；只在结尾68.5–70秒淡出。短声跟随回顾、查证、绘线、决定和收卡，不叠旋律或持续过程声，听感待反馈'});
const planName=`audio-${name}.json`;writeJson(path.join(dir,planName),plan);
const project=json(path.join(dir,'project.json'));project.files.audioPlan=planName;writeJson(path.join(dir,'project.json'),project);
const factsPath=path.join(dir,'facts.md'),heading='## 当前完整试看片：70秒收尾版';
if(!fs.readFileSync(factsPath,'utf8').includes(heading))fs.appendFileSync(factsPath,`\n\n${heading}\n\n用户同意在58秒之后总结两个案例。本轮58–70秒回顾问依据、主动找反证、比较可比信息、按需要和预算决定，也可以不买。最后结语“便宜多少，要看它和谁比；买不买，要看自己的依据”是本期原创概括，不是书中引文。两个案例的数字继续为虚构示例，不把查价或拒绝成交说成保证消除锚定。\n\n原88秒草稿在58秒后重复的网购与总结段已归档至history/before-ending-v1；当前结构为70秒，前58秒画面与混音保留，02音乐原素材0–70秒原速，68.5–70秒淡出。project.json指向本轮70秒候选音频计划，使默认工程配置与时长一致；原audio-plan.json和历史输出均保留。46–58秒按用户继续制作指令保留，未额外伪造分项观看/试听认可；整条70秒试看片尚待用户反馈。\n`);
const p=loadProject('thinking-anchors',{audioPlan:planName}),output=reserveOutput(p.id,name);prepare(p,output,{from:58,to:70});
writeJson(path.join(output,'segment-plan.json'),{segmentId:'close',rangeSeconds:[58,70],duration:12,fullFilmDuration:70,events:ending.events,cues,retainedPrevious:retained,previousSourceHashes:Object.fromEntries(['scenes/AnchorLiveOpening.tsx','scenes/AnchorLiveMechanism.tsx','scenes/AnchorLiveDecision.tsx','scenes/OpeningActors.tsx','scenes/AnchorUsedEvidence.tsx','scenes/UsedEvidenceRegroup.tsx','scenes/RegroupStage.tsx','scenes/AnchorEvidenceMotion.tsx','scenes/AnchorUsedOffer.tsx'].map(f=>[f,sha(path.join(dir,f))])),summaryMethods:['问依据','找反证','比可比价','按需决定'],originalTakeaway:true,allPricesFictional:true,music:'02_情感话题_故事讲述.m4a',musicSpeed:1,musicFadeOutSeconds:[68.5,70],noNarration:true,noFixedBottomExplanations:true,userApproval:false,fullFilmApproval:false,assistantListening:'not-performed'});
console.log(JSON.stringify({output,frames:360,range:[58,70],fullDuration:70}));

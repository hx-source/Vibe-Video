import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,writeJson,reserveOutput,sha} from '../../scripts/files.mjs';
import {loadProject} from '../../scripts/project.mjs';
import {prepare} from '../../scripts/prepare.mjs';
import {binaries,run} from '../../scripts/runtime.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors');
const name=process.argv[2]??'opening-v1';
const indexPath=path.join(dir,'assets/index.json'),index=json(indexPath);
const source=path.join(dir,'assets/sound-palette-sources/interface-sounds/Audio/click_001.ogg');
const target=path.join(dir,'assets/sound-palettes/opening-ui-contact-v1.wav');
if(!fs.existsSync(target))run(binaries().ffmpeg,['-v','error','-n','-i',source,'-af','highpass=f=250,lowpass=f=4500,atrim=duration=0.10,afade=t=out:st=0.075:d=0.025','-ar','44100','-ac','2','-c:a','pcm_s16le',target]);
if(!index.items.some(a=>a.id==='opening-ui-contact-v1'))index.items.push({id:'opening-ui-contact-v1',path:'sound-palettes/opening-ui-contact-v1.wav',type:'audio',source:`Kenney Interface Sounds, Audio/click_001.ogg; https://kenney.nl/assets/interface-sounds; source SHA256=${sha(source)}; native-speed 0.10s excerpt, 250–4500Hz filtering, release fade; no reverb or synthesized notes`,license:'Creative Commons Zero, CC0; source pack License.txt retained'});
writeJson(indexPath,index);
const base=json(path.join(dir,'audio-regroup-outline-v1.json')),plan=structuredClone(base);
const cues=[
 {id:'opening-quote',source:'palette-paper-short',event:'offer',offset:.10,duration:.23061224489795917,gain:.8,role:'accent',purpose:'卖家报价气泡和纸质2000元标签出现，一次短翻纸声'},
 {id:'opening-counter',source:'opening-ui-contact-v1',event:'counter',offset:.10,duration:.095,gain:1.1,role:'accent',purpose:'买家提出1600元还价，一次短对话提示，保留阅读留白'},
 {id:'opening-agreement',source:'regroup-contact-v2',event:'counter',offset:1.82,duration:.11,gain:2.4,role:'end',purpose:'卖家点头同意，1600元谈成价格标签于6.82秒落定，一次短接触声对应落点'},
 {id:'opening-payment',source:'palette-cloth-two',event:'celebrate',offset:.08,duration:.4150793650793651,gain:.65,role:'transition',purpose:'买家觉得省了400元并拿出待付款手机，配一次短物件滑擦'},
 {id:'opening-pause',source:'opening-ui-contact-v1',event:'question',offset:.08,duration:.095,gain:1.4,role:'accent',purpose:'付款界面转为先别付款、手指退回，用一次短界面轻响提示状态改变'}
];
for(const c of cues)plan.clips.push({id:c.id,source:'asset:'+c.source,at:{event:'deal.'+c.event,offset:c.offset},sourceIn:0,sourceOut:c.duration,speed:1,gain:c.gain,role:c.role,fadeOut:.012,purpose:c.purpose,musicFit:'保持02故事讲述配乐和既有音量；短翻纸、物件接触与界面声分别跟随具体动作，无持续滑音、旋律叠加或空间混响；实际搭配待用户试听'});
const planName=`audio-${name}.json`;
writeJson(path.join(dir,planName),plan);
const captions=json(path.join(dir,'captions.json'));
const openingCaptions=[
 [0,1,'二手咖啡机，卖家先报了一个价。'],
 [1,5,'卖家开价2000元。'],
 [5,8,'你还到1600元，卖家同意了。'],
 [8,11,'觉得自己省了400元，正准备付款。'],
 [11,14,'等等，它真的值2000元吗？']
].map(([start,end,text],i)=>({id:'deal-'+i,segmentId:'deal',start,end,text}));
captions.items=[...openingCaptions,...captions.items.filter(c=>c.segmentId!=='deal')];
writeJson(path.join(dir,'captions.json'),captions);
const p=loadProject('thinking-anchors',{audioPlan:planName});
const output=reserveOutput(p.id,name);
prepare(p,output,{from:0,to:14});
writeJson(path.join(output,'opening-plan.json'),{scope:[0,14],style:'comic',music:'02_情感话题_故事讲述.m4a',musicSourceRange:[0,88],musicSpeed:1,musicGain:.64,narration:false,burnedBottomExplanations:false,events:{reveal:0,quote:1,counter:5,agreement:6.4,payment:8,reach:9.2,pause:11},cues,knowledgeBoundary:'原创生活剧情；2000、1600和400均为虚构金额，不判断实际市场价格。开头只提出报价依据的问题。',previousRegroup:'Preserved, not changed in this opening revision',userApproval:false,assistantListening:'not-performed'});
console.log(JSON.stringify({output,range:[0,14],frames:420}));

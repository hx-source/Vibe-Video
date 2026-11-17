import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from './files.mjs';
import {loadProject} from './project.mjs';
const legacy=process.argv[2];
if(!legacy)throw Error('Usage: node scripts/migrate-tcp.mjs <legacy tcp-handshake project directory>');
const dest=path.join(ROOT,'projects/tcp-handshake');
if(fs.existsSync(dest))throw Error('TCP project exists; migration never overwrites it');
const original=json(path.join(legacy,'project.json')),captions=json(path.join(legacy,'captions.json')),flows=json(path.join(legacy,'events.json'));
if(original.schemaVersion!==1||original.video.speed!==1.25)throw Error('Expected the verified source-seconds TCP example at speed 1.25');
const speed=original.video.speed,base=json(path.join(ROOT,'templates/starter/project.json'));
fs.cpSync(path.join(ROOT,'templates/starter'),dest,{recursive:true});
base.id='tcp-handshake';base.title='有来有回 · TCP 三次握手与四次挥手';
base.content={question:'为什么通常三次握手、四次挥手？',takeaway:'握手同步序号起点，关闭分别结束两个发送方向。'};
writeJson(path.join(dest,'project.json'),base);
const groups=[];
for(const c of captions){let g=groups.at(-1);if(g?.id!==c.scene){g={id:c.scene,start:c.start,end:c.end,captions:[]};groups.push(g);}g.end=c.end;g.captions.push(c);}
const titles={opening:'建立与关闭，都需要有来有回',title:'连接的起点，是双方的共同确认',handshake:'三次握手：交换起点，分别确认',duplex:'两个发送方向，各自结束',close:'四次挥手：先结束一边，再结束另一边',timewait:'TIME_WAIT：为最后一次确认留出余地',summary:'四次是典型过程，不是固定报文数',takeaway:'握手确认起点，挥手分别关闭',ending:'让对话有起点，也让告别有回音'};
const cards={
opening:[['建立连接','为什么通常需要三个报文？'],['结束连接','为什么又常常分成四步？'],['序号起点','TCP 的两个方向各自计数']],
title:[['SYN','告诉对方我的初始序号'],['ACK','确认对方的初始序号']],
duplex:[['客户端 → 服务端','发送结束，不再产生新数据'],['服务端 → 客户端','仍可发送尚未完成的数据']],
summary:[['典型关闭','FIN → ACK → FIN → ACK'],['可以合并','确认 ACK 与自己的 FIN 可同段发送']],
takeaway:[['建立','同步两个方向的序号起点'],['关闭','分别结束两个方向的数据发送']],
ending:[['有来有回','每个确认，都对应具体状态变化']]
};
const segments=groups.map(g=>{
 const duration=(g.end-g.start)/speed,events={intro:0,reveal:duration*.33,settle:duration*.66,end:duration};
 const s={id:g.id,durationSeconds:duration,intent:titles[g.id],sceneType:'cards',events,props:{title:titles[g.id]}};
 if(flows[g.id]){
  const f=flows[g.id];s.sceneType='sequence';s.props.nodes=[{id:'client',label:'客户端',state:f.initial.client},{id:'server',label:'服务端',state:f.initial.server}];
  s.props.messages=f.packets.map(p=>{events[`${p.id}-send`]=(p.start-g.start)/speed;events[`${p.id}-arrive`]=(p.arrive-g.start)/speed;return{id:p.id,from:p.from,label:p.label,detail:p.detail,startEvent:`${p.id}-send`,endEvent:`${p.id}-arrive`,sendState:p.sendState,receiveState:p.receiveState,data:p.data};});
  s.props.note=g.id==='handshake'?'ACK 号表示下一期待序号；SYN 占一个序号':'绿色一行是剩余数据示意，不是第五次挥手；FIN 占一个序号';
 }else if(g.id==='timewait'){
  s.sceneType='cycle';s.props.centerLabel='2MSL';s.props.centerDetail='时间压缩示意';s.props.steps=[{label:'主动关闭方等待，保留连接状态',event:'intro'},{label:'假设末次 ACK 丢失：再次确认重传 FIN',event:'reveal'},{label:'等待也让旧连接报文退出网络',event:'settle'}];s.props.note='不把 MSL 固定为某个实现秒数；重传 FIN 场景是单独的假设分支';
 }else{s.props.cards=cards[g.id].map(([title,body],i)=>({title,body,event:['intro','reveal','settle'][i]}));}
 return s;
});
writeJson(path.join(dest,'storyboard.json'),{segments});
writeJson(path.join(dest,'captions.json'),{items:groups.flatMap(g=>g.captions.map((c,i)=>({id:`${g.id}-${i}`,segmentId:g.id,start:(c.start-g.start)/speed,end:(c.end-g.start)/speed,text:c.zh})))});
fs.copyFileSync(path.join(legacy,'facts.md'),path.join(dest,'facts.md'));
fs.appendFileSync(path.join(dest,'facts.md'),'\n## Remotion 迁移\n\n字幕与报文状态沿用旧案例，源秒数显式除以 1.25。画面采用新的组件实现，并非像素级复刻。此项目默认静音，不捆绑用户原配乐。\n');
writeJson(path.join(dest,'migration.json'),{from:'Canvas template 0.3.0 / project schema 1',speedApplied:speed,sourceDuration:original.video.sourceDuration,finalDuration:original.video.sourceDuration/speed,sources:Object.fromEntries(['project.json','captions.json','events.json'].map(n=>[n,sha(path.join(legacy,n))])),originalCaptions:captions,originalFlows:flows,visualMatch:'reimplemented-not-pixel-identical',audio:'silent; original licensed audio not redistributed'});
const catalog=json(path.join(ROOT,'projects/catalog.json'));catalog.projects.push({id:'tcp-handshake',path:'tcp-handshake',kind:'topic-example',status:'migration-validation'});writeJson(path.join(ROOT,'projects/catalog.json'),catalog);
console.log(JSON.stringify({project:'tcp-handshake',frames:loadProject('tcp-handshake').timeline.durationInFrames}));

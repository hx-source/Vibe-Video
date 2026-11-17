import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const source=path.resolve(dir,'../thinking-anchors/assets');
const write=(name,value)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(value,null,2)+'\n');
const previous=JSON.parse(fs.readFileSync(path.join(source,'index.json'),'utf8'));
const ids=['opening-ui-contact-v1','palette-cloth-two','result-land'];
const items=ids.map(id=>{
 const a=previous.items.find(a=>a.id===id);if(!a)throw Error('Missing existing sound: '+id);
 const filename=path.basename(a.path);
 fs.copyFileSync(path.join(source,a.path),path.join(dir,'assets',filename));
 return {...a,path:filename,source:a.source+'; 本期复用已登记素材，自 thinking-anchors/assets 复制，保留原始来源和许可'};
});
fs.copyFileSync('D:/Documents/dy/音频/02_情感话题_故事讲述.m4a',path.join(dir,'assets','storytelling.m4a'));
items.unshift({id:'endowment-bed',path:'storytelling.m4a',type:'audio',source:'用户本地现有素材 D:/Documents/dy/音频/02_情感话题_故事讲述.m4a；本期由助手选作样片候选，未记录用户对本期音乐的认可',license:'用户现有素材，用于本地制作；沿用来源记录，不对外发布'});
write('assets/index.json',{schemaVersion:1,items});
const fit='固定02故事配乐原速、原时钟；采用无持续音高的短物件音效，避免增加旋律。当前仅完成技术检查，搭配与可辨认性待用户观看试听。';
write('audio-plan.json',{
 schemaVersion:2,sampleRate:44100,masterGain:.9,buses:{music:1,start:1,end:1,transition:1,process:.5,accent:1},
 reviewPolicy:{maxConcurrentEffects:2,maxProcessSeconds:1.5},
 qualityPolicy:{targetLufs:-18,lufsTolerance:3,maxTruePeakDb:-1,minEffectRelativeDb:-12,maxEffectRelativeDb:8},
 clips:[
 {id:'continuous-bed',role:'music',source:'asset:endowment-bed',sourceIn:0,sourceOut:91.5,at:0,speed:1,gain:.64,fadeIn:.5,fadeOut:2},
 {id:'ownership-land',role:'accent',source:'asset:opening-ui-contact-v1',sourceIn:0,sourceOut:.095,at:{event:'mechanism.own',offset:.55},gain:1.2,fadeOut:.012,purpose:'我的标签下落后接近落定，短接触音提醒杯子归属发生改变',musicFit:fit},
 {id:'protect-cup',role:'transition',source:'asset:palette-cloth-two',sourceIn:0,sourceOut:.4150793650793651,at:{event:'mechanism.loss',offset:.1},gain:.52,fadeOut:.035,purpose:'右侧人物嘴角改变、双臂开始向内护住，短布料声对应这一可见动作',musicFit:fit},
 {id:'meaning-settles',role:'end',source:'asset:result-land',sourceIn:0,sourceOut:.23,at:{event:'mechanism.result',offset:.25},gain:.7,fadeOut:.025,purpose:'得失比较的结论落定，以轻敲收束，保留随后阅读时间',musicFit:fit}
 ],cues:[],rhythms:[],ducking:[{id:'ownership-local-space',at:{event:'mechanism.own',offset:.55},attack:.06,hold:.1,release:.22,gain:.5}]
});
write('sample-sound-notes.json',{
 sample:{from:35,to:45},music:{asset:'endowment-bed',source:'02_情感话题_故事讲述.m4a',speed:1,fullClock:true,arrangement:'0–91.5秒连续音乐，最后2秒淡出；94秒初稿末尾2.5秒暂留白，待全片节奏设计再复核'},
 events:[
 {event:'mechanism.own',globalAction:36.5,globalSound:37.05,anchor:'接近落定',motion:'我的标签下降、关系线接入、人物出现',sound:'短接触声',sourceIn:0},
 {event:'mechanism.loss',globalAction:39.5,globalSound:39.6,anchor:'变化启动后0.1秒',motion:'微笑转为担忧，双臂收拢',sound:'短布料声',sourceIn:0},
 {event:'mechanism.result',globalAction:43,globalSound:43.25,anchor:'结论进入',motion:'比较曲线与一句结论淡入并落定',sound:'轻敲',sourceIn:0}
 ],assistantListening:'not-performed',userSampleApproval:'pending',musicBeatSync:'not-requested; content events determine timing; no claim of manually verified beat alignment'
});
const review=JSON.parse(fs.readFileSync(path.join(dir,'review.json'),'utf8'));
review.visual={state:'pending',note:'用户选定A聚光叙事（原话：选A）。仅记录方向选择，十秒动画样片待观看反馈。'};
review.audio={state:'pending',note:'样片采用现有02故事配乐与三处短音效；助手未实际听音，用户尚未试听认可。'};
write('review.json',review);
console.log('已准备固定配乐、三处动作音效及同步记录。');

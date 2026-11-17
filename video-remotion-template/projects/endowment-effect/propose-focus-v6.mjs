import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const read=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
const write=(f,v)=>fs.writeFileSync(path.join(dir,f),JSON.stringify(v,null,2)+'\n');
const history=path.join(dir,'history/before-focus-v6');
if(fs.existsSync(history))throw Error('Focus v6 backup already exists; do not overwrite history');
fs.mkdirSync(history,{recursive:true});
for(const f of ['project.json','storyboard.json','captions.json','audio-plan.json','production-plan.json','review.json','facts.md','README.md','scenes/EndowmentScene.tsx','scenes/OwnershipDecisionScene.tsx']){
 const to=path.join(history,f);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(dir,f),to);
}
const storyboard=read('storyboard.json'),captions=read('captions.json'),audioPlan=read('audio-plan.json');
const scene=storyboard.segments.find(s=>s.id==='mechanism');
scene.intent='一个持续情境中，先嫌30元贵，免费获赠后却舍不得以30元卖出。聚焦同一人物与同一杯子的互动，每次只给一个问题和一个反应。';
scene.props.note='30元，买它？免费送给你 30元，卖它？嫌贵 我的 舍不得 禀赋效应';
audioPlan.clips.find(c=>c.id==='ownership-land').purpose='免费获赠后杯子靠近身体，我的标签落在杯身，提示归属变化';
audioPlan.clips.find(c=>c.id==='meaning-settles').purpose='收回杯子的动作完成后，禀赋效应术语轻落定；不新增解释面板';
write('focus-v6-proposal.json',{storyboard,captions,audioPlan});
const plan=read('production-plan.json'),sp=plan.scenePlan.find(s=>s.segmentId==='mechanism');
sp.purpose=scene.intent;
sp.change='先展示30元买杯子的询问，人物摆手、杯子略移远；免费送给你时杯子靠近，手握住杯身，我的标签落定；30元卖它时杯子尝试向外移，被手收回。';
sp.implementation='深蓝与暖金A风格保持。删除流程线、报价框、两组交易图、长标题、对话气泡和场内重复解释。中央人物低对比，金色杯子为主体；顶部只有当下问题，底部只有短反应，术语最后出现。';
sp.reading='保留35–45秒的十秒节奏和共享声音事件。买入问题与嫌贵稳定3秒，免费获赠及归属动作2秒，卖出问题及拉回2.3秒，最终反应与术语2.7秒。文字只随情境变化，旧信息不堆留。';
plan.preflight.scope='用户反馈v5画面内容多、没有突出点；仅简化机制段的视觉层级，沿用A风格、同人同杯同价的逻辑和现有音乐时钟。旧输出与源码保留。';
plan.preflight.focusRevision={feedback:'整体的画面内容感觉很多，没有突出点',diagnosis:'人物、气泡、流程、报价、交易记录与结论同时争夺注意；补足语义时重复呈现了同一信息。',fix:'将比较放在时间先后中完成。一个主体、一句问题、一个反应；用杯子靠近、我的标签与手臂收回显示变化。',focalHierarchy:'金色杯子与动作 → 当前问题/反应 → 低对比人物；不再用多面板填补留白。',preserved:'同一人物、同一杯子、同样30元，明确免费获赠；金额仍是生活示意，不是实验测量。'};
write('focus-v6-production-proposal.json',plan);
console.log('v5 source archived; focus v6 proposals prepared without changing live timing/audio.');

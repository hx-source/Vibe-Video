import fs from 'node:fs';
import path from 'node:path';
import {ROOT,inside,json,sha,writeJson,reserveOutput} from './files.mjs';
import {loadProject} from './project.mjs';
import {prepare} from './prepare.mjs';
import {renderPrepared} from './render.mjs';
import {styleTheme,validateVisualPatch} from '../src/visual/styles.mjs';
import {defaultCandidates,validateCandidates,validateVisualPlan,validateProductionPlan,representativeRange,designFingerprint,previewFingerprint,previewEvidence} from './design-plan.mjs';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=()=>new Date().toISOString();
function paths(p){
  if(!p.project.files.visualPlan||!p.project.files.productionPlan)throw Error('Run design:init after defining the topic and storyboard');
  return {visual:inside(p.dir,p.project.files.visualPlan),production:inside(p.dir,p.project.files.productionPlan),ledger:inside(p.dir,'design-reviews.json')};
}
function ledger(p){const file=paths(p).ledger;return fs.existsSync(file)?json(file):{schemaVersion:1,records:[]};}
function outputManifest(p,relative){
  if(typeof relative!=='string'||!relative.startsWith(`outputs/${p.id}/`)||!relative.endsWith('/manifest.json'))throw Error('Choose a manifest from this project outputs');
  const file=inside(ROOT,relative);return {file,manifest:json(file)};
}
export function sampleStatus(p){
  if(!p.production)return {state:'not-enabled'};
  const last=ledger(p).records.at(-1);if(!last)return {state:'pending'};
  if(last.fingerprint!==designFingerprint(p))return {state:'needs-review',previousState:last.state};
  try{
    const {manifest,file}=outputManifest(p,last.manifest);
    if(sha(file)!==last.manifestSha256||sha(path.join(path.dirname(file),'video.mp4'))!==last.videoSha256)return {state:'needs-review',reason:'Sample output changed'};
    if(manifest.design?.kind!=='sample')return {state:'needs-review'};
  }catch{return {state:'needs-review',reason:'Sample output unavailable'};}
  return {state:last.state,viewed:last.viewed,listened:last.listened,manifest:last.manifest,note:last.note};
}
export function requireFullFilmApproval(p,range){
  if(!p.production||range.from!==0||range.to!==p.timeline.durationInFrames)return;
  if(!p.visual)throw Error('Choose a visual candidate with design:select before making the full film');
  if(sampleStatus(p).state!=='approved')throw Error('Representative sample needs current user approval; run design:sample, then record actual feedback with design:accept');
}
export function initializeDesign(p,selection){
  if(p.project.files.visualPlan||p.project.files.productionPlan)throw Error('Design workflow already initialized; use design:brief or design:propose');
  const visualFile=inside(p.dir,'visual-plan.json'),productionFile=inside(p.dir,'production-plan.json');
  if(fs.existsSync(visualFile)||fs.existsSync(productionFile))throw Error('Existing design files would be overwritten');
  const representative=representativeRange(p.timeline,selection);
  const question=p.project.content?.question||p.project.title;
  const visual={schemaVersion:1,activeRound:1,selectedId:null,rounds:[{id:1,createdAt:now(),candidates:defaultCandidates(question)}],decisions:[]};
  const production={schemaVersion:1,specification:{...p.project.video,narration:false,captions:'zh-CN',targetDurationSeconds:p.timeline.durationSeconds},topic:{title:p.project.title,audience:'待按任务确定',question,takeaway:p.project.content?.takeaway||''},research:{status:'pending',sources:[],boundaries:'填写事实来源与简化范围；已有 facts.md 不自动等于已核实'},outline:p.timeline.segments.map(s=>({segmentId:s.id,point:s.intent})),scenePlan:p.timeline.segments.map(s=>({segmentId:s.id,purpose:s.intent,change:'待描述对象、关系和状态的可观察变化',sceneType:s.sceneType})),representative};
  validateVisualPlan(visual);validateProductionPlan(production,p);
  const next=structuredClone(p.project);next.files.visualPlan='visual-plan.json';next.files.productionPlan='production-plan.json';
  writeJson(visualFile,visual);writeJson(productionFile,production);writeJson(inside(p.dir,'project.json'),next);
  return {visual,production};
}
export function proposeDesign(p,candidates){
  const files=paths(p),plan=structuredClone(p.visualPlan);validateCandidates(candidates);
  const id=Math.max(...plan.rounds.map(r=>r.id))+1;
  plan.rounds.push({id,createdAt:now(),candidates});plan.activeRound=id;plan.selectedId=null;
  plan.decisions.push({action:'new-round',round:id,createdAt:now()});writeJson(files.visual,plan);return plan;
}
export function selectDesign(p,candidateId,round=p.visualPlan?.activeRound,note=''){
  const files=paths(p),plan=structuredClone(p.visualPlan);
  if(Number(round)!==plan.activeRound)throw Error('This choice refers to an old round; compare the active round');
  const c=plan.rounds.find(r=>r.id===plan.activeRound).candidates.find(c=>c.id===candidateId);if(!c)throw Error('Unknown candidate in current round');
  plan.selectedId=candidateId;plan.decisions.push({action:'select',round:plan.activeRound,candidateId,note,createdAt:now()});writeJson(files.visual,plan);return plan;
}
export function reviseDesign(p,candidateId,patch,note=''){
  const files=paths(p),plan=structuredClone(p.visualPlan);validateVisualPatch(patch);
  const c=plan.rounds.find(r=>r.id===plan.activeRound).candidates.find(c=>c.id===candidateId);if(!c)throw Error('Unknown candidate');
  const before=structuredClone(c);
  c.overrides={...c.overrides,...patch,colors:{...c.overrides?.colors,...patch.colors}};
  validateVisualPlan(plan);plan.decisions.push({action:'revise',round:plan.activeRound,candidateId,before,after:structuredClone(c),note,createdAt:now()});writeJson(files.visual,plan);return plan;
}
export function recordSampleReview(p,relative,{state,viewed=false,listened=false,note=''}){
  if(!['pending','needs-changes','approved'].includes(state))throw Error('Invalid sample review state');
  if(state==='approved'&&(!viewed||!listened))throw Error('Sample approval requires actual viewing and listening');
  const {file,manifest:m}=outputManifest(p,relative),r=p.production.representative,fps=p.timeline.fps;
  if(!p.visual||m.project!==p.id||m.status!=='rendered-and-decoded'||m.design?.kind!=='sample'||m.design.fingerprint!==designFingerprint(p)||m.range.from!==Math.round(r.from*fps)||m.range.to!==Math.round(r.to*fps)||m.range.durationInFrames!==10*fps||!m.videoOutput||m.audio?.every(a=>a.silent))throw Error('Use the current complete ten-second sample with music and effects');
  const movie=path.join(path.dirname(file),'video.mp4');if(sha(movie)!==m.videoOutput.sha256)throw Error('Rendered sample differs from its manifest');
  const data=ledger(p);data.records.push({state,viewed,listened,note,createdAt:now(),fingerprint:designFingerprint(p),manifest:relative,manifestSha256:sha(file),videoSha256:m.videoOutput.sha256});writeJson(paths(p).ledger,data);return data.records.at(-1);
}
export function comparisonHtml(report){
  const cards=report.candidates.map(c=>`<article><span class="number">${escape(c.id)}</span><h2>${escape(c.label)}</h2><img src="${escape(c.image)}" alt="${escape(c.label)}的实际内容预览"><p>${escape(c.rationale)}</p><p class="detail">${escape(c.description)}</p><p class="detail">${escape(c.motion??'动作沿用本期分镜事件：入场、关系或状态变化、结果落定；风格切换不改变知识逻辑和时间。')}</p><ul>${c.capabilities.map(x=>`<li>${escape(x.sceneType)} · ${escape(x.state==='ready'?'已实现':x.state==='partial'?'部分支持':'需开发')}：${escape(x.detail)}</li>`).join('')}</ul><button data-id="${escape(c.id)}">选择此方案 · 下载选择记录</button></article>`).join('');
  const payload=JSON.stringify({round:report.round,fingerprint:report.fingerprint}).replace(/</g,'\\u003c');
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>视觉方案对比</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f2ed;color:#242b33;font:16px/1.7 system-ui,sans-serif}header,main,footer{max-width:1580px;margin:auto;padding:30px}header{padding-bottom:0}h1{font-size:32px;margin:0}header p{color:#59616b}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}article{padding:22px;background:white;border:1px solid #dedbd4;border-radius:16px}h2{margin:4px 0 16px}.number{color:#6e766d;font-size:13px}img{width:100%;border-radius:8px}.detail,li,footer{font-size:14px;color:#59616b}ul{padding-left:20px}button{padding:12px;border:1px solid #a9b6a5;background:#eaf0e6;color:#263a2a;border-radius:7px;cursor:pointer;width:100%}@media(max-width:1000px){main{grid-template-columns:1fr}}</style><header><h1>同一段内容，三种视觉方向</h1><p>${escape(report.title)} · 第 ${report.round} 轮 · 同一时刻 ${report.stillTime} 秒 · ${report.width}×${report.height}</p><p>可以选择一个方向，也可以提出局部修改或换一批。以下均为工程实际渲染；静帧用于选方向，动作和听感在十秒样片中验证。</p></header><main>${cards}</main><footer>下载只保存选择记录，不直接修改工程。把选择告诉制作助手，或用 design:select 应用。配色、字号、人物形式、背景和连线可按现有参数修改；新增美术形式需要实现对应场景。</footer><script>const context=${payload};document.querySelectorAll('button[data-id]').forEach(b=>b.onclick=()=>{const text=JSON.stringify({...context,candidate:b.dataset.id},null,2);const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='design-choice.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});</script></html>`;
}
export async function previewDesign(p,options={}){
  paths(p);const round=p.visualPlan.rounds.find(r=>r.id===p.visualPlan.activeRound),r=p.production.representative;
  const time=options.time===undefined?r.stillTime:Number(options.time);representativeRange(p.timeline,{...r,stillTime:time});
  const output=reserveOutput(p.id,options.name??`design-${Date.now()}`),report={schemaVersion:1,project:p.id,title:p.project.title,round:round.id,stillTime:time,width:p.project.video.width,height:p.project.video.height,representative:r,fingerprint:previewFingerprint(p),candidates:[]};
  for(const c of round.candidates){
    const {visual,capabilities}=previewEvidence(p,c),dir=path.join(output,c.id);fs.mkdirSync(dir);
    const candidate={...p,visual,theme:styleTheme(p.theme,visual)};
    const ready=prepare(candidate,dir,{from:r.from,to:r.to,designKind:'style-preview',publicRevision:`${path.basename(output)}-${c.id}`});
    await renderPrepared(ready,{stills:[time]});
    report.candidates.push({...c,description:visual.description,visual,capabilities,image:`${c.id}/frame-${Math.ceil(time*p.timeline.fps-1e-7)}.png`});
  }
  writeJson(path.join(output,'comparison.json'),report);fs.writeFileSync(path.join(output,'index.html'),comparisonHtml(report));
  const embedded={...report,candidates:report.candidates.map(c=>({...c,image:'data:image/png;base64,'+fs.readFileSync(path.join(output,c.image)).toString('base64')}))};
  fs.writeFileSync(path.join(output,'comparison.html'),comparisonHtml(embedded));return output;
}
export async function renderSample(p,options={}){
  paths(p);if(!p.visual)throw Error('Select a visual direction before rendering the sample');
  const r=p.production.representative;
  const silent=p.compiledAudio.clips.length+p.compiledAudio.cues.length===0;
  if(silent||!p.compiledAudio.clips.some(c=>c.role==='music'))throw Error('Configure fixed music before the ten-second sample');
  const from=r.from,to=r.to;
  let covered=from;
  for(const c of p.compiledAudio.clips.filter(c=>c.role==='music').sort((a,b)=>a.at-b.at)){
    if(c.at>covered+1e-7)break;
    if(c.at+c.duration>covered)covered=c.at+c.duration;
  }
  if(covered<to-1e-7)throw Error('Cover the entire representative sample with fixed music');
  if(![...p.compiledAudio.clips,...p.compiledAudio.cues].some(c=>c.role!=='music'&&c.at<to&&c.at+c.duration>from))throw Error('Configure action effects in the representative sample');
  const output=reserveOutput(p.id,options.name??`sample-${Date.now()}`);
  const ready=prepare(p,output,{from,to,designKind:'sample'});await renderPrepared(ready,{concurrency:options.concurrency});return output;
}
export async function designCommand(command,o){
  const p=loadProject(o.project??'starter-demo');let result;
  if(command==='init'){
    const hasRange=o.from!==undefined||o.to!==undefined;
    if(hasRange&&(o.from===undefined||o.to===undefined||!o.reason))throw Error('Supply --from, --to and --reason together');
    result=initializeDesign(p,hasRange?{from:Number(o.from),to:Number(o.to),reason:o.reason,stillTime:o.time===undefined?undefined:Number(o.time)}:undefined);
  }else{
    paths(p);
    if(command==='brief'){
      if(!o.proposal)throw Error('Supply --proposal <project-relative production plan>');
      const plan=json(inside(p.dir,o.proposal));validateProductionPlan(plan,p);writeJson(paths(p).production,plan);result=plan;
    }else if(command==='propose'){
      if(!o.proposal)throw Error('Supply a new set of three candidates with --proposal');
      result=proposeDesign(p,json(inside(p.dir,o.proposal)).candidates);
    }else if(command==='select'){
      let choice={candidate:o.candidate,round:o.round};
      if(o.proposal){const proposal=json(inside(p.dir,o.proposal));if(proposal.fingerprint!==previewFingerprint(p))throw Error('Choice preview is stale; regenerate the comparison');choice=proposal;}
      result=selectDesign(p,choice.candidate,choice.round,o.note);
    }else if(command==='revise'){
      if(!o.proposal)throw Error('Supply --proposal <project-relative visual patch>');
      result=reviseDesign(p,o.candidate??p.visualPlan.selectedId,json(inside(p.dir,o.proposal)),o.note);
    }else if(command==='preview')result=await previewDesign(p,o);
    else if(command==='sample')result=await renderSample(p,o);
    else if(command==='accept')result=recordSampleReview(p,o.manifest,{state:o.state,viewed:o.viewed==='true',listened:o.listened==='true',note:o.note});
    else if(command==='status')result={project:p.id,specification:p.production.specification,topic:p.production.topic,research:p.production.research.status,round:p.visualPlan.activeRound,selectedId:p.visualPlan.selectedId,representative:p.production.representative,sample:sampleStatus(p)};
    else throw Error('Unknown design command');
  }
  console.log(JSON.stringify(result,null,2));return result;
}

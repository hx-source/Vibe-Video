import {fingerprint} from './music.mjs';
import {visualStyle,styleCapability} from '../src/visual/styles.mjs';
export const DESIGN_VERSION=1;
export function validateCandidates(candidates){
  if(!Array.isArray(candidates)||candidates.length!==3)throw Error('Provide exactly three visual candidates');
  const ids=new Set(),looks=new Set();
  for(const c of candidates){
    if(!c||!/^[a-z0-9][a-z0-9-]*$/.test(c.id)||ids.has(c.id)||typeof c.label!=='string'||!c.label.trim()||typeof c.rationale!=='string'||!c.rationale.trim())throw Error('Candidate needs unique id, label and content rationale');
    const style=visualStyle(c);const {id,label,description,...look}=style;const hash=fingerprint(look);
    if(looks.has(hash))throw Error('Candidates must have different visual treatments');looks.add(hash);ids.add(c.id);
  }
  return candidates;
}
export function defaultCandidates(question='本期内容'){
  return validateCandidates([
    {id:'night',styleId:'night-story',label:'夜空叙事',rationale:`用人物与关系变化解释“${question}”，兼顾故事氛围和重点。`},
    {id:'clear',styleId:'clear-diagram',label:'清晰图解',rationale:`突出“${question}”中的步骤和状态，适合优先检验机制是否讲清楚。`},
    {id:'paper',styleId:'paper-sketch',label:'纸本手绘',rationale:`用纸本示意讲述“${question}”，弱化装饰，保留可读的关系变化。`},
  ]);
}
export function validateVisualPlan(plan){
  if(plan?.schemaVersion!==DESIGN_VERSION||!Array.isArray(plan.rounds)||!plan.rounds.length||!Array.isArray(plan.decisions))throw Error('Invalid visual plan');
  const ids=new Set();for(const r of plan.rounds){if(!Number.isInteger(r.id)||r.id<1||ids.has(r.id))throw Error('Invalid visual round');ids.add(r.id);validateCandidates(r.candidates);}
  const round=plan.rounds.find(r=>r.id===plan.activeRound);if(!round)throw Error('Missing active visual round');
  if(plan.selectedId!==null&&!round.candidates.some(c=>c.id===plan.selectedId))throw Error('Selected candidate is not in active round');
  return plan;
}
export function selectedVisual(plan){
  if(!plan)return null;validateVisualPlan(plan);if(!plan.selectedId)return null;
  return visualStyle(plan.rounds.find(r=>r.id===plan.activeRound).candidates.find(c=>c.id===plan.selectedId));
}
export function representativeRange(timeline,selection){
  const fps=timeline.fps,total=timeline.durationInFrames;
  if(total<10*fps)throw Error('Representative sample requires at least ten seconds; extend the content instead of stretching playback');
  let from,to,reason,stillTime;
  if(selection){
    from=Math.round(selection.from*fps);to=Math.round(selection.to*fps);reason=selection.reason;stillTime=selection.stillTime;
  }else{
    const events=Object.values(timeline.events);const starts=new Set([0,total-10*fps]);
    for(const s of timeline.segments){starts.add(s.startFrame);for(const t of Object.values(s.events))starts.add(Math.round((s.startSeconds+t-.5)*fps));}
    const choices=[...starts].filter(f=>f>=0&&f+10*fps<=total).map(f=>{
      const end=f+10*fps,overlap=timeline.segments.filter(s=>s.startFrame<end&&s.endFrame>f);
      const mechanism=overlap.some(s=>s.sceneType!=='cards');const count=events.filter(t=>t*fps>=f&&t*fps<end).length;
      return {f,count,score:count+(mechanism?10:0)};
    }).sort((a,b)=>b.score-a.score||a.f-b.f);
    from=choices[0].f;to=from+10*fps;reason=`候选窗口包含 ${choices[0].count} 个内容事件，优先检验机制变化；可根据讲解重点重新指定。`;
  }
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to>total||to-from!==10*fps||typeof reason!=='string'||!reason.trim())throw Error('Choose a valid ten-second range and explain why it represents the film');
  stillTime=stillTime??(from/fps+5);
  if(!Number.isFinite(stillTime)||stillTime<from/fps||stillTime>=to/fps)throw Error('Comparison frame must lie inside the sample range');
  return {from:from/fps,to:to/fps,stillTime,reason};
}
export function validateProductionPlan(plan,p){
  if(plan?.schemaVersion!==1||!plan.specification||!plan.topic||!plan.research||!Array.isArray(plan.outline)||!Array.isArray(plan.scenePlan))throw Error('Invalid production plan');
  const v=p.project.video;for(const k of ['width','height','fps'])if(plan.specification[k]!==v[k])throw Error(`Production specification differs from project.video.${k}; update the brief`);
  if(plan.specification.narration!==false||plan.specification.captions!=='zh-CN')throw Error('This workflow currently supports Chinese captions and no narration');
  if(typeof plan.topic.question!=='string'||!plan.topic.question.trim()||typeof plan.topic.takeaway!=='string')throw Error('Define the core content question and takeaway');
  if(!['pending','verified','provided-example'].includes(plan.research.status)||!Array.isArray(plan.research.sources)||typeof plan.research.boundaries!=='string')throw Error('Record research sources and simplification boundaries');
  for(const s of plan.research.sources)if(typeof s.title!=='string'||typeof s.reference!=='string'||!s.reference.trim())throw Error('Research source needs title and reference');
  for(const s of plan.scenePlan)if(!p.timeline.segments.some(x=>x.id===s.segmentId)||typeof s.purpose!=='string'||typeof s.change!=='string')throw Error('Scene plan needs an existing segment, purpose and visible change');
  plan.representative=representativeRange(p.timeline,plan.representative);return plan;
}
export function designFingerprint(p,visual=p.visual){
  const sources=Object.fromEntries(Object.entries(p.sources).filter(([key])=>key!=='visualPlan'));
  return fingerprint({project:p.project,sources,visual,theme:p.theme,sceneSources:p.sceneSources,assets:[...p.used].map(([id,a])=>[id,a.contentHash]),production:p.production});
}
export function previewFingerprint(p){return fingerprint({content:designFingerprint(p),visualPlan:p.visualPlan});}
export function previewEvidence(p,candidate){
  const visual=visualStyle(candidate);return {visual,capabilities:[...new Set(p.timeline.segments.map(s=>s.sceneType))].map(sceneType=>({sceneType,...styleCapability(sceneType,visual)}))};
}

const palette={
  night:{background:'#080e1d',text:'#f2e7d0',muted:'#a9b2c6',primary:'#e1c487',accent:'#ed777b',panel:'#171d31',line:'#35415b',success:'#78b9b3'},
  clear:{background:'#f2f6fa',text:'#182c42',muted:'#52677b',primary:'#315fa0',accent:'#b33f57',panel:'#ffffff',line:'#bccbd7',success:'#287d72'},
  paper:{background:'#f2ead8',text:'#352f29',muted:'#6c6256',primary:'#795b2c',accent:'#a63e37',panel:'#fbf7ec',line:'#c7b99e',success:'#4d7460'},
};
export const STYLE_PRESETS={
  'night-story':{label:'夜空叙事',description:'深蓝夜空、暖金重点、人物肖像和柔光连线',colors:palette.night,background:'night',illustration:'portrait',lineWidth:3,glow:true,fontScale:1,titleWeight:400,texture:.08},
  'clear-diagram':{label:'清晰图解',description:'浅色网格、编号节点、清楚的关系与状态',colors:palette.clear,background:'grid',illustration:'node',lineWidth:4,glow:false,fontScale:1.08,titleWeight:700,texture:0},
  'paper-sketch':{label:'纸本手绘',description:'暖纸底色、手绘人物边框、墨色与朱红连线',colors:palette.paper,background:'paper',illustration:'sketch',lineWidth:3.5,glow:false,fontScale:1.04,titleWeight:400,texture:.13},
};
const keys=['colors','background','illustration','lineWidth','glow','fontScale','titleWeight','texture'];
export function validateVisualPatch(patch){
  if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('Visual overrides must be an object');
  for(const key of Object.keys(patch))if(!keys.includes(key))throw Error(`Unknown visual property: ${key}`);
  if(patch.colors!==undefined){
    if(!patch.colors||typeof patch.colors!=='object'||Array.isArray(patch.colors))throw Error('Invalid visual colors');
    for(const [k,v] of Object.entries(patch.colors))if(!Object.hasOwn(palette.night,k)||!/^#[0-9a-f]{6}$/i.test(v))throw Error(`Invalid visual color: ${k}`);
  }
  for(const [k,lo,hi] of [['lineWidth',1,8],['fontScale',.9,1.25],['texture',0,.25]])if(patch[k]!==undefined&&(!Number.isFinite(patch[k])||patch[k]<lo||patch[k]>hi))throw Error(`Invalid visual ${k}`);
  if(patch.background!==undefined&&!['night','grid','paper'].includes(patch.background))throw Error('Invalid visual background');
  if(patch.illustration!==undefined&&!['portrait','node','sketch'].includes(patch.illustration))throw Error('Invalid visual illustration');
  if(patch.glow!==undefined&&typeof patch.glow!=='boolean')throw Error('Invalid visual glow');
  if(patch.titleWeight!==undefined&&![400,700].includes(patch.titleWeight))throw Error('Use bundled font weight 400 or 700');
  return patch;
}
export function visualStyle(candidate){
  const base=STYLE_PRESETS[candidate.styleId];if(!base)throw Error(`Unknown visual preset: ${candidate.styleId}`);
  const patch=validateVisualPatch(candidate.overrides??{});
  const style={...structuredClone(base),...patch,id:candidate.id,styleId:candidate.styleId,colors:{...base.colors,...patch.colors}};
  const luminance=hex=>{const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
  const a=luminance(style.colors.text),b=luminance(style.colors.background);
  if((Math.max(a,b)+.05)/(Math.min(a,b)+.05)<4.5)throw Error('Visual text/background contrast is too low');
  return style;
}
export function styleTheme(theme,visual){return visual?{...theme,colors:{...visual.colors}}:theme;}

// This registry describes real renderer support, not conceptual moodboards.
export function styleCapability(sceneType,visual){
  if(sceneType==='anchor-story-motion')return {state:visual.id==='comic'?'ready':'partial',detail:'生活故事场景已接入报价、还价、人物反应、物件牵引、重新检查、付款暂停、查价和收束动作；无固定底部说明栏'};
  if(sceneType==='anchor-evidence-motion')return {state:visual.id==='comic'?'ready':'partial',detail:'商品检查、放大镜移动、人物反应、滑看成交记录和价格归组均接入动画；大字字幕与小字说明改为场内表达，仅本段已适配'};
  if(sceneType==='anchor-life')return {state:visual.id==='comic'?'ready':'partial',detail:'本期二手砍价与网购场景已实现漫画构图、人物、商品、证据记录和连续状态变化；其他风格没有专属适配'};
  if(sceneType==='anchor-study')return {state:'partial',detail:['comic','isometric'].includes(visual.id)?'本实验场景已实现独立构图、矢量插画和确定性动画；其他段落尚未按新风格适配':'保留原深蓝图解的完整实验画面；其余风格仍按各自场景实现范围交付'};
  if(sceneType==='moon-match')return {state:'ready',detail:'背景、人物形式、配色、线条和字号均接入实际动画'};
  if(['cards','sequence','cycle','anchoring'].includes(sceneType))return {state:'partial',detail:'配色与公共标题可用；专题插画、纹理和节点外观需接入该场景'};
  return {state:'unavailable',detail:'需要新增场景组件及输入校验'};
}

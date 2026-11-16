import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {ROOT,json,sha,writeJson} from '../../scripts/files.mjs';

const dir=path.join(ROOT,'projects/thinking-anchors'),out=path.join(ROOT,'outputs/thinking-anchors/regroup-motion-v1');
const manifest=json(path.join(out,'manifest.json'));
if(manifest.status!=='rendered-three-options')throw Error('Render all three options first');
const previous=path.join(ROOT,'outputs/thinking-anchors/b-pencil-follow-through-v1/mix');
const before=fs.readFileSync(path.join(previous,'mix.wav'));
for(const v of manifest.variants){
 const target=path.join(out,v.id),mix=fs.readFileSync(path.join(target,'mix/mix.wav'));
 if(sha(path.join(target,'mix/music.wav'))!==sha(path.join(previous,'music.wav')))throw Error('Background music changed');
 const from=44+40*44100*4,to=44+42*44100*4;
 if(!mix.subarray(44,from).equals(before.subarray(44,from))||!mix.subarray(to).equals(before.subarray(to)))throw Error('Unrelated audio changed');
 const a=json(path.join(target,'encoded-audio.json'));
 if(a.silent||a.truePeakDb>-1||Math.abs(a.integratedLufs+18)>3)throw Error('Encoded audio out of range');
 if(json(path.join(target,'audio-quality.json')).warnings.length)throw Error('Unresolved audio warning');
}
const expected={'scenes/AnchorEvidenceMotion.tsx':'c5d3d20d517d3f7cfc4047717e68be8099ad5f0db4722e981af58189aa373c6e','scenes/AnchorLifeScene.tsx':'20bd8bf58a606784126f0413aac2365487200b3f19dc88d305a406341b3f9653'};
for(const [f,h]of Object.entries(expected))if(sha(path.join(dir,f))!==h)throw Error('Prior scene changed');
const html=fs.readFileSync(path.join(out,'review.html'),'utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
for(const link of html.matchAll(/(?:href|src|poster)="([^"]+)"/g))if(!fs.existsSync(path.join(out,link[1])))throw Error('Broken media link: '+link[1]);
const history=path.join(dir,'history/before-regroup-motion-v1');
fs.mkdirSync(history,{recursive:true});
for(const f of ['delivery-status.json','sound-review.json','README.md']){const dest=path.join(history,f);if(!fs.existsSync(dest))fs.copyFileSync(path.join(dir,f),dest);}
const status=json(path.join(dir,'delivery-status.json'));
Object.assign(status,{state:'regroup-motion-and-sound-options-ready',review:'outputs/thinking-anchors/regroup-motion-v1/review.html',preview:'outputs/thinking-anchors/regroup-motion-v1/outline/preview.mp4',pictureUnchanged:false,changedPicture:'Only evidence chapter from local 8s onward: three regroup alternatives; final speech stays on left to preserve evidence visibility',music:'02_情感话题_故事讲述.m4a',musicUnchanged:true,unrelatedCuesUnchanged:true,selectedRegroupVariant:null,regroupChoicePending:true,regroupAlternatives:manifest.variants,selectedMotionSound:null,selectedMotionPlan:null,userMotionCueSelection:false,userSoundApproval:false,assistantHumanListening:'not-performed',formalAudioPlan:'audio-plan.json unchanged; three audio-regroup-*-v1.json alternatives'});
writeJson(path.join(dir,'delivery-status.json'),status);
const sound=json(path.join(dir,'sound-review.json'));
sound.regroupRevision={status:'awaiting-user-viewing-and-listening',userRequest:'将8秒动画换一种形式，再配适合的短声；保留02背景音乐',review:status.review,preview:status.preview,variants:manifest.variants,selected:null,assistantListening:'not-performed',previousSelectionScope:'Historical movement selection; does not approve these redesigned variants'};
writeJson(path.join(dir,'sound-review.json'),sound);
writeJson(path.join(dir,'regroup-proposal.json'),{status:'three-actual-animated-options-ready',selected:null,style:'comic',changedChapter:'evidence',localMotionSeconds:[8,10],previewGlobalSeconds:[32,46],musicUnchanged:true,review:status.review,variants:manifest.variants,fullFilmIntegration:'pending-local-variant-choice'});
const note='\n\n## 第8秒归组动作重新设计\n\n本轮三段14秒有声对照见 outputs/thinking-anchors/regroup-motion-v1/review.html。A把三个价格落到刻度上，B保留记录并逐笔圈出价格，C汇成一张区间卡。固定02背景音乐与前段五处音效保持原样；只替换本地8–10秒动作与短声。B用短铅笔录音跟随框线，而非追随搬运价格。三版均待用户观看、试听和选择，尚未接入整片。\n\n候选源码：scenes/RegroupStage.tsx、scenes/AnchorEvidenceRegroup.tsx、regroup-entry.tsx。候选音频计划：audio-regroup-ruler-v1.json、audio-regroup-outline-v1.json、audio-regroup-summary-v1.json。复现：node projects/thinking-anchors/render-regroup-options.mjs（静帧）；首次导出追加 --render。已完成的视频不覆盖。\n';
if(!fs.readFileSync(path.join(dir,'README.md'),'utf8').includes('## 第8秒归组动作重新设计'))fs.appendFileSync(path.join(dir,'README.md'),note);
if(fs.existsSync(path.join(out,'layout-failure.json')))fs.renameSync(path.join(out,'layout-failure.json'),path.join(history,'resolved-layout-draft-issues.json'));
manifest.verification={backgroundMusicPcmIdentical:true,mixOutsideGlobal40to42PcmIdentical:true,priorSceneHashesPreserved:true,allThreeDecoded:true,comparisonMediaLinksValid:true,comparisonScriptSyntaxValid:true,actualHumanListening:false};
writeJson(path.join(out,'manifest.json'),manifest);
console.log(JSON.stringify({state:status.state,review:status.review,verified:manifest.verification}));

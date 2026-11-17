import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';

const revision='landscape-final-v1',topic=path.join(ROOT,'projects/thinking-anchors'),local=path.join(topic,revision),relative='outputs/thinking-anchors/'+revision,out=path.join(ROOT,relative),audit=path.join(out,'audit');
const movie=path.join(out,'video.mp4'),videoSha256=sha(movie),manifest=json(path.join(out,'manifest.json')),technical=json(path.join(out,'technical-review.json')),playback=json(path.join(audit,'browser-full-playback.json')),visual=json(path.join(audit,'source-visual-review.json')),audio=json(path.join(audit,'audio-event-review.json')),sourceMap=json(path.join(out,'source-map.json'));
if(videoSha256!==manifest.video.sha256||videoSha256!==playback.videoSha256||!playback.playedFromStartToEnd||!technical.fullDecodePassed||!technical.audio.audioPacketsUnchanged||visual.framesChecked!==2220||!visual.noOverlappingPrimaryChapterHeadings)throw Error('Actual final file checks incomplete');
for(const [file,hash] of Object.entries(sourceMap.originalSources))if(sha(path.join(ROOT,file))!==hash)throw Error('Approved source modified: '+file);
if(sha(path.join(ROOT,sourceMap.sourceVideo))!==sourceMap.sourceVideoSha256)throw Error('Approved full preview changed');
for(const folder of ['landscape-opening-v2','landscape-focus-v1','landscape-used-v1','landscape-offer-v1','landscape-ending-v1']){
 const previous=path.join(ROOT,'outputs/thinking-anchors',folder),m=json(path.join(previous,'manifest.json'));
 const entries=m.files??(m.video?.sha256?[{file:m.video.file??'video.mp4',sha256:m.video.sha256}]:[]);
 for(const item of entries)if(item.sha256&&fs.existsSync(path.join(previous,item.file))&&sha(path.join(previous,item.file))!==item.sha256)throw Error('Previous output modified: '+folder+'/'+item.file);
}
const feedback='这个收尾可以，接下来把整条74秒视频的前后衔接、节奏和音效统一检查一下，保持现在的横屏漫画风格和02背景音乐，导出最终完整视频。';
const endingVideo=path.join(ROOT,'outputs/thinking-anchors/landscape-ending-v1/video.mp4');
writeJson(path.join(topic,'landscape-ending-v1-acceptance.json'),{revision:'landscape-ending-v1',rangeSeconds:[64,74],status:'user-approved',feedback,userApproved:true,video:'outputs/thinking-anchors/landscape-ending-v1/video.mp4',videoSha256:sha(endingVideo),viewingAndListeningNotSeparatelyRecorded:true,scope:'用户认可64–74秒收尾，并明确授权74秒整片统一检查和最终导出；不推断最终新文件已被用户完整观看或试听。'});

technical.browserFullPlayback={passed:true,videoSha256,playedFromStartToEnd:true,playbackRate:1,testMuted:true,navigationWorks:playback.navigationWorks};
technical.encodedContactSheetsInspected=true;
technical.sourcePreservationChecked=true;
writeJson(path.join(out,'technical-review.json'),technical);
const quality={revision,videoSha256,checks:technical,visual:{framesChecked:2220,allTextInside1920x1080:visual.allTextInside1920x1080,noBlankSourceFrames:visual.noBlankSourceFrames,noOldLeftWindow:visual.noOldLeftWindow,noOverlappingPrimaryChapterHeadings:visual.noOverlappingPrimaryChapterHeadings,seams:visual.seams,readingIntervals:visual.readingIntervalsAt90PercentOpacity},sound:{effectCount:audio.effectCount,maxConcurrentEffects:audio.maxConcurrentEffects,allEffectsBoundToPictureEvents:audio.allEffectsBoundToPictureEvents,warningDisposition:audio.warningDisposition},manualReview:{encodedKeyframesAndTransitionContactSheets:'inspected',fullBrowserPlayback:'muted automated playback',assistantListening:'not-performed'},userFinalExportAuthorized:true,userApprovedFinalFile:false,externalPublication:false};
writeJson(path.join(out,'quality-review.json'),quality);
const qualityText=`# 74秒横屏最终完整版检查记录

输出：video.mp4；1920×1080，30fps，2220帧，74秒，H.264 / yuv420p，AAC双声道。保留漫画风格、少量场内文字和02背景音乐，无旁白。

## 前后衔接与画面

- 0–24秒：199不变、对“贵不贵”的判断改变，提出“该拿什么比”；24–38秒查可比到手价、条件、需求与预算。
- 38–52秒从买衣服过渡到二手相机，检查磨损和缺充电器，查同款、成色与配件相近的已成交记录，形成620–680示例参考。
- 52–64秒说明依据后提出630示例报价，卖家拒绝后保留不成交选择；64–74秒回顾两个案例，落到需求、预算与也可以不买。价格和成交记录都是剧情示例，不代表实际行情。
- 全2220帧检查文字边界和非空画面，24、38、52、64秒边界前后SVG相同；左侧旧窗框未出现。
- 修复约31秒指向条件时手腕与手臂的连接；38.3、52.3、64.3秒改为干净的场景切换，清除旧、新标题叠加，保留对象运动与事件时刻。
- 已检查最终编码关键帧、手腕修复和五处转场对照图。0–24秒解码像素与认可预览一致；24–38、38–74秒与本次源码渲染的画面逐段哈希一致。

## 节奏

不增加同屏讲解文字，不改74秒总时长。首帧问题持续进入案例，后续依次展示查价、条件、需求、预算、商品检查、成交记录、出价与退出选择。已记录关键短句达到90%不透明度的停留时间；这些是节奏核对依据，不是对所有观众阅读速度的保证。

## 配乐与音效

- 指定音乐：D:/Documents/dy/音频/02_情感话题_故事讲述.m4a；原速，连续使用0–74秒，原有开头淡入及72.8–74秒渐出保留。
- 38个动作音效均绑定画面事件，无跨段越界，最多同时1个；保留已认可素材与混音。最终AAC数据包哈希与原74秒预览完全一致。
- 最终编码：${technical.audio.integratedLufs} LUFS，真峰值${technical.audio.truePeakDb} dBTP，削波样本${technical.audio.decodedClippedSamples}个；12、24、38、52、64秒交界音频均非异常静音。
- 开头hook-price自动相对响度提示来自当时接近静音的音乐底，不能据此判定绝对过载；保留原提示与素材，最终峰值和削波检查通过。
- 助手未进行人工试听；技术指标、事件同步和静音浏览器播放不等同于人工听感验收。

## 文件与交付

最终文件全长解码通过，时间戳连续；Chrome以1倍速从0播放到74秒结束，并测试跨段定位与审片页按钮。浏览器播放为静音技术测试，报告绑定实际文件SHA256。

源代码、音频计划、素材输入哈希和原预览映射见source-map.json、manifest.json与audit目录。旧预览、旧70秒成片及认可源码均保留。本次初始候选另存audit/before-transition-cleanup，未覆盖已认可版本。

用户已认可收尾并授权统一复查及最终导出；未虚构最终文件的用户观看或试听记录。已在本地完成交付，未上传或发布。

SHA256：${videoSha256}
`;
fs.writeFileSync(path.join(out,'quality-review.md'),qualityText);

const history=path.join(topic,'history/before-landscape-final-v1');fs.mkdirSync(history,{recursive:true});
for(const file of ['landscape-production.json','current-production.json','delivery-status.json','segment-production.json','landscape-active-sources.json','README.md'])if(!fs.existsSync(path.join(history,file)))fs.copyFileSync(path.join(topic,file),path.join(history,file));
const ledger=json(path.join(topic,'landscape-production.json'));
Object.assign(ledger.segments.find(s=>s.id==='closing'),{status:'approved',userApproved:true,approval:'landscape-ending-v1-acceptance.json',feedback});
for(const s of ledger.segments){s.finalOutput=relative+'/video.mp4';s.finalSourceRevision=revision;}
Object.assign(ledger,{currentSegment:null,currentStage:'final-exported',currentReview:relative+'/review.html',remainingReviews:[],remainingTopics:[],fullFilmProduced:true,fullFilmStatus:'final-exported',finalExportProduced:true,finalExportAuthorized:true,finalOutput:relative+'/video.mp4',fullFilmApproval:false,assistantListening:'not-performed',qualityReview:relative+'/quality-review.md'});
writeJson(path.join(topic,'landscape-production.json'),ledger);
const current=json(path.join(topic,'current-production.json'));
Object.assign(current,{currentSegment:null,currentStage:'final-exported',revision,rangeSeconds:[0,74],currentReview:relative+'/review.html',output:relative+'/video.mp4',continuityOutput:relative+'/video.mp4',qualityReview:relative+'/quality-review.md',userApproved:false,fullFilmApproval:false,fullFilmProduced:true,fullFilmStatus:'final-exported',finalExportProduced:true,finalExportAuthorized:true,revisionReason:feedback,note:'完成74秒整片统一复查、手腕连接和三处转场清理；原02音轨完整保留。实际最终文件已全长解码与浏览器完整播放测试，未进行人工试听。',assistantListening:'not-performed'});
writeJson(path.join(topic,'current-production.json'),current);
const active=json(path.join(topic,'landscape-active-sources.json')),sourceRelative='projects/thinking-anchors/'+revision;
Object.assign(active,{revision,sourceRoot:sourceRelative,decision:sourceRelative+'/Decision.tsx',actor:sourceRelative+'/Actor.tsx',entry:sourceRelative+'/entry.tsx',composition:sourceRelative+'/Root.tsx',usedEvidence:sourceRelative+'/Used.tsx',offer:sourceRelative+'/Offer.tsx',ending:sourceRelative+'/Ending.tsx',audioPlan:'outputs/thinking-anchors/landscape-ending-v1/audio-plan.json',finalVideo:relative+'/video.mp4',note:'最终74秒横屏入口。0–24沿用opening-v2；24–38为手腕修正副本；38–74为清理三处旧、新标题重叠的场景副本。所有原认可源码与输出保留。Root是画面入口，最终声音从原74秒预览AAC复制。'});
writeJson(path.join(topic,'landscape-active-sources.json'),active);
const delivery=json(path.join(topic,'delivery-status.json'));
const release={state:'final-complete-video-exported',revision,output:relative+'/video.mp4',review:relative+'/review.html',qualityReview:relative+'/quality-review.md',captions:relative+'/captions.srt',manifest:relative+'/manifest.json',durationSeconds:74,resolution:[1920,1080],fps:30,frames:2220,style:'comic',music:'02_情感话题_故事讲述.m4a',audioPlan:active.audioPlan,musicFadeOutSeconds:[72.8,74],soundCueCount:38,sourceMixPreserved:true,endingUserApproved:true,endingApprovalRecord:'landscape-ending-v1-acceptance.json',fullFilmUserApproval:false,assistantHumanListening:'not-performed',technicalChecks:technical,previousPreview:sourceMap.sourceVideo,scope:'74秒整片衔接、节奏、音效技术复查与最终导出',nextSegmentNeedsProduction:false,currentFormat:'landscape',activeTrackingFile:'current-production.json',userFinalExportAuthorized:true,videoSha256,externalPublication:false};
Object.assign(delivery,release);if(delivery.landscapeEndingProduction)Object.assign(delivery.landscapeEndingProduction,{status:'approved',userApproved:true,approval:'landscape-ending-v1-acceptance.json'});delivery.landscapeFinalProduction=release;delete delivery.freshFullRender;
writeJson(path.join(topic,'delivery-status.json'),delivery);
const segments=json(path.join(topic,'segment-production.json'));segments.legacySegmentLedgerPreservedAt='history/before-landscape-final-v1/segment-production.json';segments.segments=ledger.segments;segments.currentSegment=null;segments.nextContinuityReview='74秒整片统一复查和最终本地导出完成；未记录人工试听';segments.fullFilmApproval=false;segments.currentFormat='landscape';segments.activeTrackingFile='current-production.json';segments.finalExport=release;writeJson(path.join(topic,'segment-production.json'),segments);

const rootReadme=path.join(topic,'README.md');fs.writeFileSync(rootReadme,`## 当前交付：74秒横屏最终完整版

已按用户授权统一检查整片衔接、节奏与音效同步，完成最终本地导出。1920×1080、30fps、漫画风格、02背景音乐，无旁白。修复约31秒人物手腕连接及38、52、64秒附近的转场重叠；内容、金额、事件时刻和总时长保持。

- [最终视频](../../${relative}/video.mp4)
- [审片与下载页](../../${relative}/review.html)
- [质量检查](../../${relative}/quality-review.md)
- [工程入口映射](landscape-active-sources.json)

全2220帧边界检查、最终文件完整解码、逐段画面核对和1倍速浏览器完整播放测试通过。最终AAC音轨与已认可74秒预览完全相同；音频完成技术核对，助手未进行人工试听。当前以current-production.json和landscape-production.json为准。以下为历史制作记录，其中旧版的“待反馈”等描述只对应当时版本。

`+fs.readFileSync(rootReadme,'utf8'));
fs.writeFileSync(path.join(local,'README.md'),`# 74秒横屏最终交付源码

当前成片：../../../${relative}/video.mp4；检查与下载：../../../${relative}/review.html。

1920×1080，30fps，2220帧，漫画风格，02原速连续配乐，无旁白。原认可源码未改动：Decision/Actor为手腕修正副本；Used/Offer/Ending为取消过渡标题叠加的副本，保留原事件与对象运动。依赖及哈希见输出source-map.json。Root.tsx/entry.tsx为本版画面入口，Root本身不含音轨；不要用默认旧70秒项目入口替代本版。

制作记录：audit-and-render.mjs逐帧审核并渲染24–38秒修复画面；audit-transitions.mjs逐帧复查并渲染38–74秒转场修复；export.mjs保留0–24秒画面并组装本次原生画面渲染，AAC直接复制认可74秒预览；playback.mjs用最终MP4完整播放测试；deliver.mjs验证证据并登记交付。

脚本以工程根目录运行。输出均使用存在检查；复现必须先指定新的输出目录，避免覆盖本次交付。FFprobe使用KNOWLEDGE_VIDEO_FFPROBE环境变量指定本机可用二进制。审片页有分段跳转、循环播放、下载与可选字幕。完整播放测试静音，助手人工试听未执行，不将其标为听感通过。
`);
sourceMap.finalSources={};for(const file of fs.readdirSync(local).filter(f=>/\.(mjs|tsx|json|md)$/.test(f)))sourceMap.finalSources[sourceRelative+'/'+file]=sha(path.join(local,file));
sourceMap.activeSources=active;sourceMap.audioPlan=active.audioPlan;sourceMap.audioPlanSha256=sha(path.join(ROOT,active.audioPlan));sourceMap.audioReport='outputs/thinking-anchors/landscape-ending-v1/audio/audio-report.json';sourceMap.audioReportSha256=sha(path.join(ROOT,sourceMap.audioReport));sourceMap.musicSource=audio.musicSource;sourceMap.finalVideoSha256=videoSha256;writeJson(path.join(out,'source-map.json'),sourceMap);
Object.assign(manifest,{status:'final-exported',qualityReview:'quality-review.md',sourceMap:'source-map.json',technicalReview:'technical-review.json',playbackReview:'audit/browser-full-playback.json',checksPassed:{fullDecode:true,all2220SourceFrameBounds:true,cleanChapterTransitions:true,pictureRangeHashes:true,audioPacketsUnchanged:true,fullBrowserPlayback:true},sources:sourceMap.finalSources,assistantListening:'not-performed',closingApproval:'projects/thinking-anchors/landscape-ending-v1-acceptance.json',exportAuthorization:feedback});writeJson(path.join(out,'manifest.json'),manifest);
console.log(JSON.stringify({status:'final-exported',output:movie,videoSha256,durationSeconds:74,assistantListening:'not-performed'}));

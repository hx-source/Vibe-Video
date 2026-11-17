import fs from 'node:fs';
import path from 'node:path';
import {ROOT,json,sha,writeJson} from '../../../scripts/files.mjs';
const revision='landscape-final-v2',topic=path.join(ROOT,'projects/thinking-anchors'),local=path.join(topic,revision),rel='outputs/thinking-anchors/'+revision,out=path.join(ROOT,rel),manifest=json(path.join(out,'manifest.json')),technical=json(path.join(out,'technical-review.json')),playback=json(path.join(out,'audit/browser-full-playback.json')),map=json(path.join(out,'source-map.json')),videoHash=sha(path.join(out,'video.mp4'));
if(videoHash!==manifest.video.sha256||videoHash!==playback.videoSha256||!playback.playedFromStartToEnd||!technical.fullDecodePassed||!technical.approvedOpening720PixelsUnchanged||!technical.following1500PixelsUnchanged||!technical.audio.encodedPacketsUnchanged)throw Error('Final checks incomplete');
if(sha(path.join(ROOT,map.previousFinal.file))!==map.previousFinal.sha256)throw Error('Previous final changed');
const history=path.join(topic,'history/before-landscape-final-v2');fs.mkdirSync(history,{recursive:true});for(const file of ['current-production.json','landscape-production.json','landscape-active-sources.json','delivery-status.json','segment-production.json','README.md'])if(!fs.existsSync(path.join(history,file)))fs.copyFileSync(path.join(topic,file),path.join(history,file));
technical.browserFullPlayback={passed:true,videoSha256:videoHash,playedFromStartToEnd:true,playbackRate:1,testMuted:true,navigationWorks:playback.navigationWorks};technical.encodedConceptAnd24SecondTransitionInspected=true;writeJson(path.join(out,'technical-review.json'),technical);
const quality={...technical,revision,openingUserApproved:true,openingApproval:'projects/thinking-anchors/landscape-opening-v4-acceptance.json',fullNewFileUserApproval:false,manualReview:'encoded concept frame and24second join inspected; automated full browser playback is muted',previousFinalPreserved:true,assistantListening:'not-performed'};writeJson(path.join(out,'quality-review.json'),quality);
fs.writeFileSync(path.join(out,'quality-review.md'),`# 74秒新版完整视频检查

1920×1080横屏，30fps，2220帧，74秒，漫画风格，02背景音乐，无旁白。0–24秒为用户回复“可以”认可的直播间开头和概念点题；其认可不自动等同于新74秒文件已获用户完整观看或人工试听。

19.2–22.4秒明确呈现“今天我们讲《思考，快与慢》中的锚定效应”，主词完全清晰约2.73秒；22.4秒回到该拿什么比，24秒继续查可比价、条件、需求和预算。然后保持二手商品检查、查可比成交、据此出价与不成交选择、两案例总结。金额与成交记录为虚构示例，方法用于减少偏差，不保证消除影响。

已用最终MP4解码像素哈希核对全部2220帧：前720帧与认可开头完全一致，后1500帧与上一版完整视频完全一致。未引入新的画面压缩或重排；手腕连接修复及38.3、52.3、64.3秒干净转场保留。文字边界和停留检查沿用这两份原生源码的逐帧审核，见technical-review.json所列路径。编码后的概念点题和24秒交接关键帧已查看。

完整解码、尺寸、帧率、总帧数与连续时间戳检查通过，最大时间戳误差${technical.maxFrameTimestampError}秒。Chrome以1倍速从头播放到74秒结束，并测试概念、交接及后段定位，报告绑定实际文件SHA256；播放测试静音。

最终AAC音轨的数据包与上一版74秒成片完全一致，02音乐原速、0–74秒连续范围及72.8–74秒淡出保留。${technical.audio.integratedLufs} LUFS，真峰值${technical.audio.truePeakDb} dBTP。原21.18秒短纸声在新画面中对应概念强调线，素材、增益与绝对时间不变；完整语义计划在projects/thinking-anchors/landscape-final-v2/audio-plan-used.json。助手未进行人工试听，不把编码、响度或静音播放检查当作听感验收。

旧74秒成片及所有开头预览和认可源码保留，未上传发布。来源映射见source-map.json；实际交付文件SHA256：${videoHash}。
`);
const ledger=json(path.join(topic,'landscape-production.json'));Object.assign(ledger.segments.find(s=>s.id==='opening'),{status:'approved',userApproved:true,approval:'landscape-opening-v4-acceptance.json',feedback:'可以',finalSourceRevision:'landscape-opening-v4'});for(const s of ledger.segments)s.finalOutput=rel+'/video.mp4';Object.assign(ledger,{currentSegment:null,currentStage:'final-exported',currentReview:rel+'/review.html',continuityOutput:rel+'/video.mp4',remainingReviews:[],fullFilmStatus:'final-exported',fullFilmProduced:true,finalExportProduced:true,finalExportAuthorized:true,finalOutput:rel+'/video.mp4',qualityReview:rel+'/quality-review.md',fullFilmApproval:false});writeJson(path.join(topic,'landscape-production.json'),ledger);
const current=json(path.join(topic,'current-production.json'));Object.assign(current,{revision,currentSegment:null,currentStage:'final-exported',rangeSeconds:[0,74],output:rel+'/video.mp4',currentReview:rel+'/review.html',continuityOutput:rel+'/video.mp4',qualityReview:rel+'/quality-review.md',fullFilmStatus:'final-exported',fullFilmProduced:true,finalExportProduced:true,finalExportAuthorized:true,openingUserApproved:true,openingApproval:'landscape-opening-v4-acceptance.json',userApproved:false,fullFilmApproval:false,note:'合入已认可的直播间及概念点题开头；后24–74秒和完整02音轨保持上一版。全长解码、逐帧像素核对与实际完整播放测试通过，未进行人工试听。',revisionReason:'用户认可最新开头，沿用此前整片导出授权完成74秒新版合入'});writeJson(path.join(topic,'current-production.json'),current);
const active=json(path.join(topic,'landscape-active-sources.json'));Object.assign(active,{revision,sourceRoot:'projects/thinking-anchors/'+revision,entry:'projects/thinking-anchors/'+revision+'/entry.tsx',composition:'projects/thinking-anchors/'+revision+'/Root.tsx',audioPlan:'projects/thinking-anchors/'+revision+'/audio-plan-used.json',finalVideo:rel+'/video.mp4',note:'0–24引用已获用户认可的landscape-opening-v4；24–74沿用landscape-final-v1修正场景。完整74秒已重新导出，Root为画面入口，最终AAC保留原完整音轨。旧成片保留。'});writeJson(path.join(topic,'landscape-active-sources.json'),active);
const release={state:'final-complete-video-exported',revision,output:rel+'/video.mp4',review:rel+'/review.html',qualityReview:rel+'/quality-review.md',manifest:rel+'/manifest.json',captions:rel+'/captions.srt',durationSeconds:74,resolution:[1920,1080],fps:30,frames:2220,style:'comic',music:'02_情感话题_故事讲述.m4a',audioPlan:active.audioPlan,sourceMixPreserved:true,soundCueCount:38,openingUserApproved:true,openingApproval:'landscape-opening-v4-acceptance.json',fullFilmUserApproval:false,assistantHumanListening:'not-performed',technicalChecks:technical,previousFinal:map.previousFinal.file,videoSha256:videoHash,externalPublication:false};
const delivery=json(path.join(topic,'delivery-status.json'));Object.assign(delivery,release,{currentRevision:revision,currentState:'final-exported',landscapeFinalProduction:release});if(delivery.landscapeOpeningRevision)Object.assign(delivery.landscapeOpeningRevision,{userApproved:true,status:'approved',approval:'landscape-opening-v4-acceptance.json'});writeJson(path.join(topic,'delivery-status.json'),delivery);
const segments=json(path.join(topic,'segment-production.json'));Object.assign(segments,{segments:ledger.segments,currentSegment:null,currentFormat:'landscape',activeTrackingFile:'current-production.json',finalExport:release,nextContinuityReview:'已合入认可开头，74秒新版完整导出与技术复查完成；未记录人工试听'});writeJson(path.join(topic,'segment-production.json'),segments);
const readme=path.join(topic,'README.md');fs.writeFileSync(readme,`## 当前交付：74秒新版完整版（直播间与概念点题）

用户已认可landscape-opening-v4的0–24秒开头，确认记录见landscape-opening-v4-acceptance.json。新版已合入：主播报价与买家心动、19.2–22.4秒书名和锚定效应点题。后24–74秒画面及完整02音轨保持上一版；1920×1080、30fps、漫画风格，无旁白。

- [74秒新版完整视频](../../${rel}/video.mp4)
- [审片与下载](../../${rel}/review.html)
- [质量记录](../../${rel}/quality-review.md)

最终文件完整解码、全部2220帧分段像素核对与1倍速浏览器播放通过。原74秒文件及各预览保留，助手未人工试听。当前以current-production.json为准，下面是各自历史版本的制作记录。

`+fs.readFileSync(readme,'utf8'));
map.finalSources=Object.fromEntries(fs.readdirSync(local).filter(f=>/\.(tsx|json|mjs|md)$/.test(f)).map(f=>['projects/thinking-anchors/'+revision+'/'+f,sha(path.join(local,f))]));writeJson(path.join(out,'source-map.json'),map);
Object.assign(manifest,{status:'final-exported',qualityReview:'quality-review.md',browserPlayback:'audit/browser-full-playback.json',sources:map.finalSources,openingApproval:'projects/thinking-anchors/landscape-opening-v4-acceptance.json',fullNewFileUserApproval:false});writeJson(path.join(out,'manifest.json'),manifest);
console.log(JSON.stringify({status:'final-exported',output:path.join(out,'video.mp4'),durationSeconds:74,videoSha256:videoHash,assistantListening:'not-performed'}));

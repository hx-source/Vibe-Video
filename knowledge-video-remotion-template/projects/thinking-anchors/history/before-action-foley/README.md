# 你真的买便宜了吗？｜锚定效应

88秒完整视频已经导出。内容：二手砍价主故事、网购折扣延伸，结合《思考，快与慢》相关讨论，把“问依据、找反证、再比较”放进人物行动中。

## 当前交付

- 完整视频：outputs/thinking-anchors/full-motion-v1/video.mp4。
- 带章节定位、分轨和可选解释字幕的播放器：同目录review.html。
- 分镜：同目录storyboard.html。
- 验证：delivery-checks.json、layout-report.json、probe.json、encoded-audio-quality.json。
- 知识来源与应用边界：同目录knowledge-sources.json；工程facts.md保留来源和历史修订说明。

1920×1080、30fps、2640帧、88秒；H264视频与AAC立体声音轨。无旁白。原解释字幕保留为SRT/VTT可选文件，不烧入画面。全部八段均使用fullbleed和场内对话、人物反应、物件变化，没有固定底部说明栏。

## 已确认选择

用户选择“新B漫画实验室”，指定02_情感话题_故事讲述.m4a，要求生活案例同时包含书中应对方法；随后明确大字字幕和小字说明都要改，认可sample-motion-v3动作表达样片：“目前看可以”。该认可用于继续扩展全片，不等于完整视频验收。

已认可的34–44秒场景、事件、视觉依赖保持不变。五张当前PNG与旧样片逐字节一致；该窗口PCM混音一致；原生样片MP4逐字节复用并携带原认可记录，重新绑定到当前项目指纹。最终整片中的相同窗口与旧样片编码画面SSIM为0.998514，差异来自编码上下文。保留旧样片、旧源码快照和全部认可历史。

## 场景与声音

AnchorStoryMotion.tsx负责其余七段，AnchorEvidenceMotion.tsx是已认可的检查商品段落；AnchorLifeScene.tsx仅复用咖啡机绘制，保留原源码校验和。

0–14秒：卖家报价、买家还价、以为省了400后的疑问。
14–24秒：先出现的2000元牵住对1600元的判断，锚定机制示意。
24–32秒：回到开价前，结合书中方法寻找反对锚点的理由。
32–46秒：检查商品，滑看成交记录，形成参考区间。
46–58秒：将有依据的目标变成报价，也保留换一家或不成交的选择。
58–70秒：划线价与到手价诱发付款冲动，人物暂停。
70–82秒：比较同款同条件价格，再看需要和预算。
82–88秒：把检查工具收进包里，收束方法与知识出处。

音乐从用户指定02素材0–88秒连续使用，不变速，末尾淡出。已有短非旋律原创音效按内容事件复用，过程音关闭。全片PCM混音没有削波；最终AAC测得-16.17 LUFS、真峰值-4.68 dB，技术策略无告警。助手没有声称实际听过全片。

## 验证与复现

1072个时刻检查文字边界、互相重叠和底部字幕节点，八张场景关键帧已查看。全部章节独立编码并检查帧数，再拼接视频与连续音乐；整片完整解码通过。最终编码12、43、80秒画面已抽查；音视频都从0秒开始，均为88秒。类型检查及33项单元测试通过。

本机localhost默认渲染入口此前返回EACCES，沿用本期离线Chromium管道方式。完整导出前验证当前布局指纹和工程的样片认可门槛；不覆盖已有输出，不自动认可全片。

```powershell
$env:KNOWLEDGE_VIDEO_FFPROBE='D:\Documents\dy\fitness-video\animation\node_modules\@ffprobe-installer\win32-x64\ffprobe.exe'
node projects/thinking-anchors/produce-motion-film.mjs check full-layout-v2
node projects/thinking-anchors/produce-motion-film.mjs render full-motion-v2 full-layout-v2
node projects/thinking-anchors/verify-motion-film.mjs full-motion-v2
```

以上输出名须新建；代码或输入变动后重新检查受影响部分。chapters内为无声视频编码中间文件，正常观看使用顶层video.mp4。delivery-status.json记录当前交付，完整视频仍待用户反馈。

# 你真的买便宜了吗？｜锚定效应

已选漫画实验室风格。用户已同意二手砍价主故事、网购折扣延伸，并要求结合《思考，快与慢》相关内容解释如何减少锚定影响。配乐为用户指定的02_情感话题_故事讲述.m4a。

## 当前交付

88秒分镜草稿，1920×1080、30fps、中文字幕，无旁白。

- 十秒有声样片：outputs/thinking-anchors/sample-life-v1/video.mp4，取全片34–44秒。
- 播放器与分轨：同目录review.html。
- 全片八段分镜静帧：同目录storyboard.html。
- 核验：delivery-checks.json、visual-checks.json、probe.json、encoded-audio-quality.json。

代表片段展示检查磨损/缺少配件、加入同款相近成色成交记录、形成参考区间，重点验证应对方法的解释效果。金额、商品和成交记录均为剧情设定；知识来源和应用边界见facts.md。

## 结构

0–14秒：开价2000、还价1600，觉得省了400。
14–24秒：先出现的数字如何成为判断起点。
24–32秒：回到交易，主动寻找反对锚点的理由。
32–46秒：检查成色、配件与可比成交记录。
46–58秒：根据独立依据形成目标，允许换一家或放弃交易。
58–70秒：网购原价999、到手199的折扣感受。
70–82秒：核对常态售价、其他店到手价，再看需求与预算。
82–88秒：问依据、找反证、再比较。

## 声音与验证

02音乐从原素材0–88秒连续使用，不变速；样片保留全片34–44秒的配乐时钟。三个原创短噪声瞬态按具体事件复用，没有连续过程音。全片混音未检测到削波；样片AAC测得-16.85 LUFS、真峰值-3.06 dB，质量策略无告警。这些是技术结果，尚未实际试听。

八张分镜静帧已查看；71个时刻检查HTML溢出、SVG文字边界和互相重叠，后退跳转渲染一致。类型检查和33项单元测试通过。十秒样片为300帧，音轨存在，完整解码通过；全片视频尚未导出。

## 工程与重现

场景源码scenes/AnchorLifeScene.tsx已注册为anchor-life，八种模式及内容事件已校验。配置生成入口configure-life.py会保留旧输入快照；build-sample-assets.py沿用next-revision-brief.json中的用户音乐选择。

本机localhost正常渲染入口此前返回EACCES，因此使用本期受约束的离线样片入口。--prepare复用工程prepare并检查完整音乐覆盖、样片内动作音效、选定comic和精确十秒范围；保存同样的设计指纹，拒绝覆盖已有输出。

```powershell
$env:KNOWLEDGE_VIDEO_FFPROBE='D:\Documents\dy\fitness-video\animation\node_modules\@ffprobe-installer\win32-x64\ffprobe.exe'
node projects/thinking-anchors/render-sample-offline.mjs sample-life-v2 --prepare
```

输出名必须新建。design:accept和design:status管理本期真实反馈；当前新样片pending，未代填观看、试听或认可。收到反馈后继续分段制作。

旧书中实验输入保存在history/book-experiment-v1；旧sample-comic-v1与三轮视觉预览继续保留，不能把旧样片认可用于新版。


## 当前动作表达修订

用户明确“大字字幕和小字说明都要改”。本轮先改34–44秒代表片段，交付outputs/thinking-anchors/sample-motion-v3/video.mp4；同目录comparison.html为同步新旧对照，review.html可试听分轨。

新增scenes/AnchorEvidenceMotion.tsx：放大镜移动检查、发现问题后的表情与手势、滑看记录、价格从记录取出归入比较线。该场景使用fullbleed和captionPlacement=scene，原底部大字字幕不烧入画面；小字来源说明改为场内短印章和片外来源记录。原解释文字仍保留为可选SRT。其他场景暂时维持上一版。

正常Remotion组件和本期离线入口均支持场内字幕放置；输入校验要求完整动作事件。浏览器检查确认本段没有固定底部字幕节点，文字边界和互相遮挡通过；跳转重现一致；300帧、10秒、1080p/30、AAC和完整解码通过。类型检查和33项单元测试通过。没有宣称已实际试听或用户认可。

旧生活案例输入及场景保存在history/life-explainer-v1；旧MP4继续保留。中间输出sample-motion-v1/v2仅作排版和人物姿态修订对照，当前交付为v3。重现时使用新的输出名：node projects/thinking-anchors/render-sample-offline.mjs sample-motion-v4 --prepare，并沿用上文FFPROBE配置。

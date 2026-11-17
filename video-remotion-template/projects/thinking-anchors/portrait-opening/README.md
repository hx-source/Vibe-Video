# 抖音竖屏开头样片

使用本项目独立的原生竖屏适配，1080×1920、30fps、12秒，无旁白。

从工程根目录执行：

```powershell
$env:KNOWLEDGE_VIDEO_FFPROBE='D:\Documents\dy\fitness-video\animation\node_modules\@ffprobe-installer\win32-x64\ffprobe.exe'
node projects/thinking-anchors/portrait-opening/render.mjs
node projects/thinking-anchors/portrait-opening/render.mjs --render
```

第一条制作配乐/音效和关键静帧，并检查360帧的文字碰撞与安全区域。第二条从React/SVG场景完整渲染视频并检查编码、帧数与音轨。完成输出拒绝覆盖，新版本使用`--name=portrait-opening-v2`；仍使用同一已登记02音乐分析参考。

项目场景注册见Opening.tsx的portraitScenes，参数校验见contract.mjs。Root.tsx也注册了独立Remotion Composition，供后续接入Studio；此Composition是画面入口，声音由本地render.mjs复用工程音频混合器处理。正式70秒项目的16:9注册与配置未改变。

阅读顺序：999原价 → 199到手价 → “省800”的想法 → 另一家同款同条件189 → 比较相差10，追问刚才在和谁比。每个阶段有一个主要变化；没有长期步骤条、来源小字或固定底部讲解字幕。

用户明确同意此方向，当前只授权制作开头样片，尚未认可新样片或授权替换整条正式视频。

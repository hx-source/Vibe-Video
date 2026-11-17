# 锚定效应 · 62 秒知识动画

1920×1080、30fps，字幕讲解，配乐为用户指定的 01_认知科普_观点讲述.m4a。没有新增旁白。

内容：商品原价示例 → 数轴锚定机制 → 1974 经典实验 → 独立估计与外部证据 → 反思问题。

## 文件
- project.json、storyboard.json、captions.json：规格、分镜与字幕。
- facts.md：知识来源、数据口径和简化边界。
- audio-plan.json、assets/index.json：连续配乐方案和素材来源。
- scenes/AnchoringScene.tsx：本期定制场景，已注册并添加 props 校验。
- render-offline.mjs、offline-entry.tsx：本地离线导出入口，复用本工程场景和字幕组件。

## 重现
在工程根目录运行（输出名不可重复）：
```powershell
$env:KNOWLEDGE_VIDEO_FFPROBE='D:\Documents\dy\fitness-video\animation\node_modules\@ffprobe-installer\win32-x64\ffprobe.exe'
node projects/anchoring-effect/render-offline.mjs full-v2
```
默认 Remotion 渲染入口在当前环境连接 localhost 时返回 EACCES。离线入口通过浏览器管道渲染相同 React 场景，再由 FFmpeg 编码。源配置仍兼容工程 preview/render 命令。

成片位于 outputs/anchoring-effect/full-v1/video.mp4；同目录保存 SRT、混音、关键帧、输入快照和核验清单。

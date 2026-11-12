# 音频规则与接入

content.mjs、plan.mjs 从旧工程迁移，负责基础片段编排、音效用途、启停、音乐避让及提醒。AudioTrack.tsx 将唯一混音结果接入 Remotion，按片段全片偏移裁剪。

实际解码、PCM 混音与分轨在 scripts 中；本目录不重复修改音量。原始音频素材由 asset:id 引用，prepare 阶段映射为已准备文件。

# 左侧画外装饰修正

独立冻结了三个当前竖屏场景，移除Opening.tsx中一个被画面裁到边缘的窗框path，并调整依赖路径。内容、布局、文字、动作时刻与声音均沿用。

渲染入口render.mjs，交付记录deliver.mjs。完整1140帧重新从源码绘制，已有AAC直接复制，音频数据包哈希一致。历史源与输出不覆盖。后续使用此目录中的Opening、Mechanism和Decision模块，映射见上级portrait-active-sources.json。

输出：outputs/thinking-anchors/portrait-edge-cleanup-v1/continuity-0-38.mp4
新增段修正版：outputs/thinking-anchors/portrait-edge-cleanup-v1/video.mp4
审片：outputs/thinking-anchors/portrait-edge-cleanup-v1/review.html

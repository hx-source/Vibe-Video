# 24–38秒人物动作增强

人物行为位于Actor.tsx，以原方法段事件为依据。其余画面和文字沿用去窗框版本，0–24秒导入portrait-edge-cleanup-v1，声音直接复制对应上一版AAC。

导出：node projects/thinking-anchors/portrait-character-motion-v1/render.mjs；完成后：node projects/thinking-anchors/portrait-character-motion-v1/deliver.mjs。Windows环境需设置KNOWLEDGE_VIDEO_FFPROBE为可用的ffprobe.exe。输出目录不得已有，历史输出不覆盖。Root.tsx为纯画面合成；带声音交付以render.mjs输出为准。

审片：outputs/thinking-anchors/portrait-character-motion-v1/compare.html，尚未记录用户认可。首轮手势靠近头部的草稿保留于outputs/thinking-anchors/portrait-character-motion-v1-draft。

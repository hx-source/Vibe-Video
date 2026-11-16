# 74秒横屏最终交付源码

当前成片：../../../outputs/thinking-anchors/landscape-final-v1/video.mp4；检查与下载：../../../outputs/thinking-anchors/landscape-final-v1/review.html。

1920×1080，30fps，2220帧，漫画风格，02原速连续配乐，无旁白。原认可源码未改动：Decision/Actor为手腕修正副本；Used/Offer/Ending为取消过渡标题叠加的副本，保留原事件与对象运动。依赖及哈希见输出source-map.json。Root.tsx/entry.tsx为本版画面入口，Root本身不含音轨；不要用默认旧70秒项目入口替代本版。

制作记录：audit-and-render.mjs逐帧审核并渲染24–38秒修复画面；audit-transitions.mjs逐帧复查并渲染38–74秒转场修复；export.mjs保留0–24秒画面并组装本次原生画面渲染，AAC直接复制认可74秒预览；playback.mjs用最终MP4完整播放测试；deliver.mjs验证证据并登记交付。

脚本以工程根目录运行。输出均使用存在检查；复现必须先指定新的输出目录，避免覆盖本次交付。FFprobe使用KNOWLEDGE_VIDEO_FFPROBE环境变量指定本机可用二进制。审片页有分段跳转、循环播放、下载与可选字幕。完整播放测试静音，助手人工试听未执行，不将其标为听感通过。

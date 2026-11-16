# 明确主题的横屏开头第二版

Opening.tsx覆盖0–719帧，entry.tsx显式注册校验，720–1139沿用landscape-focus-v1。1920×1080、30fps；Root.tsx为纯画面工程，有声交付由render.mjs导出。

设置KNOWLEDGE_VIDEO_FFPROBE为可用ffprobe.exe，运行node projects/thinking-anchors/landscape-opening-v2/render.mjs，再运行node projects/thinking-anchors/landscape-opening-v2/deliver.mjs。已存在输出会拒绝覆盖。本版只修改画面与场内短句，不重做声音；两份对应AAC直接复制landscape-opening-v1。旧0–24秒源码和视频均保留。

检查全部720帧固定199及文字边界，首12秒问题与衣服标注，后420帧解码哈希、连续时间戳、AAC包哈希及浏览器播放。助手未实际听音，新版未记录用户认可。

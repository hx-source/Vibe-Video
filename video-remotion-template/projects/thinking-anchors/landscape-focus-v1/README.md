# 横屏聚焦版

1920×1080、30fps，成片24–38秒的14秒样片。Decision.tsx是独立横屏场景，board.json定义事件并由本地场景注册与校验接入。Root.tsx只提供画面；有声交付使用render.mjs，逐帧渲染并复制对应旧版AAC。

导出：设置KNOWLEDGE_VIDEO_FFPROBE指向可用ffprobe.exe，然后运行node projects/thinking-anchors/landscape-focus-v1/render.mjs；完成后运行node projects/thinking-anchors/landscape-focus-v1/deliver.mjs。输出已存在会拒绝覆盖。局部类型检查使用该目录tsconfig.json。

当前只有这14秒使用新版横屏布局，不能将旧竖屏模块直接拼入；历史横屏70秒成片、竖屏片段和认可记录全部保留。当前输出待用户反馈。

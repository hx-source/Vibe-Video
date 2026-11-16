# 横屏开头0–24秒与前38秒连贯预览

Opening.tsx覆盖全局帧0–719；入口显式注册并校验新场景，720–1139使用landscape-focus-v1方法段。1920×1080、30fps、漫画风格，无旁白。Root.tsx为纯画面工程预览，有声交付使用render.mjs。

设置KNOWLEDGE_VIDEO_FFPROBE为可用ffprobe.exe，运行node projects/thinking-anchors/landscape-opening-v1/render.mjs，再运行node projects/thinking-anchors/landscape-opening-v1/deliver.mjs。输出目录已存在会拒绝覆盖。audio.mjs使用现有安排工具构建本地变体，不修改公共音频计划；refine-audio.mjs保留了术语提示音的试验流程，早期画面和声音候选归档于outputs/thinking-anchors/landscape-opening-v1-before-wrist-fix。当前audio.mjs已去掉多余的术语点击音，重新导出不需要运行修订脚本。

0–24秒新渲染，24–38秒从原横屏视频保留画面流；新完整AAC由连续混音编码。后14秒画面哈希和混音PCM均校验保留。24秒独立预览末尾0.18秒淡出不进入完整38秒。新开头尚未记录认可。

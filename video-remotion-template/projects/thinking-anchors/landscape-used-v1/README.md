# 横屏二手检查38–52秒

1920×1080、30fps、漫画风格、无旁白。Used.tsx为本期专属场景，board.json及入口显式注册校验，Root.tsx为纯画面0–52秒工程。音画交付由render.mjs生成，有声输出与审片页位于outputs/thinking-anchors/landscape-used-v1。

设置KNOWLEDGE_VIDEO_FFPROBE指向可用ffprobe.exe，运行node projects/thinking-anchors/landscape-used-v1/render.mjs，再运行node projects/thinking-anchors/landscape-used-v1/deliver.mjs。输出存在会拒绝覆盖。首轮视频与全帧校验完成后，为联系表补采两个静帧，记录保留在render-executed.mjs、extra-stills.json；finish.mjs仅完成首轮缺失的交付后处理，未重新渲染视频，当前render.mjs的静帧列表已修正，后续新输出不需要此恢复流程。

前38秒画面流复制，验证1140帧解码像素保持；音乐原速延长至52秒，0–37.82秒混音PCM保持，取消旧预览末尾淡出，新预览在51.82–52秒淡出。新增成交金额为虚构示例，用户尚未认可新片段，助手未实际听音。

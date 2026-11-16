# 横屏有依据出价与不成交52–64秒

1920×1080、30fps、漫画风格、无旁白。Offer.tsx为本期场景，board.json与入口显式注册校验，Root.tsx提供纯画面0–64秒工程。带声音交付由render.mjs导出。

设置KNOWLEDGE_VIDEO_FFPROBE为可用ffprobe.exe，运行node projects/thinking-anchors/landscape-offer-v1/render.mjs，再运行node projects/thinking-anchors/landscape-offer-v1/deliver.mjs。输出已存在会拒绝覆盖。render.mjs使用联系表帧与检查帧的并集，避免遗漏交付静帧。首轮拒绝提示声轻微增益调整由refine-audio.mjs完成，原候选以before-refusal-level保留；audio.mjs已包含最终增益，后续重新导出不必再运行修订脚本。

前52秒画面流保留并校验1560帧；0–51.82秒混音PCM相同，音乐原速延长至64秒，旧预览淡出移至63.82–64秒。630为协商提议示例，不是市场数据或机械定价公式。新12秒待用户反馈，助手未实际听音，后续需总结收尾。

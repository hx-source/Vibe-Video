# 竖屏12–24秒机制段

画面：Mechanism.tsx；本项目场景注册和参数校验：entry.tsx、contract.mjs；独立Remotion画面入口：Root.tsx。原生1080×1920、30fps，无旁白。

从工程根运行render.mjs准备检查，添加--render渲染新增12秒并连接已认可开头。完成输出拒绝覆盖，新版本使用--name。deliver.mjs生成审片页并检查前24秒播放与模式切换。

输出：outputs/thinking-anchors/portrait-mechanism-v1/video.mp4
连贯版：outputs/thinking-anchors/portrait-mechanism-v1/continuity-0-24.mp4
审片页：outputs/thinking-anchors/portrait-mechanism-v1/review.html

前12秒视频码流保留，解码像素哈希一致；音乐取消独立预览末尾0.18秒淡出以衔接下一段。新增5个短音效与命名事件同步，技术检查和人工听感分别记录。原70秒横屏版本及两版开头均保留。

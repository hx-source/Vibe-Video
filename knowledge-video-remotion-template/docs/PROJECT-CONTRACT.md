# 项目与场景格式 · contractVersion 1

运行校验入口为 scripts/project.mjs 和 src/timeline/compile.mjs。模板版本为 0.1.0；旧配置须显式迁移，不能只改版本号。

## 文件

| 文件 | 职责 |
| --- | --- |
| project.json | contract、contractVersion、templateVersion、id、title、video、timelineBasis、themeId、files |
| storyboard.json | segments 数组，按数组顺序播放 |
| captions.json | items 数组，每条包括 id、segmentId、start、end、text |
| audio-plan.json | schema 2，默认空方案 |
| facts.md | 来源、简化边界与易误解点 |
| review.json | 事实、画面和声音的人工审阅状态 |
| assets/index.json | 素材标识、相对路径、类型、来源和授权说明 |
| scenes/ | 可放本期专属场景；使用前需在工程 registry 中显式注册并增加校验 |

项目 id、片段 id、事件 id 使用小写字母、数字、连字符。video 为偶数尺寸 16:9，宽 320–3840、fps 1–60。timelineBasis 固定为 final-seconds，不接受 video.speed 或 sourceDuration。narration.enabled 当前必须关闭。

## 片段与字幕

片段包含 id、durationSeconds、intent、sceneType、events、props。events 是局部秒数，完整事件名为 `片段id.事件id`。例如 opening.reveal。

字幕 start/end 可以是本段秒数，也可以是 `{ "event": "reveal", "offset": 0 }`。区间左闭右开，允许留白，不允许重叠、零帧字幕或越界。全片时长由片段相加得到。

## 已实现的场景

所有场景 props 必须含 title，可以含 note。

- cards：cards 数组，1–3 项；每项 title、body、event。按事件揭示卡片，并以连接箭头体现关系。可配置 imageAsset，对应图像素材 id。
- sequence：nodes 为两个不同 id 的节点，包含 label、可选 state；messages 最多五条，每条 id、from、label、detail、startEvent、endEvent；可选 sendState、receiveState、data。节点状态与报文飞行共享事件。data 用于标明普通数据，不计入知识上的握手/挥手次数。
- cycle：steps 为 2–4 项 label/event；centerLabel、centerDetail 控制圆环中心文字。圆环只是片段进度示意，不是实际协议计时器。

长文本须运行浏览器布局检查。增加场景不能仅修改 sceneType 字符串，应同时实现组件、注册和数据校验。

## 主题与素材

现有 themeId 为 paper、midnight；主题改变配色，保持相同的安全区和 Noto Sans SC 字体。

素材索引：`{ "schemaVersion": 1, "items": [{ "id": "bed", "path": "bed.wav", "type": "audio", "source": "来源说明", "license": "授权说明" }] }`。

公共素材路径相对工程 assets，本期素材路径相对本期 assets；id 在合并索引中必须唯一。支持 audio、image。启用的引用必须存在；禁用的音效候选无需准备文件。原始媒体默认不进入 Git，需要时显式收录有分享权的样例。

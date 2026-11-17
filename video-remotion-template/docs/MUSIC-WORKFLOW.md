# 音乐驱动制作

固定音乐 → 分析与校正 → 分镜与动作对齐 → 十秒试片 → 反馈后分段制作。旧项目不配置 musicSync 时保持原有行为。

## 分析与试听

先登记音乐资产，并在 audio-plan.json 中配置连续 music clip。

```powershell
npm run music:analyze -- --project my-topic --clip bed --name music-analysis-v1
```

自动检测失败或需完全手工标拍时，运行 `npm run music:manual -- --project my-topic --clip bed --bpm 120 --first 0 --name music-manual-v1`，生成带源指纹的候选分析文件，再在 review 中输入完整逐拍时间表。BPM 只作初始参考，手工 beats 优先于 BPM/firstBeat。

把 outputs/my-topic/music-analysis-v1/music-analysis.json 复制到本期项目，保留分析版本。

```powershell
npm run music:review -- --project my-topic --analysis music-analysis.json --name music-review-v1
```

打开输出 index.html，试听音乐与普通拍/重拍提示音。支持时间/帧号、局部循环、半速/倍速、首拍、拍号、重拍相位和完整手工拍表。下载校正文件，保存为本期 music-overrides.json。再运行 review 并加 `--overrides music-overrides.json`，获取最终 music-grid.json 的 revision。

算法使用 8kHz 单声道能量上升与自相关，估计 60–180 BPM 恒定速度候选；近似同分时偏好接近 120 BPM。confidence 是周期相关强度，不是正确概率。默认 4/4 重拍只是重音假设。必须检查速度漂移、半速/倍速、拍号和相位；变速音乐用 overrides.beats 完整源时间数组。静音或没有可用瞬态会失败，应手工标拍。最长源文件 600 秒。

energy 间隔 0.5 秒；peakDb/rmsDb 为分析用单声道信号的 dBFS，不是原始多声道真峰值或 LUFS。第二阶段已增加局部速度、能量段落和调性窗口候选，详见 [第二阶段流程](MUSIC-PHASE2.md)；乐器仍靠标签，原始声道元数据不自动识别，不能把能量峰当成已确认段落或重拍。试听页显示源时间，浏览器提示音可能存在调度误差，最终落点以渲染帧为准。

## 对齐动作与音效

在 project.json 的 files 中添加 `"musicSync":"music-sync.json"`：

```json
{
  "schemaVersion":1,
  "analysis":"music-analysis.json",
  "overrides":"music-overrides.json",
  "music":{"clipId":"bed","sourceIn":0,"sourceOut":12,"at":0,"speed":1},
  "requiredEvents":["opening.reveal"],
  "actions":[
    {"event":"opening.reveal","beat":8,"landmark":"impact","key":true,"soundId":"reveal-ding","soundOffset":0,"revision":"从最终 music-grid.json 复制"}
  ]
}
```

beat 从 0 开始，引用完整源文件拍表。music 必须与 audio-plan 的 clipId/sourceIn/sourceOut/at/speed 一致。成片秒数 = at + (源拍时间 − sourceIn) / speed；量化到最近整数帧，误差不超过半帧。

动作保留有语义的事件名，landmark 选择 start/impact/settle。场景中的对应动作必须实际使用该事件；工具不会重写动画曲线。只调整映射事件，分段时长与其余事件不变；引用事件的字幕会一起移动，必须检查阅读时间与转场。事件越界则失败。

每个动作锁定拍表 revision；换源、改拍表或拍号后阻止静默重排。审查受影响片段后逐项更新 revision，不批量绕过检查；保留已认可输出。人工 listened 状态不会改变拍表 revision。

音效使用同一事件：

requiredEvents 为人工梳理的关键动作清单，配置后检查其中事件是否都登记到 actions 且标为关键动作。工具无法从任意场景代码自动识别遗漏动作；仍需逐项观看验证动作覆盖与真实落点。

```json
{"id":"reveal-ding","role":"accent","at":{"event":"opening.reveal","offset":0},"kind":"tone","frequency":784,"duration":0.25,"gain":0.08,"purpose":"关键对象出现","musicFit":"候选音色，需与主音乐混合试听"}
```

soundOffset 是音效内部起点到可听落点的秒数；有 0.05 秒起音时，音效 at.offset 为 -0.05，soundOffset 为 0.05。负时间或越界仍会失败，需裁切或调整设计。非关键动作可 key:false；其余动作须填 soundId，对应启用的非音乐音效。tone/kick 只是简单技术音色；钟琴、木琴、钢片琴等真实配器使用有授权素材并混合试听。

## 检查与分段

```powershell
npm run music:check -- --project my-topic
npm run check -- --project my-topic
npm run render -- --project my-topic --from 0 --to 10 --name opening-v1
npm run review -- --project my-topic --from 0 --to 10 --name opening-review-v1
npm run render -- --project my-topic --segment chapter-two --name chapter-two-v1
```

检查音乐映射、源指纹、拍表版本、事件与音效落点；prepare/render 保存 music-check.json，manifest 包含分析与校正文件指纹。密度与削波沿用原音频检查。旧项目无映射时 music:check 提示需配置，普通 check/render 不受影响。

先交十秒含音乐与音效的试片，收到反馈后分段推进。使用新输出名称保留版本，不移动音乐或整体变速修补局部。记录人工节拍、音画、音色、阅读时间和衔接结论；自动检查不能代替试听或用户认可。

## 第二阶段

时间轴编辑、修改影响预览、分段验收、音效素材标签和混音质量见 [MUSIC-PHASE2.md](MUSIC-PHASE2.md)。

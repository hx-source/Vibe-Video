# 音乐第二阶段：编辑、影响预览与分段验收

## 目录

- [局部分析与时间轴](#局部分析与时间轴)
- [修改影响预览与应用](#修改影响预览与应用)
- [分段验收](#分段验收)
- [音效标签与候选试听](#音效标签与候选试听)
- [混音质量](#混音质量)
- [验证与边界](#验证与边界)

## 局部分析与时间轴

沿用第一阶段的资产登记与 musicSync 接口，仍兼容旧分析文件。分析默认保留恒速拍表；选择局部跟拍候选：

```powershell
npm run music:analyze -- --project my-topic --clip bed --tracking adaptive --name analysis-v2
```

新增输出：

| 字段 | 含义 |
| --- | --- |
| localTempo / drift | 每 3 秒区间的局部速度、周期相关强度、恒速网格距瞬态的平均偏差和复核标记；使用约 6 秒上下文 |
| adaptiveBeats | 邻近瞬态跟随的候选拍表；停顿后重新寻找瞬态，不强行贯穿长静音 |
| meterCandidates | 三拍与四拍的重音对比假设，不自动认定拍号 |
| waveform | 50 毫秒间隔的振幅包络，供时间轴显示 |
| pauses / sections / repeats | 长低能量区间、能量变化/恢复/首尾候选与相似能量轮廓；不等同于音乐语义乐句 |
| tonality | 整体及每 8 秒窗口的调性候选、音级分布和 uncertain 状态 |

把分析文件保存到项目后运行 music:review。离线工作台支持拖动、双击增拍、删除、方向键按帧移动、撤销/重做、波形与能量显示、动作及音效标记、视窗缩放、局部节奏重排与平移。手机端时间轴可横向滚动。

“半速”隔拍取样，“倍速”在相邻拍间插值，适用于手工变速表；“以 BPM 重建全曲”才会替换完整逐拍表。选中一拍可设为重拍。所有操作使“已试听”状态失效；撤销也不继承已试听状态。动作音效表可选择带 sound 标签的登记素材，调整截取时长、可听起点与增益；下载修改提案时同时导出 audioPlan 和 actions。仅下载校正 JSON 不包含音效替换。音色原音和混合比较使用 music:palette；应用后用 review 听实际片段混音。

段落名称和起止时间可编辑、删除和新增，保存在 overrides.sections；段落可以重叠，作为注释，不自动改动画。局部编辑只改选区拍点，插入/删除会改变后续拍序号，必须查看影响。导出 `music-overrides.json` 或 `music-proposal.json`，不会直接覆盖项目。

## 修改影响预览与应用

先将工作台下载的提案放到本期目录。也可手写以下对象；未给出的字段保持不变：

```json
{
  "overrides":{"beats":[0.2,0.7,1.2,1.73],"beatsPerBar":4,"downbeatPhase":0},
  "music":{"sourceIn":0,"sourceOut":12,"at":0,"speed":1}
}
```

此示例拍表仅展示结构，真实项目需提供完整拍表。还支持替换 analysis、actions、storyboard、captions、audioPlan。music 变化会同步对应音频 clip 的截取、位置与速度，不自动修改场景时长。

```powershell
npm run music:impact -- --project my-topic --proposal music-proposal.json --name impact-v2
```

生成只读 `index.html`、impact.json、baseline.json、candidate.json。报告列出动作新旧位置、字幕时间与阅读风险、音效位置与越界、受影响片段及已认可片段是否需重新打开。字幕阅读风险是长度/时长启发式提示，不代替观看。无效候选不能应用。

如需比较历史输出，使用 `--baseline outputs/my-topic/old-version/music-snapshot.json`，路径相对于工程根目录。历史比较报告可用于审查，但只有 baseline 与当前项目完全一致才可应用。

```powershell
npm run music:apply -- --project my-topic --report outputs/my-topic/impact-v2/impact.json --expected 报告中的baselineFingerprint
```

应用前校验当前项目、候选和预览指纹，防止把过期报告应用到已变化的项目。若涉及已认可片段，明确传入 `--reopen chapter-two`（多个片段用逗号分隔），然后重新试片。这里的显式重新打开用于保护已认可片段，不能代替用户对新结果的验收。无变化片段保留认可状态。显式重开会追加 listened:false 的待复核记录；在本轮修改结束前继续调整该段无需重复 reopen，实际验收后才重新标为 approved。工具更新拍表版本，不重排未映射事件；写入前保留备份，载入校验失败时回滚本次写入。此为单进程回滚，不能保证断电级事务。

应用修改不会更新或覆盖任何已导出视频。旧版本位于原输出目录。

## 分段验收

prepare/render/review 输出 music-snapshot.json、segment-status.json，并在 manifest 中记录分段配置指纹和分段 PCM 音频指纹。配置指纹包括视频规格、场景、字幕、相交音乐与音效、混音参数、资产与场景源码。节拍在其他片段变化不会仅因全局 grid revision 改变而使前段失效；更换公共场景或音画渲染源码等变化会保守地要求复核。

```powershell
npm run music:status -- --project my-topic
npm run music:accept -- --project my-topic --manifest outputs/my-topic/opening-v1/manifest.json --segment opening --state needs-changes --note "结束音尾部过长"
```

实际观看并试听后才记录认可：

```powershell
npm run music:accept -- --project my-topic --manifest outputs/my-topic/opening-v2/manifest.json --segment opening --state approved --listened true --note "已观看并试听"
```

状态为 pending、needs-changes、approved；当前指纹变化后显示 needs-review，保留历史记录。manifest 必须对应当前配置，并覆盖整个片段，不能用仅覆盖 10 秒的预览认可一个 12 秒片段。需要先交十秒时，将 opening 分镜设计为 10 秒；未完成的后段可以继续单独制作。记录保存在本期 segment-reviews.json，技术检查不自动写入 approved/listened。

## 音效标签与候选试听

项目与共享资产索引的 audio 条目可增加 sound：

```json
{
  "id":"soft-chime","type":"audio","path":"soft-chime.wav",
  "source":"素材来源","license":"使用许可",
  "sound":{
    "instrument":"glockenspiel","pitches":[72,76,79],
    "durationSeconds":0.8,"attackSeconds":0.03,"tailSeconds":0.6,
    "loudnessLufs":-23,"truePeakDb":-5,
    "tags":["light","spacious"],"roles":["accent","end"]
  }
}
```

音高使用 MIDI 0–127；instrument/tags 为人工标签。音效分析给出可听起点、峰后有效衰减、尾部静音、音高候选和实际 LUFS/真峰值：

```powershell
npm run music:sound -- --project my-topic --asset soft-chime --instrument glockenspiel --tags light,spacious --name chime-analysis-v1
npm run music:palette -- --project my-topic --analysis music-analysis.json --instrument glockenspiel --tag light --role accent --at 8 --name palette-v1
```

sound 只输出候选 metadata，不自动改索引；复核后再登记。palette 从已登记素材筛选并排序，参考试听位置对应的调性窗口；调性 uncertain 时不使用音阶匹配评分。输出原音、与固定音乐混合的 3 秒候选、响度和来源说明。不提供自动乐器识别、素材下载或完整作曲。

候选比较统一使用 music gain × 0.7、effect gain 0.3，音效在 0.5 秒进入；它是比较样本，不代替最终 audio-plan 的混音。最多展示 12 个候选，长音效只试听前 3 秒。调性估计不能证明和谐，来源许可仍需按实际使用范围确认。

## 混音质量

prepare/audio/review/render 自动生成 A/audio-quality.json（有 B 方案时同样生成 B 报告）：

- 使用 FFmpeg loudnorm 的 input 数据测量 integrated LUFS、true peak dBTP、LRA；不自动归一化、不修改原混音。
- 对每个动作窗口（最长 0.6 秒）比较 music 与合并 effects 分轨的 RMS；重叠音效时这是合并响度，不是单独某个音效的响度。
- 检查目标响度、真峰值余量与潜在掩蔽/过强，并生成未应用的 duckingCandidates。已有 ducking 支持 attack/hold/release/gain，用户选择后复制到 audio-plan 再局部 A/B 试听。
- 正式 render 成功编码后，另测最终视频的 encoded-audio-quality.json，避免只测编码前混音。

可在 audio-plan 中设置 qualityPolicy：

```json
{"targetLufs":-16,"lufsTolerance":3,"maxTruePeakDb":-1,"minEffectRelativeDb":-18,"maxEffectRelativeDb":6,"duckGain":0.65}
```

这是项目的默认检查目标，不是强制发布标准。静音文件测量值为 null，并显式标记 silent。已有削波检查仍失败退出，不靠 loudness 报告替代。

单独生成报告：`npm run music:quality -- --project my-topic --name quality-v1`。

## 验证与边界

运行 `npm test`、`npm run typecheck`、`npm run check:scaffold`、`npm run verify:music` 和 `npm run verify:music:phase2`。

测试包含恒速、渐变速度、停顿恢复、弱瞬态、三/四拍候选、截取偏移、局部编辑、字幕/音效影响、认可片段保护、过期预览拒绝、真实 FFmpeg 测量与浏览器拖动/撤销/提案导出，以及桌面/手机布局。

纯合成样本不能证明所有真实音乐分析准确；没有鼓点、强切分、复合拍、复杂和弦和快速转调仍可能歧义。原音色、最终音画落点、字幕理解与混音听感必须人工审片，不能因测试通过自动标记为已听或已认可。

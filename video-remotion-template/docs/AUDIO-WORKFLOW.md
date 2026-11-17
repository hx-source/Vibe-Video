# 音频编排与审片

内容决定用途，配乐决定搭配，混合试听决定采用。用途不绑定固定声音；同一视频可以有多个不同的开始或结束音。过程音默认关闭。

## 编排

沿用旧工程 schema 2：sampleRate 为 44100，masterGain 非负；buses 支持 music/start/end/transition/process/accent，角色增益范围 0–4。clips、cues、rhythms、ducking 分别保存素材、简单合成音、显式节奏和配乐避让。

素材 clip：id、role、source（`asset:素材id`）、sourceIn/sourceOut（原素材秒数）、at（成片秒数或全片事件引用）、speed（0.5–2，默认 1）、gain、fadeIn/fadeOut、envelope、maxTailPadding。仅局部素材可以变速，不改变画面时间。

合成 cue：id、role、at、duration、kind（tone/kick）、frequency、gain。它是简单技术音色，不是完整作曲。rhythms 需显式设置 bpm、beats，不自动检测音乐节拍。

启用的非音乐音效必须写 purpose；musicFit 缺失会产生待试听提醒。process 必须显式 enabled:true。默认模板为空，不自动填入声音。

例如：

```json
{"id":"landing","role":"end","kind":"tone","at":{"event":"opening.settle"},"duration":0.25,"frequency":392,"gain":0.08,"purpose":"表示状态抵达终点","musicFit":"候选，需与背景音乐一起试听"}
```

避让 ducking 的 at 表示达到目标音量的时刻，attack 向前，hold/release 向后。重叠避让取最强一次，不连续相乘；只调整 music，不移动音乐位置。削波立即失败；峰值、RMS、重叠密度和长过程音提醒不代表听感通过。

## 命令与结果

```sh
npm run audio -- --project audio-demo --from 8 --to 10.5 --name ending-audio-v1
npm run review -- --project audio-demo --event opening.settle --before 1 --after 1.5 --compare audio-alternative.json
```

先生成完整混音，再裁剪本次选段。输出 A/、B/ 保存完整 mix.wav 和分轨；顶层 A-mix.wav、A-music.wav、A-effects.wav 等为局部音频。审片页使用完整音轨及全片偏移，切换时保留播放位置和播放状态。

审片记录 listened 仅表示用户勾选“已实际试听”，不表示批准。下载记录包含所选方案、音轨、范围及备注。工程不自动覆盖本期 review.json，不自动选中候选。

## 本地素材与复现

音频源通过素材索引解析，仅复制引用文件。原音乐不随源码分发。audio-demo 的测试配乐可运行 npm run demo:assets 重新生成；正式视频应使用用户选择或有适当使用权的素材。

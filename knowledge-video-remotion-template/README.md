# 内容驱动知识视频 · Remotion 模板工程

版本：0.1.0。提供项目创建、配置校验、按内容事件编排、画面预览、独立混音、带画面的 A/B 审片、静帧与局部/整片导出。

画面由 Remotion 渲染；音频由完整 FFmpeg 与确定性 PCM 混音生成，再由视频入口使用。没有连接 AI 作曲服务，不会自动生成经审美认可的分镜或配乐。

## 安装

使用 Node.js 22.12 或更新版本；本机验证使用 Node.js 24。首次安装需要联网下载依赖、字体和媒体程序。

```sh
npm ci
npx remotion browser ensure
npm run demo:assets
npm run doctor -- --project starter-demo
```

`demo:assets` 只生成 audio-demo 的 12 秒连续测试配乐，可重复执行；不修改用户选定的音乐。它是简单程序合成的技术样本，不是正式配乐方案。

## 常用操作

```sh
npm run new -- --project my-topic --title "本期主题"
npm run check -- --project my-topic
npm run preview -- --project my-topic
npm run review -- --project audio-demo --event opening.settle --before 1 --after 1.5 --compare audio-alternative.json
npm run stills -- --project tcp-handshake --times 18,25.2,45.6 --name inspect-v1
npm run render -- --project tcp-handshake --segment handshake --name handshake-v1
npm run render -- --project tcp-handshake --name full-v1
```

命令均在本目录执行。preview 启动 Studio，默认端口 8737；review 启动带画面的审片页，默认端口 8738。终端会给出实际地址；结束服务可按 Ctrl+C。`--name` 不填写时自动生成唯一时间名称，显式指定且目录已存在时拒绝覆盖。

每次 preview/review 使用独立的项目快照；修改项目配置后重新运行命令生成新修订。旧审片链接保留原方案，不自动更新成最新内容。

`check` 检查配置、引用和音频计划，不代替浏览器观看。所有时间参数均为成片秒数，区间右端不包含。`--segment`、`--event`、`--from/--to` 三种选段方式互斥。

## 示例

| 项目 | 用途 | 声音 |
| --- | --- | --- |
| starter-demo | 12 秒最小复用与字幕验证 | 静音 |
| audio-demo | 连续配乐、不同用途音效、音乐避让、A/B | 程序生成的测试配乐与短音，待人工试听 |
| tcp-handshake | 完整迁移旧三次握手/四次挥手内容与状态模型 | 静音，不捆绑用户原配乐 |

TCP 保留旧片的成片时间与字幕，源时间显式除以 1.25；最终包含末尾不足一帧的内容，共 2197 帧。画面重新实现，不是像素级复刻。

## 输出

`outputs/<项目>/<修订>/` 内保存 video.mp4、静帧、字幕、混音、分轨、输入配置与来源清单。A/、B/ 是整片声音，顶层 A-mix.wav 等是当前选段声音；浏览器使用完整音轨和片段偏移，保留跨边界尾音。

原始素材在公共 assets 或本期 assets；public/prepared 由工具生成。依赖、原始媒体、缓存和导出文件默认不进入 Git。

## 检查

```sh
npm run check:scaffold
npm run typecheck
npm test
npm run verify:browser
```

浏览器检查覆盖跳帧、文字边界、同画面 A/B、播放位置、范围循环及审片记录下载。每次导出后检查尺寸、帧数、音轨存在及完整解码。人工观看和听感另记，自动报告不会代替它们。

## 文档

- [结构与边界](docs/ARCHITECTURE.md)
- [项目与场景格式](docs/PROJECT-CONTRACT.md)
- [声音编排](docs/AUDIO-WORKFLOW.md)
- [迁移与验证](docs/MIGRATION.md)
- [Skill 接入](docs/SKILL-INTEGRATION.md)

目前面向最长 600 秒的 16:9 二维视频，字幕单轨，无配音。新增表现形式须增加场景组件与校验；更换配色不等于已支持所有知识题材。预览与渲染依赖本机浏览器和媒体程序可以启动。

# Remotion 工程调用 · 0.1.0

先运行本 Skill 的 scripts/locate_engine.py，以返回的 engineRoot 为命令工作目录。显式 --root 优先于环境变量，错误路径立即失败。默认查找 Remotion；旧 Canvas 须显式指定并改读 legacy.md。

工程 README、docs/PROJECT-CONTRACT.md、docs/AUDIO-WORKFLOW.md 是接口的权威说明。初次使用检查依赖；缺少时 npm ci，随后 npx remotion browser ensure。默认不升级锁定依赖。

音乐卡点项目另读工程 docs/MUSIC-WORKFLOW.md，使用 music:analyze、music:review、music:check；旧 rhythms 的显式 BPM 不代表已分析音乐。musicSync 为可选扩展，不改变引擎合约 0.1.0。

## 制作入口

```powershell
npm run new -- --project topic-id --title "本期主题"
npm run doctor -- --project topic-id
npm run check -- --project topic-id
npm run preview -- --project topic-id
npm run stills -- --project topic-id --times 1,5,9 --name stills-v1
npm run render -- --project topic-id --from 4 --to 7 --name transition-v1
npm run render -- --project topic-id --name full-v1
```

topic-id 应替换为实际名称。new 只创建静音结构，之后要填写 facts、storyboard、captions 和本期内容。现有 cards/sequence/cycle 是表现形式，不表示任意主题都能只换文字。专属组件须显式注册并增加 props 校验。

project.json 保存视频规格与文件引用；storyboard.json 决定片段顺序、时长、事件和场景；captions.json 保存单轨中文字幕。片段事件为局部成片秒数，声音使用完整的 segment-id.event-id 引用。字幕允许留白，不能重叠。

## 局部声音与审片

```powershell
npm run audio -- --project topic-id --from 4 --to 7 --name sound-v1
npm run review -- --project topic-id --event opening.settle --before 1 --after 1.5
npm run review -- --project topic-id --from 4 --to 7 --compare audio-alternative.json
```

review 是带画面的本机审片页，支持 A/B、分轨、逐帧、时间定位和范围循环。compare 路径相对本期目录。变体不改正式源计划；切换应保持位置和播放状态。导出 A/、B/ 为完整混音，顶层 A-mix.wav 等为选段音频，选段保留跨边界尾音。

所有选段均为成片秒数；--segment、--event、--from/--to 互斥，结束位置不包含。--name 已存在时拒绝覆盖。preview/review 是持续服务，报告实际地址并管理本次启动的进程，不关闭其他会话的服务。

## 检查与交付

- check 是配置与资源检查，不代表画面合格。
- 修改公共逻辑运行 npm run typecheck、npm test；修改浏览器或声音接入再运行 npm run verify:browser。
- 视频导出自动检查尺寸、帧数、音轨与完整解码。检查关键静帧及相邻转场；声音还需真正试听。
- outputs/<项目>/<修订> 保存视频、字幕、音轨、manifest 和输入数据。交付可播放结果与对应源码位置。
- 示例 audio-demo 首次使用先 npm run demo:assets；它是技术音色，不是默认生产配乐。
- 不自动上传原始媒体或把每次修改都公开发布；仓库同步按用户当前授权范围执行。

第二阶段接口见工程 docs/MUSIC-PHASE2.md：music:impact/apply/snapshot/status/accept/sound/palette/quality，验证命令 verify:music:phase2。历史对比、report 和 manifest 参数为工程根目录相对路径；analysis、overrides 和 proposal 为本期项目相对路径。

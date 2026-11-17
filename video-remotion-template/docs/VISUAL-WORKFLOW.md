# 规格、内容、三方案与十秒验证

按「规格 → 主题 → 资料核实 → 内容分析 → 三种视觉示例 → 选择/修改 → 场景与节奏 → 代表片段十秒 → 分段制作」推进。研究、构思与风格提案由制作助手执行，工程负责记录、渲染与版本检查；不会仅凭主题自动保证事实或美术质量。

## 规格与初始化

```powershell
npm run new -- --project my-topic --title "主题" --preset hd720
```

hd720 为 1280×720 / 30，hd1080 为 1920×1080 / 30，默认 hd1080。只支持 16:9；现有项目在 project.json.video 中修改尺寸。先填写实际内容、分镜、字幕及音频计划，再初始化：

```powershell
npm run design:init -- --project my-topic
# 指定中段的完整十秒，并给出选择理由：
npm run design:init -- --project another-topic --from 20 --to 30 --time 25 --reason "包含核心状态变化和主要视觉元素"
```

自动选段依据事件数量和机制场景优先级，只是可改候选；不固定取开头。片长不足十秒会明确失败，不拉伸或变速。

初始化新增 project.files.visualPlan、productionPlan，保留原有分镜和输出。默认三种候选尚未选定。未启用新流程的旧项目行为不变。

## 制作记录

production-plan.json 保存 specification（规格）、topic（受众/问题/结论）、research（status/sources/boundaries）、outline、scenePlan、representative（from/to/stillTime/reason）。sources 每项包含 title 与 reference；本地示例可指向 facts.md，不能伪造互联网核实。scenePlan 记录现有 segmentId、purpose、change 和 sceneType。

需要更新时先复制该文件为 production-proposal.json，编辑后应用：

```powershell
npm run design:brief -- --project my-topic --proposal production-proposal.json
```

规格须与 project.json 一致；当前实现不配音、中文字幕。讲解结构与场景意图属于计划，不能自动替代 storyboard 或事实审查。

## 比较实际风格

```powershell
npm run design:preview -- --project my-topic --name styles-v1
```

outputs/my-topic/styles-v1/index.html（或图片已内嵌的 comparison.html）显示同一内容、同一时刻的三张实际 PNG，并给出理由、表现方式与实现范围。比较页支持下载选择记录，不直接写本地文件；可以在聊天里告知制作助手选择或修改要求。

| 预设 | 背景 | 形象 | 线条 |
| --- | --- | --- | --- |
| night-story | 夜空、月亮、远山 | 人物肖像 | 柔光关系线 |
| clear-diagram | 浅色网格 | 大字节点 | 清楚的实线 |
| paper-sketch | 暖纸、细纹、手绘边界 | 手绘边框人物 | 朱红/墨色连线 |

moon-match 场景完整接入这些参数；其他现有场景支持配色及公共版式的部分适配，会明确显示“部分支持”。新主题仍需选择、编写合适场景，不能只添加风格名字。

```powershell
npm run design:select -- --project my-topic --candidate night --round 1 --note "用户选择夜空方案"
```

也可把比较页下载的 design-choice.json 放进项目目录，再使用 `--proposal design-choice.json`。该方式检查比较版本指纹；过期选择会被拒绝。

## 局部修改、混合与换一批

visual-patch.json 示例：

```json
{"background":"paper","illustration":"portrait","colors":{"background":"#f2ead8","text":"#352f29","muted":"#6c6256","primary":"#795b2c","panel":"#fbf7ec","line":"#c7b99e","accent":"#a63e37"},"fontScale":1.12,"glow":false}
```

```powershell
npm run design:revise -- --project my-topic --candidate night --proposal visual-patch.json --note "保留人物，改纸底并放大文字"
npm run design:preview -- --project my-topic --name styles-v2
```

可改 colors（八个主题颜色）、background（night/grid/paper）、illustration（portrait/node/sketch）、lineWidth（1–8）、glow、fontScale（0.9–1.25）、titleWeight（400/700）、texture（0–0.25）。字体使用已打包 Noto Sans SC；额外字体需实现打包和加载，不接受任意未安装字体名。局部修改保留未指定字段，并保存修改前后记录。

换一批时，在 candidates-proposal.json 中提供新的三组候选：

```json
{"candidates":[
  {"id":"a","styleId":"night-story","label":"方案A","rationale":"本期内容为何适合这种表达","overrides":{"illustration":"node"}},
  {"id":"b","styleId":"clear-diagram","label":"方案B","rationale":"突出关系与步骤"},
  {"id":"c","styleId":"paper-sketch","label":"方案C","rationale":"适合逐步推演"}
]}
```

```powershell
npm run design:propose -- --project my-topic --proposal candidates-proposal.json
```

保留旧轮次和修改记录，新轮不自动选中。实际视觉参数完全相同的候选会被拒绝。现有参数之外的风格需要先开发，不能用概念图冒充动画效果。

## 十秒样片与全片

选定风格、配置固定音乐与动作音效后：

```powershell
npm run design:sample -- --project my-topic --name representative-v1
npm run design:status -- --project my-topic
```

样片使用生产计划的全片范围，保留事件、字幕和配乐的全片时钟。它必须含音乐及至少一个范围内的动作音效。选择方向不等于认可动画和声音。

实际收到用户对该版本的观看、试听反馈后：

```powershell
npm run design:accept -- --project my-topic --manifest outputs/my-topic/representative-v1/manifest.json --state approved --viewed true --listened true --note "用户已观看试听并认可"
npm run render -- --project my-topic --name full-v1
```

状态也可为 pending 或 needs-changes；记录不能代替真实用户反馈。样片指纹涵盖内容、规格、场景源码、素材、视觉方案、音乐和选段；改变后显示 needs-review。旧输出不覆盖，已认可历史不删除。样片文件被替换或丢失也会失效。

启用此流程的项目，通过常规 CLI 导出整个全片前检查样片认可；局部测试仍可执行。此为工作流约束，不阻止开发者直接调用底层渲染 API。十秒认可只覆盖该样片方向，不代替整段或全片事实、画面和声音验收；music:accept 仍要求覆盖对应整段。

## 验证

```powershell
npm test
npm run typecheck
npm run check:scaffold
npm run verify:design
npm run verify:browser
```

verify:design 使用已有 moon-match-sample 原创素材；生成三张不同实际静帧，并在隔离测试项目中渲染片头之后的十秒，验证 720p/300 帧、音轨、解码和过期检查。不会给用户项目自动选择方案或写 approved/listened。

# 当前版本、局部修改和统一对照

可选扩展，不修改project contract 1。统一入口为`npm run production -- <命令>`，管理修订、冻结依赖、局部渲染、检查、媒体和反馈。原`render`、`review`、`music:impact`继续可用。接入参数化场景后，JSON补丁参与实际渲染；任意新动画仍需场景实现。

## 初始化与主记录

原生工程先完成基础配置，再运行：

```powershell
npm run production -- init --project my-topic
npm run production -- status --project my-topic
```

`init --seed production-seed.json`可接入自定义场景及已有媒体。已有本项目这种分段制作记录使用：

```powershell
npm run production -- import-current --project thinking-anchors
```

导入读取旧current-production、landscape-active-sources和landscape-production，核对当前完整媒体的实际时长和规格，沿manifest中的来源链导入同片长历史媒体。不会重渲染、改变视频，也不会把已排除段落加入有效时间线；不同片长历史保留在旧记录，不自动当成可直接对照的版本。迁移前旧视图备份在`production-history/legacy-before-init/`。

之后`production-state.json`是唯一当前版本主记录，包括specification、durationSeconds、segments、excludedSegments、currentRevision、revisions和reviews。每个revision含parent、status、全片rangeSeconds、局部editRangeSeconds、来源文件及SHA256、媒体及全局范围、可选配乐/音效轨和范围反馈。状态为draft、preview-ready、approved、exported、excluded；导出状态不代表用户已观看或试听。

`current-production.json`、`landscape-active-sources.json`、`landscape-production.json`和`delivery-status.json`仅为派生视图，带generatedFrom与主记录指纹。不要分别手改，也不要再运行会重写这些视图的旧单期finish脚本。`status`报告来源/产物变化及视图漂移，`sync`从主记录修复视图。每次修改前保存上一代主记录到`production-history/state-N.json`；`activate`回到已登记版本，历史源及媒体不删除。

## 建立局部修订

在项目目录写入`local-change.json`：

```json
{
  "id": "label-v2",
  "reason": "让报价变成参照的过程更明显",
  "rangeSeconds": [22, 23.5],
  "contextSeconds": 1,
  "changes": [
    {"sourceKey": "board", "replace": [{"pointer": "/labelAnimation/turn", "value": 22.5}]}
  ]
}
```

```powershell
npm run production -- revise --project my-topic --proposal local-change.json
```

`sourceKey`必须已在当前revision.sources登记。`changes`可为空，用于需要新场景代码的修改。非空时仅支持JSON现有属性替换（RFC6901指针）；TSX或任意命令不自动执行。补丁写入`production-revisions/<id>/sources/<sourceKey>/`，原认可文件保持。工作目录包含request与impact，列出涉及片段和带上下文的审片范围；当前版本不会自动切换。

来源哈希变化、过期baseRevision、重复修订、越界范围和无效指针会拒绝执行。范围是修改意图，不自动证明场景代码只改了这些秒数；仍需执行相邻转场、未修改内容及音频检查。需要改TSX时新建独立源文件，再用现有渲染入口制作实际产物。

新源在提案的`sources`中显式指定，例如`{"entry":"projects/my-topic/scenes/Film.tsx"}`，键必须已有登记，路径相对工程根目录。不要与同一键的JSON补丁混用。原文件及当前版本保持。`sourceOrigins`保存参数最初导入路径，构建时将相应JSON导入重定向到修订文件，而非仅写出一份未使用的配置。

若公共依赖已发生预期修改，先检查`status`列出的全部变化，在新提案中用`dependencyUpdates:{"src/components/example.tsx":"实际SHA256"}`明确采用；列表须与全部变化路径一致且哈希匹配。原记录和冻结包保持，不通过改写旧哈希消除告警。非预期变化应恢复原文件；快照损坏不能通过此方式跳过。

## 冻结依赖与统一渲染

每个修订最多冻结一个快照。给当前旧成片添加快照仅保存其当前可用源和工具依据，不重渲染成片，也不证明旧编码当时使用了完全相同的环境。主记录、历史源与原视频均保留。

项目内的renderer.json使用如下格式（路径相对工程根目录）：

```json
{
  "schemaVersion":1,
  "type":"browser-entry",
  "entry":"projects/my-topic/scenes/entry.tsx",
  "renderFunction":"renderFilm",
  "audio":{
    "planSourceKey":"audioPlan",
    "assetIndexes":["projects/my-topic/assets/index.json"],
    "eventSources":[{"sourceKey":"board","pointer":"/events","prefix":"reason.","offset":20}],
    "eventValues":{"label.turn":{"sourceKey":"board","pointer":"/labelAnimation/turn"}}
  }
}
```

入口暴露`window.renderFilm(整条整数帧)`，每次调用完整、确定地更新画面。当前适配React/SVG浏览器场景；不依赖播放历史，不联网取素材。字体默认内嵌Noto Sans SC400/700，纯字体无关测试可设置`fonts:false`。未设置audio时生成无音轨演示，不能称作配乐成片。此适配器不宣称支持任意Remotion上下文或外部视频；原生复杂场景可继续用原render并register。

音频索引沿用`{items:[{id,path,...}]}`，path相对索引目录。音频计划使用`asset:id`；只冻结实际启用的片段素材。eventSources从JSON读取事件；eventValues绑定一个具体参数，两者使用整条秒数。画面用同一参数，音效计划通过命名事件加可听起点偏移对齐。事件移动不自动调整所有后续内容，需检查动作时长与衔接。

```powershell
npm run production -- snapshot --project my-topic --revision label-v2 --config renderer.json
npm run production -- render --project my-topic --revision label-v2 --name label-v2-check
npm run production -- check --project my-topic --revision label-v2
```

snapshot保存esbuild传递依赖、声明的数据源、启用音频素材、字体、包清单与锁文件；输入原字节和独立画面包、混音实现包写入`production-snapshots/blobs/`并逐个校验SHA256。按内容去重，不覆盖旧快照。manifest含原路径到blob映射、事件、实际参数、Node/esbuild依据。原源发生变化时status告警，新修订默认拒绝；旧冻结包可在原TSX被改动或移走后继续渲染。浏览器和FFmpeg仍是外部运行条件，每次渲染记录实际工具依据；跨工具版本不承诺编码逐字节一致。

render默认用impact中的带上下文范围；可显式`--from 20 --to 26`或整条`--from 0 --to 52`，起止必须落在帧边界。保留整条事件时钟，先混音完整时间线再按采样裁剪，跨片段起点的尾音得到保留。每次必须新输出名称。成功后自动登记focus或full及同范围分轨，状态为preview-ready，当前版本和认可不自动改变。已登记版本的复现使用`--register false`，输出仍必须新名称。

默认检查：快照完整性、逐帧文字边界、浏览器异常、音频素材边界/事件重叠/削波/响度提示、编码帧数/时长/规格、完整解码、已登记旧媒体哈希。父版本有快照时，额外抽查未修改片段边界及修改前后帧，报告DOM与PNG差异；这是抽样，不是全部未修改帧的证明。Chrome轻微边缘差异仅在DOM完全相同且不超过0.1%像素、每通道最多2级时允许，其余沿用1级限制。`checks.json`记录范围、证据和人工检查边界。已有历史响度警告保留，不自动重混已认可配乐。

`check`重新校验冻结包、登记媒体哈希、规格与完整解码，并列出实时源漂移；源漂移与快照损坏分别报告。阅读是否充分、转场是否自然、声音是否贴合仍需正常速度观看/试听，不能由技术通过推断。

已有两个可直接复用的组件：`src/components/LabelTransition.tsx`控制标签说明到新身份的转换；`PriceComparison.tsx`控制前后价格、判断和出现顺序。52秒项目的新适配位于`projects/thinking-anchors/scenes/`，原批准组件保持。独立的`projects/production-price-demo/`是6秒无音轨参数示例，不是用户成片。`npm run verify:production:render`实际验证两类组件、参数改变后的画面与声音、02配乐PCM和历史媒体，并生成独立预览；此验证会新增非当前测试修订与输出。

## 登记真实媒体和来源

```json
{
  "sources": {"entry": "projects/my-topic/label-v2/entry.tsx"},
  "artifacts": {
    "full": {"file": "outputs/my-topic/label-v2/video.mp4", "rangeSeconds": [0, 52]},
    "focus": {"file": "outputs/my-topic/label-v2/focus.mp4", "rangeSeconds": [20, 26]}
  },
  "audioTracks": {
    "music": [{"file": "outputs/my-topic/label-v2/music.wav", "rangeSeconds": [0, 52]}],
    "effects": [{"file": "outputs/my-topic/label-v2/effects.wav", "rangeSeconds": [0, 52]}]
  }
}
```

```powershell
npm run production -- register --project my-topic --revision label-v2 --proposal rendered-label-v2.json
```

登记用ffprobe核对实际时长、视频尺寸和帧率，保存文件指纹；同修订已有媒体时不允许替换。根草稿可以登记第一版实际预览，之后每次修改新建revision。配乐与音效轨可不提供；提供时应与成片使用同一全片时钟及音量包络，不能把另一版本或不同淡出的分轨当成该片分轨。登记不会自动批准或选为当前版。

`npm run production -- activate --project my-topic --revision label-v2`显式切到已登记版本，也用于回退。来源或媒体已改变时拒绝切换。

## 对照与分轨

```powershell
npm run production -- review --project my-topic --before label-v1 --after label-v2 --from 22 --to 23.5 --context 1 --name label-v2
# 可选本机HTTP服务，仅监听127.0.0.1：
npm run production -- review --project my-topic --before label-v1 --after label-v2 --from 22 --to 23.5 --name label-http --serve true --port 8740
```

生成`outputs/<project>/production-review-<name>/index.html`和review-data.json，可直接打开本地HTML。服务只提供本次列出的媒体，支持Range拖动，不暴露工程目录。未指定before时取after的父版本；未指定范围时取修改范围或全片范围。两边媒体必须覆盖所需范围，优先选最短覆盖片段，避免全片与中段预览起点混淆。

页面支持保持整条位置和播放/暂停状态切换、范围循环、逐帧、速度、完整混音，以及已登记的配乐/音效分轨。未登记分轨的版本禁用对应选项。下载的检查记录只反映用户手动勾选和备注，不自动形成认可。

## 反馈与最终交付状态

```json
{"kind":"visual","rangeSeconds":[22,23.5],"artifact":"focus","feedback":"还可以"}
```

`production accept --project my-topic --revision label-v2 --proposal feedback.json`仅记录真实反馈，kind可为visual、audio、content、whole。范围必须被指定媒体覆盖，认可绑定该媒体SHA256；技术测试不能代填。局部或视觉认可不会变成整条听感认可。

最终渲染、编码和全片检查仍按现有工程执行。完成后登记完整媒体、activate，再用`production deliver --project my-topic --revision final-v1 --proposal delivery.json`记录实际交付。delivery.json为`{"authorization":"用户实际授权导出最终完整视频的原话"}`。它核验当前完整媒体，记录exported状态，不推断用户已经观看或批准。原生design样片与music听感流程继续遵循各自验收，production记录不替代它们。

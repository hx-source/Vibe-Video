# 统一修改与版本入口

完整参数和数据格式以工程 `docs/PRODUCTION-WORKFLOW.md` 为准。已适配场景支持来源快照、参数补丁、局部渲染和自动检查；任意新漫画动作仍需实现，也不替代 `music:impact` 的节拍影响分析。

- 项目有 `production-state.json` 时，以它作为当前版本、产物、分段及反馈的主记录；`production status` 检查来源、产物和派生视图是否漂移。`current-production.json` 等生成视图不要逐份修改。
- 新工程用 `production init`；已有分段项目用 `production import-current`，迁移前查看当前完整视频与有效片段，旧视图自动备份。不要把历史二手段或旧片长重新带回当前内容。
- 已授权局部修改用 `production revise --proposal ...` 建立独立修订和影响范围。显式JSON参数补丁写入新目录，不覆盖认可源。新TSX动画在独立源版本实现，用提案sources登记；已接入场景用 `snapshot/render/check`，成功后自动登记实际范围和分轨，再用 `review` 做局部对照。未接入场景沿用原有渲染入口后register。全片时钟及音乐偏移保持。
- snapshot冻结传递依赖、参数、素材、字体、画面包和混音实现，原字节按哈希去重保留；可用冻结包复现旧场景。实时源漂移和冻结包损坏分别报告。预期的公共源变化用新提案的dependencyUpdates精确列出实际哈希，不修改历史快照来消除警告。浏览器和编码工具仍需兼容。
- render默认检查修改范围及上下文中的文字边界、音频与完整编码；有父快照时抽查未改片段边界。查阅checks.json确认实际覆盖，抽样不能当全片证明。技术检查不判断是否读得完、转场是否自然或音色是否合适，需按阅读与声音参考正常速度复核。
- `production review` 支持新旧不同起点的完整或局部媒体，切换保留整条位置和播放状态，并提供范围循环、逐帧和已登记的分轨。浏览器检查和下载检查记录不自动认定观看、试听或认可。
- 仅将真实用户原话写入 `production accept`，明确 visual/audio/content/whole 及实际范围；不得用技术检查替代。`production activate` 显式选择当前版本，可切到已登记的待看片供审阅，也可回退；不自动批准。
- 修改前核对来源，修改后登记产物而非覆盖旧文件。已登记修订需要再次复现时用render --register false及新输出名称；要修改则新建修订。统一入口不具备任意场景自动改编或自动内容审查。

```powershell
npm run production -- status --project my-topic
npm run production -- revise --project my-topic --proposal local-change.json
npm run production -- snapshot --project my-topic --revision label-v2 --config renderer.json
npm run production -- render --project my-topic --revision label-v2 --name label-v2-check
npm run production -- check --project my-topic --revision label-v2
npm run production -- register --project my-topic --revision label-v2 --proposal rendered-label-v2.json
npm run production -- review --project my-topic --before label-v1 --after label-v2 --from 22 --to 23.5 --context 1 --name label-v2
```

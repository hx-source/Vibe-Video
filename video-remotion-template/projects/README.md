# 项目目录

starter-demo 为静音最小示例，audio-demo 为声音工程验证，tcp-handshake 为完整旧案例迁移。用途记录在 catalog.json，技术样本不代表已认可的声音配方。

新一期通过 npm run new 创建；每期独立保存事实、分镜、字幕、素材和审阅状态。历史输出不回写源配置。

## 项目索引

| 项目 | 用途 | 当前状态 |
| --- | --- | --- |
| thinking-anchors | 锚定效应正式视频 | 52秒横屏最终版已获用户完成确认，并复制到本机成片目录 |
| endowment-effect | 禀赋效应主题制作 | 当前保留10秒代表试片 v6，尚无完整成片 |
| anchoring-effect | 早期锚定效应案例 | 62秒完整导出，保留为旧案例，不等同于52秒已确认成片 |
| moon-match-sample | 场景与风格示例 | 10秒演示样片 |
| tcp-handshake | TCP握手迁移示例 | 73.23秒无声完整演示 |
| starter-demo | 最小工程示例 | 用于新工程验证 |
| audio-demo | 声音功能验证 | 12秒声音演示，技术状态与试听认可分别记录 |
| production-price-demo | 参数化价格组件验证 | 局部渲染与版本管理示例 |

`catalog.json` 提供分类索引；有 `production-state.json` 的项目以该文件为当前版本与认可主记录。示例项目不自动视为用户已认可成片。

## 当前制作与历史入口

对 thinking-anchors 的后续修改使用 `npm run production -- status/revise/register/review/accept` 等统一入口，具体参数见 [制作流程](../docs/PRODUCTION-WORKFLOW.md)。当前源文件由 `landscape-active-sources.json` 标识，该文件由主记录生成。

单期历史 `finish`、`deliver`、`render` 脚本用于理解旧制作过程；部分仍被复现流程调用，暂不移动或删除。不要直接重跑会覆盖当前状态文件的旧脚本。清理输出前需同时核对代码、记录和预览页面引用。

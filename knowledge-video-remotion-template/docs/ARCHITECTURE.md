# 工程结构与边界 · 0.1.0

## 数据流

事实与分镜 → 配置校验 → 全片/片段时间轴 → Remotion 场景；同一事件表 → 音频计划 → 完整混音与分轨 → 画面预览、审片与导出。

| 模块 | 实现与职责 |
| --- | --- |
| src/compositions | Root 注册入口；KnowledgeFilm 按全片帧选择场景和字幕；default 提供静音默认项目 |
| src/components | 图形、字幕、进度计算及打包中文字体加载 |
| src/scenes | cards、sequence、cycle；sequence-model 负责可测试的状态演示 |
| src/timeline | 编译局部事件、字幕、全片事件和帧边界；选段与 SRT |
| src/themes | paper、midnight 两套配色，统一版式与中文字体 |
| src/audio | schema 2 音频编排规则及 Remotion 音轨入口 |
| src/review | Player 页面；同画面 A/B、分轨、定位、逐帧、循环及备注下载 |
| scripts/project.mjs | 项目创建、输入校验、资产标识解析与来源摘要 |
| scripts/prepare.mjs | 资源准备、声音生成、整片/片段音轨、输入配置与 manifest |
| scripts/arrange-audio.mjs | 已从旧工程迁移的 PCM 混音、分轨、避让和峰值检查 |
| scripts/render.mjs | 打包、渲染静帧/视频、检查帧数及完整解码 |
| scripts/runtime.mjs | 浏览器与媒体程序定位；完整 FFmpeg 用于混音，Remotion 程序用于视频渲染 |
| scripts/review-server.mjs | 本机审片服务；忽略输出与缓存变化，避免渲染中打断审片 |
| scripts/cli.mjs | 用户操作入口 |
| scripts/migrate-tcp.mjs | 显式转换旧 TCP 配置；拒绝覆盖已有迁移项目 |
| scripts/demo-assets.mjs | 可复现的声音技术样本 |
| tests | 时间、字幕、路径、声音策略、PCM 分轨及 TCP 状态语义 |

## 时间与一致性

配置使用成片秒数。绝对边界转换为第一个不早于该时间的帧，即 ceil(seconds × fps)，带微小浮点容差；不独立累计舍入后的片段帧数。末尾部分帧保留。

每个场景接收局部时间，由帧和输入数据计算，不依赖播放历史。修改内容时长会重排后续片段；仅修改布局不会改变后续位置。音乐节拍不自动改写内容时间。

局部画面使用全片帧偏移，局部声音从完整混音裁剪，不从头重播背景音乐。字幕 SRT 裁剪后从局部零时刻计时。

## 资源与运行边界

依赖版本由 package-lock.json 固定。字体来自 @fontsource/noto-sans-sc，在本机打包并等待加载完成，不依赖用户系统字体名称。完整 FFmpeg 通过 ffmpeg-static 安装；Remotion 的精简媒体程序不承担 PCM 混音。

仅复制实际引用的资源到 public/prepared/<项目>/<修订>。源素材索引记录来源、授权说明；manifest 记录配置、素材和依赖摘要。路径不得越出素材或项目根目录。

画面类型的注册与校验需要一起修改。Node 文件操作不进入浏览器组件；浏览器不维护另一份声音编排规则。当前无云端渲染、AI 作曲、自动调性匹配或人声轨。

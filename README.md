# Vibe Knowledge Video

内容驱动的知识讲解视频制作工程：**Remotion 模板工程 + 单期项目配置 + knowledge-video Skill**。

当前工程版本 **0.1.0**，Skill **2.0.0**。已经接通本地制作、预览、混音、带画面的审片与导出，保留旧 Canvas 工程 v0.3.0 的显式兼容入口。

## 已有能力

- 单期分镜、中文字幕、内容事件、素材索引与事实说明。
- 卡片关系、双方消息时序、循环进度三类 React/SVG 场景。
- 纸张和深色两套配色，随依赖安装的 Noto Sans SC 中文字体。
- 连续背景音乐、按用途安排音效、独立音量与音乐避让。
- Remotion Studio 预览、同画面 A/B 与分轨试听、逐帧和局部循环。
- 新建项目、静帧、局部/整片 MP4、SRT、音轨和来源清单。
- 时间、音频、协议状态测试，以及真实浏览器和视频解码检查。

工程保证配置能被一致执行，不自动保证内容正确或声音好听。当前没有 AI 作曲、自动节拍检测、旁白或任意知识题材的一键成片。

## 开始

使用 Node.js 22.12 或更新版本；当前验证环境是 Windows、Node.js 24。

```sh
cd knowledge-video-remotion-template
npm ci
npx remotion browser ensure
npm run demo:assets
npm run doctor -- --project starter-demo
npm run preview -- --project starter-demo
```

首次安装需要联网；后续使用本地资源制作。依赖锁文件固定版本。素材和渲染结果默认不上传 GitHub。

```sh
npm run new -- --project my-topic --title "本期主题"
npm run render -- --project tcp-handshake --segment handshake --name handshake-v1
npm run review -- --project audio-demo --event opening.settle --compare audio-alternative.json
```

new 创建可渲染的静音结构，正式制作前需填写本期内容。旧 TCP 案例已经迁移为 73.233 秒/2197 帧的完整静音示例；音频演示另有 12 秒程序测试素材，不捆绑用户原音乐。

## 目录与说明

| 目录 | 用途 |
| --- | --- |
| knowledge-video-remotion-template | 运行工程、单期模板、示例、工具和验证 |
| skills/knowledge-video | Skill 维护源；默认调用新工程，显式指定时处理旧工程 |
| .github/workflows | 配置、类型与单元测试工作流；不在云端自动发布影片 |

- [工程操作手册](knowledge-video-remotion-template/README.md)
- [各模块职责](knowledge-video-remotion-template/docs/ARCHITECTURE.md)
- [逐项完成清单](knowledge-video-remotion-template/docs/MIGRATION.md)
- [验证与限制](knowledge-video-remotion-template/docs/VERIFICATION-v0.1.md)
- [Skill 说明](skills/README.md)

## 版本与素材管理

本仓库是工程和 Skill 的维护源。公共能力改工程，单期选择改项目，制作方法改 Skill。工程与 Skill 分别编号并记录兼容范围。

依赖、浏览器、缓存、原始媒体和每次生成的视频不加入源码历史。素材索引保存来源与授权说明；要共享原始媒体时，单独确认分享范围。发布工具可从已提交源码生成本地 ZIP 与校验清单，不自动发布 GitHub Release。

当前未附加源码开源许可证；第三方依赖和素材分别遵循其自身许可。

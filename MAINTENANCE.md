# 工程与 Skill 维护

## 职责与入口

| 内容 | 维护位置 | 说明 |
| --- | --- | --- |
| 制作流程与验收方法 | skills/knowledge-video | Skill 维护源，验证后同步已安装副本 |
| 通用画面、音频及工具 | video-remotion-template/src、scripts | 公共能力改这里；运行相关测试 |
| 新项目起点 | video-remotion-template/templates | 保持模板引用与工程版本一致 |
| 单期内容、素材索引及状态 | video-remotion-template/projects | 单期修改不直接写成全局 Skill 规则 |
| 项目分类 | video-remotion-template/projects/catalog.json、README.md | 完成情况以单期制作主记录为准 |

本机 Skill 安装在 `C:/Users/hx/.codex/skills/knowledge-video`；仓库内副本是维护源。新电脑通过工程相对位置或显式 `--root` 定位，固定本机路径仅作回退。

## 本地输出与归档

- `outputs/<项目>/<修订>`：视频、音轨、审片页面和历史对照。
- `output/playwright`：浏览器检查截图和报告。
- `public/prepared`：供预览读取的素材、混音副本。
- `.cache/bundle-*`、`node_modules/.cache`：可重新生成的构建缓存；关闭相关任务后清理。
- `projects/*/assets`：单期素材及来源索引；原始音频、参考视频也可能位于仓库外。

本机用户明确确认某条视频完成后，将确认版本复制到 `D:/Documents/dy/视频成片`，校验 SHA256 一致并保留工程内原文件。不同内容不覆盖同名文件。认可通过 `production accept` 登记；归档位置和校验结果保存在该项目的归档记录中。未经用户确认的技术检查不替代完成认可。

## GitHub 同步范围

同步工程源码、锁文件、Skill 维护源、配置、说明和制作记录。依赖、构建缓存、原始媒体、成片、预览副本和 `production-snapshots` 生成包保留本地，由 `.gitignore` 排除。同步前检查暂存文件清单，避免额外媒体或凭据进入仓库。

本地目录与远程仓库均为 `Vibe-Video`，远程地址为 `https://github.com/hx-source/Vibe-Video.git`。工程目录名为 `video-remotion-template`，内部包标识 `knowledge-video-remotion-template` 保持兼容。

仅克隆源码不能恢复全部历史影片：必须另行备份原始素材、需要保留的输出和冻结快照。历史文档内本地媒体链接在只有源码的克隆中不可用。

## 同步前检查

在 `video-remotion-template` 中运行 `npm run check:scaffold`、`npm run typecheck` 和 `npm test`；首次克隆先 `npm ci`，示例素材用 `npm run demo:assets` 生成。通过 Skill 的 `scripts/locate_engine.py` 验证定位，检查维护源与本机安装副本一致。

目录迁移与相关配置应放在同一次提交中，检查改名识别、忽略规则及暂存差异。提交和推送按用户本次授权执行。

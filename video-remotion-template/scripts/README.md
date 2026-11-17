# 本机制作工具

cli.mjs 是操作入口；project/files 负责加载、路径与来源；prepare/arrange-audio/pcm 负责素材和声音；render/runtime 负责实际渲染和媒体检查；review-server 为审片提供本机服务。

verify-browser 是真实浏览器检查；demo-assets 生成技术样本；migrate-tcp 显式转换旧案例；release 从已提交源码生成快照。详细命令见工程 README。

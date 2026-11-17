# 讲解场景

cards 支持事件揭示、关系连接和可选图片；sequence 支持双方消息流与状态变化；cycle 支持进度环与阶段解释。registry.tsx 统一分派；sequence-model.mjs 提供与画面共享的纯状态模型。

新增场景时同时更新 scripts/project.mjs 校验和 registry。场景与 paper/midnight 配色分离。本期专属场景可放 projects/<项目>/scenes，须显式接入，不动态执行 JSON 中的任意路径。

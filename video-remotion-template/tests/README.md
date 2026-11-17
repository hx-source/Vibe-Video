# 验证范围

npm test 验证事件、帧边界、字幕、路径、混音策略、实际 PCM 分轨与 TCP 协议状态；npm run typecheck 检查 React/TypeScript 接口。

npm run verify:browser 启动真实浏览器检查布局、任意跳帧、A/B 同位置切换、播放/循环和审片记录。每次视频导出都会核对尺寸、帧数、音轨并完整解码。

这些自动检查不代替知识审阅或人工听感判断。audio-demo 首次检查前运行 npm run demo:assets。

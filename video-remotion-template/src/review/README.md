# 带画面的审片

main.tsx 通过 Remotion Player 展示同一画面，提供全片秒数定位、逐帧、播放进度、范围循环、A/B 及分轨选择。切换保留位置和播放状态。控制条在画面外，避免遮挡字幕和干扰截图。

使用 npm run review 启动，不能直接双击 HTML。审片数据限定在 /prepared/ 下；记录需下载后归档。未勾选试听时仍保持 not-listened。

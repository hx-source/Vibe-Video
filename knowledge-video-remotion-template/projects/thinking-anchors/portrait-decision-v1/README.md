# 竖屏24–38秒生活方法段

画面Decision.tsx，场景注册与参数校验entry.tsx、contract.mjs；独立Remotion画面入口Root.tsx。1080×1920、30fps，无旁白。

render.mjs检查新增420帧，--render导出14秒并衔接前24秒；完成输出拒绝覆盖，需新--name。deliver.mjs生成审片页和播放检查。首次输出的时间戳修复由finish-join.mjs完成，保留了截短的中间文件以便核查；正式脚本已修正到38秒。

输出：outputs/thinking-anchors/portrait-decision-v1/video.mp4
连贯版：outputs/thinking-anchors/portrait-decision-v1/continuity-0-38.mp4
审片页：outputs/thinking-anchors/portrait-decision-v1/review.html

前24秒使用认可码流并验证解码像素哈希，0–23.82秒混音相同。后0.18秒取消原独立预览淡出以连续衔接。技术检查与人工听感分别记录。

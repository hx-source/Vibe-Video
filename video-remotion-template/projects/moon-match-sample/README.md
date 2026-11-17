# 月老的算法 · 10 秒样片

1280×720 / 30 fps / 300 帧 / 无配音 / 中文字幕。原创 SVG 人物、夜空与关系动画；不提取参考视频的画面或声音。

用两位邀请者和两位接收者演示一次暂留、替换与继续邀请。只解释这一局部机制，不宣称证明完整稳定匹配算法。

## 复现

在工程根目录执行：

```powershell
python projects/moon-match-sample/build-assets.py
npm run check -- --project moon-match-sample
npm run render -- --project moon-match-sample --name sample-v1
```

`build-assets.py` 依赖 Python / numpy，生成固定 120 BPM 原创程序配乐与短铃音；不是 AI 音乐服务或真实乐器采样。重生成音乐时应重新分析并检查源指纹，不能沿用失配的分析文件。

自动分析将部分强拍识别为 60 BPM；music-overrides.json 按原始作曲代码给出的半秒节拍校正为 120 BPM。该记录属于谱面依据，未冒充人工试听。动作读取 storyboard 事件，音效绑定同一事件。

## 可选规格

创建项目时可选择：

```powershell
npm run new -- --project my-topic --preset hd720
npm run new -- --project my-topic-hd --preset hd1080
```

默认 hd1080（1920×1080 / 30）；hd720 为 1280×720 / 30。现有项目在 project.json 中修改 video 尺寸，使用同一 1920×1080 设计坐标缩放。全屏场景由 props.layout=fullbleed 启用；已有场景仍使用原版式。

## 验收

用户对画面及听感的认可状态保留为待确认。自动节拍、响度和导出检查不能代替试听。

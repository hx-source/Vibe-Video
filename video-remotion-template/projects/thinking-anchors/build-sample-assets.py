"""Create short original nonmusical action sounds; keep the provided music unchanged."""
from pathlib import Path
import json
import shutil
import wave
import numpy as np

ROOT = Path(__file__).resolve().parent
assets = ROOT / 'assets'
assets.mkdir(exist_ok=True)
rate = 44100
rng = np.random.default_rng(20261114)

def sound(name, duration, decay, smooth, echo):
    n = round(duration * rate)
    t = np.arange(n) / rate
    noise = rng.normal(0, 1, n)
    filtered = np.convolve(noise, np.ones(smooth) / smooth, mode='same')
    attack = np.minimum(1, t / .0025)
    fade = np.minimum(1, (duration - t) / .018)
    samples = filtered * attack * fade * np.exp(-t / decay)
    delay = round(echo * rate)
    if delay:
        samples[delay:] += .18 * samples[:-delay].copy()
    samples *= .62 / max(.0001, np.max(np.abs(samples)))
    stereo = np.column_stack((samples, .97 * samples))
    with wave.open(str(assets / name), 'wb') as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(rate)
        out.writeframes((stereo * 32767).astype('<i2').tobytes())

sound('wheel-stop.wav', .13, .022, 12, .017)
sound('bubble-pop.wav', .16, .031, 30, .025)
sound('result-land.wav', .23, .047, 19, .038)
music_source=Path(json.loads((ROOT/'next-revision-brief.json').read_text(encoding='utf-8'))['music']['path'])
shutil.copyfile(music_source, assets / 'storytelling.m4a')
items = [{
    'id': 'anchors-bed', 'path': 'storytelling.m4a', 'type': 'audio',
    'source': f'用户明确指定：{music_source.as_posix()}',
    'license': '沿用本地素材用于本期本地试片；未核实公开传播许可'
}]
for asset_id, filename, instrument, duration, purpose in [
    ('wheel-stop', 'wheel-stop.wav', 'muted-noise-click', .13, '转盘停止'),
    ('bubble-pop', 'bubble-pop.wav', 'soft-noise-pop', .16, '比较气泡出现'),
    ('result-land', 'result-land.wav', 'soft-noise-tap', .23, '统计结果落定'),
]:
    items.append({
        'id': asset_id, 'path': filename, 'type': 'audio',
        'source': f'本期 build-sample-assets.py 生成的短噪声瞬态；用途：{purpose}；不是配乐或AI作曲',
        'license': '本期原创程序音效，无第三方采样',
        'sound': {'instrument': instrument, 'pitches': [], 'durationSeconds': duration,
                  'attackSeconds': .0025, 'tailSeconds': duration-.0025,
                  'tags': ['short', 'nonmusical', 'original'], 'roles': ['accent', 'end']}
    })
(assets/'index.json').write_text(json.dumps({'schemaVersion': 1, 'items': items}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print('Prepared one local music candidate and three original short action sounds.')

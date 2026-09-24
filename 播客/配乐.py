#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配乐.py — 给合成好的播客垫一层节奏欢快一些的背景音乐

输入：播客/音频/YYYY-MM-DD.mp3（由 合成音频.py 产出的纯人声）
输出：同一个文件，混好音乐之后原地替换

为什么单独做一步，不并进 合成音频.py：
  合成音频.py 是靠「MP3 帧首尾相接」拼出来的，全程不解码，
  所以它快、也不需要任何音频库。但背景音乐是要和人声**叠加**的，
  两条波形相加这件事在 MP3 域里做不到，必须解码成 PCM。
  与其把那个干净的拼接逻辑改乱，不如在它后面加一道独立工序：
  合成音频.py 照旧只管人声，这里只管垫乐。

时间轴必须原样保留：
  播客页面的跟读高亮是拿 currentTime 和文稿里的 at / end 比的，
  所以这一步**不许改变总时长**，只叠加、不裁剪、不补零。
  跑完会自己核对一遍，对不上就不写回去。

反复跑也不会越垫越厚：
  第一次跑的时候，把纯人声那一版备份进 .缓存/，
  以后每次都从那份备份重新混。所以这个脚本可以随便重跑。

音乐是**现场用 numpy 算出来的**，不是下载的素材：
  底层是 C 大调和弦垫底，走的是流行乐最常见的「欢快」进行
  C - G - Am - F，比小调多的大调五级、四级让色彩更明亮；
  和弦每 4.3 秒换一轮（原来是 20 秒），转得更勤，听感更有向前走的劲头。
  上面叠一条按八分音符（112 拍/分）跳动的分解和弦「拨弦」声部——
  短促起振、指数衰减，像轻的马林巴——这是「节奏感」真正的来源：
  纯长音的和弦垫底听不出拍子，加一条会跳的音符线才有。
  依然没有鼓组、没有人声旋律，音量也不高，不会把注意力从讲课内容
  上拽走，也没有版权问题（全部现场合成）。

人声一响，音乐自动让路（side-chain ducking）：
  跟着人声的包络实时压低音量 —— 说话时几乎听不见，
  段落间隙里才轻轻浮上来一点。这是背景音乐不招人烦的关键。

用法：
  python 配乐.py                 → 给今天的垫乐
  python 配乐.py 2026-09-19      → 给指定日期的垫乐
  python 配乐.py 2026-09-19 --干  → 还原成纯人声（撤销垫乐）
"""

import datetime
import os
import shutil
import subprocess
import sys

for _s in ("stdout", "stderr"):
    try:
        getattr(sys, _s).reconfigure(errors="replace", line_buffering=True)
    except Exception:
        pass

try:
    import numpy as np
except ImportError:
    print("缺少 numpy。请先在命令行运行：pip install numpy")
    sys.exit(1)

ROOT = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(ROOT, "音频")
CACHE_DIR = os.path.join(ROOT, ".缓存")

SR = 24000          # 和 edge-tts 的输出一致，省一次重采样
BITRATE = "64k"     # 人声原本是 48k；垫了乐之后给音乐留一点余量

# ---- 混音档位（线性增益，不是分贝）----
MUSIC_UNDER_SPEECH = 0.055   # 说话时：约 -25 dB，垫底但不抢话
MUSIC_IN_GAPS      = 0.21    # 间隙时：约 -13 dB，比舒缓版本略高，
                              # 让分解和弦的跳动节奏在段落间隙里能被听出来
FADE_IN_SEC        = 4.0
FADE_OUT_SEC       = 7.0
DUCK_ATTACK_SEC    = 0.08    # 人声一起来，音乐迅速让开
DUCK_RELEASE_SEC   = 1.10    # 人声停了，音乐慢慢浮回来（快了会「一跳一跳」）

# ---- 节奏参数 ----
BPM = 112                    # 比原来的纯长音明显快，是「欢快」的主要来源
BEAT_SEC   = 60.0 / BPM
EIGHTH_SEC = BEAT_SEC / 2.0


def ffmpeg_exe():
    """
    优先用 imageio-ffmpeg 自带的那个 —— 它装在 site-packages 里，
    不用往系统里装东西，换台电脑 pip install 一下就有。
    系统里本来就有 ffmpeg 的话也认。
    """
    from shutil import which
    p = which("ffmpeg")
    if p:
        return p
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def decode(exe, path):
    """MP3 → 单声道 float32 PCM。"""
    r = subprocess.run(
        [exe, "-v", "error", "-i", path,
         "-f", "f32le", "-acodec", "pcm_f32le",
         "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    if r.returncode != 0:
        raise RuntimeError("解码失败：" + r.stderr.decode("utf-8", "replace")[-400:])
    return np.frombuffer(r.stdout, dtype="<f4").astype(np.float32)


def encode(exe, pcm, path):
    """float32 PCM → MP3，写到 path。"""
    r = subprocess.run(
        [exe, "-v", "error", "-y",
         "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
         "-c:a", "libmp3lame", "-b:a", BITRATE, "-ar", str(SR), "-ac", "1",
         # 临时文件叫 .tmp，ffmpeg 猜不出格式，这里明确告诉它
         "-f", "mp3", path],
        input=pcm.astype("<f4").tobytes(), capture_output=True,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    if r.returncode != 0:
        raise RuntimeError("编码失败：" + r.stderr.decode("utf-8", "replace")[-400:])


# ---------------- 音乐合成 ----------------

def _note(freq, n, t):
    """
    一个「暖」音：基频 + 二次 + 三次谐波，两路轻微失谐叠在一起。
    失谐量很小（万分之六），听感上是厚，不是走音。
    """
    out = np.zeros(n, dtype=np.float32)
    for detune in (1.0, 1.0006):
        f = freq * detune
        phase = 2 * np.pi * f * t
        out += (np.sin(phase)
                + 0.25 * np.sin(2 * phase)
                + 0.08 * np.sin(3 * phase)).astype(np.float32)
    return out * 0.5


# 流行乐最常见的「欢快」四和弦进行：C - G - Am - F（I-V-vi-IV）。
# 拨弦声部和长音垫底共用同一套和弦，保证两条线永远合拍。
CHORDS = [
    (130.81, 196.00, 261.63, 329.63, 392.00),   # C     C3 G3 C4 E4 G4
    (98.00,  196.00, 246.94, 293.66, 392.00),   # G     G2 G3 B3 D4 G4
    (110.00, 164.81, 220.00, 329.63, 392.00),   # Am    A2 E3 A3 E4 G4
    (87.31,  174.61, 261.63, 349.23, 440.00),   # F     F2 F3 C4 F4 A4
]
NOTES_PER_CHORD = 16                                  # 2 小节（每小节 8 个八分音符）
CHORD_SEC = NOTES_PER_CHORD * EIGHTH_SEC              # ≈4.29 秒，比原来的 20 秒快得多


def make_pad(total_samples):
    """
    和弦长音垫底，走 CHORDS 的进行，每个和弦持续一轮 CHORD_SEC，
    相邻和弦用 1.2 秒交叉淡入淡出，接缝听不出来。
    换得比原来的舒缓版本快很多，本身就是「欢快感」的一部分。
    """
    t = np.arange(total_samples, dtype=np.float32) / SR

    chords = CHORDS

    hold = int(CHORD_SEC * SR)     # 每个和弦持续
    fade = int(1.2 * SR)           # 交叉淡入淡出
    step = hold - fade             # 下一个和弦的起点

    pad = np.zeros(total_samples + hold, dtype=np.float32)
    seg_t = np.arange(hold, dtype=np.float32) / SR
    # 单个和弦的包络：两头是等功率淡入淡出，中间保持
    env = np.ones(hold, dtype=np.float32)
    ramp = np.linspace(0.0, 1.0, fade, dtype=np.float32)
    env[:fade] = np.sin(ramp * np.pi / 2) ** 2
    env[-fade:] = np.cos(ramp * np.pi / 2) ** 2

    i = 0
    k = 0
    while i < total_samples:
        freqs = chords[k % len(chords)]
        seg = np.zeros(hold, dtype=np.float32)
        for j, f in enumerate(freqs):
            # 高音部稍微轻一点，避免和人声的中高频打架
            seg += _note(f, hold, seg_t) * (1.0 / (1.0 + 0.55 * j))
        pad[i:i + hold] += seg * env
        i += step
        k += 1

    pad = pad[:total_samples]

    # 呼吸起伏：0.09 Hz，约 11 秒一个来回，幅度 ±12%——比舒缓版本快了一倍，
    # 跟更快的和弦节奏合拍
    breath = 1.0 + 0.12 * np.sin(2 * np.pi * 0.09 * t).astype(np.float32)
    pad *= breath

    peak = float(np.max(np.abs(pad))) or 1.0
    return (pad / peak).astype(np.float32)


def _pluck(freq, n, t):
    """
    短促的「拨弦」音色：极快起振（6 毫秒）+ 指数衰减（0.35 秒），
    叠二次、三次谐波增加亮度。这是「欢快」的节奏来源——
    纯长音的和弦垫底本身听不出拍子。
    """
    phase = 2 * np.pi * freq * t
    wave = (np.sin(phase)
            + 0.35 * np.sin(2 * phase)
            + 0.15 * np.sin(3 * phase)).astype(np.float32)
    decay = np.exp(-t / 0.35).astype(np.float32)
    attack = np.minimum(t / 0.006, 1.0).astype(np.float32)
    return wave * decay * attack * 0.6


def make_arpeggio(total_samples):
    """
    跟着 CHORDS 的和弦走向，按八分音符逐个「弹」出分解和弦
    （根音-三音-五音-八度来回起伏），形成向前走的律动。
    只有一条单音线，音量也不大，不会盖过人声，
    但足够让间隙里的音乐听出「拍子」。
    """
    step_n = int(round(EIGHTH_SEC * SR))
    pattern = [0, 1, 2, 1, 3, 2, 1, 0]       # 一小节内的旋律走向：上行再回落
    note_len = step_n * 2                    # 音符长度盖过下一次起音，靠衰减自然收尾

    out = np.zeros(total_samples + note_len, dtype=np.float32)
    i = 0
    k = 0
    while i < total_samples:
        notes = CHORDS[k % len(CHORDS)]
        for _ in range(NOTES_PER_CHORD // len(pattern)):
            for idx in pattern:
                if i >= total_samples:
                    break
                f = notes[idx % len(notes)] * 2   # 高八度，和长音垫底区分开
                seg_n = min(note_len, len(out) - i)
                tt = np.arange(seg_n, dtype=np.float32) / SR
                out[i:i + seg_n] += _pluck(f, seg_n, tt)
                i += step_n
        k += 1

    return out[:total_samples]


def make_music(total_samples):
    """长音垫底 + 拨弦律动叠在一起，归一化到统一的峰值。"""
    pad = make_pad(total_samples)
    arp = make_arpeggio(total_samples)
    mixed = pad * 0.8 + arp * 0.55
    peak = float(np.max(np.abs(mixed))) or 1.0
    return (mixed / peak).astype(np.float32)


def duck_gain(speech):
    """
    跟着人声算一条音量曲线：说话时压到 MUSIC_UNDER_SPEECH，
    间隙里放到 MUSIC_IN_GAPS。attack 快、release 慢，
    否则每个字的间隔音乐都会往上窜一下，非常闹。
    """
    env = np.abs(speech)

    # 先按 20 毫秒一块取峰值，把逐采样的抖动抹掉，顺便快 100 倍
    block = int(0.02 * SR)
    pad_n = (-len(env)) % block
    if pad_n:
        env = np.concatenate([env, np.zeros(pad_n, dtype=np.float32)])
    env = env.reshape(-1, block).max(axis=1)

    # 一阶平滑，attack / release 分开
    a_att = float(np.exp(-0.02 / DUCK_ATTACK_SEC))
    a_rel = float(np.exp(-0.02 / DUCK_RELEASE_SEC))
    sm = np.empty_like(env)
    prev = 0.0
    for i, v in enumerate(env):
        a = a_att if v > prev else a_rel
        prev = a * prev + (1.0 - a) * v
        sm[i] = prev

    # 归一化成 0~1 的「有没有人在说话」。用较低的阈值，
    # 因为人声本来就不大，用峰值归一会让轻声的句子压不下去音乐。
    thr = max(float(np.percentile(sm, 92)), 1e-4)
    talk = np.clip(sm / thr, 0.0, 1.0)

    gain = MUSIC_IN_GAPS + (MUSIC_UNDER_SPEECH - MUSIC_IN_GAPS) * talk
    gain = np.repeat(gain, block)
    return gain


def _db(x):
    r = float(np.sqrt(np.mean(np.square(x.astype(np.float64)))))
    return 20.0 * np.log10(max(r, 1e-9))


def mix(speech):
    n = len(speech)
    music = make_music(n) * duck_gain(speech)[:n]

    t = np.arange(n, dtype=np.float32) / SR
    if n > FADE_IN_SEC * SR:
        k = int(FADE_IN_SEC * SR)
        music[:k] *= np.linspace(0.0, 1.0, k, dtype=np.float32) ** 2
    if n > FADE_OUT_SEC * SR:
        k = int(FADE_OUT_SEC * SR)
        music[-k:] *= np.linspace(1.0, 0.0, k, dtype=np.float32) ** 2
    del t

    out = speech + music

    # 只在真的顶到头的时候才整体压一点，不做压缩器，免得人声发闷
    peak = float(np.max(np.abs(out)))
    if peak > 0.97:
        out *= 0.97 / peak

    # 顺便量一下真实音量，好在日志里说人话。
    # 注意不能拿上面那两个增益档位当分贝报 —— 那是「峰值增益」，
    # 而和弦的 RMS 比峰值低十来个 dB，直接report会把人骗了。
    # 「有没有人在说话」按 200 毫秒平滑后的包络判，别拿瞬时幅度判：
    # 字与字之间本来就有空档，按瞬时判会把半句话算成间隙。
    k = int(0.2 * SR)
    env = np.convolve(np.abs(speech), np.ones(k, dtype=np.float32) / k, mode="same")
    talking = env > 0.02 * float(np.max(env) or 1.0)
    quiet = ~talking
    stats = {
        "speech": _db(speech[talking]) if talking.any() else _db(speech),
        "under": _db(music[talking]) if talking.any() else _db(music),
        "gaps": _db(music[quiet]) if quiet.any() else _db(music),
    }
    return out.astype(np.float32), stats


def main():
    args = [a for a in sys.argv[1:]]
    dry = "--干" in args or "--dry" in args
    args = [a for a in args if not a.startswith("--")]
    date_str = args[0] if (args and len(args[0]) == 10 and args[0][4] == "-") \
        else datetime.date.today().isoformat()

    mp3 = os.path.join(AUDIO_DIR, date_str + ".mp3")
    if not os.path.exists(mp3):
        print("找不到音频 %s" % mp3)
        print("请先运行：python 合成音频.py " + date_str)
        return 1

    os.makedirs(CACHE_DIR, exist_ok=True)
    clean = os.path.join(CACHE_DIR, date_str + ".人声.mp3")
    mark = os.path.join(CACHE_DIR, date_str + ".已垫乐")

    # 判断现在 音频/ 里躺着的这一版，是「我们垫过乐的成品」还是
    # 「合成音频.py 刚出炉的纯人声」。
    #
    # 这一步不能省：每日任务里 合成音频.py 跑在前面，补做那天它会把
    # mp3 重新生成一遍。要是这里无脑信任旧备份，就会拿昨天的人声去垫乐，
    # 把今天刚合成的内容整个覆盖掉。
    size = os.path.getsize(mp3)
    mixed_before = False
    if os.path.exists(mark) and os.path.exists(clean):
        try:
            with open(mark, "r", encoding="utf-8") as f:
                mixed_before = (int(f.read().strip()) == size)
        except Exception:
            mixed_before = False

    if not mixed_before:
        # 是新鲜出炉的人声，拿它当基准，覆盖掉可能过时的旧备份
        shutil.copy2(mp3, clean)

    if dry:
        shutil.copy2(clean, mp3)
        if os.path.exists(mark):
            os.remove(mark)          # 还原之后它就不是成品了，标记要撤掉
        print("[配乐] %s 已还原成纯人声" % date_str)
        return 0

    exe = ffmpeg_exe()
    if not exe:
        print("[配乐] 没找到 ffmpeg，这一步跳过（音频本身是好的，只是没有背景音乐）。")
        print("       装一下就有：pip install imageio-ffmpeg")
        return 0

    print("[配乐] %s" % date_str)
    speech = decode(exe, clean)
    secs = len(speech) / SR
    print("       人声 %d 分 %d 秒，正在垫乐…" % (secs // 60, secs % 60))

    out, stats = mix(speech)

    tmp = mp3 + ".tmp"
    encode(exe, out, tmp)

    # 时长必须对得上，否则跟读高亮会整体错位 —— 对不上就不写回去
    check = len(decode(exe, tmp)) / SR
    if abs(check - secs) > 0.35:
        os.remove(tmp)
        print("       ⚠ 垫乐后时长变了（%.2fs → %.2fs），已放弃，保留纯人声。"
              % (secs, check))
        return 1

    os.replace(tmp, mp3)
    with open(mark, "w", encoding="utf-8") as f:
        f.write(str(os.path.getsize(mp3)))
    print("       → 播客/音频/%s.mp3（%.1f MB，时长不变 %d 分 %d 秒）"
          % (date_str, os.path.getsize(mp3) / 1024 / 1024, secs // 60, secs % 60))
    print("       说话时音乐比人声轻 %.0f dB，段落间隙里浮到轻 %.0f dB。"
          % (stats["speech"] - stats["under"], stats["speech"] - stats["gaps"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())

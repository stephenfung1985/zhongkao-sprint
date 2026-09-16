#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
合成音频.py — 把播客文稿合成成一个 MP3

输入：播客/文稿/YYYY-MM-DD.json（由 生成文稿.js 产出）
输出：播客/音频/YYYY-MM-DD.mp3

用的是微软 Edge 的在线神经网络语音（edge-tts），免费、不要 key，
但**合成的时候需要联网**。合成完之后的 mp3 是本地文件，
放的时候不需要网，手机、音箱、车里都能放。

两个主播：
  晓晓 zh-CN-XiaoxiaoNeural  女声，温暖   —— 主讲
  云希 zh-CN-YunxiNeural     男声，阳光   —— 搭档、提问、控场

为什么不用 ffmpeg 拼接：
  这台机器上没有 ffmpeg，而且为了一个每天要跑的小任务去装一套
  几百兆的工具不划算。edge-tts 输出的是固定码率的 MP3
  （MPEG-2 Layer III / 24kHz / 48kbps / 单声道），每一帧都是 144 字节，
  没有 VBR 头也没有 ID3，所以**直接按字节首尾相接就是合法的 MP3**。
  静音同理：一个头部正常、数据全零的帧，解码出来就是 24 毫秒的安静。
  于是整件事不需要任何音频库。

用法：
  python 合成音频.py                 → 合成今天的
  python 合成音频.py 2026-09-20      → 合成指定日期的
"""

import asyncio
import datetime
import json
import os
import sys
import zlib

# 中文 Windows 控制台是 GBK，日志里的 ⚠ 之类会直接抛异常。
# 和 server.py 一样兜个底：绝不因为打印日志而中断合成。
for _s in ("stdout", "stderr"):
    try:
        getattr(sys, _s).reconfigure(errors="replace", line_buffering=True)
    except Exception:
        pass

try:
    import edge_tts
except ImportError:
    print("缺少 edge-tts。请先在命令行运行：pip install edge-tts")
    sys.exit(1)

ROOT = os.path.dirname(os.path.abspath(__file__))
SCRIPT_DIR = os.path.join(ROOT, "文稿")
AUDIO_DIR = os.path.join(ROOT, "音频")
CACHE_DIR = os.path.join(ROOT, ".缓存")

VOICES = {
    "F": "zh-CN-XiaoxiaoNeural",   # 晓晓
    "M": "zh-CN-YunxiNeural",      # 云希
}
RATE = "-6%"      # 比默认慢一点，饭桌上听更清楚
VOLUME = "+0%"

# ---- MP3 静音帧 ----
# ff f3 64 c4 = MPEG-2 Layer III / 24000Hz / 48kbps / 单声道 / 无填充
# 帧长 144 字节，时长 576 采样 ÷ 24000Hz = 24 毫秒
SILENT_FRAME = bytes([0xFF, 0xF3, 0x64, 0xC4]) + bytes(140)
FRAME_MS = 24


def silence(seconds: float) -> bytes:
    n = max(0, int(round(seconds * 1000 / FRAME_MS)))
    return SILENT_FRAME * n


def strip_to_first_frame(data: bytes) -> bytes:
    """去掉可能存在的 ID3 等前导字节，从第一个帧同步头开始。"""
    for i in range(min(len(data) - 1, 4096)):
        if data[i] == 0xFF and (data[i + 1] & 0xE0) == 0xE0:
            return data[i:]
    return data


SEG_TIMEOUT = 45      # 单段最多等 45 秒


async def _stream_once(text: str, voice: str) -> bytes:
    comm = edge_tts.Communicate(text, voice, rate=RATE, volume=VOLUME)
    buf = bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            buf.extend(chunk["data"])
    return bytes(buf)


async def say(text: str, voice: str, retries: int = 3):
    """
    把一句话合成成 mp3 字节。失败返回 None —— 注意不是抛异常。

    这里必须加超时：edge-tts 偶尔会在某一段上把连接挂住，
    既不返回也不报错。之前整期节目就卡在一句三个字的话上，
    等了十分钟。一段话不值得让整期节目停下来。
    """
    last = None
    for attempt in range(retries):
        try:
            data = await asyncio.wait_for(_stream_once(text, voice), SEG_TIMEOUT)
            if len(data) > 200:
                return strip_to_first_frame(data)
            last = "返回的音频是空的"
        except asyncio.TimeoutError:
            last = f"超过 {SEG_TIMEOUT} 秒没有响应"
        except Exception as e:                      # noqa: BLE001
            last = repr(e)
        if attempt < retries - 1:
            await asyncio.sleep(1.5 * (attempt + 1))
    print(f"       ⚠ 这一段没合成出来，用静音顶过去：「{text[:24]}」（{last}）",
          flush=True)
    return None


async def synth_all(segments, date_str, concurrency=5):
    """
    并发合成每一段，但保持顺序。
    单段缓存到 .缓存/ 下：中途断网重跑时，已经合成好的不用再跑一遍。
    """
    os.makedirs(CACHE_DIR, exist_ok=True)
    results = [b""] * len(segments)
    sem = asyncio.Semaphore(concurrency)
    done = 0
    failed = 0
    total = sum(1 for s in segments if s["v"] != "GAP")

    async def one(i, s):
        nonlocal done, failed
        if s["v"] == "GAP":
            return
        # 缓存键只认「内容 + 音色」，不认段落序号。
        # 这样改一句话、或者加餐环节长度变了导致后面整体错位时，
        # 没变的那些段照样命中缓存，不用重新合成一遍。
        voice = VOICES.get(s["v"], VOICES["F"])
        digest = zlib.crc32((voice + "\x00" + s["t"]).encode("utf-8"))
        cache_path = os.path.join(CACHE_DIR, f"{date_str}-{digest:08x}.mp3")
        if os.path.exists(cache_path) and os.path.getsize(cache_path) > 200:
            with open(cache_path, "rb") as f:
                results[i] = f.read()
            done += 1
            return
        async with sem:
            audio = await say(s["t"], voice)
        done += 1
        if audio is None:
            failed += 1
            # 没合成出来就留一段等长的静音，节目不至于跳拍
            results[i] = silence(min(6.0, len(s["t"]) / 5.0))
            return
        with open(cache_path, "wb") as f:
            f.write(audio)
        results[i] = audio
        if done % 20 == 0 or done == total:
            print(f"       合成中 {done}/{total} 段…", flush=True)

    await asyncio.gather(*(one(i, s) for i, s in enumerate(segments)))
    if failed:
        print(f"       ⚠ 共 {failed} 段没合成出来（已用静音顶替）。"
              f"重新跑一次通常就好了：已经成功的那些走缓存，不会重来。", flush=True)
    return results


def clean_cache(date_str):
    """只留今天的缓存，别让它无限长大。"""
    if not os.path.isdir(CACHE_DIR):
        return
    for name in os.listdir(CACHE_DIR):
        if not name.startswith(date_str):
            try:
                os.remove(os.path.join(CACHE_DIR, name))
            except OSError:
                pass


def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    date_str = arg if (arg and len(arg) == 10 and arg[4] == "-") \
        else datetime.date.today().isoformat()

    json_path = os.path.join(SCRIPT_DIR, date_str + ".json")
    if not os.path.exists(json_path):
        print(f"找不到文稿 {json_path}")
        print("请先运行：node 生成文稿.js " + date_str)
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        ep = json.load(f)

    segs = ep["segments"]
    print(f"[音频] {date_str} {ep['title']}")
    print(f"       {len(segs)} 段，预计 {ep['estMinutes']} 分钟")

    clean_cache(date_str)
    audios = asyncio.run(synth_all(segs, date_str))

    # 一边拼接，一边记下每段从第几秒开始 —— 播客页面靠这个做跟读高亮。
    # 时间是数出来的，不是估的：帧数 × 24 毫秒，误差为零。
    out = bytearray()
    out += silence(0.6)                       # 开头留一点，别一点开就说话
    for s, a in zip(segs, audios):
        s["at"] = round(len(out) // 144 * FRAME_MS / 1000, 2)
        if a:
            out += a
        gap = float(s.get("gap") or 0)
        if gap > 0:
            out += silence(gap)
        s["end"] = round(len(out) // 144 * FRAME_MS / 1000, 2)
    out += silence(1.2)                       # 结尾留白

    os.makedirs(AUDIO_DIR, exist_ok=True)
    mp3_path = os.path.join(AUDIO_DIR, date_str + ".mp3")
    with open(mp3_path, "wb") as f:
        f.write(out)

    frames = len(out) // 144
    secs = frames * FRAME_MS / 1000
    print(f"       → 播客/音频/{date_str}.mp3")
    print(f"       {len(out) / 1024 / 1024:.1f} MB / 实际时长 "
          f"{int(secs // 60)} 分 {int(secs % 60)} 秒")

    # 把真实时长写回文稿，播客页面直接读这个数
    ep["actualSeconds"] = int(secs)
    ep["mp3"] = f"音频/{date_str}.mp3"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(ep, f, ensure_ascii=False, indent=2)

    update_index(date_str, int(secs))


def update_index(date_str, secs):
    """
    把节目单里这一期标成「有音频了」。

    必须在这儿做：节目单是 生成文稿.js 写的，而那一步跑完的时候
    mp3 还没合成出来，所以它只能把 hasAudio 记成 false。
    不在合成之后回来改一次，播客页面就会一直说「还没有音频」。
    """
    idx_path = os.path.join(ROOT, "节目单.json")
    if not os.path.exists(idx_path):
        return
    try:
        with open(idx_path, "r", encoding="utf-8") as f:
            idx = json.load(f)
        for e in idx.get("episodes", []):
            if e.get("date") == date_str:
                e["hasAudio"] = True
                e["actualSeconds"] = secs
        with open(idx_path, "w", encoding="utf-8") as f:
            json.dump(idx, f, ensure_ascii=False, indent=2)
    except Exception as e:                          # noqa: BLE001
        print(f"       ⚠ 节目单没更新成：{e!r}（音频本身是好的）", flush=True)


if __name__ == "__main__":
    main()

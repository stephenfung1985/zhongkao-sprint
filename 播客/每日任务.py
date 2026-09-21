#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
每日任务.py — 每天 17:00 由 Windows 计划任务调起的那个入口

干两件事：
  1) node 生成文稿.js   → 按今天的学习数据生成文稿
  2) python 合成音频.py → 合成 MP3

设计成「不出声」：用 pythonw.exe 跑的时候没有黑窗口，
做饭时间不会突然弹一个命令行出来。跑完的结果全部写进 日志.txt，
所以哪天没出播客，翻一眼日志就知道卡在哪儿。

手动跑（想看着它跑完）：
  python 每日任务.py
计划任务里跑（安静）：
  pythonw.exe 每日任务.py
"""

import datetime
import io
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(ROOT, "日志.txt")
MAX_LOG_BYTES = 512 * 1024          # 日志超过 512K 就从中间截一半，别无限长


def log(msg):
    line = "[%s] %s" % (datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), msg)
    try:
        print(line)
    except Exception:
        pass
    try:
        with io.open(LOG, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def trim_log():
    try:
        if os.path.exists(LOG) and os.path.getsize(LOG) > MAX_LOG_BYTES:
            with io.open(LOG, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
            with io.open(LOG, "w", encoding="utf-8") as f:
                f.writelines(lines[len(lines) // 2:])
    except Exception:
        pass


def which_node():
    """
    计划任务跑起来的时候 PATH 可能和你自己开命令行时不一样，
    所以这里把几个常见位置都找一遍，找不到再报错。
    """
    from shutil import which
    p = which("node")
    if p:
        return p
    for c in (r"C:\Program Files\nodejs\node.exe",
              r"C:\Program Files (x86)\nodejs\node.exe",
              os.path.expandvars(r"%LOCALAPPDATA%\Programs\nodejs\node.exe"),
              os.path.expandvars(r"%APPDATA%\npm\node.exe")):
        if os.path.isfile(c):
            return c
    return None


def run(cmd, label):
    log("→ %s" % label)
    try:
        r = subprocess.run(
            cmd, cwd=ROOT, capture_output=True, timeout=45 * 60,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)
        )
    except subprocess.TimeoutExpired:
        log("   %s 超时（45 分钟），放弃" % label)
        return False
    except Exception as e:                          # noqa: BLE001
        log("   %s 没跑起来：%r" % (label, e))
        return False

    out = (r.stdout or b"").decode("utf-8", "replace").strip()
    err = (r.stderr or b"").decode("utf-8", "replace").strip()
    for ln in out.splitlines():
        log("   " + ln)
    if r.returncode != 0:
        log("   %s 失败（退出码 %d）" % (label, r.returncode))
        for ln in err.splitlines()[-15:]:
            log("   ! " + ln)
        return False
    return True


def main():
    trim_log()
    today = datetime.date.today().isoformat()
    log("=" * 52)
    log("开始制作 %s 的播客" % today)

    node = which_node()
    if not node:
        log("找不到 node。装一个 Node.js（nodejs.org），或者把它加进 PATH。")
        log("在这之前，播客做不出来。")
        return 1

    if not run([node, os.path.join(ROOT, "生成文稿.js"), today], "生成文稿"):
        return 1

    # 合成用当前这个解释器，省得再去找 python 在哪
    if not run([sys.executable, os.path.join(ROOT, "合成音频.py"), today], "合成音频"):
        log("文稿已经生成好了，只是音频没成。联网之后手动跑一次：")
        log("  python 播客\\合成音频.py %s" % today)
        log("已经合成成功的段落有缓存，重跑只补缺的那些，很快。")
        return 1

    # 垫背景音乐。这一步失败不算整期失败 —— 没有音乐的节目照样能听，
    # 所以这里只记一笔，不 return。
    if not run([sys.executable, os.path.join(ROOT, "配乐.py"), today], "垫背景音乐"):
        log("音乐没垫上，但音频是好的，照常能放。")

    mp3 = os.path.join(ROOT, "音频", today + ".mp3")
    if os.path.exists(mp3):
        log("完成：播客/音频/%s.mp3（%.1f MB）"
            % (today, os.path.getsize(mp3) / 1024 / 1024))
        log("开饭时在学习平台点「播客」就能放。")
        return 0
    log("跑完了但没找到 mp3，奇怪。检查一下 播客/音频/ 目录。")
    return 1


if __name__ == "__main__":
    sys.exit(main())

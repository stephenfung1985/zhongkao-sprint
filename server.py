#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中考冲刺学习平台 — 本地服务器

为什么需要它：
  直接双击 index.html 打开时，浏览器地址是 file:// ，这种页面的数据被浏览器
  当成「本地文件站点数据」存放，清理浏览数据、关闭浏览器时清除、或者电脑上的
  清理软件扫一遍，都会把打卡记录一起删掉 —— 这就是「第二天记录没了」的原因。

  通过这个服务器打开（http://localhost:8765），除了浏览器存储更可靠之外，
  最重要的是：打卡数据会**实时写进磁盘上的一个 json 文件**，
  浏览器怎么清理都影响不到它。

数据存在哪：
  学习数据/学习记录.json          ← 当前数据（随时可复制备份）
  学习数据/历史备份/*.json        ← 每天第一次保存时自动留一份，最多保留 30 份

只用标准库，不需要联网、不需要安装任何东西。
"""

import http.server
import socketserver
import json
import os
import sys
import shutil
import datetime
import threading
import webbrowser

# 中文 Windows 的控制台是 GBK，遇到 GBK 编不出的字符（如 ⚠ ✓）会直接抛异常把服务器搞崩。
# 这里兜一下底：编不出的字符替换掉，绝不因为打印日志而中断学习。
for _s in ("stdout", "stderr"):
    try:
        getattr(sys, _s).reconfigure(errors="replace")
    except Exception:
        pass

PORT = 8765
ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "学习数据")
DATA_FILE = os.path.join(DATA_DIR, "学习记录.json")
BACKUP_DIR = os.path.join(DATA_DIR, "历史备份")
MAX_BACKUPS = 30

_lock = threading.Lock()


def ensure_dirs():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(BACKUP_DIR, exist_ok=True)


def read_data():
    if not os.path.exists(DATA_FILE):
        return None
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print("  [警告] 读取学习记录失败：%s" % e)
        return None


def make_daily_backup():
    """每天第一次保存时留一份当天的备份，避免误操作后无法回退。"""
    if not os.path.exists(DATA_FILE):
        return
    stamp = datetime.date.today().strftime("%Y-%m-%d")
    dest = os.path.join(BACKUP_DIR, "学习记录-%s.json" % stamp)
    if os.path.exists(dest):
        return
    try:
        shutil.copy2(DATA_FILE, dest)
    except Exception as e:
        print("  [警告] 生成备份失败：%s" % e)
        return
    # 只保留最近 MAX_BACKUPS 份
    try:
        files = sorted(
            f for f in os.listdir(BACKUP_DIR) if f.endswith(".json")
        )
        for old in files[:-MAX_BACKUPS]:
            os.remove(os.path.join(BACKUP_DIR, old))
    except Exception:
        pass


def write_data(obj):
    """先写临时文件再替换，避免写到一半断电导致文件损坏。"""
    ensure_dirs()
    make_daily_backup()
    tmp = DATA_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    os.replace(tmp, DATA_FILE)


class Handler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    # ---------- 不缓存，改完文件刷新就生效 ----------
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/load"):
            with _lock:
                data = read_data()
            return self._json({"ok": True, "data": data})
        if self.path.startswith("/api/ping"):
            return self._json({"ok": True, "file": DATA_FILE})
        return super().do_GET()

    def do_POST(self):
        if not self.path.startswith("/api/save"):
            return self._json({"ok": False, "error": "unknown endpoint"}, 404)
        try:
            n = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(n).decode("utf-8"))
            with _lock:
                write_data(payload)
            days = len((payload or {}).get("checkins", {}) or {})
            print("  [已保存] 打卡 %d 天  %s"
                  % (days, datetime.datetime.now().strftime("%H:%M:%S")))
            return self._json({"ok": True, "days": days})
        except Exception as e:
            print("  [错误] 保存失败：%s" % e)
            return self._json({"ok": False, "error": str(e)}, 500)

    # 安静一点，只打印我们自己的日志
    def log_message(self, fmt, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    """
    必须是多线程的。单线程 TCPServer 遇到浏览器的 keep-alive 长连接会被占住，
    后续请求全部排队 —— 表现出来就是页面卡死、打卡按钮没反应。
    """
    allow_reuse_address = True
    daemon_threads = True


def main():
    ensure_dirs()
    os.chdir(ROOT)
    try:
        httpd = Server(("127.0.0.1", PORT), Handler)
    except OSError as e:
        print("\n  端口 %d 被占用了。" % PORT)
        print("  可能平台已经在另一个窗口开着了，直接去浏览器看看：")
        print("  http://localhost:%d\n" % PORT)
        input("  按回车关闭…")
        return

    url = "http://localhost:%d/" % PORT
    existing = read_data()
    days = len((existing or {}).get("checkins", {}) or {}) if existing else 0

    print("=" * 56)
    print("  中考冲刺学习平台已启动")
    print("=" * 56)
    print("  网址：%s" % url)
    print("  数据文件：%s" % DATA_FILE)
    if existing:
        print("  已读到之前的记录：打卡 %d 天" % days)
    else:
        print("  还没有历史记录，今天是第一天")
    print()
    print("  [重要] 学习期间不要关闭这个黑窗口，关掉就停止保存了。")
    print("  学完之后直接关掉这个窗口即可。")
    print("=" * 56)
    print()

    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  已停止。学习数据已经保存在磁盘上，放心关闭。")
        httpd.server_close()


if __name__ == "__main__":
    main()

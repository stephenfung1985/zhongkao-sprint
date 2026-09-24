#!/bin/bash
# 中考冲刺学习平台 — macOS 启动程序
# 双击本文件会打开终端并自动起本地服务器、打开浏览器。
# 学习期间不要关这个窗口，关掉就停止保存了。学完直接关掉即可。
# 对应 Windows 的「启动学习平台.bat」。

cd "$(dirname "$0")" || exit 1

PY=""
if command -v python3 >/dev/null 2>&1; then
  PY="python3"
fi

if [ -z "$PY" ]; then
  echo ""
  echo "  没有找到 Python3。"
  echo "  macOS 一般自带 /usr/bin/python3；如果没有，请到"
  echo "  https://www.python.org/downloads/ 安装，然后重新双击本文件。"
  echo ""
  read -r -p "  按回车键关闭…" _
  exit 1
fi

exec "$PY" server.py

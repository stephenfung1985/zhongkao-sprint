@echo off
title 中考冲刺学习平台（学习时别关这个窗口）
cd /d "%~dp0"

where python > NUL 2>&1
if %errorlevel%==0 goto RUNPY

where py > NUL 2>&1
if %errorlevel%==0 goto RUNPY2

echo.
echo   没有找到 Python。
echo   请到 https://www.python.org/downloads/ 下载安装后，再双击本文件。
echo   安装时记得勾选 "Add Python to PATH"
echo.
pause
goto END

:RUNPY
python server.py
goto END

:RUNPY2
py server.py
goto END

:END
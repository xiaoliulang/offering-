@echo off
chcp 65001 >nul
title 华为 CBG Offering 自动填充引擎
color 0A

echo ======================================================================
echo              华为 CBG Offering 自动化填充本地引擎
echo ======================================================================
echo.
echo [1/3] 正在检查 Python 环境与依赖...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python，请先安装 Python 3.8+ 并勾选 "Add to PATH"。
    pause
    exit /b 1
)

python -c "import playwright" >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 正在安装 Playwright 依赖库，请稍候...
    pip install playwright -i https://pypi.tuna.tsinghua.edu.cn/simple
    playwright install chromium
)

echo [2/3] 依赖就绪，正在启动本地 HTTP 桥接监听服务 (端口 19222)...
echo.
echo ======================================================================
echo  服务已成功运行！请保持本黑框窗口打开（可最小化）。
echo  在浏览器工作台中点击【自动化填充】按钮，系统将自动拉起 Edge 完成注入！
echo ======================================================================
echo.

python "%~dp0cbg_bridge.py"
if %errorlevel% neq 0 (
    echo.
    echo 服务异常退出，按任意键关闭。
    pause
)

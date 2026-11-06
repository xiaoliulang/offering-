#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
华为 CBG Offering 自动填充助手 (Playwright 本地桥接服务)
支持从业务工作台网页端一键触发，自动将 Excel 注入华为价格配置系统。

依赖安装：
    pip install playwright
    playwright install chromium
"""

import sys
import os
import time
import subprocess
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from playwright.sync_api import sync_playwright

# 默认配置
DEFAULT_USER_DATA_DIR = r"C:\Users\y00656362\AppData\Local\Microsoft\Edge\User Data"
TARGET_URL = "https://cbg.huawei.com/#/group/finance/service_iprice_configuration"
DEFAULT_TEMP_EXCEL = os.path.abspath("latest_offering_workbench.xlsx")
PORT = 19222


def ensure_edge_debug_browser(user_data_dir=None):
    """检测并强制拉起带 9222 调试端口的 Microsoft Edge 浏览器"""
    print("\n" + "=" * 50)
    print("🧹 正在检查并清理后台 Edge 进程...")
    os.system("taskkill /f /im msedge.exe >nul 2>&1")
    time.sleep(1.5)

    # 检测 Edge 路径
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    profile_dir = user_data_dir or DEFAULT_USER_DATA_DIR
    if not os.path.exists(profile_dir):
        fallback_profile = os.path.expanduser(r"~\AppData\Local\Microsoft\Edge\User Data")
        if os.path.exists(fallback_profile):
            profile_dir = fallback_profile

    print(f"🚀 正在拉起带 9222 调试端口的 Edge...")
    print(f"📂 使用用户配置文件: {profile_dir}")
    print(f"🔗 目标页面: {TARGET_URL}")

    cmd = [
        edge_path,
        "--remote-debugging-port=9222",
        f"--user-data-dir={profile_dir}",
        TARGET_URL
    ]
    subprocess.Popen(cmd)
    
    print("⏳ 等待 3.5 秒，确保 Edge 调试服务完全就绪...")
    time.sleep(3.5)


def run_playwright_workflow(excel_path):
    """
    执行步骤 1 ~ 4 自动化流程：
    步骤 1: 点击“服务Offering配置表” Tab
    步骤 2: 点击“导入”按钮
    步骤 3: 点击弹框中的“选择文件”按钮
    步骤 4: 静默注入 Excel 配置文件
    (步骤 5 点击保存按钮暂未自动执行，请核对后手动点击保存)
    """
    print("\n" + "=" * 50)
    print(f"🚀 开始执行自动化填充流程，目标文件: {excel_path}")

    # 1. 确保 Edge 调试浏览器已拉起
    ensure_edge_debug_browser()

    with sync_playwright() as p:
        try:
            print("🔌 正在连接本地 Edge 9222 调试端口...")
            browser = p.chromium.connect_over_cdp("http://localhost:9222")
            context = browser.contexts[0]
            
            # 定位已有或新打开的页面
            page = None
            for p_item in context.pages:
                if "service_iprice_configuration" in p_item.url:
                    page = p_item
                    break
            
            if not page:
                page = context.pages[0] if context.pages else context.new_page()
                page.goto(TARGET_URL, wait_until="networkidle")

            # 步骤 1：点击“服务Offering配置表” Tab
            print("⏳ 步骤 1/4: 正在定位并点击“服务Offering配置表”...")
            tab_elem = page.get_by_text("服务Offering配置表", exact=True)
            tab_elem.wait_for(state="visible", timeout=15000)
            tab_elem.click()
            print("✅ 步骤 1 完成：已成功切换至“服务Offering配置表”")

            # 步骤 2：点击“导入”按钮
            print("⏳ 步骤 2/4: 正在等待表格区域渲染，并精准点击“导入”按钮...")
            import_xpath = '//*[@id="serviceParameter"]/section/main/div/div/div/div[1]/div/div[6]/div[1]/div/div/div[1]/div[2]/div[4]/button'
            import_btn = page.locator(f"xpath={import_xpath}")
            import_btn.wait_for(state="visible", timeout=15000)
            import_btn.click()
            print("✅ 步骤 2 完成：已成功点击“导入”按钮")

            # 步骤 3：点击弹框中的“选择文件”按钮
            print("⏳ 步骤 3/4: 正在等待文件上传弹框出现，并点击“选择文件”...")
            upload_btn = page.locator("button.uploadBtn")
            upload_btn.wait_for(state="visible", timeout=10000)
            upload_btn.click()
            print("✅ 步骤 3 完成：已点击“选择文件”按钮")

            # 步骤 4：静默注入 Excel 配置文件
            print(f"⏳ 步骤 4/4: 正在向文件输入框注入 Excel 表格: {excel_path}")
            page.set_input_files("input[type='file']", excel_path)
            print("✅ 步骤 4 完成：Excel 文件已注入！")

            print("\n" + "*" * 55)
            print("🎉 恭喜！前 4 步已全部全自动执行完毕！")
            print("👉 当前为验证阶段，请在打开的 Edge 弹窗中核对数据，并手动点击【保存】按钮！")
            print("*" * 55 + "\n")

            # 保持 5 秒供观察
            page.wait_for_timeout(5000)
            return True

        except Exception as e:
            print(f"❌ 自动化执行异常: {e}")
            raise e


class AutoFillHTTPHandler(BaseHTTPRequestHandler):
    """本地 HTTP 桥接服务处理器，供网页端一键调用"""
    
    def log_message(self, format, *args):
        # 自定义日志格式
        print(f"[{time.strftime('%H:%M:%S')}] {args[0]} {args[1]} -> {args[2]}")

    def do_OPTIONS(self):
        # 处理浏览器跨域预检请求
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Accept')
        self.end_headers()

    def do_GET(self):
        # 健康检查探针
        if self.path.startswith('/status'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            resp = json.dumps({"status": "running", "target": TARGET_URL, "version": "1.0"})
            self.wfile.write(resp.encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        # 接收来自工作台网页发来的 Excel 数据流
        if self.path.startswith('/autofill'):
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                excel_bytes = self.rfile.read(content_len)

                # 暂存为本地最新的 Excel 表格
                with open(DEFAULT_TEMP_EXCEL, 'wb') as f:
                    f.write(excel_bytes)
                print(f"\n📥 收到网页端推来的 Excel 数据，已暂存 ({len(excel_bytes)} 字节) -> {DEFAULT_TEMP_EXCEL}")

                # 执行 Playwright 流程
                run_playwright_workflow(DEFAULT_TEMP_EXCEL)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                resp = json.dumps({
                    "success": True,
                    "message": "步骤 1~4 已全部自动执行成功！请在页面中核对并点击【保存】。"
                }, ensure_ascii=False)
                self.wfile.write(resp.encode('utf-8'))

            except Exception as err:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                resp = json.dumps({"success": False, "error": str(err)}, ensure_ascii=False)
                self.wfile.write(resp.encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()


def start_server():
    server_address = ('127.0.0.1', PORT)
    httpd = HTTPServer(server_address, AutoFillHTTPHandler)
    print("=" * 60)
    print("🚀 华为 Offering 自动化 Playwright 本地服务已启动！")
    print(f"👉 本地服务地址: http://127.0.0.1:{PORT}")
    print("💡 使用方式：保持此窗口运行，在业务工作台点击【自动化填充】按钮，")
    print("   Edge 浏览器将全自动启动、切换标签、打开弹窗并装填文件！")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 服务已停止。")
        httpd.server_close()


def main():
    parser = argparse.ArgumentParser(description="华为 CBG Offering 自动填充助手 (Playwright 专版)")
    parser.add_argument("--file", help="直接使用本地 Excel 文件运行一次（不启动 HTTP 监听）")
    parser.add_argument("--profile", default=DEFAULT_USER_DATA_DIR, help="Edge 用户数据目录路径")
    args = parser.parse_args()

    if args.file:
        # 命令行单次直接运行模式
        target_file = os.path.abspath(args.file)
        if not os.path.exists(target_file):
            print(f"❌ 找不到指定文件: {target_file}")
            sys.exit(1)
        run_playwright_workflow(target_file)
    else:
        # 常驻 HTTP 监听模式，与网页一键联动
        start_server()


if __name__ == '__main__':
    main()

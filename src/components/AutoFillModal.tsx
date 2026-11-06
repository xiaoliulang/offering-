import React, { useState, useEffect } from 'react';
import { OfferingRow } from '../types/offering';
import { generateExcelBuffer } from '../utils/offeringParser';
import {
  X,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Download,
  CheckCircle2,
  Play,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

interface AutoFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableData: OfferingRow[];
  onTriggerToast: (msg: string) => void;
}

export const EXPORT_HEADERS = [
  { title: '*服务产品LV3' },
  { title: '*服务产品LV4' },
  { title: '*服务Offering' },
  { title: '*硬件BU' },
  { title: '硬件LV3' },
  { title: '硬件Offering' },
  { title: '设备价格档位（从）' },
  { title: '设备价格档位（至）' },
  { title: '*有效期（月）' },
  { title: '*次数（次）' },
  { title: '*销售对象' },
  { title: '*维修部件' },
];

export const PYTHON_PLAYWRIGHT_SCRIPT = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
华为 CBG Offering 自动填充助手 (Playwright 专版)
通过 Edge 远程调试端口 (CDP 9222) 继承个人登录态，
在工作台点击【自动化填充】后，全自动完成页面跳转、切换Tab、打开导入弹窗并静默注入生成的 Excel 文件。

步骤 1: 点击“服务Offering配置表” Tab
步骤 2: 点击“导入”按钮
步骤 3: 点击弹框中的“选择文件”按钮
步骤 4: 静默注入 Excel 配置文件
步骤 5: 保持核对状态，由人工最终点击【保存】
"""

import sys
import os
import time
import subprocess
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from playwright.sync_api import sync_playwright

DEFAULT_USER_DATA_DIR = r"C:\\Users\\y00656362\\AppData\\Local\\Microsoft\\Edge\\User Data"
TARGET_URL = "https://cbg.huawei.com/#/group/finance/service_iprice_configuration"
DEFAULT_TEMP_EXCEL = os.path.abspath("latest_offering_workbench.xlsx")
PORT = 19222


def ensure_edge_debug_browser(user_data_dir=None):
    """检测并强制拉起带 9222 调试端口的 Microsoft Edge 浏览器，继承登录态"""
    print("\\n" + "=" * 55)
    print("🧹 正在检查并清理后台 Edge 进程...")
    os.system("taskkill /f /im msedge.exe >nul 2>&1")
    time.sleep(1.5)

    edge_path = r"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
    if not os.path.exists(edge_path):
        edge_path = r"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"

    profile_dir = user_data_dir or DEFAULT_USER_DATA_DIR
    if not os.path.exists(profile_dir):
        fallback_profile = os.path.expanduser(r"~\\AppData\\Local\\Microsoft\\Edge\\User Data")
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
    print("\\n" + "=" * 55)
    print(f"🚀 开始执行自动化填充流程，目标文件: {excel_path}")

    # 1. 确保 Edge 调试浏览器已拉起
    ensure_edge_debug_browser()

    with sync_playwright() as p:
        try:
            print("🔌 正在连接本地 Edge 9222 调试端口...")
            browser = p.chromium.connect_over_cdp("http://localhost:9222")
            context = browser.contexts[0]
            
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

            print("\\n" + "*" * 55)
            print("🎉 恭喜！前 4 步已全部全自动执行完毕！")
            print("👉 当前为验证阶段，请在打开的 Edge 弹窗中核对数据，并手动点击【保存】按钮！")
            print("*" * 55 + "\\n")

            page.wait_for_timeout(5000)
            return True

        except Exception as e:
            print(f"❌ 自动化执行异常: {e}")
            raise e


class AutoFillHTTPHandler(BaseHTTPRequestHandler):
    """本地 HTTP 桥接服务处理器，供网页端一键调用"""
    
    def log_message(self, format, *args):
        print(f"[{time.strftime('%H:%M:%S')}] {args[0]} {args[1]} -> {args[2]}")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Accept')
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/status'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            resp = json.dumps({"status": "running", "target": TARGET_URL, "version": "2.0"})
            self.wfile.write(resp.encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path.startswith('/autofill'):
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                excel_bytes = self.rfile.read(content_len)

                with open(DEFAULT_TEMP_EXCEL, 'wb') as f:
                    f.write(excel_bytes)
                print(f"\\n📥 收到网页端推来的 Excel 数据，已暂存 ({len(excel_bytes)} 字节) -> {DEFAULT_TEMP_EXCEL}")

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
    print("🚀 华为 Offering 自动化 Playwright 本地引擎已启动！")
    print(f"👉 本地服务地址: http://127.0.0.1:{PORT}")
    print("💡 使用方式：保持此窗口运行，在业务工作台点击【自动化填充】按钮，")
    print("   Edge 浏览器将全自动启动、切换标签、打开弹窗并装填文件！")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\\n🛑 服务已停止。")
        httpd.server_close()


def main():
    parser = argparse.ArgumentParser(description="华为 CBG Offering 自动填充助手 (Playwright 专版)")
    parser.add_argument("--file", help="直接使用本地 Excel 文件运行一次（不启动 HTTP 监听）")
    parser.add_argument("--profile", default=DEFAULT_USER_DATA_DIR, help="Edge 用户数据目录路径")
    args = parser.parse_args()

    if args.file:
        target_file = os.path.abspath(args.file)
        if not os.path.exists(target_file):
            print(f"❌ 找不到指定文件: {target_file}")
            sys.exit(1)
        run_playwright_workflow(target_file)
    else:
        start_server()


if __name__ == '__main__':
    main()
`;

export const AutoFillModal: React.FC<AutoFillModalProps> = ({
  isOpen,
  onClose,
  tableData,
  onTriggerToast,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScriptDrawer, setShowScriptDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLocalServiceReady, setIsLocalServiceReady] = useState<boolean | null>(null);
  const [isCheckingService, setIsCheckingService] = useState(false);

  // 检测本地 Playwright 引擎服务健康状态
  const checkServiceHealth = async () => {
    setIsCheckingService(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('http://127.0.0.1:19222/status', {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        setIsLocalServiceReady(true);
      } else {
        setIsLocalServiceReady(false);
      }
    } catch {
      setIsLocalServiceReady(false);
    } finally {
      setIsCheckingService(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkServiceHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(PYTHON_PLAYWRIGHT_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPy = () => {
    const blob = new Blob([PYTHON_PLAYWRIGHT_SCRIPT], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cbg_bridge.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBat = () => {
    const batContent = `@echo off
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
`;
    const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'start_automation.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExecuteAutoFill = async () => {
    if (tableData.length === 0) {
      alert('当前工作台暂无数据，请先添加记录后再执行自动填充');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 准备标准 12 列数据
      const rows = tableData.map((row) => [
        row.lv3 || '',
        row.lv4 || '',
        row.offering || '',
        row.hardwareBU || '',
        row.hardwareLV3 || '',
        row.hardwareOffering || '',
        row.priceFrom || '',
        row.priceTo || '',
        row.term || '',
        row.count || '',
        row.target || '',
        row.parts || '',
      ]);

      // 2. 生成 Excel 二进制 Buffer
      const buffer = await generateExcelBuffer(EXPORT_HEADERS, rows, '服务Offering配置表');

      // 3. 在浏览器本地自动保存一份备份 Excel 表格
      const blob = new Blob([buffer as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `服务Offering配置表_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      // 4. 将生成的 Excel 推送到本地 Playwright 引擎服务执行
      try {
        const localBridgeRes = await fetch('http://127.0.0.1:19222/autofill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: blob,
        });

        if (localBridgeRes.ok) {
          setIsLocalServiceReady(true);
          onTriggerToast('🎉 步骤 1~4 已全部自动执行完成！已在 Edge 中拉起并装填数据，请核对后手动点击【保存】。');
          onClose();
          return;
        } else {
          const errJson = await localBridgeRes.json().catch(() => ({}));
          throw new Error(errJson.error || `HTTP ${localBridgeRes.status}`);
        }
      } catch (bridgeErr: any) {
        setIsLocalServiceReady(false);
        console.warn('Local bridge failed:', bridgeErr);
        alert(
          '未检测到本地自动化引擎服务（http://127.0.0.1:19222）。\n\n' +
          '【启动方法】：\n' +
          '1. 请点击弹窗上方的【一键下载启动脚本 (.bat)】；\n' +
          '2. 将 start_automation.bat 与 cbg_bridge.py 放在同一文件夹下，双击运行即可！\n' +
          '（已为您自动在电脑下载了最新的 Excel 备份文件）'
        );
      }
    } catch (err: any) {
      console.error('Failed to trigger auto fill:', err);
      alert(`处理失败: ${err.message || '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">预览与自动填充</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {tableData.length} 条待导出数据
                </span>

                {/* Local Engine Status Badge */}
                {isLocalServiceReady === true ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>本地自动化引擎已就绪</span>
                  </span>
                ) : isLocalServiceReady === false ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>本地自动化引擎待启动</span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                预览 12 项标准导出字段数据，确认后点击右下角“自动化填充”自动注入华为配置系统
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice & Instructions Banner */}
        <div className="px-5 pt-4 pb-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-blue-50/70 border border-indigo-100 rounded-xl">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-950 leading-relaxed">
                <span className="font-semibold text-indigo-900">自动化执行流程（完全按您的定制脚本执行）：</span>
                点击右下角“自动化填充”，系统自动将生成的 Excel 传入本地自动化引擎，在 Edge 中完成【步骤 1: 切换Tab】➜【步骤 2: 点击导入】➜【步骤 3: 选择文件】➜【步骤 4: 注入Excel】。
                <span className="text-purple-700 font-medium ml-1">步骤 5 保存按钮保持人工核对，核对无误后手动保存。</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={checkServiceHealth}
                disabled={isCheckingService}
                title="检查本地引擎状态"
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingService ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              <button
                onClick={() => setShowScriptDrawer((prev) => !prev)}
                className="px-3 py-1.5 bg-white hover:bg-indigo-50 active:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold rounded-lg text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                <span>{showScriptDrawer ? '收起本地引擎工具' : '本地引擎一键启动包与代码'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showScriptDrawer ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Engine Setup Drawer */}
          {showScriptDrawer && (
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs space-y-3 border border-slate-700 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span>本地自动化引擎: cbg_bridge.py (Playwright + Edge 9222 端口)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadBat}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下载一键启动批处理 (.bat)</span>
                  </button>
                  <button
                    onClick={handleDownloadPy}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下载 cbg_bridge.py</span>
                  </button>
                  <button
                    onClick={handleCopyScript}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制代码' : '复制 Python 代码'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed space-y-1">
                <div>
                  <strong>💡 极简启动方式（仅需一次双击）：</strong>
                </div>
                <div>
                  1. 点击上方绿色按钮下载 <code className="bg-slate-800 text-emerald-300 px-1 py-0.5 rounded font-mono">start_automation.bat</code> 和蓝色按钮下载 <code className="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded font-mono">cbg_bridge.py</code>，放在电脑任意同一文件夹下；
                </div>
                <div>
                  2. 双击运行 <code className="bg-slate-800 text-emerald-300 px-1 py-0.5 rounded font-mono">start_automation.bat</code>（会自动检测环境并启动本地引擎）；
                </div>
                <div>
                  3. 启动后保持小黑框窗口运行，回到本页面点击【自动化填充】，即全自动拉起 Edge 完成前 4 步！
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-emerald-400 max-h-36 overflow-y-auto border border-slate-800">
                <pre className="whitespace-pre-wrap">{PYTHON_PLAYWRIGHT_SCRIPT}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Preview Table */}
        <div className="p-5 flex-1 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">导出数据字段预览 (12 列标准规范):</span>
            <span>向右滑动可查看全部 12 列明细</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs max-h-[46vh]">
            <table className="w-full text-left text-xs whitespace-nowrap divide-y divide-slate-200">
              <thead className="bg-slate-100/90 text-slate-700 sticky top-0 font-semibold z-10">
                <tr>
                  <th className="p-2.5 text-center bg-slate-200/60 w-12 text-slate-500">#</th>
                  {EXPORT_HEADERS.map((h, i) => (
                    <th key={i} className="p-2.5 text-slate-800">
                      {h.title.startsWith('*') ? (
                        <span>
                          <span className="text-rose-500 font-bold">*</span>
                          {h.title.slice(1)}
                        </span>
                      ) : (
                        h.title
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-slate-400">
                      工作台中暂无数据，请先录入或导入 Offering 记录
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 text-center font-mono text-slate-400 bg-slate-50/50">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 font-medium text-slate-700">{row.lv3 || '-'}</td>
                      <td className="p-2.5 font-semibold text-blue-700">{row.lv4 || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-900 font-bold">{row.offering || '-'}</td>
                      <td className="p-2.5 text-slate-700">{row.hardwareBU || '-'}</td>
                      <td className="p-2.5 text-slate-500">{row.hardwareLV3 || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-600 truncate max-w-[160px]" title={row.hardwareOffering}>
                        {row.hardwareOffering || '-'}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">{row.priceFrom || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-600">{row.priceTo || '-'}</td>
                      <td className="p-2.5 text-center font-mono text-emerald-700 font-bold">{row.term || '-'}</td>
                      <td className="p-2.5 text-center font-mono">
                        {row.count === '0' ? (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            不限次数
                          </span>
                        ) : (
                          row.count || '-'
                        )}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-purple-700">{row.target || '-'}</td>
                      <td className="p-2.5 text-rose-600 font-medium truncate max-w-[200px]" title={row.parts}>
                        {row.parts || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer with exact required buttons: 取消 and 自动化填充 */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>目标系统：华为 CBG 价格配置平台 (http://127.0.0.1:19222 本地引擎)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              取消
            </button>

            <button
              onClick={handleExecuteAutoFill}
              disabled={isSubmitting || tableData.length === 0}
              className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
                tableData.length > 0 && !isSubmitting
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-200 hover:shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? '正在全自动执行中...' : '自动化填充'}</span>
              <Play className="w-3 h-3 opacity-90 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

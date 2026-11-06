import React, { useState } from 'react';
import { OfferingRow } from '../types/offering';
import { generateExcelBuffer } from '../utils/offeringParser';
import {
  X,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Code2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Download,
  CheckCircle2,
  Play,
  ShieldCheck,
  ChevronDown,
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

export const TAMPERMONKEY_SCRIPT_CODE = `// ==UserScript==
// @name         华为CBG价格配置 - Offering全自动填充助手
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  点击工作台自动化填充后，自动切换Tab、点击导入、选择文件并静默注入最新Excel表格（完全对应Playwright步骤1~4，步骤5暂停核对）
// @author       Offering System
// @match        https://cbg.huawei.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // HUD 悬浮提示条
    function showHUD(message, type = 'info', duration = 8000) {
        let hud = document.getElementById('offering-autofill-hud');
        if (!hud) {
            hud = document.createElement('div');
            hud.id = 'offering-autofill-hud';
            hud.style.cssText = \`
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 999999;
                max-width: 480px;
                padding: 14px 18px;
                border-radius: 12px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
                font-size: 13px;
                font-weight: 500;
                line-height: 1.5;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                align-items: center;
                gap: 12px;
            \`;
            document.body.appendChild(hud);
        }

        const colors = {
            info: { bg: '#1e1b4b', text: '#e0e7ff', border: '#4338ca', icon: '🤖' },
            success: { bg: '#064e3b', text: '#ecfdf5', border: '#059669', icon: '🎉' },
            warn: { bg: '#78350f', text: '#fef3c7', border: '#d97706', icon: '⚠️' },
            error: { bg: '#7f1d1d', text: '#fee2e2', border: '#dc2626', icon: '❌' }
        };

        const theme = colors[type] || colors.info;
        hud.style.backgroundColor = theme.bg;
        hud.style.color = theme.text;
        hud.style.border = \`1.5px solid \${theme.border}\`;
        hud.innerHTML = \`<span style="font-size:18px;">\${theme.icon}</span> <span>\${message}</span>\`;
        hud.style.opacity = '1';
        hud.style.transform = 'translateY(0)';

        if (duration > 0) {
            setTimeout(() => {
                if (hud) hud.style.opacity = '0';
            }, duration);
        }
    }

    // Vue 3 兼容的高仿真事件链点击
    function simulateFullClick(el) {
        if (!el) return;
        try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {}

        ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(evtName => {
            try {
                const evt = new MouseEvent(evtName, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    detail: 1
                });
                el.dispatchEvent(evt);
            } catch (e) {}
        });

        if (typeof el.click === 'function') {
            try { el.click(); } catch (e) {}
        }
    }

    // 请求文件 Blob (支持 GM_xmlhttpRequest 绕过跨域限制)
    function fetchFileBlob(url) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === 'function') {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    responseType: 'blob',
                    onload: (res) => {
                        if (res.status >= 200 && res.status < 300) {
                            resolve(res.response);
                        } else {
                            reject(new Error('HTTP status ' + res.status));
                        }
                    },
                    onerror: (err) => reject(err)
                });
            } else {
                fetch(url).then(r => {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.blob();
                }).then(resolve).catch(reject);
            }
        });
    }

    // 核心主入口
    function checkAndRun() {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const urlParams = new URLSearchParams(search);
        const hashParams = hash.includes('?') ? new URLSearchParams(hash.split('?')[1]) : new URLSearchParams();

        const isAutoFill = urlParams.get('offering_autofill') === '1' ||
                           hashParams.get('offering_autofill') === '1' ||
                           sessionStorage.getItem('offering_autofill_pending') === '1' ||
                           localStorage.getItem('offering_autofill_pending') === '1';

        if (!isAutoFill) return;

        // 记入会话状态
        sessionStorage.setItem('offering_autofill_pending', '1');
        const serverOrigin = urlParams.get('src') || hashParams.get('src') ||
                             sessionStorage.getItem('offering_server_src') ||
                             localStorage.getItem('offering_server_src') ||
                             'https://ais-dev-5hrgtnkandgiguunxzlb32-129552824885.asia-southeast1.run.app';
        sessionStorage.setItem('offering_server_src', serverOrigin);

        // 如果在主页面或者路由不对，自动引导至价格配置页面
        if (!window.location.hash.includes('service_iprice_configuration')) {
            console.log('[Offering 自动化助手] 检测到自动填充请求，正在自动跳转到服务价格配置页面...');
            showHUD('Offering 自动化助手：检测到请求，正在进入服务价格配置页面...', 'info');
            setTimeout(() => {
                window.location.hash = '#/group/finance/service_iprice_configuration';
            }, 800);
            return;
        }

        showHUD('Offering 自动化助手：已进入配置页面，开始自动执行步骤 1~4...', 'info');

        // 状态机依次执行步骤 1 -> 2 -> 3 -> 4
        let currentStep = '1_WAIT_TAB';
        let stepAttempts = 0;
        const MAX_STEP_ATTEMPTS = 50; // 每步最多重试 25 秒 (500ms * 50)

        const timer = setInterval(async () => {
            stepAttempts++;

            // ================= 步骤 1: 点击“服务Offering配置表” Tab =================
            if (currentStep === '1_WAIT_TAB') {
                showHUD('[步骤 1/4] 正在定位并点击「服务Offering配置表」...', 'info');

                // 检查内容区是否已呈现
                if (document.querySelector('#serviceParameter')) {
                    console.log('[Offering 自动化助手] 已在「服务Offering配置表」内容区，直接进入步骤 2');
                    currentStep = '2_WAIT_IMPORT_BTN';
                    stepAttempts = 0;
                    return;
                }

                // 精准文本定位 (对应 Playwright get_by_text)
                const allElems = Array.from(document.querySelectorAll('span, li, [role="tab"], div, a'));
                let tabElem = allElems.find(el => el.textContent && el.textContent.trim() === '服务Offering配置表');

                if (!tabElem) {
                    const tabXPath = '/html/body/div[3]/div/div/div[2]/div[1]/div/div/div/div/div/div[1]/div/div/div/div/section/div/div/ul/li[5]/span';
                    try {
                        tabElem = document.evaluate(tabXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    } catch (e) {}
                }

                if (tabElem) {
                    console.log('[Offering 自动化助手] 定位到「服务Offering配置表」:', tabElem);
                    simulateFullClick(tabElem);
                    const parentLi = tabElem.closest('li, [role="tab"]');
                    if (parentLi && parentLi !== tabElem) simulateFullClick(parentLi);

                    showHUD('✅ 步骤 1 完成：已点击「服务Offering配置表」，等待表格加载...', 'info');
                    currentStep = '2_WAIT_IMPORT_BTN';
                    stepAttempts = 0;
                    return;
                }

                if (stepAttempts > MAX_STEP_ATTEMPTS) {
                    console.warn('[Offering 自动化助手] 步骤 1 等待超时，尝试进入步骤 2');
                    currentStep = '2_WAIT_IMPORT_BTN';
                    stepAttempts = 0;
                }
            }

            // ================= 步骤 2: 点击“导入”按钮 =================
            else if (currentStep === '2_WAIT_IMPORT_BTN') {
                showHUD('[步骤 2/4] 正在定位并点击「导入」按钮...', 'info');

                // 优先使用 Playwright 验证的 XPath
                const importXPath = '//*[@id="serviceParameter"]/section/main/div/div/div/div[1]/div/div[6]/div[1]/div/div/div[1]/div[2]/div[4]/button';
                let importBtn = null;
                try {
                    const elem = document.evaluate(importXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if (elem) importBtn = elem.closest('button') || elem;
                } catch (e) {}

                if (!importBtn) {
                    const buttons = Array.from(document.querySelectorAll('#serviceParameter button, button'));
                    importBtn = buttons.find(b => {
                        const txt = b.textContent ? b.textContent.trim() : '';
                        return txt === '导入' || txt.includes('导入');
                    });
                }

                if (importBtn) {
                    console.log('[Offering 自动化助手] 定位到「导入」按钮:', importBtn);
                    simulateFullClick(importBtn);
                    showHUD('✅ 步骤 2 完成：已点击「导入」，等待上传弹窗打开...', 'info');
                    currentStep = '3_WAIT_UPLOAD_BTN';
                    stepAttempts = 0;
                    return;
                }

                if (stepAttempts > MAX_STEP_ATTEMPTS) {
                    showHUD('未自动检测到导入按钮，请手动点击「导入」', 'warn');
                    currentStep = '3_WAIT_UPLOAD_BTN';
                    stepAttempts = 0;
                }
            }

            // ================= 步骤 3: 点击“选择文件”按钮 =================
            else if (currentStep === '3_WAIT_UPLOAD_BTN') {
                showHUD('[步骤 3/4] 正在等待文件弹窗并点击「选择文件」...', 'info');

                // 优先匹配 button.uploadBtn
                let uploadBtn = document.querySelector('button.uploadBtn');

                if (!uploadBtn) {
                    const dialogButtons = Array.from(document.querySelectorAll('.el-dialog button, .ant-modal button, [role="dialog"] button, button'));
                    uploadBtn = dialogButtons.find(b => {
                        const txt = b.textContent ? b.textContent.trim() : '';
                        return txt.includes('选择文件') || txt.includes('点击上传') || b.classList.contains('uploadBtn');
                    });
                }

                if (uploadBtn) {
                    console.log('[Offering 自动化助手] 定位到「选择文件」按钮:', uploadBtn);
                    simulateFullClick(uploadBtn);
                    showHUD('✅ 步骤 3 完成：已点击「选择文件」，正在注入 Excel 表格...', 'info');
                    currentStep = '4_INJECT_FILE';
                    stepAttempts = 0;
                    return;
                }

                // 若 input[type="file"] 已就绪，直接进入注入
                if (document.querySelector('input[type="file"]')) {
                    currentStep = '4_INJECT_FILE';
                    stepAttempts = 0;
                    return;
                }

                if (stepAttempts > MAX_STEP_ATTEMPTS) {
                    currentStep = '4_INJECT_FILE';
                    stepAttempts = 0;
                }
            }

            // ================= 步骤 4: 静默注入 Excel 配置文件 =================
            else if (currentStep === '4_INJECT_FILE') {
                showHUD('[步骤 4/4] 正在向系统注入 Excel 配置文件...', 'info');

                const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
                const fileInput = fileInputs[fileInputs.length - 1];

                if (fileInput) {
                    clearInterval(timer);
                    console.log('[Offering 自动化助手] 定位到 input[type="file"]:', fileInput);

                    const fileUrl = \`\${serverOrigin}/api/workbench/latest-export.xlsx?t=\${Date.now()}\`;

                    try {
                        const blob = await fetchFileBlob(fileUrl);
                        const file = new File([blob], '服务Offering配置表_' + new Date().toISOString().slice(0, 10) + '.xlsx', {
                            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        });

                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        fileInput.files = dataTransfer.files;

                        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                        fileInput.dispatchEvent(new Event('input', { bubbles: true }));

                        console.log('[Offering 自动化助手] Excel 表格注入成功!');
                        sessionStorage.removeItem('offering_autofill_pending');
                        localStorage.removeItem('offering_autofill_pending');

                        // 步骤 5 暂停：核对确认
                        showHUD('🎉 恭喜！步骤 1~4 已全部自动执行成功！Excel 已注入系统。请在当前弹窗中核对数据，确认无误后请手动点击【保存】。', 'success', 25000);
                    } catch (err) {
                        console.error('[Offering 自动化助手] 拉取/注入文件失败:', err);
                        showHUD('⚠️ 自动装填文件失败，请手动在弹窗中选择刚下载的 Excel 备份文件。', 'error', 15000);
                    }
                } else if (stepAttempts > MAX_STEP_ATTEMPTS) {
                    clearInterval(timer);
                    showHUD('⚠️ 未检测到文件输入框，请手动选择刚下载的 Excel 文件。', 'warn', 15000);
                }
            }
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndRun);
    } else {
        checkAndRun();
    }

    window.addEventListener('hashchange', () => {
        setTimeout(checkAndRun, 600);
    });
})();
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

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(TAMPERMONKEY_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExecuteAutoFill = async () => {
    if (tableData.length === 0) {
      alert('当前工作台暂无数据，请先添加记录后再执行自动填充');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 准备标准 12 列明细数据
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

      // 3. 将 Buffer 转为 Base64，同步上传至服务器，供跳转后自动拉取注入
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = window.btoa(binary);

      try {
        await fetch('/api/workbench/latest-export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            filename: `服务Offering配置表_${new Date().toISOString().slice(0, 10)}.xlsx`,
          }),
        });
      } catch (uploadErr) {
        console.warn('Failed to upload latest export to server:', uploadErr);
      }

      // 4. 触发浏览器本地自动下载一份 Excel 表格备份
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

      // 5. 存储标记与跨域源地址
      sessionStorage.setItem('offering_autofill_pending', '1');
      localStorage.setItem('offering_autofill_pending', '1');
      localStorage.setItem('offering_server_src', window.location.origin);

      // 6. 异步尝试触发本地 Python 服务（若开启则双重保障，若未开也不会报错阻断）
      fetch('http://127.0.0.1:19222/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: blob,
      }).catch(() => {
        // 静默忽略本地 Python 未开启错误，因为主要采用浏览器直接跳转模式
      });

      // 7. 直接在浏览器中自动跳转到目标华为页面！
      const targetUrl = `https://cbg.huawei.com/#/group/finance/service_iprice_configuration?offering_autofill=1&src=${encodeURIComponent(
        window.location.origin
      )}`;
      window.open(targetUrl, '_blank');

      onTriggerToast('🚀 已自动跳转到华为价格配置页面，自动化脚本正在执行步骤 1~4...');
      onClose();
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
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                预览 12 项标准导出字段数据，点击右下角“自动化填充”直接跳转到华为系统自动执行
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
                <span className="font-semibold text-indigo-900">自动化执行流程：</span>
                点击右下角“自动化填充”，系统将自动生成最新 Excel 并直接跳转至华为价格配置页面，自动执行【步骤 1: 切换Tab】➜【步骤 2: 点击导入】➜【步骤 3: 选择文件】➜【步骤 4: 注入Excel】。
                <span className="text-purple-700 font-medium ml-1">步骤 5 保存按钮保持人工核对，核对无误后手动保存。</span>
              </div>
            </div>
            <button
              onClick={() => setShowScriptDrawer((prev) => !prev)}
              className="shrink-0 px-3 py-1.5 bg-white hover:bg-indigo-50 active:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold rounded-lg text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showScriptDrawer ? '收起配套脚本' : '配套油猴脚本 (一键复制/更新)'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showScriptDrawer ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Tampermonkey Script Drawer */}
          {showScriptDrawer && (
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs space-y-3 border border-slate-700 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <span>配套油猴自动化脚本 (针对 Vue3 SPA 精准优化，包含步骤 1~4 全自动逻辑)</span>
                </div>
                <button
                  onClick={handleCopyScript}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '已复制代码' : '一键复制脚本'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed space-y-1">
                <div>
                  <strong>💡 安装/更新说明：</strong>
                </div>
                <div>
                  1. 在浏览器右上角油猴图标中，选择「添加新脚本」或编辑已有脚本；
                </div>
                <div>
                  2. 点击上方【一键复制脚本】，将代码完整粘贴并保存（Ctrl + S）。
                </div>
                <div>
                  3. 保存后回到本页面，每次点击【自动化填充】都将直接跳转并开始全自动执行！
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-emerald-400 max-h-36 overflow-y-auto border border-slate-800">
                <pre className="whitespace-pre-wrap">{TAMPERMONKEY_SCRIPT_CODE}</pre>
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
            <span>目标页面：https://cbg.huawei.com/#/group/finance/service_iprice_configuration</span>
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
              <span>{isSubmitting ? '正在跳转并执行...' : '自动化填充'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-90" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

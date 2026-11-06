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
  ArrowRight,
  ShieldCheck,
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
// @name         华为CBG价格配置 - Offering自动填充助手
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  自动选择“服务Offering配置表”、点击导入并静默注入最新Excel表格 (Vue3多阶段状态机容错版)
// @author       Offering System
// @match        https://cbg.huawei.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    function checkAndRun() {
        if (!window.location.hash.includes('service_iprice_configuration')) return;

        const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
        const isAutoFill = urlParams.get('offering_autofill') === '1' || sessionStorage.getItem('offering_autofill_pending') === '1';
        if (!isAutoFill) return;

        sessionStorage.removeItem('offering_autofill_pending');
        showFloatingNotice('Offering 自动化助手：检测到自动填充请求，准备执行...', 'info');

        // 状态机: 1_WAIT_TAB -> 2_WAIT_IMPORT_BTN -> 3_WAIT_UPLOAD_INPUT -> 4_DONE
        let currentStep = '1_WAIT_TAB';
        let stepAttempts = 0;
        const MAX_STEP_ATTEMPTS = 60; // 每步最多重试 30 秒 (500ms * 60)

        const timer = setInterval(async () => {
            stepAttempts++;

            // ================= 步骤 1: 寻找并点击「服务Offering配置表」 =================
            if (currentStep === '1_WAIT_TAB') {
                showFloatingNotice('Offering 自动化助手：[步骤 1/3] 正在定位「服务Offering配置表」标签...', 'info');

                // 检查是否已经在目标选项卡中（内容区已挂载）
                const isAlreadyOnTab = document.querySelector('#serviceParameter') ||
                                       Array.from(document.querySelectorAll('.is-active, .active, [aria-selected="true"]'))
                                           .some(el => el.textContent && el.textContent.includes('服务Offering配置表'));

                if (isAlreadyOnTab && document.querySelector('#serviceParameter')) {
                    console.log('[Offering 自动化助手] 检测到已处于「服务Offering配置表」内容区，直接进入步骤 2');
                    currentStep = '2_WAIT_IMPORT_BTN';
                    stepAttempts = 0;
                    return;
                }

                const tabXPath = '/html/body/div[3]/div/div/div[2]/div[1]/div/div/div/div/div/div[1]/div/div/div/div/section/div/div/ul/li[5]/span';
                let tabElem = getElementByXPath(tabXPath) ||
                              findDeepestElementByText('服务Offering配置表') ||
                              findAnyElementByText('服务Offering配置表');

                if (tabElem) {
                    console.log('[Offering 自动化助手] 定位到「服务Offering配置表」元素:', tabElem);
                    simulateFullClick(tabElem);

                    // 兼容 Element Plus / AntD：如果父级是 li 或 tab 容器，同步点击
                    const parentTab = tabElem.closest('li, [role="tab"], .el-tabs__item, .ant-tabs-tab');
                    if (parentTab && parentTab !== tabElem) {
                        simulateFullClick(parentTab);
                    }

                    showFloatingNotice('Offering 自动化助手：已点击「服务Offering配置表」，等待内容加载...', 'info');
                    currentStep = '2_WAIT_IMPORT_BTN';
                    stepAttempts = 0;
                    return;
                }

                if (stepAttempts > MAX_STEP_ATTEMPTS) {
                    console.warn('[Offering 自动化助手] 步骤 1 超时，尝试直接进入步骤 2');
                    showFloatingNotice('Offering 自动化助手：若未自动切换，请手动点击「服务Offering配置表」...', 'warn');
                    currentStep = '2_WAIT_IMPORT_BTN';
                    stepAttempts = 0;
                }
            }

            // ================= 步骤 2: 寻找并点击「导入」按钮 =================
            else if (currentStep === '2_WAIT_IMPORT_BTN') {
                showFloatingNotice('Offering 自动化助手：[步骤 2/3] 正在寻找「导入」按钮...', 'info');

                const importXPath = '//*[@id="serviceParameter"]/section/main/div/div/div/div[1]/div/div[6]/div[1]/div/div/div[1]/div[2]/div[4]/button/span/span/svg';
                let importElem = getElementByXPath(importXPath);
                let importBtn = importElem ? (importElem.closest('button') || importElem) : null;

                if (!importBtn) {
                    // 全局/容器内备选查找：寻找包含“导入”文本的按钮
                    const allButtons = Array.from(document.querySelectorAll('button, .el-button, [role="button"]'));
                    importBtn = allButtons.find(b => {
                        const txt = b.textContent ? b.textContent.trim() : '';
                        return txt === '导入' || txt.includes('导入');
                    });
                }

                if (importBtn) {
                    console.log('[Offering 自动化助手] 定位到「导入」按钮:', importBtn);
                    simulateFullClick(importBtn);
                    showFloatingNotice('Offering 自动化助手：已点击「导入」，等待上传弹窗打开...', 'info');
                    currentStep = '3_WAIT_UPLOAD_INPUT';
                    stepAttempts = 0;
                    return;
                }

                if (stepAttempts > MAX_STEP_ATTEMPTS) {
                    console.warn('[Offering 自动化助手] 步骤 2 超时');
                    showFloatingNotice('Offering 自动化助手：未自动检测到导入按钮，请手动点击「导入」...', 'warn');
                    currentStep = '3_WAIT_UPLOAD_INPUT';
                    stepAttempts = 0;
                }
            }

            // ================= 步骤 3: 寻找上传 input 并静默注入 Excel =================
            else if (currentStep === '3_WAIT_UPLOAD_INPUT') {
                showFloatingNotice('Offering 自动化助手：[步骤 3/3] 正在定位上传组件并注入文件...', 'info');

                // 寻找上传组件中的 input[type="file"]
                const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
                const fileInput = fileInputs[fileInputs.length - 1]; // 取当前最新的/最顶层的 input

                if (fileInput) {
                    clearInterval(timer);
                    console.log('[Offering 自动化助手] 定位到 input[type="file"]:', fileInput);
                    showFloatingNotice('Offering 自动化助手：正在从工作台拉取最新 Excel 表格...', 'info');

                    const serverOrigin = urlParams.get('src') || localStorage.getItem('offering_server_origin') || window.location.origin;
                    const fileUrl = \`\${serverOrigin}/api/workbench/latest-export.xlsx?t=\${Date.now()}\`;

                    try {
                        const blob = await fetchFileBlob(fileUrl);
                        const file = new File([blob], 'offering_workbench_export.xlsx', {
                            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        });

                        // 使用 DataTransfer 将文件静默注入到 input[type="file"]
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        fileInput.files = dataTransfer.files;

                        // 触发 input 和 change 事件通知 Vue 组件响应
                        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                        fileInput.dispatchEvent(new Event('input', { bubbles: true }));

                        console.log('[Offering 自动化助手] Excel 文件注入成功!');
                        showFloatingNotice('🎉 全部完成：已自动装填 Excel 表格！请核对并点击提交。', 'success');
                    } catch (err) {
                        console.error('[Offering 自动化助手] 注入文件失败:', err);
                        showFloatingNotice('Offering 自动化助手：文件自动装填失败，请手动选择刚下载的 Excel 表格。', 'error');
                    }
                }

                if (stepAttempts > MAX_STEP_ATTEMPTS) {
                    clearInterval(timer);
                    showFloatingNotice('Offering 自动化助手：未检测到上传输入框，请手动选择刚下载的 Excel 文件。', 'warn');
                }
            }
        }, 500);
    }

    function getElementByXPath(xpath) {
        try {
            return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } catch {
            return null;
        }
    }

    // 查找包含指定文本的最深叶子节点
    function findDeepestElementByText(text) {
        const all = Array.from(document.querySelectorAll('span, a, div, li, p'));
        return all.find(el => {
            if (!el.textContent || !el.textContent.includes(text)) return false;
            return !Array.from(el.children).some(child => child.textContent && child.textContent.includes(text));
        });
    }

    function findAnyElementByText(text) {
        const elems = Array.from(document.querySelectorAll('span, [role="tab"], li'));
        return elems.find(el => el.textContent && el.textContent.trim().includes(text));
    }

    // Vue 3 兼容的完整事件链模拟触发
    function simulateFullClick(el) {
        if (!el) return;
        try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {}

        const eventNames = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
        for (const evtName of eventNames) {
            try {
                const evt = new MouseEvent(evtName, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    detail: 1
                });
                el.dispatchEvent(evt);
            } catch (e) {}
        }
        if (typeof el.click === 'function') {
            try {
                el.click();
            } catch (e) {}
        }
    }

    function fetchFileBlob(url) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest !== 'undefined') {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    responseType: 'blob',
                    onload: (res) => {
                        if (res.status >= 200 && res.status < 300) {
                            resolve(res.response);
                        } else {
                            reject(new Error(\`HTTP \${res.status}\`));
                        }
                    },
                    onerror: reject
                });
            } else {
                fetch(url).then(r => r.blob()).then(resolve).catch(reject);
            }
        });
    }

    function showFloatingNotice(msg, type) {
        let notice = document.getElementById('offering-autofill-notice');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'offering-autofill-notice';
            notice.style.position = 'fixed';
            notice.style.top = '24px';
            notice.style.right = '24px';
            notice.style.zIndex = '999999';
            notice.style.padding = '14px 20px';
            notice.style.borderRadius = '10px';
            notice.style.boxShadow = '0 10px 30px rgba(0,0,0,0.22)';
            notice.style.fontSize = '14px';
            notice.style.fontFamily = 'system-ui, sans-serif';
            notice.style.fontWeight = 'bold';
            notice.style.transition = 'all 0.3s ease';
            document.body.appendChild(notice);
        }
        if (type === 'success') {
            notice.style.background = '#059669';
            notice.style.color = '#ffffff';
        } else if (type === 'warn') {
            notice.style.background = '#d97706';
            notice.style.color = '#ffffff';
        } else if (type === 'error') {
            notice.style.background = '#dc2626';
            notice.style.color = '#ffffff';
        } else {
            notice.style.background = '#2563eb';
            notice.style.color = '#ffffff';
        }
        notice.textContent = msg;
        setTimeout(() => {
            if (notice && type === 'success') {
                notice.style.opacity = '0';
                setTimeout(() => notice.remove(), 500);
            }
        }, 8000);
    }

    window.addEventListener('hashchange', checkAndRun);
    window.addEventListener('load', checkAndRun);
    checkAndRun();
})();`;

export const AutoFillModal: React.FC<AutoFillModalProps> = ({
  isOpen,
  onClose,
  tableData,
  onTriggerToast,
}) => {
  const [showScriptDrawer, setShowScriptDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // 1. Prepare export rows
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

      // 2. Generate standard Excel binary buffer
      const buffer = await generateExcelBuffer(EXPORT_HEADERS, rows, '服务Offering配置表');

      // 3. Convert buffer to Base64
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      // 4. Save to backend /api/workbench/latest-export
      await fetch('/api/workbench/latest-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64,
          filename: `offering_workbench_${new Date().toISOString().slice(0, 10)}.xlsx`,
        }),
      });

      // 5. Trigger backup local download
      const blob = new Blob([buffer as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `offering_workbench_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      onTriggerToast('已生成最新 Excel 并暂存，正在联动打开华为价格配置平台...');

      // 6. Open target Huawei page with auto-fill query params
      const targetUrl = `https://cbg.huawei.com/#/group/finance/service_iprice_configuration?offering_autofill=1&src=${encodeURIComponent(
        window.location.origin
      )}`;
      window.open(targetUrl, '_blank');

      onClose();
    } catch (err: any) {
      console.error('Failed to trigger auto fill:', err);
      alert(`自动化填充启动失败: ${err.message || '网络或数据错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
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
                核对 12 项标准导出字段数据，确认后一键生成 Excel 并联动自动填充至华为价格配置系统
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
                <span className="font-semibold text-indigo-900">全自动装填流：</span>
                点击右下角“自动化填充”后，系统将自动生成最新 Excel
                表格并存储在本地服务，同时自动打开目标华为页面。已安装油猴脚本的浏览器将自动点击菜单并注入文件。
              </div>
            </div>
            <button
              onClick={() => setShowScriptDrawer((prev) => !prev)}
              className="shrink-0 px-3 py-1.5 bg-white hover:bg-indigo-50 active:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold rounded-lg text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showScriptDrawer ? '收起油猴脚本' : '配套油猴脚本 (首次需安装)'}</span>
            </button>
          </div>

          {/* Tampermonkey Script Drawer */}
          {showScriptDrawer && (
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs space-y-3 border border-slate-700 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <span>油猴自动化脚本（Tampermonkey UserScript）</span>
                </div>
                <button
                  onClick={handleCopyScript}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '已复制到剪贴板' : '一键复制脚本'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed">
                <strong>安装步骤：</strong>
                1. 在浏览器右上角点击油猴插件图标，选择「添加新脚本」；
                2. 清空编辑器中的默认代码，点击上方「一键复制脚本」并粘贴进去；
                3. 按 Ctrl+S（或菜单点击「文件」-「保存」）即可。之后每次点击「自动化填充」，都将自动为您完成点击与文件装填！
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
              <span>{isSubmitting ? '正在处理中...' : '自动化填充'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

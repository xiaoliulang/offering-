import React, { useState } from 'react';
import { PrefixRule, PartRule, OfferingRow } from '../types/offering';
import { parseBatchInputText, downloadCSV, STANDARD_OFFERING_TEMPLATE_CSV } from '../utils/offeringParser';
import { Upload, Download, X, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefixRules: PrefixRule[];
  partRules: PartRule[];
  onConfirmImport: (rows: OfferingRow[]) => void;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  prefixRules,
  partRules,
  onConfirmImport,
}) => {
  const [inputText, setInputText] = useState('');
  const [previewRows, setPreviewRows] = useState<OfferingRow[]>([]);
  const [mode, setMode] = useState<'paste' | 'file'>('paste');

  if (!isOpen) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (val.trim()) {
      const parsed = parseBatchInputText(val, prefixRules, partRules);
      setPreviewRows(parsed);
    } else {
      setPreviewRows([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
      const parsed = parseBatchInputText(text, prefixRules, partRules);
      setPreviewRows(parsed);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDownloadTemplate = () => {
    downloadCSV(STANDARD_OFFERING_TEMPLATE_CSV, 'offering_import_template.csv');
  };

  const handleImportSubmit = () => {
    if (previewRows.length === 0) return;
    onConfirmImport(previewRows);
    setInputText('');
    setPreviewRows([]);
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">批量导入 Offering 明细数据</h3>
              <p className="text-xs text-slate-500">支持 Excel 复制粘贴 (制表符) 或标准逗号分隔 (CSV)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Download & Import Template Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
            <div className="text-xs text-blue-900">
              <span className="font-semibold">批量导入：</span>
              <span className="text-blue-700 ml-1">
                您可以先下载示例模板填写，或直接点击“导入模板”选择文件上传，亦可直接在下方粘贴文本。
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载模板</span>
              </button>
              <label className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors">
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>导入模板</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Label above textarea */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              批量数据输入（复制“区域、服务offering”、硬件BU、硬件LV3、硬件offering、维修部件/前台展示分类）：
            </label>
          </div>

          {/* Text Area */}
          <textarea
            value={inputText}
            onChange={handleTextChange}
            rows={7}
            placeholder={`"中国地区部,欧洲地区部",ASDW-Hope-1AY121CAB,Hope,手机,"Hope-L29C, Hope-L09C, Hope-AL10D","前壳,外屏"\n"中国地区部",CAP-Mate-2BY242BCN,Mate,手机,"Hope-L29C、Hope-L09C、Hope-AL10D","前壳,外屏"`}
            className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />

          {/* Parsed Preview Table */}
          {previewRows.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  已成功解析预览 ({previewRows.length} 条记录):
                </span>
                <span className="text-slate-400">系统已自动完成简称解码与属性切片</span>
              </div>

              <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-medium border-b border-slate-200">
                    <tr>
                      <th className="p-2">区域</th>
                      <th className="p-2">服务产品LV3</th>
                      <th className="p-2">服务产品LV4</th>
                      <th className="p-2">服务Offering</th>
                      <th className="p-2">硬件BU</th>
                      <th className="p-2">硬件LV3</th>
                      <th className="p-2">硬件Offering</th>
                      <th className="p-2 text-center">期限/次数/对象</th>
                      <th className="p-2">维修部件</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-medium text-emerald-700">{r.region}</td>
                        <td className="p-2 text-slate-600">{r.lv3}</td>
                        <td className="p-2 font-semibold text-blue-700">{r.lv4}</td>
                        <td className="p-2 font-mono">{r.offering}</td>
                        <td className="p-2">{r.hardwareBU}</td>
                        <td className="p-2 text-slate-500">{r.hardwareLV3 || '-'}</td>
                        <td className="p-2 font-mono text-slate-500">{r.hardwareOffering || '-'}</td>
                        <td className="p-2 font-mono text-center">
                          {r.term}月 / {r.count}次 / {r.target}
                        </td>
                        <td className="p-2 text-rose-600 truncate max-w-[150px] font-medium">{r.parts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImportSubmit}
            disabled={previewRows.length === 0}
            className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 ${
              previewRows.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>确认导入 ({previewRows.length} 条)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

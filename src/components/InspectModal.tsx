import React from 'react';
import { OfferingRow } from '../types/offering';
import { parseOfferingString, splitRegions } from '../utils/offeringParser';
import { X, Layers, CheckCircle2, AlertTriangle, ShieldCheck, Tag } from 'lucide-react';

interface InspectModalProps {
  isOpen: boolean;
  row: OfferingRow | null;
  onClose: () => void;
}

export const InspectModal: React.FC<InspectModalProps> = ({ isOpen, row, onClose }) => {
  if (!isOpen || !row) return null;

  const parsed = parseOfferingString(row.offering);
  const regionList = splitRegions(row.region);
  const partsList = row.parts ? row.parts.split(',').map((p) => p.trim()) : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Offering 编码与规则穿透详情</h3>
              <p className="text-xs text-slate-500 font-mono">{row.offering || '(未填写编码)'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Visual Code Breakdown */}
          <div>
            <div className="text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>字符编码结构拆解 (Token Anatomy):</span>
            </div>
            <div className="bg-slate-900 p-3.5 rounded-xl text-slate-100 font-mono text-center flex items-center justify-center gap-1.5 flex-wrap">
              <div className="bg-blue-900/60 border border-blue-500/50 rounded px-2.5 py-1.5">
                <div className="text-blue-300 font-bold">{parsed.prefix || '-'}</div>
                <div className="text-[10px] text-blue-400">简称映射</div>
              </div>
              <span className="text-slate-500">-</span>
              <div className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5">
                <div className="text-slate-200">{row.hardwareBU || '-'}</div>
                <div className="text-[10px] text-slate-400">硬件 BU</div>
              </div>
              <span className="text-slate-500">-</span>
              <div className="bg-emerald-950 border border-emerald-500/50 rounded px-2.5 py-1.5">
                <div className="text-emerald-300 font-bold">{row.term || '-'}</div>
                <div className="text-[10px] text-emerald-400">期限(月)</div>
              </div>
              <div className="bg-amber-950 border border-amber-500/50 rounded px-2.5 py-1.5">
                <div className="text-amber-300 font-bold">
                  {row.count === '0' ? '0 (不限次数)' : (row.count || '-')}
                </div>
                <div className="text-[10px] text-amber-400">次数(次)</div>
              </div>
              <div className="bg-purple-950 border border-purple-500/50 rounded px-2.5 py-1.5">
                <div className="text-purple-300 font-bold">{row.target || '-'}</div>
                <div className="text-[10px] text-purple-400">对象({row.target === 'C' ? '个人' : '企业'})</div>
              </div>
            </div>
          </div>

          {/* Details table */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50/40">
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">归属业务大区:</span>
              <span className="font-semibold text-emerald-700">
                {row.region} {regionList.length > 1 && `(出险率表将展开为 ${regionList.length} 个区域)`}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">服务产品级别 (LV3 / LV4):</span>
              <span className="font-semibold text-blue-700">
                {row.lv3} / {row.lv4}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">设备价格档位区间:</span>
              <span className="font-mono tabular-nums text-slate-800">
                ¥{row.priceFrom || 0} ~ ¥{row.priceTo || '不限'}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">硬件 LV3 / 硬件 Offering:</span>
              <span className="text-slate-800">
                {row.hardwareLV3 || '未填写'} / {row.hardwareOffering || '未填写'}
              </span>
            </div>
          </div>

          {/* Parts breakdown */}
          <div>
            <div className="text-slate-500 font-semibold mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>关联维修部件 ({partsList.length} 项，生成对应前台分类):</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {partsList.map((part, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-md font-medium"
                >
                  {part}
                </span>
              ))}
              {partsList.length === 0 && (
                <span className="text-amber-600 font-medium">未配置相关维修部件</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

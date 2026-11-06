import React, { useState } from 'react';
import { PrefixRule, PartRule } from '../types/offering';
import { parseOfferingString, resolveOfferingRecord } from '../utils/offeringParser';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, Info, Copy, Check } from 'lucide-react';

interface DecoderSimulatorProps {
  prefixRules: PrefixRule[];
  partRules: PartRule[];
  onApplyToWorkbench?: (offering: string, bu: string) => void;
}

export const DecoderSimulator: React.FC<DecoderSimulatorProps> = ({
  prefixRules,
  partRules,
  onApplyToWorkbench,
}) => {
  const [inputCode, setInputCode] = useState('ASDW-Hope-1AY121CAB');
  const [hardwareBU, setHardwareBU] = useState('Hope');
  const [copied, setCopied] = useState(false);

  const samplePresets = [
    { code: 'ASDW-Hope-1AY121CAB', bu: 'Hope', label: '碎屏保 · 笔记本 · 12月1次 · C端' },
    { code: 'CAP-Mate-2BY242BCN', bu: 'Mate', label: '政企碎屏 · 旗舰手机 · 24月2次 · B端' },
    { code: 'BCAI-Hope-3CY121CAB', bu: 'Hope', label: '全保综合服务 · 12月1次 · 多部件' },
    { code: 'WDP-Hope-4DY241CAB', bu: 'Hope', label: '延长保修 · 台式机 · 24月1次' },
    { code: 'ACAP-Mate-5EY121BAB', bu: 'Mate', label: '意外服务宝 · 折叠屏 · 12月1次' },
    { code: 'BAT-Hope-6FY361CAB', bu: 'Hope', label: '电池安心换 · 36月1次' },
  ];

  const parsed = parseOfferingString(inputCode);
  const resolved = resolveOfferingRecord(
    {
      offering: inputCode,
      hardwareBU,
      region: '华东大区',
    },
    prefixRules,
    partRules
  );

  const partsList = resolved.parts ? resolved.parts.split(',').map((p) => p.trim()) : [];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Offering 编码规则实验室与解析引擎
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              测试并直观查看任意 Offering 编码如何由简称映射、切片截取（期限/次数/销售对象）以及硬件 BU 关联维修部件并最终拆分为出险率行。
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>规则库状态:</span>
            <span className="font-semibold text-slate-700">{prefixRules.length} 个简称</span>
            <span>·</span>
            <span className="font-semibold text-slate-700">{partRules.length} 个部件映射</span>
          </div>
        </div>

        {/* Presets bar */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">快速填入典型编码测试:</span>
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputCode(preset.code);
                setHardwareBU(preset.bu);
              }}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors font-mono"
            >
              {preset.code}
            </button>
          ))}
        </div>

        {/* Input Controls */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>待解析 Offering 编码 (Service Offering Code)</span>
              <span className="text-slate-400 font-normal">
                当前长度: <b className="text-slate-700 tabular-nums">{inputCode.length}</b> 字符
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.trim())}
                placeholder="例如: ASDW-Hope-1AY121CAB"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <button
                onClick={() => handleCopy(inputCode)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded"
                title="复制编码"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">硬件产品族 (Hardware BU)</label>
            <input
              type="text"
              value={hardwareBU}
              onChange={(e) => setHardwareBU(e.target.value)}
              placeholder="例如: Hope / Mate / Nova"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Visual Token Breakdown */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            字符串几何切片透视 (String Slicing Anatomy)
          </h3>

          {inputCode.length >= 6 ? (
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
              <div className="flex items-center gap-1 min-w-[500px]">
                {/* Prefix */}
                <div className="flex-1 bg-blue-950/80 border border-blue-500/40 rounded p-2.5 text-center">
                  <div className="text-blue-300 font-bold text-sm tracking-widest">{parsed.prefix || '(空)'}</div>
                  <div className="text-[10px] text-blue-400/80 mt-1">简称 (Prefix)</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">第一个横杠前</div>
                </div>

                <span className="text-slate-500 font-bold px-1">-</span>

                {/* Middle */}
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded p-2.5 text-center">
                  <div className="text-slate-200 font-medium text-sm">{parsed.middle.replace(/^-/, '') || '(主体编码)'}</div>
                  <div className="text-[10px] text-slate-400 mt-1">硬件/内部规格</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">去除简称及倒数6位</div>
                </div>

                <span className="text-slate-500 font-bold px-1">-</span>

                {/* Term */}
                <div className="bg-emerald-950/80 border border-emerald-500/40 rounded p-2.5 text-center min-w-[70px]">
                  <div className="text-emerald-300 font-bold text-sm">{parsed.term || '--'}</div>
                  <div className="text-[10px] text-emerald-400/80 mt-1">期限 (月)</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">slice(-6, -4)</div>
                </div>

                {/* Count */}
                <div className="bg-amber-950/80 border border-amber-500/40 rounded p-2.5 text-center min-w-[70px]">
                  <div className="text-amber-300 font-bold text-sm">
                    {parsed.count === '0' ? '0 (不限)' : (parsed.count || '--')}
                  </div>
                  <div className="text-[10px] text-amber-400/80 mt-1">次数 (次)</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">slice(-4, -3)</div>
                </div>

                {/* Target */}
                <div className="bg-purple-950/80 border border-purple-500/40 rounded p-2.5 text-center min-w-[65px]">
                  <div className="text-purple-300 font-bold text-sm">{parsed.target || '--'}</div>
                  <div className="text-[10px] text-purple-400/80 mt-1">对象</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">slice(-3, -2)</div>
                </div>

                {/* Tail */}
                <div className="bg-slate-800 border border-slate-700 rounded p-2.5 text-center min-w-[60px]">
                  <div className="text-slate-400 text-sm">{inputCode.slice(-2)}</div>
                  <div className="text-[10px] text-slate-500 mt-1">后缀位</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">slice(-2)</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                编码长度必须大于等于 6 位方可按系统规则切片出期限 (倒数第6~5位)、次数 (倒数第4位) 和销售对象 (倒数第3位)。
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Product & Attributes Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            解析映射结果 (Resolved Attributes)
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500">匹配前缀 (Prefix):</span>
              <span className="font-mono font-semibold text-slate-800">{parsed.prefix || '无'}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500">服务产品 LV3 (Service LV3):</span>
              <span className="font-medium text-slate-800">{resolved.lv3}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500">服务产品 LV4 (Service LV4):</span>
              <span className="font-semibold text-blue-600">{resolved.lv4}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500">有效保障期限 (Term):</span>
              <span className="font-mono font-semibold text-emerald-700">
                {resolved.term ? `${resolved.term} 个月` : '未识别'}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500">保障服务次数 (Count):</span>
              <span className="font-mono font-semibold text-amber-700">
                {resolved.count === '0'
                  ? '不限次数 (0)'
                  : (resolved.count ? `${resolved.count} 次` : '未识别')}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500">销售对象分类 (Target):</span>
              <span className="font-mono font-semibold text-purple-700">
                {resolved.target === 'C'
                  ? 'C (Consumer 个人消费者)'
                  : resolved.target === 'B'
                  ? 'B (Business 行业/政企)'
                  : resolved.target || '未识别'}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500">规则匹配状态:</span>
              <span
                className={`font-medium ${
                  resolved.status === 'valid'
                    ? 'text-emerald-600'
                    : resolved.status === 'error'
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              >
                {resolved.validationMsg || '全部匹配成功'}
              </span>
            </div>
          </div>

          {onApplyToWorkbench && (
            <div className="pt-2">
              <button
                onClick={() => onApplyToWorkbench(inputCode, hardwareBU)}
                className="w-full py-2 px-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>将此条测试数据直接追加到工作台</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Exploded Risk Table Rows Simulation */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              部件展开出险率预览 (Exploded Risk Rows)
            </h3>
            <span className="text-xs text-slate-500">
              展开为 <b className="text-blue-600 tabular-nums">{partsList.length}</b> 行
            </span>
          </div>

          <p className="text-xs text-slate-500">
            当依据「服务产品 LV4 ({resolved.lv4})」+「硬件 BU ({hardwareBU})」命中部件映射时，系统会自动将该 Offering 裂变为以下前台分类：
          </p>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">行序号</th>
                  <th className="py-2 px-3">前台展示分类 (拆分部件)</th>
                  <th className="py-2 px-3">对应服务 Offering</th>
                  <th className="py-2 px-3 text-right">出险率预设</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partsList.map((part, index) => (
                  <tr key={index} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 text-slate-400 tabular-nums">{index + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{part}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{inputCode}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-400">待填写</td>
                  </tr>
                ))}
                {partsList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      未匹配到部件，请检查部件映射配置表。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

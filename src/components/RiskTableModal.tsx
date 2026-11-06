import React, { useState, useMemo } from 'react';
import { RiskTableRow, HistoryRiskRecord } from '../types/offering';
import {
  REGION_STANDARD_ORDER,
  formatRiskRate,
  parseRiskRateToNumber,
} from '../utils/offeringParser';
import {
  FileSpreadsheet,
  Download,
  Upload,
  X,
  Search,
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
  Eraser,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Save,
} from 'lucide-react';

interface RiskTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskTableData: RiskTableRow[];
  onUpdateRiskRate: (id: string, rate: string) => void;
  onBatchSetRates: (rateMap: Record<string, string>) => void;
  onExportCSV: () => void;
  onSaveHistory?: (records: HistoryRiskRecord[]) => void;
}

export const RiskTableModal: React.FC<RiskTableModalProps> = ({
  isOpen,
  onClose,
  riskTableData,
  onUpdateRiskRate,
  onBatchSetRates,
  onExportCSV,
  onSaveHistory,
}) => {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Default sort by identical region so rows with the same region are grouped together
  const [sortField, setSortField] = useState<'region' | 'lv4' | 'offering' | 'hardwareBU' | 'displayCategory' | 'riskRate'>('region');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Batch fill popup / input - default 3.50%
  const [uniformRate, setUniformRate] = useState('3.50%');
  const [showBatchTools, setShowBatchTools] = useState(false);

  // Available unique categories
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    riskTableData.forEach((r) => {
      if (r.displayCategory) set.add(r.displayCategory);
    });
    return Array.from(set);
  }, [riskTableData]);

  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    riskTableData.forEach((r) => {
      if (r.region) set.add(r.region);
    });
    return Array.from(set);
  }, [riskTableData]);

  const handleToggleSort = (field: 'region' | 'lv4' | 'offering' | 'hardwareBU' | 'displayCategory' | 'riskRate') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleResetToRegionSort = () => {
    setSortField('region');
    setSortAsc(true);
  };

  // Filtered & Sorted rows (default sorted by identical region)
  const filteredData = useMemo(() => {
    const list = riskTableData.filter((r) => {
      if (filterCategory !== 'ALL' && r.displayCategory !== filterCategory) return false;
      if (filterRegion !== 'ALL' && r.region !== filterRegion) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (
          !r.offering.toLowerCase().includes(q) &&
          !r.displayCategory.toLowerCase().includes(q) &&
          !r.hardwareBU.toLowerCase().includes(q) &&
          !r.lv4.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortField === 'region') {
        if (a.region !== b.region) {
          const idxA = REGION_STANDARD_ORDER.indexOf(a.region);
          const idxB = REGION_STANDARD_ORDER.indexOf(b.region);
          let diff = 0;
          if (idxA !== -1 && idxB !== -1) {
            diff = idxA - idxB;
          } else if (idxA !== -1) {
            diff = -1;
          } else if (idxB !== -1) {
            diff = 1;
          } else {
            diff = a.region.localeCompare(b.region, 'zh-CN');
          }
          return sortAsc ? diff : -diff;
        }
        // Same region secondary: Offering code, BU, displayCategory
        if (a.offering !== b.offering) return a.offering.localeCompare(b.offering, 'zh-CN');
        if (a.hardwareBU !== b.hardwareBU) return a.hardwareBU.localeCompare(b.hardwareBU, 'zh-CN');
        return a.displayCategory.localeCompare(b.displayCategory, 'zh-CN');
      }

      if (sortField === 'riskRate') {
        const valA = parseRiskRateToNumber(a.riskRate);
        const valB = parseRiskRateToNumber(b.riskRate);
        return sortAsc ? valA - valB : valB - valA;
      }

      const valA = (a[sortField] || '').toString();
      const valB = (b[sortField] || '').toString();
      const cmp = valA.localeCompare(valB, 'zh-CN');
      if (cmp !== 0) return sortAsc ? cmp : -cmp;

      // Secondary: region
      return a.region.localeCompare(b.region, 'zh-CN');
    });
  }, [riskTableData, filterCategory, filterRegion, searchTerm, sortField, sortAsc]);

  // Statistics
  const filledCount = useMemo(() => {
    return riskTableData.filter((r) => r.riskRate.trim() !== '').length;
  }, [riskTableData]);

  const avgRate = useMemo(() => {
    const valid = riskTableData
      .map((r) => parseRiskRateToNumber(r.riskRate))
      .filter((n) => !isNaN(n) && n > 0);
    if (valid.length === 0) return 0;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }, [riskTableData]);

  // Batch Fill handlers
  const handleApplyUniformRate = () => {
    const formatted = formatRiskRate(uniformRate) || '3.50%';
    const map: Record<string, string> = {};
    riskTableData.forEach((r) => {
      map[r.id] = formatted;
    });
    onBatchSetRates(map);
  };

  const handleApplySmartActuarialRates = () => {
    const map: Record<string, string> = {};
    riskTableData.forEach((r) => {
      const cat = r.displayCategory.toLowerCase();
      let rate = '2.00%';
      if (cat.includes('外屏') || cat.includes('屏幕') || cat.includes('前壳')) {
        rate = '4.50%';
      } else if (cat.includes('后盖') || cat.includes('中框')) {
        rate = '1.80%';
      } else if (cat.includes('主板')) {
        rate = '1.50%';
      } else if (cat.includes('电池')) {
        rate = '2.50%';
      } else if (cat.includes('摄像头')) {
        rate = '1.20%';
      } else if (cat.includes('键盘')) {
        rate = '1.60%';
      }
      map[r.id] = rate;
    });
    onBatchSetRates(map);
  };

  const handleClearAllRates = () => {
    if (filledCount === 0) {
      return;
    }
    if (window.confirm('确定要清空所有已填写的出险率吗？')) {
      const map: Record<string, string> = {};
      riskTableData.forEach((r) => {
        map[r.id] = '';
      });
      onBatchSetRates(map);
    }
  };

  const handleSaveCurrentRates = () => {
    const filledRows = riskTableData.filter((r) => r.riskRate && r.riskRate.trim());
    if (filledRows.length === 0) {
      alert('当前出险率预览表中没有包含任何已填写的出险率，请先填写至少一条出险率数据。');
      return;
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const batchId = `BATCH-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const newRecords: HistoryRiskRecord[] = [];

    filledRows.forEach((row, rowIdx) => {
      // Split hardwareOffering if it contains multiple models (by comma or 顿号)
      const rawOffering = row.hardwareOffering ? String(row.hardwareOffering).trim() : '';
      const offerings = rawOffering
        ? rawOffering
            .split(/[,，、]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : ['-'];

      offerings.forEach((offeringItem, itemIdx) => {
        newRecords.push({
          id: `hist-${batchId}-${rowIdx}-${itemIdx}-${offeringItem}`,
          batchId,
          savedAt: timeStr,
          region: row.region,
          lv3: row.lv3,
          lv4: row.lv4,
          hardwareBU: row.hardwareBU,
          hardwareLV3: row.hardwareLV3,
          hardwareOffering: offeringItem,
          target: row.target,
          term: row.term,
          count: row.count,
          part: row.displayCategory,
          riskRate: formatRiskRate(row.riskRate),
        });
      });
    });

    if (onSaveHistory) {
      onSaveHistory(newRecords);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                出险率导入表预览 (共 {riskTableData.length} 行)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Actuarial Summary Bar */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Filters & Sorting Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索编码 / 分类 / BU..."
                className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none text-slate-700"
            >
              <option value="ALL">前台展示分类 (全部)</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none text-slate-700"
            >
              <option value="ALL">全部区域</option>
              {uniqueRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Actuarial Metrics & Quick Tools */}
          <div className="flex items-center gap-4 flex-wrap justify-end">
            <div className="flex items-center gap-3 text-slate-600">
              <span>
                已配置出险率:{' '}
                <b className="text-slate-900 tabular-nums">
                  {filledCount}/{riskTableData.length}
                </b>
              </span>
              <span>·</span>
              <span>
                平均出险率:{' '}
                <b className="text-indigo-600 font-mono tabular-nums">
                  {avgRate > 0 ? avgRate.toFixed(2) + '%' : '未计算'}
                </b>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleApplySmartActuarialRates}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition-colors flex items-center gap-1"
                title="依据屏幕(4.50%)、主板(1.50%)、电池(2.50%)等行业参考基准智能填充"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>智能填入参考率</span>
              </button>

              <button
                onClick={() => setShowBatchTools(!showBatchTools)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                统一赋值...
              </button>

              <button
                onClick={handleClearAllRates}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="清空所有已填写的出险率"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Batch Uniform Tool Drawer */}
        {showBatchTools && (
          <div className="px-5 py-3 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-indigo-900">批量统一赋值出险率:</span>
              <input
                type="text"
                value={uniformRate}
                onChange={(e) => setUniformRate(e.target.value)}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    setUniformRate(formatRiskRate(e.target.value));
                  }
                }}
                placeholder="例如: 3.50%"
                className="w-24 px-2 py-1 bg-white border border-indigo-200 rounded font-mono text-center outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleApplyUniformRate}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium"
              >
                应用到所有行
              </button>
            </div>
            <button
              onClick={() => setShowBatchTools(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              收起
            </button>
          </div>
        )}

        {/* Data Grid */}
        <div className="p-4 flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5 text-center min-w-[50px]">序号</th>
                <th
                  onClick={() => handleToggleSort('region')}
                  className="p-2.5 cursor-pointer hover:bg-slate-200 select-none group"
                  title="点击切换区域排序 (默认按相同区域集中排列)"
                >
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <span>区域 (默认排序)</span>
                    {sortField === 'region' ? (
                      sortAsc ? (
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                    )}
                  </div>
                </th>
                <th className="p-2.5">服务产品LV3</th>
                <th
                  onClick={() => handleToggleSort('lv4')}
                  className="p-2.5 cursor-pointer hover:bg-slate-200 select-none group"
                  title="点击按服务产品LV4排序"
                >
                  <div className="flex items-center gap-1 text-slate-800">
                    <span>服务产品LV4</span>
                    {sortField === 'lv4' ? (
                      sortAsc ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('offering')}
                  className="p-2.5 cursor-pointer hover:bg-slate-200 select-none group"
                  title="点击按服务offering排序"
                >
                  <div className="flex items-center gap-1 text-slate-800">
                    <span>服务offering</span>
                    {sortField === 'offering' ? (
                      sortAsc ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('hardwareBU')}
                  className="p-2.5 cursor-pointer hover:bg-slate-200 select-none group"
                  title="点击按硬件BU排序"
                >
                  <div className="flex items-center gap-1 text-slate-800">
                    <span>硬件BU</span>
                    {sortField === 'hardwareBU' ? (
                      sortAsc ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
                    )}
                  </div>
                </th>
                <th className="p-2.5">硬件LV3</th>
                <th className="p-2.5">硬件offering</th>
                <th className="p-2.5 text-center">设备价格(从)</th>
                <th className="p-2.5 text-center">设备价格(至)</th>
                <th className="p-2.5 text-center">销售对象</th>
                <th className="p-2.5 text-center">期限(月)</th>
                <th className="p-2.5 text-center">次数</th>
                <th
                  onClick={() => handleToggleSort('displayCategory')}
                  className="p-2.5 font-bold text-blue-700 bg-blue-50/80 cursor-pointer hover:bg-blue-100 select-none group"
                  title="点击按前台展示分类排序"
                >
                  <div className="flex items-center gap-1">
                    <span>前台展示分类 (部件)</span>
                    {sortField === 'displayCategory' ? (
                      sortAsc ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-blue-300 group-hover:text-blue-500 shrink-0" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('riskRate')}
                  className="p-2.5 font-bold text-indigo-700 min-w-[130px] bg-indigo-50/80 cursor-pointer hover:bg-indigo-100 select-none group"
                  title="点击按出险率排序"
                >
                  <div className="flex items-center gap-1">
                    <span>出险率 (%)</span>
                    {sortField === 'riskRate' ? (
                      sortAsc ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-indigo-300 group-hover:text-indigo-500 shrink-0" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row, index) => {
                const isNewRegion =
                  sortField === 'region' &&
                  (index === 0 || row.region !== filteredData[index - 1]?.region);
                const regionGroupCount =
                  sortField === 'region'
                    ? filteredData.filter((r) => r.region === row.region).length
                    : 0;

                return (
                  <React.Fragment key={row.id}>
                    {/* Visual Region Grouping Divider Bar */}
                    {isNewRegion && (
                      <tr className="bg-slate-50 border-t-2 border-emerald-400/50 select-none">
                        <td colSpan={15} className="py-2 px-3 bg-emerald-50/60 text-slate-800 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-2xs"></span>
                              <span className="font-bold text-emerald-950 text-xs">
                                【{row.region}】
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-emerald-800 font-medium border border-emerald-200 shadow-2xs">
                                本区域共 {regionGroupCount} 条部件记录
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Group #{filteredData.slice(0, index).filter((r, i) => i === 0 || r.region !== filteredData[i - 1].region).length + 1}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 text-center font-mono text-xs text-slate-500 tabular-nums font-medium">
                        {index + 1}
                      </td>
                      <td className="p-2.5 font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold inline-block">
                          {row.region}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600">{row.lv3}</td>
                      <td className="p-2.5 font-medium text-blue-700">{row.lv4}</td>
                      <td className="p-2.5 font-mono text-slate-800">{row.offering}</td>
                      <td className="p-2.5">{row.hardwareBU}</td>
                      <td className="p-2.5 text-slate-500">{row.hardwareLV3 || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-500">{row.hardwareOffering || '-'}</td>
                      <td className="p-2.5 text-center tabular-nums text-slate-400">{row.priceFrom || '-'}</td>
                      <td className="p-2.5 text-center tabular-nums text-slate-400">{row.priceTo || '-'}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-purple-700">
                        {row.target || '-'}
                      </td>
                      <td className="p-2.5 text-center font-mono">{row.term}</td>
                      <td className="p-2.5 text-center font-mono">
                        {row.count === '0' ? (
                          <span className="text-emerald-700 font-semibold">不限次数</span>
                        ) : (
                          row.count
                        )}
                      </td>
                      <td className="p-2.5 font-bold text-blue-700 bg-blue-50/40">
                        {row.displayCategory}
                      </td>
                      <td className="p-1.5 bg-indigo-50/30">
                        <input
                          type="text"
                          value={row.riskRate}
                          onChange={(e) => onUpdateRiskRate(row.id, e.target.value)}
                          onBlur={(e) => {
                            const trimmed = e.target.value.trim();
                            if (trimmed) {
                              onUpdateRiskRate(row.id, formatRiskRate(trimmed));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="例: 3.50%"
                          className="w-full px-2.5 py-1 border border-slate-300 rounded font-mono text-xs text-indigo-900 bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    暂无出险率数据，请先在明细表中添加 Offering 记录或检查筛选条件。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>
              提示：出险率字段默认按百分比（%）填写并保留两位小数（如 3.50%），失焦后会自动规范补齐格式。
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              关闭预览
            </button>
            <button
              onClick={handleSaveCurrentRates}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="保存所有已填写的出险率数据到历史出险率配置查询模块"
            >
              <Save className="w-4 h-4" />
              <span>保存当前出险率</span>
            </button>
            <button
              onClick={onExportCSV}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>下载出险率导入表</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

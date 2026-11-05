import React, { useState, useMemo } from 'react';
import { HistoryRiskRecord } from '../types/offering';
import { downloadExcelTable } from '../utils/offeringParser';
import {
  History,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface HistoryRiskQueryViewProps {
  records: HistoryRiskRecord[];
  onClearAll: () => void;
  onDeleteRecord: (id: string) => void;
  onDeleteBatch: (batchId: string) => void;
  onShowToast: (msg: string) => void;
}

export const HistoryRiskQueryView: React.FC<HistoryRiskQueryViewProps> = ({
  records,
  onClearAll,
  onDeleteRecord,
  onDeleteBatch,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [buFilter, setBuFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');

  // Unique options for filters
  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.region && set.add(r.region));
    return Array.from(set);
  }, [records]);

  const buOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.hardwareBU && set.add(r.hardwareBU));
    return Array.from(set);
  }, [records]);

  const batchOptions = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      if (r.batchId && !map.has(r.batchId)) {
        map.set(r.batchId, r.savedAt);
      }
    });
    return Array.from(map.entries()).map(([batchId, savedAt]) => ({
      batchId,
      savedAt,
    }));
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (regionFilter !== 'ALL' && r.region !== regionFilter) return false;
      if (buFilter !== 'ALL' && r.hardwareBU !== buFilter) return false;
      if (batchFilter !== 'ALL' && r.batchId !== batchFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const combined = `${r.region} ${r.lv3} ${r.lv4} ${r.hardwareBU} ${r.hardwareLV3} ${r.hardwareOffering} ${r.target} ${r.part} ${r.riskRate} ${r.batchId}`.toLowerCase();
        if (!combined.includes(query)) return false;
      }

      return true;
    });
  }, [records, regionFilter, buFilter, batchFilter, searchTerm]);

  // Grouped by batch
  const groupedByBatch = useMemo(() => {
    const map = new Map<string, { savedAt: string; list: HistoryRiskRecord[] }>();
    filteredRecords.forEach((r) => {
      if (!map.has(r.batchId)) {
        map.set(r.batchId, { savedAt: r.savedAt, list: [] });
      }
      map.get(r.batchId)!.list.push(r);
    });
    return Array.from(map.entries());
  }, [filteredRecords]);

  // Handle Export Excel
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert('暂无符合条件的历史出险率记录可导出');
      return;
    }

    const headers = [
      { title: '保存批次', required: false },
      { title: '保存时间', required: false },
      { title: '区域', required: true },
      { title: '服务产品LV3', required: true },
      { title: '服务产品LV4', required: true },
      { title: '硬件BU', required: false },
      { title: '硬件LV3', required: false },
      { title: '硬件offering', required: false },
      { title: '销售对象', required: false },
      { title: '期限(月)', required: false },
      { title: '次数(次)', required: false },
      { title: '物料', required: true },
      { title: '出险率', required: true },
    ];

    const rows = filteredRecords.map((r) => [
      r.batchId,
      r.savedAt,
      r.region,
      r.lv3,
      r.lv4,
      r.hardwareBU,
      r.hardwareLV3,
      r.hardwareOffering,
      r.target,
      r.term,
      r.count,
      r.part,
      r.riskRate,
    ]);

    downloadExcelTable(
      headers,
      rows,
      `history_risk_rate_config_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    onShowToast('已导出历史出险率配置查询表 (.xlsx)');
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Summary Card */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 border border-indigo-900/50">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">历史出险率配置查询</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold font-mono">
                {records.length} 条记录
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>导出</span>
          </button>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Keyword Search */}
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索区域 / LV4 / BU / offering / 物料..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Region filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
            <span className="text-slate-400 font-medium">区域:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">全部区域</option>
              {regionOptions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* BU filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
            <span className="text-slate-400 font-medium">硬件BU:</span>
            <select
              value={buFilter}
              onChange={(e) => setBuFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">全部硬件BU</option>
              {buOptions.map((bu) => (
                <option key={bu} value={bu}>
                  {bu}
                </option>
              ))}
            </select>
          </div>

          {/* Batch filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
            <span className="text-slate-400 font-medium">保存批次:</span>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer font-mono"
            >
              <option value="ALL">全部保存批次 ({batchOptions.length})</option>
              {batchOptions.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchId} ({b.savedAt})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            明细列表 ({filteredRecords.length})
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'grouped'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            按批次分组 ({groupedByBatch.length})
          </button>
        </div>
      </div>

      {/* Main Table / Grouped View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12 text-slate-400">#</th>
                  <th className="p-3">区域</th>
                  <th className="p-3">服务产品LV3</th>
                  <th className="p-3">服务产品LV4</th>
                  <th className="p-3">硬件BU</th>
                  <th className="p-3">硬件LV3</th>
                  <th className="p-3">硬件offering (拆分后单项)</th>
                  <th className="p-3 text-center">销售对象</th>
                  <th className="p-3 text-center">期限(月)</th>
                  <th className="p-3 text-center">次数(次)</th>
                  <th className="p-3">物料 (前台展示分类)</th>
                  <th className="p-3 text-center font-bold text-indigo-900">出险率</th>
                  <th className="p-3">保存批次与时间</th>
                  <th className="p-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.map((r, i) => (
                  <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="p-3 text-center font-mono text-slate-400">{i + 1}</td>
                    <td className="p-3 font-semibold text-emerald-700">{r.region}</td>
                    <td className="p-3 text-slate-600">{r.lv3}</td>
                    <td className="p-3 font-semibold text-blue-700">{r.lv4}</td>
                    <td className="p-3 font-medium text-slate-700">{r.hardwareBU}</td>
                    <td className="p-3 text-slate-500">{r.hardwareLV3 || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-[11px] rounded border border-slate-200 font-semibold">
                        {r.hardwareOffering}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-purple-700 font-bold">
                      {r.target || '-'}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">{r.term}</td>
                    <td className="p-3 text-center font-mono text-slate-600">{r.count}</td>
                    <td className="p-3 font-bold text-indigo-900">{r.part}</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-mono font-bold rounded-full text-xs">
                        {r.riskRate}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      <div>{r.batchId}</div>
                      <div className="text-[10px] text-slate-400">{r.savedAt}</div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="删除单条记录"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-400">
                      暂无历史出险率配置记录。您可以在出险率预览表中点击“保存当前出险率”将配置结果存入此模块。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grouped View */
        <div className="space-y-4">
          {groupedByBatch.map(([batchId, { savedAt, list }]) => (
            <div
              key={batchId}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Batch Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono font-bold text-xs rounded-lg">
                    {batchId}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    保存时间: {savedAt}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                    包含 {list.length} 条单项出险率记录
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`确定要删除批次 [${batchId}] 下的全部 ${list.length} 条记录吗？`)) {
                      onDeleteBatch(batchId);
                      onShowToast(`已删除批次 [${batchId}]`);
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除整批</span>
                </button>
              </div>

              {/* Batch Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100/50 text-slate-600 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="p-2.5 pl-4">区域</th>
                      <th className="p-2.5">服务产品LV3 / LV4</th>
                      <th className="p-2.5">硬件BU / LV3</th>
                      <th className="p-2.5">硬件offering (拆分后)</th>
                      <th className="p-2.5 text-center">销售对象 / 期限 / 次数</th>
                      <th className="p-2.5">物料 (前台展示分类)</th>
                      <th className="p-2.5 text-center font-bold text-indigo-900">出险率</th>
                      <th className="p-2.5 text-center pr-4">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {list.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-2.5 pl-4 font-semibold text-emerald-700">{r.region}</td>
                        <td className="p-2.5 text-slate-700">
                          <div>{r.lv4}</div>
                          <div className="text-[10px] text-slate-400">{r.lv3}</div>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          <div>{r.hardwareBU}</div>
                          <div className="text-[10px] text-slate-400">{r.hardwareLV3 || '-'}</div>
                        </td>
                        <td className="p-2.5">
                          <span className="font-mono text-xs text-indigo-900 font-bold">
                            {r.hardwareOffering}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-600">
                          {r.target} / {r.term}月 / {r.count}次
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">{r.part}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-indigo-700 bg-indigo-50/50">
                          {r.riskRate}
                        </td>
                        <td className="p-2.5 text-center pr-4">
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {groupedByBatch.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              暂无符合条件的历史批次记录。
            </div>
          )}
        </div>
      )}
    </div>
  );
};

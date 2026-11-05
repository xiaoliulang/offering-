import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PrefixRule,
  PartRule,
  RegionItem,
  OfferingRow,
  RiskTableRow,
  HistoryRiskRecord,
} from './types/offering';
import {
  DEFAULT_PREFIX_RULES,
  DEFAULT_PART_RULES,
  DEFAULT_REGIONS,
  DEFAULT_OFFERING_ROWS,
  resolveOfferingRecord,
  generateRiskTableRows,
  downloadCSV,
  downloadExcelTable,
  formatRiskRate,
  STANDARD_OFFERING_TEMPLATE_CSV,
} from './utils/offeringParser';
import { HeaderNav } from './components/HeaderNav';
import { WorkbenchTable } from './components/WorkbenchTable';
import { DecoderSimulator } from './components/DecoderSimulator';
import { ConfigRulesView } from './components/ConfigRulesView';
import { RiskTableModal } from './components/RiskTableModal';
import { BatchImportModal } from './components/BatchImportModal';
import { InspectModal } from './components/InspectModal';
import { ConfirmModal } from './components/ConfirmModal';
import { HistoryRiskQueryView } from './components/HistoryRiskQueryView';

const STORAGE_KEYS = {
  PREFIX: 'offering_system_prefix_rules_v1',
  PARTS: 'offering_system_part_rules_v1',
  REGIONS: 'offering_system_regions_v1',
  WORKBENCH: 'offering_system_workbench_v1',
  RATES: 'offering_system_rates_v1',
  HISTORY: 'offering_system_history_records_v1',
};

const DEFAULT_HISTORY_RECORDS: HistoryRiskRecord[] = [
  {
    id: 'hist-demo-1',
    batchId: 'BATCH-20261104-180000',
    savedAt: '2026-11-04 18:00:00',
    region: '华东大区',
    lv3: '保险服务',
    lv4: '华为碎屏服务宝',
    hardwareBU: 'Hope',
    hardwareLV3: '笔记本',
    hardwareOffering: 'Hope-L29C',
    target: 'C',
    term: '12',
    count: '1',
    part: '前壳',
    riskRate: '3.50%',
  },
  {
    id: 'hist-demo-2',
    batchId: 'BATCH-20261104-180000',
    savedAt: '2026-11-04 18:00:00',
    region: '华东大区',
    lv3: '保险服务',
    lv4: '华为碎屏服务宝',
    hardwareBU: 'Hope',
    hardwareLV3: '笔记本',
    hardwareOffering: 'Hope-L09C',
    target: 'C',
    term: '12',
    count: '1',
    part: '前壳',
    riskRate: '3.50%',
  },
  {
    id: 'hist-demo-3',
    batchId: 'BATCH-20261104-180000',
    savedAt: '2026-11-04 18:00:00',
    region: '华东大区',
    lv3: '保险服务',
    lv4: '华为碎屏服务宝',
    hardwareBU: 'Hope',
    hardwareLV3: '笔记本',
    hardwareOffering: 'Hope-AL10D',
    target: 'C',
    term: '12',
    count: '1',
    part: '外屏',
    riskRate: '4.20%',
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('workbench');

  // 1. Persistent State Initialization
  const [prefixRules, setPrefixRules] = useState<PrefixRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PREFIX);
      return saved ? JSON.parse(saved) : DEFAULT_PREFIX_RULES;
    } catch {
      return DEFAULT_PREFIX_RULES;
    }
  });

  const [partRules, setPartRules] = useState<PartRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PARTS);
      return saved ? JSON.parse(saved) : DEFAULT_PART_RULES;
    } catch {
      return DEFAULT_PART_RULES;
    }
  });

  const [regionTable, setRegionTable] = useState<RegionItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REGIONS);
      return saved ? JSON.parse(saved) : DEFAULT_REGIONS;
    } catch {
      return DEFAULT_REGIONS;
    }
  });

  const [tableData, setTableData] = useState<OfferingRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WORKBENCH);
      return saved ? JSON.parse(saved) : DEFAULT_OFFERING_ROWS;
    } catch {
      return DEFAULT_OFFERING_ROWS;
    }
  });

  // Risk Rates Cache map: Key = offering_region_part_pFrom_pTo -> Rate
  const [ratesMap, setRatesMap] = useState<Map<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RATES);
      if (saved) {
        const obj = JSON.parse(saved);
        return new Map(Object.entries(obj));
      }
    } catch {
      // fallback
    }
    return new Map();
  });

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const [historyRecords, setHistoryRecords] = useState<HistoryRiskRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : DEFAULT_HISTORY_RECORDS;
    } catch {
      return DEFAULT_HISTORY_RECORDS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyRecords));
    } catch {}
  }, [historyRecords]);

  const handleSaveHistoryRecords = useCallback((newRecords: HistoryRiskRecord[]) => {
    setHistoryRecords((prev) => [...newRecords, ...prev]);
    showToast(`已成功保存 ${newRecords.length} 条数据至「历史出险率配置查询」`);
  }, [showToast]);

  const handleClearAllHistory = useCallback(() => {
    setHistoryRecords([]);
  }, []);

  const handleDeleteHistoryRecord = useCallback((id: string) => {
    setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleDeleteHistoryBatch = useCallback((batchId: string) => {
    setHistoryRecords((prev) => prev.filter((r) => r.batchId !== batchId));
  }, []);

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [inspectRow, setInspectRow] = useState<OfferingRow | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFIX, JSON.stringify(prefixRules));
    } catch {}
  }, [prefixRules]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(partRules));
    } catch {}
  }, [partRules]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(regionTable));
    } catch {}
  }, [regionTable]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKBENCH, JSON.stringify(tableData));
    } catch {}
  }, [tableData]);

  useEffect(() => {
    try {
      const obj = Object.fromEntries(ratesMap.entries());
      localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(obj));
    } catch {}
  }, [ratesMap]);

  // Derived: Generate exploded Risk Table Rows
  const riskTableData = useMemo(() => {
    return generateRiskTableRows(tableData, ratesMap);
  }, [tableData, ratesMap]);

  // Update a single workbench row and re-resolve rules
  const handleUpdateRow = useCallback(
    (index: number, updatedFields: Partial<OfferingRow>) => {
      setTableData((prev) => {
        const next = [...prev];
        const current = next[index];
        if (!current) return prev;

        const merged = { ...current, ...updatedFields };
        const resolved = resolveOfferingRecord(merged, prefixRules, partRules);
        next[index] = resolved;
        return next;
      });
    },
    [prefixRules, partRules]
  );

  // Add new row inheriting hardware BU, LV3, Offering from last row
  const handleAddNewRow = useCallback(() => {
    setTableData((prev) => {
      const lastRow = prev.length > 0 ? prev[prev.length - 1] : null;
      const defaultRegion = lastRow?.region || regionTable[0]?.name || '华东大区';
      const defaultBU = lastRow?.hardwareBU ?? '';
      const defaultLV3 = lastRow?.hardwareLV3 ?? '';
      const defaultOffering = lastRow?.hardwareOffering ?? '';

      const newRecord = resolveOfferingRecord(
        {
          region: defaultRegion,
          offering: '',
          hardwareBU: defaultBU,
          hardwareLV3: defaultLV3,
          hardwareOffering: defaultOffering,
          priceFrom: '',
          priceTo: '',
        },
        prefixRules,
        partRules
      );
      return [...prev, newRecord];
    });
    showToast('已新增一行，硬件BU/LV3/Offering已自动继承上一条数据');
  }, [regionTable, prefixRules, partRules, showToast]);

  // Remove row
  const handleRemoveRow = useCallback((index: number) => {
    setTableData((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Duplicate row
  const handleDuplicateRow = useCallback(
    (index: number) => {
      setTableData((prev) => {
        const current = prev[index];
        if (!current) return prev;
        const duplicated: OfferingRow = {
          ...current,
          id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          offering: current.offering ? `${current.offering}-COPY` : '',
        };
        const resolved = resolveOfferingRecord(duplicated, prefixRules, partRules);
        const next = [...prev];
        next.splice(index + 1, 0, resolved);
        return next;
      });
      showToast('已快速复制选中行');
    },
    [prefixRules, partRules, showToast]
  );

  // Clear table
  const handleClearTable = useCallback(() => {
    setConfirmConfig({
      isOpen: true,
      title: '清空工作台',
      message: '确定清空当前工作台中的所有 Offering 记录吗？清空后数据将被全部移除。',
      confirmText: '确认清空',
      onConfirm: () => {
        setTableData([]);
        showToast('已成功清空工作台记录');
      },
    });
  }, [showToast]);

  // Batch delete
  const handleBatchDelete = useCallback(
    (ids: string[]) => {
      const set = new Set(ids);
      setTableData((prev) => prev.filter((r) => !set.has(r.id)));
      showToast(`已批量删除 ${ids.length} 条记录`);
    },
    [showToast]
  );

  // Batch update region
  const handleBatchUpdateRegion = useCallback(
    (ids: string[], newRegion: string) => {
      const set = new Set(ids);
      setTableData((prev) =>
        prev.map((r) => {
          if (set.has(r.id)) {
            return resolveOfferingRecord({ ...r, region: newRegion }, prefixRules, partRules);
          }
          return r;
        })
      );
      showToast(`已将选中的 ${ids.length} 条记录更新为「${newRegion}」`);
    },
    [prefixRules, partRules, showToast]
  );

  // Batch update price
  const handleBatchUpdatePrice = useCallback(
    (ids: string[], priceFrom: string, priceTo: string) => {
      const set = new Set(ids);
      setTableData((prev) =>
        prev.map((r) => {
          if (set.has(r.id)) {
            return resolveOfferingRecord(
              { ...r, priceFrom, priceTo },
              prefixRules,
              partRules
            );
          }
          return r;
        })
      );
      showToast(`已将选中的 ${ids.length} 条记录更新价格档位`);
    },
    [prefixRules, partRules, showToast]
  );

  // Apply code from Simulator to Workbench
  const handleApplyFromSimulator = useCallback(
    (offering: string, bu: string) => {
      const newRecord = resolveOfferingRecord(
        {
          region: regionTable[0]?.name || '华东大区',
          offering,
          hardwareBU: bu,
          hardwareLV3: '测试硬件',
          hardwareOffering: 'TEST-OFF',
          priceFrom: '0',
          priceTo: '5000',
        },
        prefixRules,
        partRules
      );
      setTableData((prev) => [newRecord, ...prev]);
      setCurrentTab('workbench');
      showToast('已将测试 Offering 追加至业务工作台');
    },
    [regionTable, prefixRules, partRules, showToast]
  );

  // Confirm Batch Import
  const handleConfirmImport = useCallback(
    (newRows: OfferingRow[]) => {
      setTableData((prev) => [...newRows, ...prev]);
      showToast(`成功批量导入 ${newRows.length} 条 Offering 明细记录`);
    },
    [showToast]
  );

  // Update single risk rate
  const handleUpdateRiskRate = useCallback(
    (id: string, rate: string) => {
      const targetRow = riskTableData.find((r) => r.id === id);
      if (!targetRow) return;

      const rateKey = `${targetRow.offering}_${targetRow.region}_${targetRow.displayCategory}_${targetRow.priceFrom}_${targetRow.priceTo}`;
      setRatesMap((prev) => {
        const next = new Map(prev);
        next.set(rateKey, rate);
        return next;
      });
    },
    [riskTableData]
  );

  // Batch set risk rates
  const handleBatchSetRates = useCallback(
    (rateMap: Record<string, string>) => {
      setRatesMap((prev) => {
        const next = new Map(prev);
        Object.entries(rateMap).forEach(([id, rate]) => {
          const targetRow = riskTableData.find((r) => r.id === id);
          if (targetRow) {
            const rateKey = `${targetRow.offering}_${targetRow.region}_${targetRow.displayCategory}_${targetRow.priceFrom}_${targetRow.priceTo}`;
            next.set(rateKey, rate);
          }
        });
        return next;
      });
      showToast('已批量更新出险率数据');
    },
    [riskTableData, showToast]
  );

  // Export Workbench CSV
  const handleExportWorkbenchCSV = useCallback(() => {
    if (tableData.length === 0) {
      alert('当前工作台暂无数据可导出');
      return;
    }
    let csv =
      '服务产品LV3,服务产品LV4,服务offering,硬件BU,硬件LV3,硬件offering,设备价格档位(从),设备价格档位(至),有效期限(月),次数(次),销售对象,维修部件\n';
    tableData.forEach((row) => {
      csv += `"${row.lv3}","${row.lv4}","${row.offering}","${row.hardwareBU}","${row.hardwareLV3}","${row.hardwareOffering}","${row.priceFrom}","${row.priceTo}","${row.term}","${row.count}","${row.target}","${row.parts}"\n`;
    });
    downloadCSV(csv, `offering_workbench_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('已下载 Offering 明细表 (CSV)');
  }, [tableData, showToast]);

  // Export Risk CSV/Excel
  const handleExportRiskCSV = useCallback(() => {
    if (riskTableData.length === 0) {
      alert('当前暂无出险率数据可导出，请先在明细表中添加 Offering 记录');
      return;
    }
    const headers = [
      { title: '区域', required: true },
      { title: '服务产品LV3', required: true },
      { title: '服务产品LV4', required: true },
      { title: '服务offering', required: false },
      { title: '硬件BU', required: false },
      { title: '硬件LV3', required: false },
      { title: '硬件offering', required: false },
      { title: '设备价格档位(从)', required: false },
      { title: '设备价格档位(至)', required: false },
      { title: '销售对象', required: false },
      { title: '期限(月)', required: false },
      { title: '次数(次)', required: false },
      { title: '前台展示分类', required: true },
      { title: '出险率', required: true },
    ];

    const rows = riskTableData.map((row) => [
      row.region,
      row.lv3,
      row.lv4,
      row.offering,
      row.hardwareBU,
      row.hardwareLV3,
      row.hardwareOffering,
      row.priceFrom,
      row.priceTo,
      row.target,
      row.term,
      row.count,
      row.displayCategory,
      row.riskRate ? formatRiskRate(row.riskRate) : '',
    ]);

    downloadExcelTable(headers, rows, `risk_rate_import_table_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('已下载出险率导入表 (.xlsx)');
  }, [riskTableData, showToast]);

  // Download template (Excel 6-column matching copy-paste workflow)
  const handleDownloadTemplate = useCallback(() => {
    downloadCSV(STANDARD_OFFERING_TEMPLATE_CSV, 'offering_import_template.csv');
    showToast('已下载 Excel 标准 6 列导入模板');
  }, [showToast]);

  // Reset all configs to default
  const handleResetAllConfigs = useCallback(() => {
    setConfirmConfig({
      isOpen: true,
      title: '重置为默认规则',
      message: '确定将所有映射配置（简称、部件、区域）恢复为出厂默认设置吗？',
      confirmText: '重置规则',
      onConfirm: () => {
        setPrefixRules(DEFAULT_PREFIX_RULES);
        setPartRules(DEFAULT_PART_RULES);
        setRegionTable(DEFAULT_REGIONS);
        showToast('已成功恢复系统默认规则配置');
      },
    });
  }, [showToast]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation */}
      <HeaderNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        totalRecords={tableData.length}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Tab 1: Workbench */}
        {currentTab === 'workbench' && (
          <WorkbenchTable
            tableData={tableData}
            regionTable={regionTable}
            onUpdateRow={handleUpdateRow}
            onAddNewRow={handleAddNewRow}
            onRemoveRow={handleRemoveRow}
            onDuplicateRow={handleDuplicateRow}
            onClearTable={handleClearTable}
            onOpenImportModal={() => setShowImportModal(true)}
            onOpenRiskModal={() => setShowRiskModal(true)}
            onExportCSV={handleExportWorkbenchCSV}
            onDownloadTemplate={handleDownloadTemplate}
            onInspectRow={(r) => setInspectRow(r)}
            onBatchDelete={handleBatchDelete}
            onBatchUpdateRegion={handleBatchUpdateRegion}
            onBatchUpdatePrice={handleBatchUpdatePrice}
          />
        )}

        {/* Tabs 3, 4, 5: Configurations */}
        {(currentTab === 'config_prefix' ||
          currentTab === 'config_parts' ||
          currentTab === 'config_region') && (
          <ConfigRulesView
            activeTab={currentTab as 'config_prefix' | 'config_parts' | 'config_region'}
            prefixRules={prefixRules}
            partRules={partRules}
            regionTable={regionTable}
            onUpdatePrefixRules={setPrefixRules}
            onUpdatePartRules={setPartRules}
            onUpdateRegions={setRegionTable}
            onResetAllConfigs={handleResetAllConfigs}
          />
        )}

        {/* Tab 6: History Risk Query */}
        {currentTab === 'history_query' && (
          <HistoryRiskQueryView
            records={historyRecords}
            onClearAll={handleClearAllHistory}
            onDeleteRecord={handleDeleteHistoryRecord}
            onDeleteBatch={handleDeleteHistoryBatch}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Modals */}
      <BatchImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        prefixRules={prefixRules}
        partRules={partRules}
        onConfirmImport={handleConfirmImport}
      />

      <RiskTableModal
        isOpen={showRiskModal}
        onClose={() => setShowRiskModal(false)}
        riskTableData={riskTableData}
        onUpdateRiskRate={handleUpdateRiskRate}
        onBatchSetRates={handleBatchSetRates}
        onExportCSV={handleExportRiskCSV}
        onSaveHistory={handleSaveHistoryRecords}
      />

      <InspectModal
        isOpen={Boolean(inspectRow)}
        row={inspectRow}
        onClose={() => setInspectRow(null)}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">服务产品offering成本测算配置小工具</span>
          <span>·</span>
          <span>支持多部件维度裂变展开与精算导入表生成</span>
        </div>
        <div className="text-slate-400">
          基于标准前端架构 · 支持离线缓存与 UTF-8 BOM CSV 导出
        </div>
      </footer>
    </div>
  );
}

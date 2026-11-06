import React, { useState, useMemo } from 'react';
import { OfferingRow, RegionItem } from '../types/offering';
import { splitRegions } from '../utils/offeringParser';
import { RegionMultiSelect } from './RegionMultiSelect';
import {
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Trash2,
  Copy,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  HelpCircle,
  Eye,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { WorkbenchAnalytics } from './WorkbenchAnalytics';

interface WorkbenchTableProps {
  tableData: OfferingRow[];
  regionTable: RegionItem[];
  onUpdateRow: (index: number, updatedFields: Partial<OfferingRow>) => void;
  onAddNewRow: () => void;
  onRemoveRow: (index: number) => void;
  onDuplicateRow: (index: number) => void;
  onClearTable: () => void;
  onOpenImportModal: () => void;
  onOpenRiskModal: () => void;
  onExportCSV: () => void;
  onDownloadTemplate: () => void;
  onInspectRow: (row: OfferingRow) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchUpdateRegion: (ids: string[], region: string) => void;
  onBatchUpdatePrice: (ids: string[], priceFrom: string, priceTo: string) => void;
}

export const WorkbenchTable: React.FC<WorkbenchTableProps> = ({
  tableData,
  regionTable,
  onUpdateRow,
  onAddNewRow,
  onRemoveRow,
  onDuplicateRow,
  onClearTable,
  onOpenImportModal,
  onOpenRiskModal,
  onExportCSV,
  onDownloadTemplate,
  onInspectRow,
  onBatchDelete,
  onBatchUpdateRegion,
  onBatchUpdatePrice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('ALL');
  const [selectedLV4Filter, setSelectedLV4Filter] = useState('ALL');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Batch action popover states
  const [showBatchRegionSelect, setShowBatchRegionSelect] = useState(false);
  const [batchPriceFrom, setBatchPriceFrom] = useState('');
  const [batchPriceTo, setBatchPriceTo] = useState('');
  const [showBatchPriceModal, setShowBatchPriceModal] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Available unique LV4s for filter
  const uniqueLV4s = useMemo(() => {
    const set = new Set<string>();
    tableData.forEach((r) => {
      if (r.lv4 && r.lv4 !== '未匹配产品') set.add(r.lv4);
    });
    return Array.from(set);
  }, [tableData]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return tableData.map((row, originalIndex) => ({ row, originalIndex })).filter(({ row }) => {
      if (selectedRegionFilter !== 'ALL') {
        const rowRegions = splitRegions(row.region);
        if (!rowRegions.includes(selectedRegionFilter)) return false;
      }
      if (selectedLV4Filter !== 'ALL' && row.lv4 !== selectedLV4Filter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesCode = row.offering.toLowerCase().includes(q);
        const matchesBU = row.hardwareBU.toLowerCase().includes(q);
        const matchesLV4 = row.lv4.toLowerCase().includes(q);
        const matchesParts = row.parts.toLowerCase().includes(q);
        const matchesHwOff = row.hardwareOffering.toLowerCase().includes(q);
        const matchesRegion = row.region.toLowerCase().includes(q);
        if (!matchesCode && !matchesBU && !matchesLV4 && !matchesParts && !matchesHwOff && !matchesRegion) return false;
      }
      return true;
    });
  }, [tableData, selectedRegionFilter, selectedLV4Filter, searchTerm]);

  // Statistics: includes multi-region explosion count
  const totalExplodedRiskRows = useMemo(() => {
    return tableData.reduce((acc, row) => {
      const regionCount = splitRegions(row.region).length;
      const partsCount = row.parts ? row.parts.split(/[,，、]+/).filter(Boolean).length : 1;
      return acc + regionCount * (partsCount || 1);
    }, 0);
  }, [tableData]);

  const warningCount = useMemo(() => {
    return tableData.filter((r) => r.status === 'warning' || r.status === 'error').length;
  }, [tableData]);

  // Selection handlers
  const isAllSelected = filteredRows.length > 0 && filteredRows.every(({ row }) => selectedRowIds.has(row.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIds(new Set());
    } else {
      const next = new Set<string>();
      filteredRows.forEach(({ row }) => next.add(row.id));
      setSelectedRowIds(next);
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRowIds(next);
  };

  const handleBatchDeleteClick = () => {
    if (selectedRowIds.size === 0) return;
    setShowBatchDeleteConfirm(true);
  };

  const handleConfirmBatchDelete = () => {
    onBatchDelete(Array.from(selectedRowIds));
    setSelectedRowIds(new Set());
    setShowBatchDeleteConfirm(false);
  };

  const handleBatchApplyRegion = (regionName: string) => {
    onBatchUpdateRegion(Array.from(selectedRowIds), regionName);
    setShowBatchRegionSelect(false);
  };

  const handleBatchApplyPrice = () => {
    onBatchUpdatePrice(Array.from(selectedRowIds), batchPriceFrom, batchPriceTo);
    setShowBatchPriceModal(false);
    setBatchPriceFrom('');
    setBatchPriceTo('');
  };

  return (
    <div className="space-y-4">
      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">总维护 Offering 数</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {tableData.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">当前工作台有效数据记录</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">预估出险率拆解行数</div>
          <div className="text-2xl font-bold text-blue-600 mt-1 tabular-nums">
            {totalExplodedRiskRows}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">多部件分类裂变展开总行数</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">涉及服务 LV4 产品</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            {uniqueLV4s.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">碎屏保 / 延保 / 全保等服务品类</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">规则匹配待核验</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {warningCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {warningCount === 0 ? '全部编码与部件规则已匹配' : '存在未识别简称或未映射部件'}
          </div>
        </div>
      </div>

      {/* Main Table Card (Fixed height container so dropdowns and grid never collapse) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 flex flex-col min-h-[680px]">
        {/* Toolbar Zone: Top row with Filters and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left search & filters */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索编码 / 硬件BU / 部件..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <select
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">全部区域 (全部)</option>
              {regionTable.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={selectedLV4Filter}
              onChange={(e) => setSelectedLV4Filter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">全部服务LV4产品</option>
              {uniqueLV4s.map((lv4) => (
                <option key={lv4} value={lv4}>
                  {lv4}
                </option>
              ))}
            </select>

            {(searchTerm || selectedRegionFilter !== 'ALL' || selectedLV4Filter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRegionFilter('ALL');
                  setSelectedLV4Filter('ALL');
                }}
                className="text-xs text-blue-600 hover:underline px-1"
              >
                重置筛选
              </button>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onAddNewRow}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 border border-blue-600 rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增一行</span>
            </button>

            <button
              onClick={onOpenImportModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 rounded-lg transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="批量导入 Offering 明细数据"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>批量导入</span>
            </button>

            <button
              onClick={onOpenRiskModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 border border-indigo-600 rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>生成出险率导入表</span>
            </button>

            <button
              onClick={onExportCSV}
              className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 rounded-lg transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="导出当前明细表 (CSV)"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>导出明细</span>
            </button>

            <button
              onClick={onClearTable}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-300 rounded-lg transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              清空
            </button>
          </div>
        </div>

        {/* Batch Selection Action Bar (shows when items are checked) */}
        {selectedRowIds.size > 0 && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-2.5 flex items-center justify-between text-xs text-blue-900 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                已选中 <b className="tabular-nums text-blue-700">{selectedRowIds.size}</b> 项
              </span>
              <span className="text-blue-300">|</span>
              <button
                onClick={() => setSelectedRowIds(new Set())}
                className="text-blue-600 hover:underline"
              >
                取消全部选择
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Batch Region dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowBatchRegionSelect(!showBatchRegionSelect)}
                  className="px-2.5 py-1 bg-white border border-blue-300 rounded text-blue-800 hover:bg-blue-50 flex items-center gap-1 font-medium"
                >
                  <span>批量修改区域</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showBatchRegionSelect && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                    {regionTable.map((reg) => (
                      <button
                        key={reg.id}
                        onClick={() => handleBatchApplyRegion(reg.name)}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        {reg.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch Price modal trigger */}
              <button
                onClick={() => setShowBatchPriceModal(true)}
                className="px-2.5 py-1 bg-white border border-blue-300 rounded text-blue-800 hover:bg-blue-50 font-medium"
              >
                批量设置价格档位
              </button>

              {/* Batch Delete */}
              <button
                onClick={handleBatchDeleteClick}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>批量删除</span>
              </button>
            </div>
          </div>
        )}

        {/* High-Density Data Grid (Fixed height, does not collapse with few rows) */}
        <div className="overflow-x-auto overflow-y-auto border border-slate-200 rounded-lg h-[540px] min-h-[540px] relative">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-800">
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-2.5 text-center min-w-[50px]">序号</th>
                <th className="p-2.5 min-w-[155px]">区域</th>
                <th className="p-2.5 min-w-[100px]">服务产品LV3</th>
                <th className="p-2.5 min-w-[130px]">服务产品LV4</th>
                <th className="p-2.5 min-w-[210px]">服务Offering编码</th>
                <th className="p-2.5 min-w-[100px]">硬件BU</th>
                <th className="p-2.5 min-w-[100px]">硬件LV3</th>
                <th className="p-2.5 min-w-[120px]">硬件Offering</th>
                <th className="p-2.5 min-w-[110px]">设备价格(从)</th>
                <th className="p-2.5 min-w-[110px]">设备价格(至)</th>
                <th className="p-2.5 text-center min-w-[70px]">期限(月)</th>
                <th className="p-2.5 text-center min-w-[60px]">次数</th>
                <th className="p-2.5 text-center min-w-[60px]">对象</th>
                <th className="p-2.5 min-w-[180px]">维修部件 (规则映射)</th>
                <th className="p-2.5 text-center min-w-[90px] sticky right-0 bg-slate-100 border-l border-slate-200">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map(({ row, originalIndex }, idx) => {
                const isSelected = selectedRowIds.has(row.id);
                const priceError =
                  row.priceFrom && row.priceTo && Number(row.priceFrom) > Number(row.priceTo);

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-2 text-center">
                      <button
                        onClick={() => toggleSelectRow(row.id)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Sequence Number */}
                    <td className="p-2 text-center text-slate-500 font-mono text-xs tabular-nums font-medium">
                      {idx + 1}
                    </td>

                    {/* Region (Supports Multi-Select & comma/顿号) */}
                    <td className="p-1.5 min-w-[155px] align-top">
                      <RegionMultiSelect
                        value={row.region}
                        regionTable={regionTable}
                        onChange={(newVal) => onUpdateRow(originalIndex, { region: newVal })}
                      />
                    </td>

                    {/* Service LV3 */}
                    <td className="p-2.5 text-slate-600 font-medium">{row.lv3}</td>

                    {/* Service LV4 */}
                    <td className="p-2.5 font-semibold text-blue-700">
                      <div className="flex items-center gap-1">
                        <span>{row.lv4}</span>
                        {row.status === 'warning' && (
                          <span title={row.validationMsg}>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Service Offering Code */}
                    <td className="p-1.5">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.offering}
                          onChange={(e) =>
                            onUpdateRow(originalIndex, { offering: e.target.value.trim() })
                          }
                          placeholder="例如: ASDW-Hope-1AY121CAB"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </td>

                    {/* Hardware BU */}
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.hardwareBU}
                        onChange={(e) =>
                          onUpdateRow(originalIndex, { hardwareBU: e.target.value.trim() })
                        }
                        placeholder="例如: 手机"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Hardware LV3 */}
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.hardwareLV3}
                        onChange={(e) =>
                          onUpdateRow(originalIndex, { hardwareLV3: e.target.value })
                        }
                        placeholder="例如: Mate系列"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Hardware Offering */}
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.hardwareOffering}
                        onChange={(e) =>
                          onUpdateRow(originalIndex, { hardwareOffering: e.target.value })
                        }
                        placeholder="例如: Hope-L29C"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Price From */}
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.priceFrom}
                        onChange={(e) =>
                          onUpdateRow(originalIndex, { priceFrom: e.target.value.trim() })
                        }
                        placeholder="例如: 0"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs tabular-nums outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Price To */}
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.priceTo}
                        onChange={(e) =>
                          onUpdateRow(originalIndex, { priceTo: e.target.value.trim() })
                        }
                        placeholder="例如: 5000"
                        className={`w-full px-2 py-1 bg-white border rounded text-xs tabular-nums outline-none focus:ring-1 ${
                          priceError
                            ? 'border-rose-400 text-rose-700 bg-rose-50/50'
                            : 'border-slate-200 focus:ring-blue-500'
                        }`}
                        title={priceError ? '价格档位(至)应大于等于价格档位(从)' : ''}
                      />
                    </td>

                    {/* Term */}
                    <td className="p-2.5 text-center font-mono font-semibold text-slate-800">
                      {row.term || '-'}
                    </td>

                    {/* Count */}
                    <td className="p-2.5 text-center font-mono font-semibold text-slate-800">
                      {row.count === '0' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          不限次数
                        </span>
                      ) : (
                        row.count || '-'
                      )}
                    </td>

                    {/* Target */}
                    <td className="p-2.5 text-center font-mono font-bold text-purple-700">
                      {row.target || '-'}
                    </td>

                    {/* Parts */}
                    <td className="p-2.5 text-slate-700">
                      <div
                        className="truncate max-w-[200px]"
                        title={row.parts}
                      >
                        {row.parts === '无匹配部件' ? (
                          <span className="text-amber-600 font-medium">无匹配部件</span>
                        ) : (
                          <span className="text-rose-600 font-medium">{row.parts}</span>
                        )}
                      </div>
                    </td>

                    {/* Actions Sticky Cell */}
                    <td className="p-2 text-center sticky right-0 bg-white border-l border-slate-200">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onInspectRow(row)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="查看 Offering 编码详细解析与拆解"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateRow(originalIndex)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="复制并生成新行"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemoveRow(originalIndex)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="删除此行"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={16} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">未找到符合条件的数据</p>
                      <p className="text-xs text-slate-400">
                        您可以尝试调整搜索关键词，或者点击右上角「新增一行」或「批量导入」。
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info note */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>
              编码截取规则: 期限为倒数 6~5 位，次数为倒数第 4 位，销售对象为倒数第 3 位 (如 C: 个人, B: 商业)。
            </span>
          </div>
          <div className="text-slate-400 tabular-nums">
            显示 {filteredRows.length} / 共 {tableData.length} 行
          </div>
        </div>
      </div>

      {/* Analytics Data Visualization Section */}
      <WorkbenchAnalytics tableData={tableData} />

      {/* Batch Price Range Modal */}
      {showBatchPriceModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              批量设置价格档位 (已选 {selectedRowIds.size} 项)
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">设备价格档位(从)</label>
                <input
                  type="text"
                  value={batchPriceFrom}
                  onChange={(e) => setBatchPriceFrom(e.target.value)}
                  placeholder="例如: 0"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">设备价格档位(至)</label>
                <input
                  type="text"
                  value={batchPriceTo}
                  onChange={(e) => setBatchPriceTo(e.target.value)}
                  placeholder="例如: 5000"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBatchPriceModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleBatchApplyPrice}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                确认应用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showBatchDeleteConfirm}
        title="批量删除确认"
        message={`确定删除选中的 ${selectedRowIds.size} 条记录吗？删除后数据不可恢复。`}
        confirmText="确认删除"
        onConfirm={handleConfirmBatchDelete}
        onClose={() => setShowBatchDeleteConfirm(false)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { PrefixRule, PartRule, RegionItem } from '../types/offering';
import {
  Plus,
  Trash2,
  Upload,
  Download,
  RotateCcw,
  Search,
  Check,
  Tag,
  MapPin,
  Wrench,
  Barcode,
} from 'lucide-react';
import {
  DEFAULT_PREFIX_RULES,
  DEFAULT_PART_RULES,
  DEFAULT_REGIONS,
} from '../utils/offeringParser';

interface ConfigRulesViewProps {
  activeTab: 'config_prefix' | 'config_parts' | 'config_region';
  prefixRules: PrefixRule[];
  partRules: PartRule[];
  regionTable: RegionItem[];
  onUpdatePrefixRules: (rules: PrefixRule[]) => void;
  onUpdatePartRules: (rules: PartRule[]) => void;
  onUpdateRegions: (regions: RegionItem[]) => void;
  onResetAllConfigs: () => void;
}

export const ConfigRulesView: React.FC<ConfigRulesViewProps> = ({
  activeTab,
  prefixRules,
  partRules,
  regionTable,
  onUpdatePrefixRules,
  onUpdatePartRules,
  onUpdateRegions,
  onResetAllConfigs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBatchRegion, setShowBatchRegion] = useState(false);
  const [batchRegionText, setBatchRegionText] = useState('');

  // 1. Prefix Rules Handlers
  const handleAddPrefixRule = () => {
    const newRule: PrefixRule = {
      id: `pref-${Date.now()}`,
      prefix: '',
      lv3: '保险服务',
      lv4: '',
      remark: '',
    };
    onUpdatePrefixRules([...prefixRules, newRule]);
  };

  const handleUpdatePrefix = (id: string, field: keyof PrefixRule, val: string) => {
    onUpdatePrefixRules(
      prefixRules.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleDeletePrefix = (id: string) => {
    onUpdatePrefixRules(prefixRules.filter((r) => r.id !== id));
  };

  // 2. Part Rules Handlers
  const handleAddPartRule = () => {
    const newRule: PartRule = {
      id: `part-${Date.now()}`,
      lv4: '',
      bu: '',
      parts: '',
    };
    onUpdatePartRules([...partRules, newRule]);
  };

  const handleUpdatePart = (id: string, field: keyof PartRule, val: string) => {
    onUpdatePartRules(
      partRules.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleDeletePart = (id: string) => {
    onUpdatePartRules(partRules.filter((r) => r.id !== id));
  };

  // 3. Region Handlers
  const handleAddRegion = () => {
    const newReg: RegionItem = {
      id: `reg-${Date.now()}`,
      name: '',
      remark: '',
    };
    onUpdateRegions([...regionTable, newReg]);
  };

  const handleUpdateRegion = (id: string, field: keyof RegionItem, val: string) => {
    onUpdateRegions(
      regionTable.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleDeleteRegion = (id: string) => {
    onUpdateRegions(regionTable.filter((r) => r.id !== id));
  };

  const handleBatchImportRegions = () => {
    if (!batchRegionText.trim()) return;
    const lines = batchRegionText.split('\n').map((l) => l.trim()).filter(Boolean);
    const added: RegionItem[] = [];

    lines.forEach((line) => {
      const parts = line.split(/[,，\t]/).map((p) => p.trim());
      if (parts[0]) {
        added.push({
          id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: parts[0],
          remark: parts[1] || '批量导入',
        });
      }
    });

    onUpdateRegions([...regionTable, ...added]);
    setBatchRegionText('');
    setShowBatchRegion(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      {/* Tab Header with Search & Reset */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          {activeTab === 'config_prefix' && (
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Barcode className="w-5 h-5 text-blue-600" />
                offering 编码与服务产品分类配置
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                根据编码首段前缀（如 ASDW、CAP、BCAI）自动识别服务产品 LV3（如保险服务）与 LV4（如华为碎屏服务宝）。
              </p>
            </div>
          )}

          {activeTab === 'config_parts' && (
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                服务产品分类出险部件配置
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                决定出险率导入表如何裂变展开：多个部件使用英文逗号分隔，每个部件将生成一行独立的「前台展示分类」。
              </p>
            </div>
          )}

          {activeTab === 'config_region' && (
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                区域基础数据与销售渠道配置
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                维护各销售大区及适用范围，工作台表格下拉菜单及导入校验均依赖本表。
              </p>
            </div>
          )}
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'config_prefix' && (
            <button
              onClick={handleAddPrefixRule}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-blue-600 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新增规则</span>
            </button>
          )}

          {activeTab === 'config_parts' && (
            <button
              onClick={handleAddPartRule}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-blue-600 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新增部件映射</span>
            </button>
          )}

          {activeTab === 'config_region' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddRegion}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-blue-600 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>新增区域</span>
              </button>
              <button
                onClick={() => setShowBatchRegion(!showBatchRegion)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>批量导入区域</span>
              </button>
            </div>
          )}

          <button
            onClick={onResetAllConfigs}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="恢复系统出厂内置规则"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>重置为默认</span>
          </button>
        </div>
      </div>

      {/* Batch Import Region Drawer */}
      {showBatchRegion && activeTab === 'config_region' && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            批量粘贴区域 (每行一条，格式: 区域名称, 备注说明)
          </label>
          <textarea
            value={batchRegionText}
            onChange={(e) => setBatchRegionText(e.target.value)}
            rows={3}
            placeholder="华东大区, 核心大区&#10;华北大区, 重点大区&#10;海外综合区, 跨境与亚太直营"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowBatchRegion(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleBatchImportRegions}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              确认批量导入
            </button>
          </div>
        </div>
      )}

      {/* 1. Prefix Rules Table */}
      {activeTab === 'config_prefix' && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-16 text-center">序号</th>
                <th className="p-3 w-40">前缀 (如 ASDW)</th>
                <th className="p-3 w-44">服务产品LV3</th>
                <th className="p-3 w-56">服务产品LV4</th>
                <th className="p-3">业务说明 / 备注</th>
                <th className="p-3 text-center w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prefixRules.map((rule, idx) => (
                <tr key={rule.id} className="hover:bg-slate-50">
                  <td className="p-3 text-center text-slate-500 font-mono tabular-nums font-medium">
                    {idx + 1}
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={rule.prefix}
                      onChange={(e) =>
                        handleUpdatePrefix(rule.id, 'prefix', e.target.value.toUpperCase())
                      }
                      placeholder="如: ASDW"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono font-bold uppercase tracking-wider text-blue-700 bg-white"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={rule.lv3}
                      onChange={(e) => handleUpdatePrefix(rule.id, 'lv3', e.target.value)}
                      placeholder="如: 保险服务"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-700 bg-white"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={rule.lv4}
                      onChange={(e) => handleUpdatePrefix(rule.id, 'lv4', e.target.value)}
                      placeholder="如: 华为碎屏服务宝"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-semibold text-blue-800 bg-white"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={rule.remark || ''}
                      onChange={(e) => handleUpdatePrefix(rule.id, 'remark', e.target.value)}
                      placeholder="备注说明 (选填)"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-600 bg-white"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDeletePrefix(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="删除此规则"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {prefixRules.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    暂无前缀规则，请点击上方「新增规则」。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Part Rules Table */}
      {activeTab === 'config_parts' && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-16 text-center">序号</th>
                <th className="p-3 w-56">服务产品LV4</th>
                <th className="p-3 w-40">硬件BU</th>
                <th className="p-3">维修部件 (逗号分隔，每个部件将生成一行出险率)</th>
                <th className="p-3 text-center w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partRules.map((rule, idx) => {
                const partsCount = rule.parts.split(',').filter(Boolean).length;
                return (
                  <tr key={rule.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-500 font-mono tabular-nums font-medium">
                      {idx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={rule.lv4}
                        onChange={(e) => handleUpdatePart(rule.id, 'lv4', e.target.value)}
                        placeholder="如: 华为碎屏服务宝"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-semibold text-blue-800 bg-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={rule.bu}
                        onChange={(e) => handleUpdatePart(rule.id, 'bu', e.target.value)}
                        placeholder="例如: 手机"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-medium text-slate-800 bg-white"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={rule.parts}
                          onChange={(e) => handleUpdatePart(rule.id, 'parts', e.target.value)}
                          placeholder="例如: 前壳,外屏,中框"
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-rose-700 font-medium bg-white font-mono"
                        />
                        <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                          共 {partsCount} 个部件
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleDeletePart(rule.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="删除此规则"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {partRules.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    暂无部件映射规则，请点击上方「新增部件映射」。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Region Table */}
      {activeTab === 'config_region' && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-16 text-center">序号</th>
                <th className="p-3 w-52">区域名称 (Region Name)</th>
                <th className="p-3">说明与适用范围</th>
                <th className="p-3 text-center w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regionTable.map((reg, idx) => (
                <tr key={reg.id} className="hover:bg-slate-50">
                  <td className="p-3 text-center text-slate-500 font-mono tabular-nums font-medium">
                    {idx + 1}
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={reg.name}
                      onChange={(e) => handleUpdateRegion(reg.id, 'name', e.target.value)}
                      placeholder="如: 华东大区"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-semibold text-emerald-800 bg-white"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={reg.remark}
                      onChange={(e) => handleUpdateRegion(reg.id, 'remark', e.target.value)}
                      placeholder="如: 核心大区 / 上海、江苏、浙江"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-600 bg-white"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDeleteRegion(reg.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="删除此区域"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {regionTable.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    暂无区域数据，请点击上方「新增区域」或「批量导入区域」。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

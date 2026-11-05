import React, { useState } from 'react';
import { PrefixRule, PartRule, RegionItem } from '../types/offering';
import {
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Tag,
  MapPin,
  Wrench,
  Barcode,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';

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
  const [showBatchRegion, setShowBatchRegion] = useState(false);
  const [batchRegionText, setBatchRegionText] = useState('');

  // Modals for adding
  const [showAddPrefixModal, setShowAddPrefixModal] = useState(false);
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showAddRegionModal, setShowAddRegionModal] = useState(false);

  // Form states for adding
  const [newPrefixForm, setNewPrefixForm] = useState({
    prefix: '',
    lv3: '保险服务',
    lv4: '',
    remark: '',
  });

  const [newPartForm, setNewPartForm] = useState({
    lv4: '',
    bu: '',
    parts: '',
  });

  const [newRegionForm, setNewRegionForm] = useState({
    name: '',
    remark: '',
  });

  // Duplicate Alert Modal state
  const [duplicateAlert, setDuplicateAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showDuplicateWarning = (title: string, message: string) => {
    setDuplicateAlert({
      isOpen: true,
      title,
      message,
    });
  };

  // 1. Prefix Rules Handlers (简称规则)
  const handleOpenAddPrefix = () => {
    setNewPrefixForm({
      prefix: '',
      lv3: '保险服务',
      lv4: '',
      remark: '',
    });
    setShowAddPrefixModal(true);
  };

  const handleConfirmAddPrefix = () => {
    const trimmedPrefix = newPrefixForm.prefix.trim().toUpperCase();
    const trimmedLv3 = newPrefixForm.lv3.trim();
    const trimmedLv4 = newPrefixForm.lv4.trim();

    if (!trimmedPrefix) {
      showDuplicateWarning('输入不完整', '请输入简称编码（如 ASDW）。');
      return;
    }
    if (!trimmedLv4) {
      showDuplicateWarning('输入不完整', '请输入服务产品LV4名称（如 华为碎屏服务宝）。');
      return;
    }

    // Duplicate check: 简称 + 服务产品LV3 + 服务产品LV4
    const isDuplicate = prefixRules.some(
      (r) =>
        r.prefix.trim().toUpperCase() === trimmedPrefix &&
        r.lv3.trim() === trimmedLv3 &&
        r.lv4.trim() === trimmedLv4
    );

    if (isDuplicate) {
      showDuplicateWarning(
        '简称规则重复提醒',
        `已存在相同的配置：简称【${trimmedPrefix}】+ 服务产品LV3【${trimmedLv3}】+ 服务产品LV4【${trimmedLv4}】，不可重复添加！`
      );
      return;
    }

    const newRule: PrefixRule = {
      id: `pref-${Date.now()}`,
      prefix: trimmedPrefix,
      lv3: trimmedLv3,
      lv4: trimmedLv4,
      remark: newPrefixForm.remark.trim(),
    };

    onUpdatePrefixRules([...prefixRules, newRule]);
    setShowAddPrefixModal(false);
  };

  const handleUpdatePrefix = (id: string, field: keyof PrefixRule, val: string) => {
    const targetRule = prefixRules.find((r) => r.id === id);
    if (!targetRule) return;

    // Check duplicate if updating prefix, lv3, or lv4
    if (field === 'prefix' || field === 'lv3' || field === 'lv4') {
      const updatedPrefix = field === 'prefix' ? val.trim().toUpperCase() : targetRule.prefix.trim().toUpperCase();
      const updatedLv3 = field === 'lv3' ? val.trim() : targetRule.lv3.trim();
      const updatedLv4 = field === 'lv4' ? val.trim() : targetRule.lv4.trim();

      if (updatedPrefix && updatedLv3 && updatedLv4) {
        const isDuplicate = prefixRules.some(
          (r) =>
            r.id !== id &&
            r.prefix.trim().toUpperCase() === updatedPrefix &&
            r.lv3.trim() === updatedLv3 &&
            r.lv4.trim() === updatedLv4
        );

        if (isDuplicate) {
          showDuplicateWarning(
            '简称规则重复提醒',
            `已存在相同的配置：简称【${updatedPrefix}】+ 服务产品LV3【${updatedLv3}】+ 服务产品LV4【${updatedLv4}】，无法修改为重复项！`
          );
          return;
        }
      }
    }

    onUpdatePrefixRules(
      prefixRules.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleDeletePrefix = (id: string) => {
    onUpdatePrefixRules(prefixRules.filter((r) => r.id !== id));
  };

  // 2. Part Rules Handlers (服务产品分类出险部件配置)
  const handleOpenAddPart = () => {
    setNewPartForm({
      lv4: '',
      bu: '',
      parts: '',
    });
    setShowAddPartModal(true);
  };

  const handleConfirmAddPart = () => {
    const trimmedLv4 = newPartForm.lv4.trim();
    const trimmedBu = newPartForm.bu.trim();
    const trimmedParts = newPartForm.parts.trim();

    if (!trimmedLv4) {
      showDuplicateWarning('输入不完整', '请输入服务产品LV4名称（如 华为碎屏服务宝）。');
      return;
    }
    if (!trimmedBu) {
      showDuplicateWarning('输入不完整', '请输入硬件BU名称（如 手机、平板、穿戴）。');
      return;
    }

    // Duplicate check: 服务产品LV4 + 硬件BU
    const isDuplicate = partRules.some(
      (r) =>
        r.lv4.trim().toLowerCase() === trimmedLv4.toLowerCase() &&
        r.bu.trim().toLowerCase() === trimmedBu.toLowerCase()
    );

    if (isDuplicate) {
      showDuplicateWarning(
        '出险部件配置重复提醒',
        `已存在相同的出险部件映射：服务产品LV4【${trimmedLv4}】与硬件BU【${trimmedBu}】，不可重复添加！`
      );
      return;
    }

    const newRule: PartRule = {
      id: `part-${Date.now()}`,
      lv4: trimmedLv4,
      bu: trimmedBu,
      parts: trimmedParts,
    };

    onUpdatePartRules([...partRules, newRule]);
    setShowAddPartModal(false);
  };

  const handleUpdatePart = (id: string, field: keyof PartRule, val: string) => {
    const targetRule = partRules.find((r) => r.id === id);
    if (!targetRule) return;

    if (field === 'lv4' || field === 'bu') {
      const updatedLv4 = field === 'lv4' ? val.trim() : targetRule.lv4.trim();
      const updatedBu = field === 'bu' ? val.trim() : targetRule.bu.trim();

      if (updatedLv4 && updatedBu) {
        const isDuplicate = partRules.some(
          (r) =>
            r.id !== id &&
            r.lv4.trim().toLowerCase() === updatedLv4.toLowerCase() &&
            r.bu.trim().toLowerCase() === updatedBu.toLowerCase()
        );

        if (isDuplicate) {
          showDuplicateWarning(
            '出险部件配置重复提醒',
            `已存在相同的出险部件映射：服务产品LV4【${updatedLv4}】与硬件BU【${updatedBu}】，无法修改为重复项！`
          );
          return;
        }
      }
    }

    onUpdatePartRules(
      partRules.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleDeletePart = (id: string) => {
    onUpdatePartRules(partRules.filter((r) => r.id !== id));
  };

  // 3. Region Handlers (区域基础数据)
  const handleOpenAddRegion = () => {
    setNewRegionForm({
      name: '',
      remark: '',
    });
    setShowAddRegionModal(true);
  };

  const handleConfirmAddRegion = () => {
    const trimmedName = newRegionForm.name.trim();
    if (!trimmedName) {
      showDuplicateWarning('输入不完整', '请输入区域名称（如 华东大区）。');
      return;
    }

    // Duplicate check: 区域名称
    const isDuplicate = regionTable.some(
      (r) => r.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      showDuplicateWarning(
        '区域基础数据重复提醒',
        `已存在相同区域名称【${trimmedName}】，不可重复添加！`
      );
      return;
    }

    const newReg: RegionItem = {
      id: `reg-${Date.now()}`,
      name: trimmedName,
      remark: newRegionForm.remark.trim(),
    };

    onUpdateRegions([...regionTable, newReg]);
    setShowAddRegionModal(false);
  };

  const handleUpdateRegion = (id: string, field: keyof RegionItem, val: string) => {
    const targetReg = regionTable.find((r) => r.id === id);
    if (!targetReg) return;

    if (field === 'name') {
      const trimmedName = val.trim();
      if (trimmedName) {
        const isDuplicate = regionTable.some(
          (r) => r.id !== id && r.name.trim().toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
          showDuplicateWarning(
            '区域基础数据重复提醒',
            `已存在相同区域名称【${trimmedName}】，无法修改为重复名称！`
          );
          return;
        }
      }
    }

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
    const duplicateNames: string[] = [];
    const existingNamesSet = new Set(regionTable.map((r) => r.name.trim().toLowerCase()));

    lines.forEach((line) => {
      const parts = line.split(/[,，\t]/).map((p) => p.trim());
      const regionName = parts[0];
      if (regionName) {
        const normalized = regionName.toLowerCase();
        if (existingNamesSet.has(normalized)) {
          duplicateNames.push(regionName);
        } else {
          existingNamesSet.add(normalized);
          added.push({
            id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: regionName,
            remark: parts[1] || '批量导入',
          });
        }
      }
    });

    if (added.length > 0) {
      onUpdateRegions([...regionTable, ...added]);
    }

    setBatchRegionText('');
    setShowBatchRegion(false);

    if (duplicateNames.length > 0) {
      showDuplicateWarning(
        '批量导入区域去重提示',
        `成功导入 ${added.length} 个新区域；以下 ${duplicateNames.length} 个区域因已存在被自动跳过：${duplicateNames.join('、')}。`
      );
    }
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
                根据编码首段简称（如 ASDW、CAP、BCAI）自动识别服务产品 LV3（如保险服务）与 LV4（如华为碎屏服务宝）。
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
                区域基础数据
              </h2>
            </div>
          )}
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'config_prefix' && (
            <button
              onClick={handleOpenAddPrefix}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-blue-600 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新增规则</span>
            </button>
          )}

          {activeTab === 'config_parts' && (
            <button
              onClick={handleOpenAddPart}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-blue-600 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新增部件映射</span>
            </button>
          )}

          {activeTab === 'config_region' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddRegion}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-blue-600 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>新增区域</span>
              </button>
              <button
                onClick={() => setShowBatchRegion(!showBatchRegion)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
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
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>确认批量导入</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Prefix Rules Table (简称规则) */}
      {activeTab === 'config_prefix' && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-16 text-center">序号</th>
                <th className="p-3 w-40">简称 (如 ASDW)</th>
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
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
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
                    暂无简称规则，请点击上方「新增规则」。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Part Rules Table (出险部件映射) */}
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
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
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

      {/* 3. Region Table (区域基础数据) */}
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
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
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

      {/* Modal: 新增简称规则 */}
      {showAddPrefixModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Barcode className="w-4 h-4 text-blue-600" />
                新增简称规则
              </h3>
              <button
                onClick={() => setShowAddPrefixModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  简称 (如 ASDW、CAP) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPrefixForm.prefix}
                  onChange={(e) =>
                    setNewPrefixForm({ ...newPrefixForm, prefix: e.target.value.toUpperCase() })
                  }
                  placeholder="例如: ASDW"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold uppercase tracking-wider text-blue-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  服务产品LV3 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPrefixForm.lv3}
                  onChange={(e) =>
                    setNewPrefixForm({ ...newPrefixForm, lv3: e.target.value })
                  }
                  placeholder="例如: 保险服务"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  服务产品LV4 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPrefixForm.lv4}
                  onChange={(e) =>
                    setNewPrefixForm({ ...newPrefixForm, lv4: e.target.value })
                  }
                  placeholder="例如: 华为碎屏服务宝"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-semibold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">业务说明 / 备注 (选填)</label>
                <input
                  type="text"
                  value={newPrefixForm.remark}
                  onChange={(e) =>
                    setNewPrefixForm({ ...newPrefixForm, remark: e.target.value })
                  }
                  placeholder="例如: 标准碎屏保"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddPrefixModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddPrefix}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: 新增部件映射 */}
      {showAddPartModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                新增出险部件映射
              </h3>
              <button
                onClick={() => setShowAddPartModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  服务产品LV4 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPartForm.lv4}
                  onChange={(e) =>
                    setNewPartForm({ ...newPartForm, lv4: e.target.value })
                  }
                  placeholder="例如: 华为碎屏服务宝"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-semibold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  硬件BU <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPartForm.bu}
                  onChange={(e) =>
                    setNewPartForm({ ...newPartForm, bu: e.target.value })
                  }
                  placeholder="例如: 手机、平板、穿戴"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  维修部件 (英文逗号分隔) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPartForm.parts}
                  onChange={(e) =>
                    setNewPartForm({ ...newPartForm, parts: e.target.value })
                  }
                  placeholder="例如: 前壳,外屏,中框"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-rose-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  每个部件将在出险率导入表中生成一行独立的「前台展示分类」。
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddPartModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddPart}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: 新增区域 */}
      {showAddRegionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                新增销售区域
              </h3>
              <button
                onClick={() => setShowAddRegionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  区域名称 (Region Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRegionForm.name}
                  onChange={(e) =>
                    setNewRegionForm({ ...newRegionForm, name: e.target.value })
                  }
                  placeholder="例如: 华东大区"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-semibold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">说明与适用范围 (选填)</label>
                <input
                  type="text"
                  value={newRegionForm.remark}
                  onChange={(e) =>
                    setNewRegionForm({ ...newRegionForm, remark: e.target.value })
                  }
                  placeholder="例如: 核心大区 / 上海、江苏、浙江"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddRegionModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddRegion}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Alert Dialog (重复校验提醒弹窗) */}
      {duplicateAlert.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-rose-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{duplicateAlert.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {duplicateAlert.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setDuplicateAlert({ isOpen: false, title: '', message: '' })}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

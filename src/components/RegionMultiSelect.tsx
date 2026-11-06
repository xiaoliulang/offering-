import React, { useState, useRef, useEffect } from 'react';
import { RegionItem } from '../types/offering';
import { splitRegions } from '../utils/offeringParser';
import { ChevronDown, Check, MapPin } from 'lucide-react';

interface RegionMultiSelectProps {
  value: string;
  regionTable: RegionItem[];
  onChange: (newValue: string) => void;
}

export const RegionMultiSelect: React.FC<RegionMultiSelectProps> = ({
  value,
  regionTable,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [customInput, setCustomInput] = useState('');

  const selectedList = splitRegions(value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Smart detect whether to open downward or upward (crucial for last row)
  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollContainer = containerRef.current.closest('.overflow-y-auto, .overflow-auto');
      const containerBottom = scrollContainer
        ? scrollContainer.getBoundingClientRect().bottom
        : window.innerHeight;

      const spaceBelow = containerBottom - rect.bottom;
      // If remaining height below is less than 320px, pop UPWARDS
      setOpenUpward(spaceBelow < 320);
    }
    setIsOpen(!isOpen);
  };

  const toggleRegion = (regionName: string) => {
    let nextList: string[];
    if (selectedList.includes(regionName)) {
      nextList = selectedList.filter((r) => r !== regionName);
    } else {
      nextList = [...selectedList, regionName];
    }
    onChange(nextList.join(','));
  };

  const handleSelectAll = () => {
    const allNames = regionTable.map((r) => r.name);
    onChange(allNames.join(','));
  };

  const handleClear = () => {
    onChange('');
  };

  const handleApplyCustom = () => {
    if (!customInput.trim()) return;
    const items = splitRegions(customInput);
    const combined = Array.from(new Set([...selectedList, ...items]));
    onChange(combined.join(','));
    setCustomInput('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button with Vertical Stacking of all Selected Regions */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full min-h-[30px] px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-left text-xs font-medium text-emerald-800 flex items-center justify-between gap-1.5 transition-colors outline-none focus:ring-1 focus:ring-blue-500"
        title="点击展开选择/修改区域 (支持多选与竖向罗列)"
      >
        {selectedList.length === 0 ? (
          <span className="text-slate-400">请选择区域</span>
        ) : (
          <div className="flex flex-col gap-1 py-0.5 flex-1 overflow-hidden">
            {selectedList.map((reg, idx) => (
              <div
                key={idx}
                className="text-[11px] leading-tight text-emerald-800 font-medium whitespace-nowrap truncate flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{reg}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0 text-slate-400 self-center">
          {selectedList.length > 1 && (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-1 py-0.2 rounded-full tabular-nums">
              {selectedList.length}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover Dropdown (Automatically opens UPWARD on the last row / near bottom) */}
      {isOpen && (
        <div
          className={`absolute left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2.5 space-y-2 text-xs animate-in fade-in zoom-in-95 duration-100 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {/* Header & Quick Actions */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>选择适用大区 (多选)</span>
            </span>
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-600 hover:underline px-1 font-medium"
              >
                全选
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-500 hover:text-rose-600 px-1 font-medium"
              >
                清空
              </button>
            </div>
          </div>

          {/* Region Checkbox list */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
            {regionTable.map((reg) => {
              const isChecked = selectedList.includes(reg.name);
              return (
                <div
                  key={reg.id}
                  onClick={() => toggleRegion(reg.name)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-emerald-50 text-emerald-900 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>{reg.name}</span>
                  </div>
                  {reg.remark && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                      {reg.remark}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom free-text entry (compatible with comma and 顿号) */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <span className="text-[10px] text-slate-400 block">
              或手动输入/粘贴（兼容逗号 , ， 与 顿号 、）：
            </span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCustom();
                  }
                }}
                placeholder="例如: 华东大区、华南大区"
                className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyCustom}
                className="px-2 py-1 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-700"
              >
                追加
              </button>
            </div>
          </div>

          {/* Close button */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors"
            >
              完成 (已选 {selectedList.length} 个区域)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

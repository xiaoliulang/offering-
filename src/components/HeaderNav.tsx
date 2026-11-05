import React from 'react';
import { Layers } from 'lucide-react';

interface HeaderNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  totalRecords: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  onTabChange,
  totalRecords,
}) => {
  const tabs = [
    { id: 'workbench', label: '业务处理工作台', count: totalRecords },
    { id: 'config_prefix', label: 'offering编码与服务产品分类配置' },
    { id: 'config_parts', label: '服务产品分类出险部件配置' },
    { id: 'config_region', label: '区域基础数据' },
    { id: 'history_query', label: '历史出险率配置查询' },
  ];

  return (
    <header className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 px-6 py-4 bg-white border-b border-slate-200 shadow-2xs">
      {/* Zone 1: Brand Wordmark (Single line, text element) */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
            服务产品offering成本测算配置小工具
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Distinct button pills) */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200/90 text-slate-700 shadow-2xs hover:border-slate-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

    </header>
  );
};

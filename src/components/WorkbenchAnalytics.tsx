import React, { useMemo, useState } from 'react';
import { OfferingRow } from '../types/offering';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from 'lucide-react';

interface WorkbenchAnalyticsProps {
  tableData: OfferingRow[];
}

const PART_COLORS = [
  '#4F46E5', // Indigo
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#059669', // Emerald
  '#D97706', // Amber
  '#E11D48', // Rose
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#0284C7', // Sky
  '#64748B', // Slate
];

const PRICE_TIER_COLORS = [
  '#38BDF8', // 0-3000: Sky
  '#3B82F6', // 3000-5000: Blue
  '#6366F1', // 5000-8000: Indigo
  '#8B5CF6', // 8000-12000: Violet
  '#EC4899', // 12000+: Pink
];

export const WorkbenchAnalytics: React.FC<WorkbenchAnalyticsProps> = ({ tableData }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [priceGroupingMode, setPriceGroupingMode] = useState<'standard' | 'exact'>('standard');

  // 1. Calculate Parts Distribution
  const partsDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalPartOccurrences = 0;

    tableData.forEach((row) => {
      if (!row.parts || !row.parts.trim()) {
        const key = '整机保障/默认';
        counts[key] = (counts[key] || 0) + 1;
        totalPartOccurrences += 1;
        return;
      }

      const list = row.parts
        .split(/[,，、]+/)
        .map((p) => p.trim())
        .filter(Boolean);

      if (list.length === 0) {
        const key = '整机保障/默认';
        counts[key] = (counts[key] || 0) + 1;
        totalPartOccurrences += 1;
      } else {
        list.forEach((part) => {
          counts[part] = (counts[part] || 0) + 1;
          totalPartOccurrences += 1;
        });
      }
    });

    const data = Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalPartOccurrences > 0 ? Number(((value / totalPartOccurrences) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      data,
      totalPartOccurrences,
      uniquePartsCount: data.length,
    };
  }, [tableData]);

  // 2. Calculate Price Tier Distribution
  const priceTierDistribution = useMemo(() => {
    if (priceGroupingMode === 'exact') {
      // Group by exact priceFrom - priceTo as configured
      const map: Record<string, number> = {};
      tableData.forEach((row) => {
        const from = row.priceFrom?.trim() || '0';
        const to = row.priceTo?.trim() || '未设上限';
        const key = `${from} - ${to} 元`;
        map[key] = (map[key] || 0) + 1;
      });

      return Object.entries(map).map(([tier, count]) => ({
        tier,
        count,
      }));
    }

    // Standard actuarial tiers: 0-3000, 3000-5000, 5000-8000, 8000-12000, 12000+
    const tiers = [
      { tier: '0-3000元 (入门)', min: 0, max: 3000, count: 0 },
      { tier: '3000-5000元 (中端)', min: 3000, max: 5000, count: 0 },
      { tier: '5000-8000元 (高端)', min: 5000, max: 8000, count: 0 },
      { tier: '8000-12000元 (旗舰)', min: 8000, max: 12000, count: 0 },
      { tier: '12000元以上 (超旗舰)', min: 12000, max: Infinity, count: 0 },
      { tier: '未配置价格', min: -1, max: -1, count: 0 },
    ];

    tableData.forEach((row) => {
      const from = parseFloat(row.priceFrom || '');
      const to = parseFloat(row.priceTo || '');

      if (isNaN(from) && isNaN(to)) {
        tiers[5].count += 1;
        return;
      }

      // Check tier overlapping based on mid-point or priceTo
      const targetVal = !isNaN(to) && to > 0 ? to : from;

      if (targetVal <= 3000) {
        tiers[0].count += 1;
      } else if (targetVal <= 5000) {
        tiers[1].count += 1;
      } else if (targetVal <= 8000) {
        tiers[2].count += 1;
      } else if (targetVal <= 12000) {
        tiers[3].count += 1;
      } else {
        tiers[4].count += 1;
      }
    });

    // Filter out tiers with 0 count if it's the unconfigured tier
    return tiers.filter((t) => t.count > 0 || t.min >= 0);
  }, [tableData, priceGroupingMode]);

  return (
    <div className="mt-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* Analytics Card Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-blue-50/20 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                精算数据分布看板
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold">
                Offering 结构透视
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              实时统计当前工作台 {tableData.length} 条 Offering 的出险部件覆盖比例与设备价格档位阶梯分布
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isCollapsed ? (
              <>
                <span>展开图表</span>
                <ChevronDown className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>收起图表</span>
                <ChevronUp className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">当前配置 Offering</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">
                  {tableData.length} <span className="text-xs font-normal text-slate-500">条</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">覆盖部件种类</div>
                <div className="text-lg font-bold text-indigo-700 tabular-nums">
                  {partsDistribution.uniquePartsCount} <span className="text-xs font-normal text-slate-500">类</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">部件裂变总频次</div>
                <div className="text-lg font-bold text-emerald-700 tabular-nums">
                  {partsDistribution.totalPartOccurrences} <span className="text-xs font-normal text-slate-500">项</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">价格档位覆盖数</div>
                <div className="text-lg font-bold text-amber-700 tabular-nums">
                  {priceTierDistribution.length} <span className="text-xs font-normal text-slate-500">档</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          {tableData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Info className="w-8 h-8 text-slate-300" />
              <p className="text-sm">暂无 Offering 数据，添加或导入 Offering 记录后将在此自动生成精算分布图表。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Parts Distribution (Donut Chart) */}
              <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-slate-800">部件分布比例图</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    按配置出险部件占比
                  </span>
                </div>

                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={partsDistribution.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {partsDistribution.data.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PART_COLORS[index % PART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown, name: unknown, item: { payload?: { percentage?: number } }) => {
                          const num = typeof val === 'number' ? val : 0;
                          const pct = item?.payload?.percentage ?? 0;
                          return [`${num} 项 (${pct}%)`, String(name)];
                        }}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        itemStyle={{ color: '#E2E8F0' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(val, entry) => {
                          const item = partsDistribution.data.find((d) => d.name === val);
                          const pct = item ? `(${item.percentage}%)` : '';
                          return (
                            <span className="text-xs text-slate-600">
                              {val} <span className="text-slate-400">{pct}</span>
                            </span>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Price Tier Distribution (Bar Chart) */}
              <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-slate-800">价格档位分布图</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                    <button
                      onClick={() => setPriceGroupingMode('standard')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                        priceGroupingMode === 'standard'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      标准阶梯
                    </button>
                    <button
                      onClick={() => setPriceGroupingMode('exact')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                        priceGroupingMode === 'exact'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      实际配置区间
                    </button>
                  </div>
                </div>

                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={priceTierDistribution}
                      margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="tier"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                      />
                      <Tooltip
                        formatter={(val: unknown) => [`${val} 条 Offering`, '数量']}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Offering 记录数"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                      >
                        {priceTierDistribution.map((_, index) => (
                          <Cell
                            key={`bar-cell-${index}`}
                            fill={PRICE_TIER_COLORS[index % PRICE_TIER_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

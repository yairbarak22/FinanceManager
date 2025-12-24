'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChartIcon, Lightbulb } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Asset } from '@/lib/types';
import { assetCategories, getCategoryInfo } from '@/lib/categories';

interface AssetAllocationChartProps {
  assets: Asset[];
  onGetRecommendations?: () => void;
}

// Brand-aligned colors for categories
const CATEGORY_COLORS: Record<string, string> = {
  real_estate: '#6366f1',  // Indigo
  stocks: '#10b981',       // Emerald
  crypto: '#f59e0b',       // Amber
  pension_fund: '#14b8a6', // Teal
  education_fund: '#a855f7', // Purple
  savings_account: '#3b82f6', // Blue
  investments: '#06b6d4',  // Cyan
  vehicle: '#64748b',      // Slate
  cash: '#34d399',         // Emerald light
  other: '#94a3b8',        // Slate light
};

export default function AssetAllocationChart({ assets, onGetRecommendations }: AssetAllocationChartProps) {
  // Calculate totals by category
  const { chartData, totalAssets } = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let total = 0;

    assets.forEach((asset) => {
      const category = asset.category || 'other';
      categoryTotals[category] = (categoryTotals[category] || 0) + asset.value;
      total += asset.value;
    });

    const data = Object.entries(categoryTotals)
      .map(([categoryId, value]) => {
        const categoryInfo = getCategoryInfo(categoryId, 'asset') || 
          assetCategories.find(c => c.id === 'other');
        return {
          id: categoryId,
          name: categoryInfo?.nameHe || categoryId,
          value,
          percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
          color: CATEGORY_COLORS[categoryId] || '#94a3b8',
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by value descending

    return { chartData: data, totalAssets: total };
  }, [assets]);

  const isEmpty = chartData.length === 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-xl border border-slate-100">
          <p className="font-semibold text-slate-900">{data.name}</p>
          <p className="text-sm text-slate-600 mt-1">{formatCurrency(data.value)}</p>
          <p className="text-xs text-slate-500">{data.percentage}% מסך הנכסים</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null; // Don't show label for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-semibold"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
      >
        {percentage}%
      </text>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <PieChartIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">פילוח נכסים</h2>
            <p className="text-xs text-slate-500">סה"כ: {formatCurrency(totalAssets)}</p>
          </div>
        </div>
        
        {/* Recommendations Button */}
        {onGetRecommendations && (
          <button
            onClick={onGetRecommendations}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-sm font-medium shadow-sm"
          >
            <Lightbulb className="w-4 h-4" />
            קבל המלצות
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
          <PieChartIcon className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm">אין נכסים להצגה</p>
          <p className="text-xs">הוסף נכסים כדי לראות את הפילוח</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {chartData.map((entry) => (
                    <Cell 
                      key={entry.id} 
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend - Brand styled */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {chartData.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

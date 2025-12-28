'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Holding } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface AllocationChartsProps {
  holdings: Holding[];
}

const COLORS = [
  '#6366f1', // indigo-500
  '#0ea5e9', // sky-500
  '#14b8a6', // teal-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#f97316', // orange-500
  '#64748b', // slate-500
  '#06b6d4', // cyan-500
];

export default function AllocationCharts({ holdings }: AllocationChartsProps) {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

  // Current allocation data
  const currentData = holdings.map((h, i) => ({
    name: h.name,
    value: h.currentValue,
    percentage: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0,
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0);

  // Target allocation data
  const targetData = holdings.map((h, i) => ({
    name: h.name,
    value: h.targetAllocation,
    percentage: h.targetAllocation,
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0);

  if (holdings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
        <h3 className="font-semibold text-slate-900 mb-4">פילוח התיק</h3>
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <p>אין נתונים להצגה</p>
          <p className="text-sm mt-1">הוסף אחזקות כדי לראות את הפילוח</p>
        </div>
      </div>
    );
  }

  const renderCustomLabel = ({ percent }: { percent?: number }) => {
    if (!percent || percent < 0.05) return null;
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 h-full flex flex-col">
      <h3 className="font-semibold text-slate-900 mb-4 sm:mb-6 flex-shrink-0">פילוח התיק</h3>
      
      <div className="flex-1 min-h-0">
        {/* Charts grid - side by side on mobile, more space on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4">
          {/* Current Allocation */}
          <div>
            <h4 className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2 text-center">נוכחי</h4>
            <div className="h-32 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentData}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="70%"
                    paddingAngle={2}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {currentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name,
                    ]}
                    contentStyle={{
                      direction: 'rtl',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">
              {formatCurrency(totalValue)}
            </p>
          </div>

          {/* Target Allocation */}
          <div>
            <h4 className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2 text-center">יעד</h4>
            <div className="h-32 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={targetData}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="70%"
                    paddingAngle={2}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {targetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}%`,
                      name,
                    ]}
                    contentStyle={{
                      direction: 'rtl',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">
              100%
            </p>
          </div>
        </div>

        {/* Legend - scrollable on mobile if many items */}
        <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-2 sm:gap-3 max-h-16 sm:max-h-none overflow-y-auto">
          {holdings.map((h, i) => (
            <div key={h.id} className="flex items-center gap-1 sm:gap-1.5">
              <div 
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-[10px] sm:text-xs text-slate-600 truncate max-w-[60px] sm:max-w-none">{h.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Holding } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface AllocationChartsProps {
  holdings: Holding[];
}

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#22c55e', // green
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
      <div className="card p-6 h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-4">פילוח התיק</h3>
        <div className="flex-1 flex items-center justify-center text-gray-400">
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
    <div className="card p-6 h-full flex flex-col">
      <h3 className="font-semibold text-gray-900 mb-6 flex-shrink-0">פילוח התיק</h3>
      
      <div className="flex-1 min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current Allocation */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2 text-center">פילוח נוכחי</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
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
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            סה״כ: {formatCurrency(totalValue)}
          </p>
        </div>

        {/* Target Allocation */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2 text-center">פילוח יעד</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={targetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
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
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            סה״כ: 100%
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {holdings.map((h, i) => (
          <div key={h.id} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-xs text-gray-600">{h.name}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}


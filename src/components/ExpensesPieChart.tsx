'use client';

import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Transaction } from '@/lib/types';
import { getCategoryInfo } from '@/lib/categories';

interface ExpensesPieChartProps {
  transactions: Transaction[];
}

export default function ExpensesPieChart({ transactions }: ExpensesPieChartProps) {
  // Calculate expenses by category
  const expensesByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);

  const data = Object.entries(expensesByCategory)
    .map(([category, amount]) => {
      const categoryInfo = getCategoryInfo(category, 'expense');
      return {
        name: categoryInfo?.nameHe || category,
        value: amount,
        color: categoryInfo?.color || '#64748b',
        percentage: ((amount / totalExpenses) * 100).toFixed(0),
      };
    })
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center h-full" >
        <PieChartIcon className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-400 text-sm">אין הוצאות להצגה</p>
      </div>
    );
  }

  return (
    <div className="card p-6 h-full flex flex-col" >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
          <PieChartIcon className="w-5 h-5 text-pink-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">התפלגות הוצאות</h2>
      </div>

      {/* Pie Chart */}
      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '13px',
              }}
              formatter={(value: number) => [formatCurrency(value), '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.slice(0, 6).map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600 truncate">{item.name}</span>
            <span className="text-xs text-gray-400 mr-auto">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

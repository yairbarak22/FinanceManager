'use client';

import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Transaction } from '@/lib/types';
import { getCategoryInfo, CategoryInfo } from '@/lib/categories';
import { SensitiveData } from './common/SensitiveData';

interface ExpensesPieChartProps {
  transactions: Transaction[];
  customExpenseCategories?: CategoryInfo[];
}

export default function ExpensesPieChart({ transactions, customExpenseCategories = [] }: ExpensesPieChartProps) {
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
      const categoryInfo = getCategoryInfo(category, 'expense', customExpenseCategories);
      return {
        id: category, // Use original category key as unique identifier
        name: categoryInfo?.nameHe || category,
        value: amount,
        color: categoryInfo?.color || '#64748b',
        percentage: ((amount / totalExpenses) * 100).toFixed(0),
      };
    })
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <PieChartIcon className="w-12 h-12 text-slate-300 mb-3" aria-hidden="true" />
        <p className="text-slate-500 text-sm">אין הוצאות להצגה</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center" aria-hidden="true">
            <PieChartIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-900">התפלגות הוצאות</h3>
        </div>
      </div>

      {/* Accessible Summary for Screen Readers */}
      <div className="sr-only">
        <h4>סיכום התפלגות הוצאות</h4>
        <p>סה"כ הוצאות: {formatCurrency(totalExpenses)}</p>
        <table>
          <caption>פירוט הוצאות לפי קטגוריה</caption>
          <thead>
            <tr>
              <th>קטגוריה</th>
              <th>סכום</th>
              <th>אחוז</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{formatCurrency(item.value)}</td>
                <td>{item.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pie Chart - Hidden from screen readers */}
      <div className="h-48" aria-hidden="true">
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
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-lg" dir="rtl">
                      <SensitiveData as="p" className="font-semibold text-slate-900 text-sm">{item.name}</SensitiveData>
                      <SensitiveData as="p" className="text-sm text-slate-600 mt-1">{formatCurrency(item.value)}</SensitiveData>
                      <SensitiveData as="p" className="text-xs text-slate-500">{item.percentage}%</SensitiveData>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend - Show all categories with amounts */}
      <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
        {data.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <SensitiveData as="span" className="text-sm text-slate-700 flex-1">{item.name}</SensitiveData>
            <SensitiveData as="span" className="text-sm font-semibold text-slate-900 flex-shrink-0">
              {formatCurrency(item.value)}
            </SensitiveData>
          </div>
        ))}
      </div>
    </div>
  );
}

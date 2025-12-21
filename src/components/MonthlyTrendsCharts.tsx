'use client';

import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ComposedChart,
  Area,
} from 'recharts';
import { formatCurrency, formatShortMonth } from '@/lib/utils';
import { MonthlySummary } from '@/lib/types';

interface MonthlyTrendsChartsProps {
  data: MonthlySummary[];
}

export default function MonthlyTrendsCharts({ data }: MonthlyTrendsChartsProps) {
  // Format data for charts
  const chartData = data.map((item) => ({
    month: formatShortMonth(new Date(item.year, parseInt(item.month) - 1)),
    income: item.income,
    expenses: item.expenses,
    balance: item.balance,
  })).reverse(); // Oldest first for charts

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="card p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-purple-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">מגמות חודשיות</h2>
      </div>

      {/* Combined Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.3}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '13px',
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'income' ? 'הכנסות' : name === 'expenses' ? 'הוצאות' : 'יתרה',
              ]}
            />
            <Legend
              formatter={(value) => (value === 'income' ? 'הכנסות' : value === 'expenses' ? 'הוצאות' : 'יתרה')}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="income" fill="url(#incomeGradient)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="url(#expenseGradient)" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#22c55e' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

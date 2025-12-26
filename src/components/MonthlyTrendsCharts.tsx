'use client';

import { BarChart3 } from 'lucide-react';
import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Line,
} from 'recharts';
import { formatCurrency, formatShortMonth } from '@/lib/utils';
import { MonthlySummary } from '@/lib/types';
import Card from './ui/Card';
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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-100">
          <p className="font-semibold text-slate-900 mb-2 text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600">
                {entry.dataKey === 'income' ? 'הכנסות' : entry.dataKey === 'expenses' ? 'הוצאות' : 'יתרה'}:
              </span>
              <span className="font-medium text-slate-900">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const renderLegend = () => (
    <div className="flex items-center justify-center gap-6 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-teal-500" />
        <span className="text-xs text-slate-600">הכנסות</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-pink-500" />
        <span className="text-xs text-slate-600">הוצאות</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <span className="text-xs text-slate-600">יתרה</span>
      </div>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">מגמות חודשיות</h2>
      </div>

      {/* Combined Chart */}
      <div className="flex-1" style={{ minHeight: '250px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            barGap={2}
            barCategoryGap="20%"
          >
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
              horizontalPoints={[]}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
              width={50}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar
              dataKey="income"
              fill="url(#incomeGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={35}
            />
            <Bar
              dataKey="expenses"
              fill="url(#expenseGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={35}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ fill: '#22c55e', strokeWidth: 0, r: 5 }}
              activeDot={{ r: 7, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      {renderLegend()}
    </Card>
  );
}

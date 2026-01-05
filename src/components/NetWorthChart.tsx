'use client';

import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { formatCurrency, formatShortMonth } from '@/lib/utils';
import { NetWorthHistory } from '@/lib/types';

interface NetWorthChartProps {
  data: NetWorthHistory[];
  currentNetWorth: number;
  transactionBalance: number;
}

export default function NetWorthChart({ data, currentNetWorth, transactionBalance }: NetWorthChartProps) {
  // Calculate change
  const firstValue = data.length > 0 ? data[0].netWorth : 0;
  const lastValue = data.length > 0 ? data[data.length - 1].netWorth : 0;
  const change = lastValue - firstValue;
  const changePercent = firstValue > 0 ? ((change / firstValue) * 100).toFixed(1) : '0';
  const isPositive = change >= 0;

  // Format data for chart
  const chartData = data.map((item) => ({
    date: formatShortMonth(item.date),
    netWorth: item.netWorth,
  }));

  return (
    <div className="card p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center" aria-hidden="true">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">התקדמות השווי הנקי</h2>
        </div>

        {/* Change Badge */}
        <div className={`px-3 py-1.5 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
          <span className={`text-sm font-medium ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {isPositive ? '+' : ''}{changePercent}%
          </span>
        </div>
      </div>

      {/* Accessible Summary for Screen Readers */}
      <div className="sr-only">
        <h3>סיכום התקדמות השווי הנקי</h3>
        <p>
          השווי הנקי הנוכחי הוא {formatCurrency(currentNetWorth)}.
          {change !== 0 && (
            <>
              {' '}השינוי מתחילת התקופה הוא {isPositive ? 'עלייה' : 'ירידה'} של {changePercent}%.
            </>
          )}
        </p>
        {chartData.length > 0 && (
          <table>
            <caption>נתוני שווי נקי לפי חודש</caption>
            <thead>
              <tr>
                <th>חודש</th>
                <th>שווי נקי</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, index) => (
                <tr key={index}>
                  <td>{item.date}</td>
                  <td>{formatCurrency(item.netWorth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Chart - Hidden from screen readers as data is available above */}
      <div className="h-48 mb-4" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(value) => `₪${(value / 1000000).toFixed(1)}M`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '13px',
              }}
              formatter={(value: number) => [formatCurrency(value), 'שווי נקי']}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#netWorthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <p className="text-xs text-slate-500 mb-1">שווי נקי נוכחי</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(currentNetWorth)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-slate-500 mb-1">יתרה מעסקאות</p>
          <p className={`text-lg font-bold ${transactionBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(transactionBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}

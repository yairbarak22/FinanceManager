'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  priceILS: number;
  valueILS: number;
  beta: number;
  sector: string;
  changePercent: number;
  weight: number;
  sparklineData: number[];
}

interface HoldingsTableProps {
  holdings: Holding[];
  className?: string;
}

/**
 * Sparkline component - tiny line chart without axes
 */
function Sparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (data.length < 2) {
    return <div className="w-16 h-8 flex items-center justify-center text-slate-300">—</div>;
  }

  const chartData = data.map((value, index) => ({ value, index }));
  const color = isPositive ? '#10b981' : '#f43f5e'; // emerald-500 / rose-500

  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Change indicator component
 */
function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <div className="flex items-center gap-1 text-emerald-600">
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="text-sm font-medium">+{change.toFixed(2)}%</span>
      </div>
    );
  }
  if (change < 0) {
    return (
      <div className="flex items-center gap-1 text-rose-500">
        <TrendingDown className="w-3.5 h-3.5" />
        <span className="text-sm font-medium">{change.toFixed(2)}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-slate-400">
      <Minus className="w-3.5 h-3.5" />
      <span className="text-sm font-medium">0.00%</span>
    </div>
  );
}

/**
 * HoldingsTable Component
 * A clean Apple-style table with sparkline charts
 */
export function HoldingsTable({ holdings, className = '' }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-8 text-center ${className}`}>
        <p className="text-slate-400">אין אחזקות להצגה</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">אחזקות</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100">
              <th className="text-right font-medium px-5 py-3">נייר</th>
              <th className="text-left font-medium px-3 py-3">7 ימים</th>
              <th className="text-left font-medium px-3 py-3">שינוי</th>
              <th className="text-left font-medium px-3 py-3">Beta</th>
              <th className="text-left font-medium px-3 py-3">משקל</th>
              <th className="text-left font-medium px-5 py-3">שווי</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => (
              <tr
                key={holding.symbol}
                className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                  index === holdings.length - 1 ? 'border-b-0' : ''
                }`}
              >
                {/* Symbol & Name */}
                <td className="px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{holding.symbol}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[150px]">{holding.name}</p>
                  </div>
                </td>

                {/* Sparkline */}
                <td className="px-3 py-4">
                  <Sparkline
                    data={holding.sparklineData}
                    isPositive={holding.changePercent >= 0}
                  />
                </td>

                {/* Change */}
                <td className="px-3 py-4">
                  <ChangeIndicator change={holding.changePercent} />
                </td>

                {/* Beta */}
                <td className="px-3 py-4">
                  <span
                    className={`text-sm font-medium ${
                      holding.beta < 0.8
                        ? 'text-emerald-600'
                        : holding.beta <= 1.2
                        ? 'text-sky-600'
                        : 'text-rose-500'
                    }`}
                  >
                    {holding.beta.toFixed(2)}
                  </span>
                </td>

                {/* Weight */}
                <td className="px-3 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(holding.weight, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600">{holding.weight.toFixed(1)}%</span>
                  </div>
                </td>

                {/* Value */}
                <td className="px-5 py-4 text-left">
                  <p className="text-sm font-semibold text-slate-900 smartlook-mask">
                    {holding.valueILS.toLocaleString('he-IL', {
                      style: 'currency',
                      currency: 'ILS',
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {holding.quantity.toLocaleString()} יח'
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

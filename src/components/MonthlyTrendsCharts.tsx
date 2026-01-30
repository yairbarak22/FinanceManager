'use client';

import { useState, useRef, useEffect } from 'react';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
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

const MAX_VISIBLE_MONTHS = 4;

export default function MonthlyTrendsCharts({ data }: MonthlyTrendsChartsProps) {
  // Format data for charts - oldest first
  const allChartData = data.map((item) => ({
    month: formatShortMonth(new Date(item.year, parseInt(item.month) - 1)),
    income: item.income,
    expenses: item.expenses,
    balance: item.balance,
  })).reverse();

  // State for pagination - start from the end (most recent months)
  const [startIndex, setStartIndex] = useState(() => 
    Math.max(0, allChartData.length - MAX_VISIBLE_MONTHS)
  );

  // Update startIndex when data changes
  useEffect(() => {
    setStartIndex(Math.max(0, allChartData.length - MAX_VISIBLE_MONTHS));
  }, [allChartData.length]);

  // Get visible slice of data
  const chartData = allChartData.slice(startIndex, startIndex + MAX_VISIBLE_MONTHS);

  // Navigation handlers
  const canGoLeft = startIndex > 0;
  const canGoRight = startIndex + MAX_VISIBLE_MONTHS < allChartData.length;

  const goLeft = () => {
    if (canGoLeft) {
      setStartIndex(prev => Math.max(0, prev - 1));
    }
  };

  const goRight = () => {
    if (canGoRight) {
      setStartIndex(prev => Math.min(allChartData.length - MAX_VISIBLE_MONTHS, prev + 1));
    }
  };

  const isEmpty = allChartData.length === 0;

  // Custom tooltip component - Apple minimalist style
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="bg-white px-4 py-3 rounded-2xl border-0"
          style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}
        >
          <p 
            className="font-semibold mb-2 text-sm"
            style={{ color: '#1D1D35' }}
          >
            {label}
          </p>
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span style={{ color: '#7E7F90' }}>
                {entry.dataKey === 'income' ? 'הכנסות' : entry.dataKey === 'expenses' ? 'הוצאות' : 'יתרה'}:
              </span>
              <span 
                className="font-medium"
                style={{ color: '#1D1D35' }}
              >
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend component - Apple minimalist style
  const renderLegend = () => (
    <div className="flex items-center justify-center gap-6 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0DBACC' }} />
        <span className="text-xs" style={{ color: '#7E7F90' }}>הכנסות</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F18AB5' }} />
        <span className="text-xs" style={{ color: '#7E7F90' }}>הוצאות</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#69ADFF' }} />
        <span className="text-xs" style={{ color: '#7E7F90' }}>יתרה</span>
      </div>
    </div>
  );

  return (
    <Card className="flex flex-col" style={{ height: '450px' }}>
      {/* Header with Navigation - Apple minimalist style */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 
          className="text-lg font-semibold"
          style={{ 
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            color: '#1D1D35'
          }}
        >
          מגמות חודשיות
        </h3>
        
        {/* Navigation Arrows */}
        {allChartData.length > MAX_VISIBLE_MONTHS && (
          <div className="flex items-center gap-1">
            <button
              onClick={goRight}
              disabled={!canGoRight}
              className={`p-1.5 rounded-lg transition-colors ${
                canGoRight 
                  ? 'hover:bg-slate-100 text-slate-600' 
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              aria-label="חודשים חדשים יותר"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={goLeft}
              disabled={!canGoLeft}
              className={`p-1.5 rounded-lg transition-colors ${
                canGoLeft 
                  ? 'hover:bg-slate-100 text-slate-600' 
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              aria-label="חודשים ישנים יותר"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">אין נתונים להצגה</p>
            <p className="text-xs mt-1">הוסף עסקאות כדי לראות מגמות חודשיות</p>
          </div>
        </div>
      ) : (
        <>
          {/* Combined Chart */}
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                barGap={2}
                barCategoryGap="20%"
              >
                <defs>
                  {/* Fincheck Turquoise gradient for income */}
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0DBACC" stopOpacity={1} />
                    <stop offset="100%" stopColor="#B4F1F1" stopOpacity={0.8} />
                  </linearGradient>
                  {/* Fincheck Cotton Candy gradient for expenses */}
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F18AB5" stopOpacity={1} />
                    <stop offset="100%" stopColor="#FFC0DB" stopOpacity={0.8} />
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
                  stroke="#69ADFF"
                  strokeWidth={3}
                  dot={{ fill: '#69ADFF', strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 7, fill: '#69ADFF', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="flex-shrink-0">
            {renderLegend()}
          </div>
        </>
      )}
    </Card>
  );
}

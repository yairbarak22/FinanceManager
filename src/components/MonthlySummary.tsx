'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { MonthlySummary as MonthlySummaryType } from '@/lib/types';

interface MonthlySummaryProps {
  summaries: MonthlySummaryType[];
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
}

const monthNames: { [key: string]: string } = {
  '01': 'ינואר',
  '02': 'פברואר',
  '03': 'מרץ',
  '04': 'אפריל',
  '05': 'מאי',
  '06': 'יוני',
  '07': 'יולי',
  '08': 'אוגוסט',
  '09': 'ספטמבר',
  '10': 'אוקטובר',
  '11': 'נובמבר',
  '12': 'דצמבר',
};

export default function MonthlySummary({
  summaries,
  totalIncome,
  totalExpenses,
  totalBalance,
}: MonthlySummaryProps) {
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) =>
      prev.includes(monthKey) ? prev.filter((m) => m !== monthKey) : [...prev, monthKey]
    );
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">סיכום חודשי</h2>
      </div>

      {/* Overall Summary */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 mb-4 border border-indigo-100">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">הכנסות</p>
            <p className="text-sm font-bold text-teal-600">{formatCurrency(totalIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">הוצאות</p>
            <p className="text-sm font-bold text-pink-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">יתרה</p>
            <p className={cn(
              'text-sm font-bold',
              totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Cards */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {summaries.map((summary) => {
          const monthKey = `${summary.year}-${summary.month}`;
          const isExpanded = expandedMonths.includes(monthKey);
          const monthName = monthNames[summary.month] || summary.month;
          const isPositive = summary.balance >= 0;

          return (
            <div key={monthKey} className="border border-gray-100 rounded-lg overflow-hidden">
              {/* Month Header */}
              <button
                onClick={() => toggleMonth(monthKey)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center',
                      isPositive ? 'bg-green-100' : 'bg-red-100'
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 text-sm">
                      {monthName} {summary.year}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'text-sm font-bold',
                      isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {isPositive ? '+' : ''}{formatCurrency(summary.balance)}
                  </p>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">הכנסות</p>
                      <p className="text-sm font-semibold text-teal-600">
                        {formatCurrency(summary.income)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">הוצאות</p>
                      <p className="text-sm font-semibold text-pink-600">
                        {formatCurrency(summary.expenses)}
                      </p>
                    </div>
                  </div>
                  {summary.savingsRate > 0 && (
                    <div className="mt-2 text-center">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        חיסכון {summary.savingsRate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

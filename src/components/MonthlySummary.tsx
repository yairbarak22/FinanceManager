'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { MonthlySummary as MonthlySummaryType } from '@/lib/types';
import Card from './ui/Card';
import { SensitiveData } from './common/SensitiveData';

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
    <Card className="flex flex-col" style={{ height: '450px' }}>
      {/* Header - Fincheck style */}
      <h3 
        className="text-lg font-semibold mb-4 flex-shrink-0"
        style={{ 
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          color: 'var(--text-primary, #303150)'
        }}
      >
        סיכום חודשי
      </h3>

      {/* Overall Summary - Fincheck style */}
      <div 
        className="rounded-2xl p-4 mb-4 flex-shrink-0"
        style={{ background: 'rgba(105, 173, 255, 0.1)' }}
      >
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p 
              className="text-xs mb-1"
              style={{ color: 'var(--text-secondary, #7E7F90)' }}
            >
              הכנסות
            </p>
            <SensitiveData as="p" className="text-sm font-bold" style={{ color: '#0DBACC' }}>
              {formatCurrency(totalIncome)}
            </SensitiveData>
          </div>
          <div>
            <p 
              className="text-xs mb-1"
              style={{ color: 'var(--text-secondary, #7E7F90)' }}
            >
              הוצאות
            </p>
            <SensitiveData as="p" className="text-sm font-bold" style={{ color: '#F18AB5' }}>
              {formatCurrency(totalExpenses)}
            </SensitiveData>
          </div>
          <div>
            <p 
              className="text-xs mb-1"
              style={{ color: 'var(--text-secondary, #7E7F90)' }}
            >
              יתרה
            </p>
            <SensitiveData 
              as="p" 
              className="text-sm font-bold"
              style={{ color: totalBalance >= 0 ? '#0DBACC' : '#F18AB5' }}
            >
              {formatCurrency(totalBalance)}
            </SensitiveData>
          </div>
        </div>
      </div>

      {/* Monthly Cards - Scrollable area - Fincheck style */}
      <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
        {summaries.map((summary) => {
          const monthKey = `${summary.year}-${summary.month}`;
          const isExpanded = expandedMonths.includes(monthKey);
          const monthName = monthNames[summary.month] || summary.month;
          const isPositive = summary.balance >= 0;

          return (
            <div 
              key={monthKey} 
              className="rounded-2xl overflow-hidden"
              style={{ background: isExpanded ? 'rgba(105, 173, 255, 0.05)' : 'transparent' }}
            >
              {/* Month Header */}
              <button
                onClick={() => toggleMonth(monthKey)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors rounded-2xl"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ 
                      background: isPositive ? 'rgba(13, 186, 204, 0.15)' : 'rgba(241, 138, 181, 0.15)'
                    }}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" style={{ color: '#0DBACC' }} />
                    ) : (
                      <TrendingDown className="w-4 h-4" style={{ color: '#F18AB5' }} />
                    )}
                  </div>
                  <div className="text-right">
                    <p 
                      className="font-medium text-sm"
                      style={{ color: 'var(--text-primary, #303150)' }}
                    >
                      {monthName} {summary.year}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <SensitiveData
                    as="p"
                    className="text-sm font-bold"
                    style={{ color: isPositive ? '#0DBACC' : '#F18AB5' }}
                  >
                    {isPositive ? '+' : ''}{formatCurrency(summary.balance)}
                  </SensitiveData>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-secondary, #7E7F90)' }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary, #7E7F90)' }} />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <div className="text-center">
                      <p className="text-xs" style={{ color: 'var(--text-secondary, #7E7F90)' }}>הכנסות</p>
                      <SensitiveData as="p" className="text-sm font-semibold" style={{ color: '#0DBACC' }}>
                        {formatCurrency(summary.income)}
                      </SensitiveData>
                    </div>
                    <div className="text-center">
                      <p className="text-xs" style={{ color: 'var(--text-secondary, #7E7F90)' }}>הוצאות</p>
                      <SensitiveData as="p" className="text-sm font-semibold" style={{ color: '#F18AB5' }}>
                        {formatCurrency(summary.expenses)}
                      </SensitiveData>
                    </div>
                  </div>
                  {summary.savingsRate > 0 && (
                    <div className="mt-2 text-center">
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(13, 186, 204, 0.15)', color: '#0DBACC' }}
                      >
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
    </Card>
  );
}

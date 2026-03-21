'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { SensitiveData } from '@/components/common/SensitiveData';
import { formatCurrency } from '@/lib/utils';
import { PieChart } from 'lucide-react';

interface BudgetPulseCardProps {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  month: number;
  year: number;
}

function getStatus(remaining: number, percentage: number) {
  if (remaining < 0 || percentage > 100)
    return { word: 'דורש התייחסות', color: '#F18AB5' };
  if (percentage > 75)
    return { word: 'קרוב לגבול', color: '#E9A800' };
  return { word: 'מצוין', color: '#0DBACC' };
}

export default function BudgetPulseCard({
  totalBudget,
  totalSpent,
  totalRemaining,
  overallPercentage,
  month,
  year,
}: BudgetPulseCardProps) {
  const status = getStatus(totalRemaining, overallPercentage);
  const fillPercent = totalBudget > 0
    ? Math.min((totalSpent / totalBudget) * 100, 100)
    : 0;

  const todayMarker = useMemo(() => {
    const now = new Date();
    if (now.getMonth() + 1 !== month || now.getFullYear() !== year) return null;
    const daysInMonth = new Date(year, month, 0).getDate();
    return (now.getDate() / daysInMonth) * 100;
  }, [month, year]);

  if (totalBudget === 0) {
    return (
      <Card className="h-full flex flex-col">
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(13, 186, 204, 0.1)' }}
          >
            <PieChart className="w-8 h-8" style={{ color: '#0DBACC' }} strokeWidth={1.5} />
          </div>
          <p
            className="text-sm"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            אין תקציב לחודש זה
          </p>
          <Link
            href="/budget"
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: '#69ADFF', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            הגדרת תקציב
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="p-6 flex flex-col gap-5 flex-1" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
        {/* Icon + label */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(13, 186, 204, 0.1)' }}
          >
            <PieChart className="w-5 h-5" style={{ color: '#0DBACC' }} strokeWidth={1.5} />
          </div>
          <span className="text-sm font-medium" style={{ color: '#7E7F90' }}>
            נותרו לשימוש
          </span>
        </div>

        {/* Big remaining number */}
        <SensitiveData
          as="p"
          className="text-3xl font-bold tabular-nums"
          style={{ color: '#303150' }}
          dir="ltr"
        >
          {formatCurrency(totalRemaining)}
        </SensitiveData>

        {/* Progress bar with today marker */}
        <div className="relative">
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: '10px', background: '#E8E8ED' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${fillPercent}%`,
                background: status.color,
                minWidth: fillPercent > 0 ? '4px' : '0',
              }}
            />
          </div>
          {todayMarker !== null && (
            <div
              className="absolute"
              style={{
                right: `${todayMarker}%`,
                top: '-3px',
                transform: 'translateX(50%)',
              }}
            >
              <div style={{ width: '2px', height: '16px', background: '#303150', borderRadius: '1px' }} />
              <span
                className="absolute whitespace-nowrap"
                style={{ fontSize: '9px', fontWeight: 600, color: '#303150', top: '18px', right: '50%', transform: 'translateX(50%)' }}
              >
                היום
              </span>
            </div>
          )}
        </div>

        {/* Summary text */}
        <p className="text-xs" style={{ color: '#7E7F90' }}>
          <SensitiveData as="span">{formatCurrency(totalSpent)}</SensitiveData>
          {' מתוך '}
          <SensitiveData as="span">{formatCurrency(totalBudget)}</SensitiveData>
          {' '}
          ({Math.round(overallPercentage)}%)
        </p>

        {/* Status line */}
        <div className="mt-auto pt-4 border-t" style={{ borderColor: '#F7F7F8' }}>
          <p className="text-xs" style={{ color: '#7E7F90' }}>
            {'מצב התקציב: '}
            <span className="font-semibold" style={{ color: status.color }}>{status.word}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}

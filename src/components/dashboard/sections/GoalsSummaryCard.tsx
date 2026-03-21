'use client';

import { useMemo } from 'react';
import { Target } from 'lucide-react';
import Card from '@/components/ui/Card';
import { SensitiveData } from '@/components/common/SensitiveData';
import { formatCurrency, isRecurringActiveInMonth, getFinancialMonthKey } from '@/lib/utils';
import { useMonth } from '@/context/MonthContext';
import type { FinancialGoal } from '@/lib/api/goals';

interface GoalsSummaryCardProps {
  goals: FinancialGoal[];
}

export default function GoalsSummaryCard({ goals }: GoalsSummaryCardProps) {
  const { selectedMonth, currentMonth, financialMonthStartDay } = useMonth();

  const effectiveMonth = selectedMonth === 'all' || selectedMonth === 'custom'
    ? currentMonth
    : selectedMonth;

  const { totalSaved, totalTarget, monthlySum } = useMemo(() => {
    let saved = 0;
    let target = 0;
    let monthly = 0;

    for (const g of goals) {
      saved += g.currentAmount;
      target += g.targetAmount;

      if (g.recurringTransaction?.isActive) {
        const monthKey = getFinancialMonthKey(new Date().toISOString(), financialMonthStartDay);
        const checkMonth = effectiveMonth || monthKey;
        if (isRecurringActiveInMonth(g.recurringTransaction, checkMonth)) {
          monthly += g.recurringTransaction.amount;
        }
      }
    }

    return { totalSaved: saved, totalTarget: target, monthlySum: monthly };
  }, [goals, effectiveMonth, financialMonthStartDay]);

  const progressPercent = totalTarget > 0
    ? Math.min(100, (totalSaved / totalTarget) * 100)
    : 0;

  return (
    <Card className="h-full flex flex-col">
      <div className="p-6 flex flex-col gap-5 flex-1">
        {/* Icon + label */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(13, 186, 204, 0.1)' }}
          >
            <Target className="w-5 h-5" style={{ color: '#0DBACC' }} strokeWidth={1.5} />
          </div>
          <span
            className="text-sm font-medium"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            סך חיסכון ליעדים
          </span>
        </div>

        {/* Main number */}
        <SensitiveData
          as="p"
          className="text-3xl font-bold"
          style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          {formatCurrency(totalSaved)}
        </SensitiveData>

        {/* Progress bar */}
        {totalTarget > 0 && (
          <div>
            <div
              className="w-full h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: '#F7F7F8' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: '#0DBACC',
                }}
              />
            </div>
            <p
              className="text-xs mt-2"
              style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              <SensitiveData as="span">
                {formatCurrency(totalSaved)}
              </SensitiveData>
              {' מתוך '}
              <SensitiveData as="span">
                {formatCurrency(totalTarget)}
              </SensitiveData>
              {' '}
              ({Math.round(progressPercent)}%)
            </p>
          </div>
        )}

        {/* Monthly recurring line */}
        <div className="mt-auto pt-4 border-t" style={{ borderColor: '#F7F7F8' }}>
          <p
            className="text-xs"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            {monthlySum > 0 ? (
              <>
                {'החודש מופרשים '}
                <SensitiveData
                  as="span"
                  className="font-semibold"
                  style={{ color: '#0DBACC' }}
                >
                  {formatCurrency(monthlySum)}
                </SensitiveData>
                {' ליעדים שלך'}
              </>
            ) : (
              'אין הפרשה קבועה פעילה ליעדים החודש'
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

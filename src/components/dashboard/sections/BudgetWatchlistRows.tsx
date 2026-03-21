'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { SensitiveData } from '@/components/common/SensitiveData';
import { formatCurrency } from '@/lib/utils';
import { getCategoryInfo, type CategoryInfo } from '@/lib/categories';
import { PieChart } from 'lucide-react';
import type { BudgetWithSpending } from '@/lib/types';

interface BudgetWatchlistRowsProps {
  budgets: BudgetWithSpending[];
  customExpenseCategories: CategoryInfo[];
}

function getPercentColor(pct: number): string {
  if (pct > 100) return '#F18AB5';
  if (pct > 90) return '#E9A800';
  return '#0DBACC';
}

export default function BudgetWatchlistRows({
  budgets,
  customExpenseCategories,
}: BudgetWatchlistRowsProps) {
  const topBudgets = useMemo(() => {
    const active = budgets.filter((b) => b.amount > 0);
    return active
      .sort((a, b) => {
        const aOver = a.percentage > 100 || a.remaining < 0 ? 1 : 0;
        const bOver = b.percentage > 100 || b.remaining < 0 ? 1 : 0;
        if (aOver !== bOver) return bOver - aOver;
        return b.percentage - a.percentage;
      })
      .slice(0, 3);
  }, [budgets]);

  return (
    <Card className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex items-center justify-between flex-shrink-0">
        <h3
          className="text-lg font-semibold"
          style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          תקציבים במיקוד
        </h3>
        <Link
          href="/budget"
          className="text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: '#69ADFF', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          לכל התקציבים
        </Link>
      </div>

      {/* Rows */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-ghost px-6 pb-4">
        {topBudgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[140px] gap-3">
            <PieChart className="w-8 h-8" style={{ color: '#BDBDCB' }} strokeWidth={1.5} />
            <p
              className="text-sm"
              style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              אין קטגוריות תקציב פעילות
            </p>
          </div>
        ) : (
          /* Match GoalsBoardRows: grid column count must equal participating children per row (hidden = omitted). md+: 4 cols / 4 cells; below md: 3 cols without progress column. */
          <div className="grid w-full gap-x-3 max-md:[grid-template-columns:2.5rem_minmax(0,1fr)_9rem] md:[grid-template-columns:2.5rem_minmax(0,1fr)_9.5rem_9rem]">
            {topBudgets.map((budget, i) => {
              const catInfo = getCategoryInfo(
                budget.categoryId,
                'expense',
                customExpenseCategories,
              );
              const Icon = catInfo.icon;
              const pctColor = getPercentColor(budget.percentage);
              const clampedWidth = Math.min(budget.percentage, 100);

              return (
                <div key={budget.categoryId} className="contents">
                  {/* Icon */}
                  <div
                    className="flex w-10 shrink-0 items-center justify-center justify-self-end py-3.5 pe-1"
                    style={{
                      borderBottom: i < topBudgets.length - 1 ? '1px solid #F7F7F8' : 'none',
                    }}
                  >
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${catInfo.bgColor}`}
                    >
                      {Icon && (
                        <Icon
                          className={`w-5 h-5 ${catInfo.textColor}`}
                          strokeWidth={1.5}
                        />
                      )}
                    </div>
                  </div>

                  {/* Name only */}
                  <div
                    className="min-w-0 self-center py-3.5"
                    style={{
                      borderBottom: i < topBudgets.length - 1 ? '1px solid #F7F7F8' : 'none',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    <p
                      className="line-clamp-2 break-words text-sm font-semibold"
                      style={{ color: '#303150' }}
                    >
                      {catInfo.nameHe}
                    </p>
                    {/* Same bar on small screens (no extra grid cell — avoids column-count mismatch) */}
                    <div className="mt-1.5 md:hidden">
                      <div className="flex w-full min-w-0 items-center gap-2" dir="ltr">
                        <span
                          className="w-9 shrink-0 text-center text-xs font-semibold tabular-nums"
                          style={{ color: pctColor, fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                        >
                          {Math.round(budget.percentage)}%
                        </span>
                        <div
                          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
                          style={{ background: '#E8E8ED' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${clampedWidth}%`, background: pctColor }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mini progress — dedicated column md+ (GoalsBoardRows pattern) */}
                  <div
                    className="hidden w-full min-w-0 justify-self-end self-center py-3.5 md:block"
                    style={{
                      borderBottom: i < topBudgets.length - 1 ? '1px solid #F7F7F8' : 'none',
                    }}
                  >
                    <div className="flex w-full min-w-0 items-center gap-2" dir="ltr">
                      <span
                        className="w-9 shrink-0 text-center text-xs font-semibold tabular-nums"
                        style={{ color: pctColor, fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      >
                        {Math.round(budget.percentage)}%
                      </span>
                      <div
                        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
                        style={{ background: '#E8E8ED' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${clampedWidth}%`, background: pctColor }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div
                    className="w-full min-w-0 justify-self-end self-center py-3.5 text-start tabular-nums"
                    dir="ltr"
                    style={{
                      borderBottom: i < topBudgets.length - 1 ? '1px solid #F7F7F8' : 'none',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    <SensitiveData
                      as="p"
                      className="text-sm font-bold"
                      style={{ color: budget.remaining >= 0 ? '#303150' : '#F18AB5' }}
                    >
                      {budget.remaining >= 0 ? `נותרו ${formatCurrency(budget.remaining)}` : `חריגה ${formatCurrency(Math.abs(budget.remaining))}`}
                    </SensitiveData>
                    <SensitiveData
                      as="p"
                      className="text-xs"
                      style={{ color: '#BDBDCB' }}
                    >
                      / {formatCurrency(budget.amount)}
                    </SensitiveData>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

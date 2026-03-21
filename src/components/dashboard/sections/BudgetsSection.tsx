'use client';

import { SectionHeader } from '@/components/dashboard';
import Card from '@/components/ui/Card';
import { PieChart } from 'lucide-react';
import type { BudgetSummary } from '@/lib/types';
import type { CategoryInfo } from '@/lib/categories';
import BudgetPulseCard from './BudgetPulseCard';
import BudgetWatchlistRows from './BudgetWatchlistRows';

export interface BudgetsSectionProps {
  budgetSummary: BudgetSummary | null;
  isLoading: boolean;
  error: Error | null;
  customExpenseCategories: CategoryInfo[];
  month: number;
  year: number;
}

export default function BudgetsSection({
  budgetSummary,
  isLoading,
  error,
  customExpenseCategories,
  month,
  year,
}: BudgetsSectionProps) {
  const hasBudgets = budgetSummary && budgetSummary.budgets.length > 0;

  return (
    <section>
      <SectionHeader
        title="תקציבים"
        subtitle="ניהול ובקרה של תקציב ההוצאות החודשי"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Card className="h-[300px] animate-pulse">
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#69ADFF] border-t-transparent rounded-full animate-spin" />
              </div>
            </Card>
          </div>
          <div className="lg:col-span-8">
            <Card className="h-[300px] animate-pulse">
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#69ADFF] border-t-transparent rounded-full animate-spin" />
              </div>
            </Card>
          </div>
        </div>
      ) : error || !hasBudgets ? (
        <Card>
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(13, 186, 204, 0.1)' }}
            >
              <PieChart className="w-8 h-8" style={{ color: '#0DBACC' }} strokeWidth={1.5} />
            </div>
            <p className="text-sm" style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
              {error ? 'שגיאה בטעינת נתוני התקציב' : 'אין תקציב מוגדר לחודש זה'}
            </p>
            <p className="text-xs" style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
              {error ? 'נסה לרענן את הדף' : 'הגדר תקציב בעמוד התקציבים כדי לעקוב אחריו כאן'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <BudgetPulseCard
              totalBudget={budgetSummary.totalBudget}
              totalSpent={budgetSummary.totalSpent}
              totalRemaining={budgetSummary.totalRemaining}
              overallPercentage={budgetSummary.overallPercentage}
              month={month}
              year={year}
            />
          </div>
          <div className="lg:col-span-8">
            <BudgetWatchlistRows
              budgets={budgetSummary.budgets}
              customExpenseCategories={customExpenseCategories}
            />
          </div>
        </div>
      )}
    </section>
  );
}

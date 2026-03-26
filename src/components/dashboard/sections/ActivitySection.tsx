'use client';

import type { RefObject } from 'react';
import { SectionHeader } from '@/components/dashboard';
import { TutorialPill } from '@/components/layout/PageTutorialDrawer';
import { getSectionTutorialConfig } from '@/lib/pageTutorials';
import Card from '@/components/ui/Card';
import ExpensesPieChart from '@/components/ExpensesPieChart';
import RecentTransactions from '@/components/RecentTransactions';
import type { Transaction, RecurringTransaction } from '@/lib/types';
import type { CategoryInfo } from '@/lib/categories';

export interface ActivitySectionProps {
  monthFilteredTransactions: Transaction[];
  filteredTransactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  customExpenseCategories: CategoryInfo[];
  customIncomeCategories: CategoryInfo[];
  selectedCategory: string | null;
  onCategoryClick: (category: string) => void;
  onClearCategoryFilter: () => void;
  effectiveMonth: string;
  transactionsRef: RefObject<HTMLDivElement | null>;
  // RecentTransactions handlers
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => Promise<void> | void;
  onUpdateTransaction: (
    transactionId: string,
    newCategory: string,
    merchantName: string,
    saveBehavior: 'once' | 'always' | 'alwaysAsk',
    newDescription?: string,
    newAmount?: number,
    updateExistingTransactions?: boolean,
    newDate?: string,
    needsDetailsReview?: boolean,
  ) => Promise<void> | void;
  onBulkUpdateCategory: (ids: string[], category: string) => Promise<void> | void;
  onNewTransaction: () => void;
  onSaveTransaction: (data: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => Promise<void>;
  onImport: () => void;
  onOpenMaaserCalculator: () => void;
  onIvrSetupSuccess: () => void;
  onAddCategory: (name: string, type: 'expense' | 'income') => Promise<CategoryInfo | void>;
  onDeleteCategory: (categoryId: string, type: string) => Promise<void>;
  onEditRecurring: (r: RecurringTransaction) => void;
  exchangeRate?: number;
  monthsCount?: number;
}

export default function ActivitySection({
  monthFilteredTransactions,
  filteredTransactions,
  recurringTransactions,
  customExpenseCategories,
  customIncomeCategories,
  selectedCategory,
  onCategoryClick,
  onClearCategoryFilter,
  effectiveMonth,
  transactionsRef,
  onDelete,
  onDeleteMultiple,
  onUpdateTransaction,
  onBulkUpdateCategory,
  onNewTransaction,
  onSaveTransaction,
  onImport,
  onOpenMaaserCalculator,
  onIvrSetupSuccess,
  onAddCategory,
  onDeleteCategory,
  onEditRecurring,
  exchangeRate,
  monthsCount,
}: ActivitySectionProps) {
  const activityTutorial = getSectionTutorialConfig('activity');

  return (
    <section>
      <SectionHeader
        title="פעילות"
        subtitle="פילוח הוצאות והכנסות ועסקאות אחרונות"
        action={activityTutorial && <TutorialPill config={activityTutorial} sectionKey="activity" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padding="sm" className="h-[500px] flex flex-col lg:col-span-1">
          <ExpensesPieChart
            transactions={monthFilteredTransactions}
            recurringExpenses={recurringTransactions}
            customExpenseCategories={customExpenseCategories}
            customIncomeCategories={customIncomeCategories}
            selectedCategory={selectedCategory}
            onCategoryClick={onCategoryClick}
            effectiveMonth={effectiveMonth}
            exchangeRate={exchangeRate}
            monthsCount={monthsCount}
          />
        </Card>

        <Card ref={transactionsRef} padding="sm" className="h-[500px] flex flex-col lg:col-span-2">
          <RecentTransactions
            transactions={filteredTransactions}
            onDelete={onDelete}
            onDeleteMultiple={onDeleteMultiple}
            onUpdateTransaction={onUpdateTransaction}
            onBulkUpdateCategory={onBulkUpdateCategory}
            onNewTransaction={onNewTransaction}
            onSaveTransaction={onSaveTransaction}
            onImport={onImport}
            customExpenseCategories={customExpenseCategories}
            customIncomeCategories={customIncomeCategories}
            selectedCategory={selectedCategory}
            onClearCategoryFilter={onClearCategoryFilter}
            onOpenMaaserCalculator={onOpenMaaserCalculator}
            onIvrSetupSuccess={onIvrSetupSuccess}
            onAddCategory={onAddCategory}
            onDeleteCategory={onDeleteCategory}
            recurringTransactions={recurringTransactions}
            effectiveMonth={effectiveMonth}
            onEditRecurring={onEditRecurring}
          />
        </Card>
      </div>
    </section>
  );
}

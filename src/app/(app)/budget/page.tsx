'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { RotateCcw, Copy } from 'lucide-react';
import { useMonth } from '@/context/MonthContext';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/useToast';
import AppLayout from '@/components/layout/AppLayout';
import { SectionHeader } from '@/components/dashboard';
import MonthSelector from '@/components/monthly-summary/MonthSelector';
import BudgetSummaryCards from '@/components/budget/BudgetSummaryCards';
import BudgetVisualCard from '@/components/budget/BudgetVisualCard';
import AddBudgetVisual from '@/components/budget/AddBudgetVisual';
import UnbudgetedExpenses from '@/components/budget/UnbudgetedExpenses';
import AddBudgetModal from '@/components/budget/AddBudgetModal';
import CopyBudgetButton from '@/components/budget/CopyBudgetButton';
import BudgetModeToggle from '@/components/budget/BudgetModeToggle';
import PassoverWorkspace from '@/components/budget/PassoverWorkspace';
import ToastContainer from '@/components/ui/Toast';
import { getCategoryInfo, CategoryInfo } from '@/lib/categories';
import { apiFetch } from '@/lib/utils';
import type { BudgetSummary } from '@/lib/types';

import BudgetSkeleton from '@/components/budget/BudgetSkeleton';

const BudgetCelebrationPlayer = dynamic(() => import('@/components/budget/BudgetCelebrationPlayer'), { ssr: false });

function parseMonthKey(monthKey: string): { month: number; year: number } {
  const [yearStr, monthStr] = monthKey.split('-');
  return { month: parseInt(monthStr, 10), year: parseInt(yearStr, 10) };
}

function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

export default function BudgetPage() {
  const { selectedMonth, setSelectedMonth, currentMonth, allMonths, monthsWithData } = useMonth();
  const { getCustomByType, addCustomCategory } = useCategories();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [budgetData, setBudgetData] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const hasShownCelebration = useRef(false);
  const [isPassoverMode, setIsPassoverMode] = useState(false);

  const { month, year } = useMemo(() => parseMonthKey(selectedMonth), [selectedMonth]);
  const previousMonth = useMemo(() => getPreviousMonth(month, year), [month, year]);

  const customExpenseCategories: CategoryInfo[] = useMemo(
    () => getCustomByType('expense'),
    [getCustomByType]
  );

  const resolveCategoryInfo = useCallback(
    (categoryId: string) => getCategoryInfo(categoryId, 'expense', customExpenseCategories),
    [customExpenseCategories]
  );

  const fetchBudgetData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/budgets?month=${month}&year=${year}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch budget data');
      const data: BudgetSummary = await res.json();
      setBudgetData(data);
    } catch {
      showError('שגיאה בטעינת נתוני התקציב');
      setBudgetData(null);
    } finally {
      setIsLoading(false);
    }
  }, [month, year, showError]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  const MONTH_NAMES_HE: Record<number, string> = {
    1: 'ינואר', 2: 'פברואר', 3: 'מרץ', 4: 'אפריל', 5: 'מאי', 6: 'יוני',
    7: 'יולי', 8: 'אוגוסט', 9: 'ספטמבר', 10: 'אוקטובר', 11: 'נובמבר', 12: 'דצמבר',
  };
  const monthDisplayName = `${MONTH_NAMES_HE[month]} ${year}`;

  const handleSaveBudget = useCallback(
    async (categoryId: string, amount: number, options?: { skipRefetch?: boolean }) => {
      const res = await apiFetch('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({ categoryId, amount, month, year }),
      });
      if (!res.ok) throw new Error('Failed to save budget');
      success('התקציב נשמר בהצלחה');
      if (!options?.skipRefetch) {
        await fetchBudgetData();
      }
    },
    [month, year, fetchBudgetData, success]
  );

  const handleUpdateBudgetAmount = useCallback(async (categoryId: string, newAmount: number) => {
    const res = await apiFetch('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ categoryId, amount: newAmount, month, year }),
    });
    if (!res.ok) throw new Error('Failed to update budget');
    success('התקציב עודכן');
    await fetchBudgetData();
  }, [month, year, fetchBudgetData, success]);

  const handleDeleteBudget = useCallback(async (budgetId: string) => {
    const res = await apiFetch(`/api/budgets/${budgetId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete budget');
    success('התקציב נמחק');
    await fetchBudgetData();
  }, [fetchBudgetData, success]);

  const handleCopyFromPrevious = useCallback(async () => {
    const res = await apiFetch('/api/budgets/copy', {
      method: 'POST',
      body: JSON.stringify({
        fromMonth: previousMonth.month,
        fromYear: previousMonth.year,
        toMonth: month,
        toYear: year,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      showError(data.error || 'שגיאה בהעתקת התקציב');
      return;
    }
    const data = await res.json();
    success(`הועתקו ${data.copied} קטגוריות תקציב`);
    await fetchBudgetData();
  }, [previousMonth, month, year, fetchBudgetData, success, showError]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openAddModal = useCallback((categoryId?: string) => {
    setEditingCategoryId(null);
    setEditingAmount(null);
    setIsAddModalOpen(true);
  }, []);

  const existingBudgetCategoryIds = useMemo(() => {
    if (!budgetData) return new Set<string>();
    return new Set(budgetData.budgets.map(b => b.categoryId));
  }, [budgetData]);

  const isCurrentMonth = selectedMonth === currentMonth;

  const sortedBudgets = useMemo(() => {
    if (!budgetData) return [];
    return [...budgetData.budgets].sort((a, b) => b.percentage - a.percentage);
  }, [budgetData]);

  const hasBudgets = budgetData && budgetData.budgets.length > 0;

  return (
    <AppLayout
      pageTitle="תקציב חודשי"
      pageSubtitle="ניהול ומעקב תקציב לפי קטגוריות"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
      showQuickAddFab={true}
    >
      <div
        className="max-w-5xl mx-auto space-y-4 transition-colors duration-500 rounded-3xl"
        style={{ background: isPassoverMode ? '#FDF8F0' : 'transparent', padding: isPassoverMode ? '24px' : '0' }}
      >
        {/* Month selector + mode toggle (month selector hidden in Passover mode) */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            {!isPassoverMode && (
              <>
                <MonthSelector monthKey={selectedMonth} onMonthChange={setSelectedMonth} />
                {!isCurrentMonth && (
                  <button
                    onClick={() => setSelectedMonth(currentMonth)}
                    className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
                  >
                    חודש נוכחי
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                )}
              </>
            )}
          </div>
          <BudgetModeToggle isPassover={isPassoverMode} onChange={setIsPassoverMode} />
        </div>

        {isPassoverMode ? (
          <PassoverWorkspace month={month} year={year} />
        ) : isLoading ? (
          <BudgetSkeleton />
        ) : !hasBudgets ? (
          /* ---- Empty state ---- */
          <div
            className="rounded-3xl p-6"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          >
            <div className="text-center py-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: '#69ADFF15' }}
              >
                <Copy className="w-6 h-6 text-[#69ADFF]" strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#303150', marginBottom: '6px' }}>
                עדיין לא הגדרת תקציב לחודש זה
              </h3>
              <p style={{ fontSize: '13px', fontWeight: 400, color: '#7E7F90', marginBottom: '16px' }}>
                הוסף קטגוריות תקציב או העתק מחודש קודם
              </p>
              <CopyBudgetButton
                fromMonth={previousMonth.month}
                fromYear={previousMonth.year}
                toMonth={month}
                toYear={year}
                onCopy={handleCopyFromPrevious}
              />
            </div>

            <div className="border-t mt-3" style={{ borderColor: '#F7F7F8' }}>
              <AddBudgetVisual
                onSave={handleSaveBudget}
                existingBudgetCategoryIds={existingBudgetCategoryIds}
                customCategories={customExpenseCategories}
                onAddCategory={(name, isMaaserEligible) =>
                  addCustomCategory(name, 'expense', isMaaserEligible)
                }
              />
            </div>

            {budgetData && budgetData.unbudgetedExpenses.length > 0 && (
              <UnbudgetedExpenses
                expenses={budgetData.unbudgetedExpenses}
                getCategoryInfo={resolveCategoryInfo}
                onAddBudget={handleSaveBudget}
              />
            )}
          </div>
        ) : (
          /* ---- Non-empty state: Dashboard-style layout ---- */
          <div className="space-y-12 pb-12">
            {/* Hero Section */}
            <section>
              <BudgetSummaryCards
                totalBudget={budgetData.totalBudget}
                totalSpent={budgetData.totalSpent}
                totalRemaining={budgetData.totalRemaining}
                overallPercentage={budgetData.overallPercentage}
                monthDisplayName={monthDisplayName}
                month={month}
                year={year}
              />
            </section>

            {/* Budget cards section */}
            <section>
              <SectionHeader
                title="תקציבים לפי קטגוריה"
                subtitle="ניהול תקציב לכל קטגוריית הוצאה"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedBudgets.map((budget) => (
                  <BudgetVisualCard
                    key={budget.id}
                    categoryInfo={resolveCategoryInfo(budget.categoryId)}
                    categoryId={budget.categoryId}
                    budgetAmount={budget.amount}
                    spent={budget.spent}
                    remaining={budget.remaining}
                    percentage={budget.percentage}
                    onUpdateAmount={handleUpdateBudgetAmount}
                    onDelete={() => handleDeleteBudget(budget.id)}
                  />
                ))}

                <AddBudgetVisual
                  onSave={handleSaveBudget}
                  existingBudgetCategoryIds={existingBudgetCategoryIds}
                  customCategories={customExpenseCategories}
                  onAddCategory={(name, isMaaserEligible) =>
                    addCustomCategory(name, 'expense', isMaaserEligible)
                  }
                />
              </div>
            </section>

            {/* Unbudgeted expenses section */}
            {budgetData.unbudgetedExpenses.length > 0 && (
              <section>
                <SectionHeader
                  title="הוצאות ללא תקציב"
                  subtitle="קטגוריות עם הוצאות שעדיין לא הוגדרו להן תקציב"
                />
                <div
                  className="rounded-3xl p-5"
                  style={{
                    background: '#FFFFFF',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <UnbudgetedExpenses
                    expenses={budgetData.unbudgetedExpenses}
                    getCategoryInfo={resolveCategoryInfo}
                    onAddBudget={(categoryId, amount) =>
                      handleSaveBudget(categoryId, amount, { skipRefetch: true })
                    }
                    onRefetch={fetchBudgetData}
                  />
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit budget modal (for presets and edit flows) */}
      <AddBudgetModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCategoryId(null);
          setEditingAmount(null);
        }}
        onSave={handleSaveBudget}
        existingBudgetCategoryIds={
          editingCategoryId
            ? new Set([...existingBudgetCategoryIds].filter(id => id !== editingCategoryId))
            : existingBudgetCategoryIds
        }
        customCategories={customExpenseCategories}
        editingCategoryId={editingCategoryId}
        editingAmount={editingAmount}
        onAddCategory={(name, isMaaserEligible) =>
          addCustomCategory(name, 'expense', isMaaserEligible)
        }
      />

      {/* Celebration overlay */}
      {showCelebration && budgetData && (
        <BudgetCelebrationPlayer
          data={{
            savedAmount: budgetData.totalRemaining,
            monthName: monthDisplayName,
          }}
          onAnimationEnd={() => {
            setShowCelebration(false);
            hasShownCelebration.current = true;
          }}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AppLayout>
  );
}

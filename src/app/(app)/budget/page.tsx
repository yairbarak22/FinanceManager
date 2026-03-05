'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Plus, RotateCcw } from 'lucide-react';
import { useMonth } from '@/context/MonthContext';
import { useModal } from '@/context/ModalContext';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/useToast';
import AppLayout from '@/components/layout/AppLayout';
import MonthSelector from '@/components/monthly-summary/MonthSelector';
import BudgetSummaryCards from '@/components/budget/BudgetSummaryCards';
import BudgetProgressBar from '@/components/budget/BudgetProgressBar';
import BudgetCategoryRow from '@/components/budget/BudgetCategoryRow';
import UnbudgetedExpenses from '@/components/budget/UnbudgetedExpenses';
import AddBudgetModal from '@/components/budget/AddBudgetModal';
import CopyBudgetButton from '@/components/budget/CopyBudgetButton';
import ToastContainer from '@/components/ui/Toast';
import { getCategoryInfo, CategoryInfo } from '@/lib/categories';
import { apiFetch } from '@/lib/utils';
import type { BudgetSummary } from '@/lib/types';

const BudgetLoadingPlayer = dynamic(() => import('@/components/budget/BudgetLoadingPlayer'), { ssr: false });
const BudgetOverviewPlayer = dynamic(() => import('@/components/budget/BudgetOverviewPlayer'), { ssr: false });
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
  const { openModal } = useModal();
  const { getCustomByType } = useCategories();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [budgetData, setBudgetData] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<number | null>(null);
  const [showOverviewAnimation, setShowOverviewAnimation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const hasPlayedOverview = useRef(false);
  const hasShownCelebration = useRef(false);

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

  // Trigger overview animation on first load with data
  useEffect(() => {
    if (budgetData && budgetData.budgets.length > 0 && !hasPlayedOverview.current && !isLoading) {
      hasPlayedOverview.current = true;
      setShowOverviewAnimation(true);
    }
  }, [budgetData, isLoading]);

  // Month name for celebration
  const MONTH_NAMES_HE: Record<number, string> = {
    1: 'ינואר', 2: 'פברואר', 3: 'מרץ', 4: 'אפריל', 5: 'מאי', 6: 'יוני',
    7: 'יולי', 8: 'אוגוסט', 9: 'ספטמבר', 10: 'אוקטובר', 11: 'נובמבר', 12: 'דצמבר',
  };
  const monthDisplayName = `${MONTH_NAMES_HE[month]} ${year}`;

  // Build overview animation data
  const overviewAnimationData = useMemo(() => {
    if (!budgetData || budgetData.budgets.length === 0) return null;
    return {
      overallPercentage: budgetData.overallPercentage,
      totalBudget: budgetData.totalBudget,
      totalSpent: budgetData.totalSpent,
      totalRemaining: budgetData.totalRemaining,
      categories: budgetData.budgets
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5)
        .map(b => {
          const info = resolveCategoryInfo(b.categoryId);
          return {
            nameHe: info?.nameHe || b.categoryId,
            color: info?.color || '#69ADFF',
            percentage: b.percentage,
            spent: b.spent,
            budget: b.amount,
          };
        }),
    };
  }, [budgetData, resolveCategoryInfo]);

  const handleSaveBudget = useCallback(async (categoryId: string, amount: number) => {
    const res = await apiFetch('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ categoryId, amount, month, year }),
    });
    if (!res.ok) throw new Error('Failed to save budget');
    success('התקציב נשמר בהצלחה');
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

  const openEditModal = useCallback((categoryId: string, amount: number) => {
    setEditingCategoryId(categoryId);
    setEditingAmount(amount);
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

  return (
    <AppLayout
      pageTitle="תקציב חודשי"
      pageSubtitle="ניהול ומעקב תקציב לפי קטגוריות"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      onOpenProfile={() => openModal('profile')}
      onOpenAccountSettings={() => openModal('accountSettings')}
      showMonthFilter={false}
      showQuickAddFab={true}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Month selector with "back to current" */}
        <div className="flex items-center justify-center gap-4">
          <MonthSelector monthKey={selectedMonth} onMonthChange={setSelectedMonth} />
          {!isCurrentMonth && (
            <button
              onClick={() => setSelectedMonth(currentMonth)}
              className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
              חודש נוכחי
            </button>
          )}
        </div>

        {isLoading ? (
          <BudgetLoadingPlayer />
        ) : !budgetData || budgetData.budgets.length === 0 ? (
          /* Empty state */
          <div className="space-y-6">
            <CopyBudgetButton
              fromMonth={previousMonth.month}
              fromYear={previousMonth.year}
              toMonth={month}
              toYear={year}
              onCopy={handleCopyFromPrevious}
            />

            <div className="text-center">
              <button
                onClick={() => openAddModal()}
                className="btn-primary flex items-center gap-2 mx-auto px-6 py-3"
              >
                <Plus className="w-5 h-5" strokeWidth={1.75} />
                הוסף קטגוריה לתקציב
              </button>
            </div>

            {/* Show unbudgeted even when no budgets defined */}
            {budgetData && budgetData.unbudgetedExpenses.length > 0 && (
              <UnbudgetedExpenses
                expenses={budgetData.unbudgetedExpenses}
                getCategoryInfo={resolveCategoryInfo}
                onAddBudget={(catId) => openAddModal(catId)}
              />
            )}
          </div>
        ) : (
          /* Budget content */
          <div className="space-y-6">
            {/* Overview animation (plays once on first load) */}
            {showOverviewAnimation && overviewAnimationData && (
              <div className="flex justify-center">
                <BudgetOverviewPlayer
                  data={overviewAnimationData}
                  onAnimationEnd={() => setShowOverviewAnimation(false)}
                />
              </div>
            )}

            {/* Summary cards */}
            <BudgetSummaryCards
              totalBudget={budgetData.totalBudget}
              totalSpent={budgetData.totalSpent}
              totalRemaining={budgetData.totalRemaining}
              overallPercentage={budgetData.overallPercentage}
            />

            {/* Global progress */}
            <div
              className="rounded-3xl p-6"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              }}
            >
              <BudgetProgressBar
                percentage={budgetData.overallPercentage}
                height={6}
                showLabel
              />
            </div>

            {/* Category list */}
            <div
              className="rounded-3xl p-6"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  style={{
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    fontWeight: 700,
                    fontSize: '18px',
                    color: '#303150',
                  }}
                >
                  פירוט לפי קטגוריות
                </h3>
                <button
                  onClick={() => openAddModal()}
                  className="btn-secondary flex items-center gap-1.5 text-sm"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                  הוסף
                </button>
              </div>

              <div className="divide-y divide-[#F7F7F8]">
                {sortedBudgets.map((budget, index) => (
                  <BudgetCategoryRow
                    key={budget.id}
                    categoryInfo={resolveCategoryInfo(budget.categoryId)}
                    categoryId={budget.categoryId}
                    budgetAmount={budget.amount}
                    spent={budget.spent}
                    remaining={budget.remaining}
                    percentage={budget.percentage}
                    onEdit={() => openEditModal(budget.categoryId, budget.amount)}
                    onDelete={() => handleDeleteBudget(budget.id)}
                    animationDelay={index * 60}
                  />
                ))}
              </div>
            </div>

            {/* Unbudgeted expenses */}
            {budgetData.unbudgetedExpenses.length > 0 && (
              <UnbudgetedExpenses
                expenses={budgetData.unbudgetedExpenses}
                getCategoryInfo={resolveCategoryInfo}
                onAddBudget={(catId) => openAddModal(catId)}
              />
            )}
          </div>
        )}
      </div>

      {/* Add/Edit budget modal */}
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

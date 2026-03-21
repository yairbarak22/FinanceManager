'use client';

import { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { DashboardSkeleton } from '@/components/dashboard';
import TransactionModal from '@/components/modals/TransactionModal';
import RecurringModal from '@/components/modals/RecurringModal';
import AssetModal from '@/components/modals/AssetModal';
import LiabilityModal from '@/components/modals/LiabilityModal';
import LiabilityTypeSelectionModal from '@/components/modals/LiabilityTypeSelectionModal';
import GemachFormModal from '@/components/modals/GemachFormModal';
import MortgageModal from '@/components/modals/MortgageModal';
import AmortizationModal from '@/components/modals/AmortizationModal';
import QuickStartModal from '@/components/modals/QuickStartModal';
import NewUserOnboardingModal from '@/components/modals/NewUserOnboardingModal';
import DocumentsModal from '@/components/modals/DocumentsModal';
import { QuickAddModal } from '@/components/quick-add';
import MaaserCalculatorModal from '@/components/modals/MaaserCalculatorModal';
import {
  Transaction,
  RecurringTransaction,
  Asset,
  Liability,
  MonthlySummary as MonthlySummaryType,
} from '@/lib/types';
import { getMonthKey, calculateSavingsRate, apiFetch, isRecurringActiveInMonth, getAmountInILS, isInFinancialMonth, getFinancialMonthKey } from '@/lib/utils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { getEffectiveMonthlyExpense, getRemainingBalance, isLiabilityActiveInCashFlow } from '@/lib/loanCalculations';
import { getTotalAssetsForMonth } from '@/lib/assetUtils';
import { useCategories } from '@/hooks/useCategories';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToast } from '@/hooks/useToast';
import { useOnboarding } from '@/context/OnboardingContext';
import { useMonth } from '@/context/MonthContext';
import { useSession } from 'next-auth/react';
import ToastContainer from '@/components/ui/Toast';
import {
  expenseCategories as defaultExpenseCategories,
  incomeCategories as defaultIncomeCategories,
  assetCategories as defaultAssetCategories,
  liabilityTypes as defaultLiabilityTypes,
} from '@/lib/categories';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DEFAULT_DASHBOARD_CONFIG } from '@/types/dashboardConfig';
import { renderDashboardSection, type DashboardSectionPropsBundles } from '@/components/dashboard/sections/sectionRenderer';
import { PeriodicReportTrigger } from '@/components/PeriodicReportModal';

export default function DashboardPage() {
  // Use shared month context
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    setMonthsWithData,
    currentMonth,
    customDateRange,
    financialMonthStartDay,
  } = useMonth();
  
  const { rate: exchangeRate } = useExchangeRate();

  // React Query-backed data (selective invalidation per resource)
  const {
    transactions,
    recurringTransactions,
    assets,
    assetHistory,
    liabilities,
    netWorthHistory,
    portfolioAnalysis,
    portfolioHistory,
    isPortfolioLoading,
    portfolioError,
    financialGoals,
    isGoalsLoading,
    goalsError,
    budgetSummary,
    isBudgetLoading,
    budgetError,
    budgetMonth,
    budgetYear,
    dashboardLayout,
    isLoading,
    refetchTransactions,
    refetchRecurring,
    refetchAssets,
    refetchLiabilities,
    setLiabilitiesOptimistic,
  } = useDashboardData();

  // Local modal state (for modals with edit data)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);

  const [isLiabilityTypeSelectionOpen, setIsLiabilityTypeSelectionOpen] = useState(false);
  const [isGemachFormOpen, setIsGemachFormOpen] = useState(false);
  const [isMortgageModalOpen, setIsMortgageModalOpen] = useState(false);
  const [isMaaserModalOpen, setIsMaaserModalOpen] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);

  // Edit state
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [editingMortgage, setEditingMortgage] = useState<Liability | null>(null);

  // Amortization modal state
  const [isAmortizationModalOpen, setIsAmortizationModalOpen] = useState(false);
  const [viewingLiability, setViewingLiability] = useState<Liability | null>(null);

  // Documents modal state
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [documentsEntity, setDocumentsEntity] = useState<{
    type: 'asset' | 'liability';
    id: string;
    name: string;
  } | null>(null);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Section refs for scrolling
  const transactionsRef = useRef<HTMLDivElement>(null);
  const recurringRef = useRef<HTMLDivElement>(null);
  const assetsRef = useRef<HTMLDivElement>(null);
  const liabilitiesRef = useRef<HTMLDivElement>(null);

  // Categories hook
  const { getCustomByType, addCustomCategory, updateCustomCategory, deleteCustomCategory, customCategories: rawCustomCategories, isHaredi } = useCategories();

  // Delete a custom category - type is passed directly from CategorySelect
  const handleDeleteCategory = useCallback(async (categoryId: string, type: string) => {
    await deleteCustomCategory(categoryId, type as 'expense' | 'income' | 'asset' | 'liability');
  }, [deleteCustomCategory]);

  // Analytics hook
  const analytics = useAnalytics();

  // Toast notifications
  const toast = useToast();

  // Onboarding
  const { startTour, startHarediTour, isWizardOpen, endTour } = useOnboarding();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  // Memoized categories
  const expenseCats = useMemo(() => ({
    default: defaultExpenseCategories,
    custom: getCustomByType('expense'),
  }), [getCustomByType]);

  const incomeCats = useMemo(() => ({
    default: defaultIncomeCategories,
    custom: getCustomByType('income'),
  }), [getCustomByType]);

  const assetCats = useMemo(() => ({
    default: defaultAssetCategories,
    custom: getCustomByType('asset'),
  }), [getCustomByType]);

  const liabilityCats = useMemo(() => ({
    default: defaultLiabilityTypes,
    custom: getCustomByType('liability'),
  }), [getCustomByType]);

  // Recalculate monthsWithData when transactions or financialMonthStartDay change
  useEffect(() => {
    if (transactions.length === 0) return;
    const dataMonths = new Set<string>();
    transactions.forEach((tx) => {
      dataMonths.add(getFinancialMonthKey(tx.date, financialMonthStartDay));
    });
    setMonthsWithData(dataMonths);
  }, [transactions, financialMonthStartDay, setMonthsWithData]);

  // ============================================================
  // Onboarding modal handlers — called when user picks an option
  // ============================================================

  const handleOnboardingImport = useCallback(async () => {
    await endTour();
    router.push('/workspace');
  }, [endTour, router]);

  const handleOnboardingGoals = useCallback(async () => {
    await endTour();
    router.push('/goals');
  }, [endTour, router]);

  const handleOnboardingCourses = useCallback(async () => {
    await endTour();
    router.push('/courses');
  }, [endTour, router]);

  const handleOnboardingAddAsset = useCallback(async () => {
    await endTour();
    setEditingAsset(null);
    setIsAssetModalOpen(true);
  }, [endTour]);

  const handleOnboardingAddLiability = useCallback(async () => {
    await endTour();
    setIsLiabilityTypeSelectionOpen(true);
  }, [endTour]);

  const handleOnboardingClose = useCallback(async () => {
    await endTour();
  }, [endTour]);

  // Check onboarding
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || isLoading || hasCheckedOnboarding) return;

    const checkOnboarding = async () => {
      try {
        const res = await apiFetch('/api/user/onboarding');
        if (res.ok) {
          const data = await res.json();
          if (!data.hasSeenOnboarding) {
            // Track Sign Up event for new users entering onboarding
            analytics.trackSignUp('google');
            // Check if user is Haredi (signupSource === 'prog')
            if (data.signupSource === 'prog') {
              startHarediTour();
            } else {
              startTour();
            }
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setHasCheckedOnboarding(true);
      }
    };

    checkOnboarding();
  }, [sessionStatus, isLoading, hasCheckedOnboarding, startTour, startHarediTour]);

  // Show quickstart modal once per login session
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !isLoading) {
      const shown = sessionStorage.getItem('qs_shown');
      if (!shown) {
        setShowQuickStart(true);
        sessionStorage.setItem('qs_shown', '1');
      }
    }
  }, [sessionStatus, isLoading]);

  // Calculate recurring totals - filter by activeMonths for the selected month
  const effectiveMonth = selectedMonth === 'all' || selectedMonth === 'custom' ? currentMonth : selectedMonth;
  const fixedIncome = recurringTransactions
    .filter((t) => t.type === 'income' && isRecurringActiveInMonth(t, effectiveMonth))
    .reduce((sum, t) => sum + getAmountInILS(t.amount, t.currency || 'ILS', exchangeRate), 0);

  const fixedExpenses = recurringTransactions
    .filter((t) => t.type === 'expense' && isRecurringActiveInMonth(t, effectiveMonth))
    .reduce((sum, t) => sum + getAmountInILS(t.amount, t.currency || 'ILS', exchangeRate), 0);

  const monthlyLiabilityPayments = liabilities
    .filter((l) => isLiabilityActiveInCashFlow(l))
    .reduce((sum, l) => sum + getAmountInILS(getEffectiveMonthlyExpense(l), l.currency || 'ILS', exchangeRate), 0);

  // Calculate totals - filter by month or custom date range (for summaries)
  const monthFilteredTransactions = selectedMonth === 'custom' && customDateRange
    ? transactions.filter((tx) => {
        const txDate = tx.date.split('T')[0]; // YYYY-MM-DD
        return txDate >= customDateRange.start && txDate <= customDateRange.end;
      })
    : selectedMonth === 'all'
      ? transactions
      : transactions.filter((tx) => isInFinancialMonth(tx.date, selectedMonth, financialMonthStartDay));

  // Filter by category as well (for display in Activity section)
  const filteredTransactions = monthFilteredTransactions.filter((tx) => {
    const matchesCategory = !selectedCategory || tx.category === selectedCategory;
    return matchesCategory;
  });

  // Category filter handlers
  const handleCategoryClick = useCallback((category: string) => {
    setSelectedCategory(prev => prev === category ? null : category);
  }, []);

  const handleClearCategoryFilter = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  // Calculate months count for recurring transactions multiplication
  const monthsCount = selectedMonth === 'custom' && customDateRange
    ? (() => {
        const start = new Date(customDateRange.start);
        const end = new Date(customDateRange.end);
        // Calculate how many unique months the range spans
        const uniqueMonths = new Set<string>();
        const cursor = new Date(start);
        while (cursor <= end) {
          uniqueMonths.add(getMonthKey(cursor));
          cursor.setDate(cursor.getDate() + 1);
        }
        return Math.max(uniqueMonths.size, 1);
      })()
    : selectedMonth === 'all' ? Math.max(monthsWithData.size, 1) : 1;

  const transactionIncome = monthFilteredTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + getAmountInILS(tx.amount, tx.currency || 'ILS', exchangeRate), 0);

  const transactionExpenses = monthFilteredTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + getAmountInILS(tx.amount, tx.currency || 'ILS', exchangeRate), 0);

  const totalIncome = transactionIncome + (fixedIncome * monthsCount);
  const totalExpenses = transactionExpenses + ((fixedExpenses + monthlyLiabilityPayments) * monthsCount);
  const totalBalance = totalIncome - totalExpenses;

  const totalAssets = getTotalAssetsForMonth(assets, assetHistory, selectedMonth === 'custom' ? 'all' : selectedMonth);
  const selectedMonthDate = selectedMonth === 'all' || selectedMonth === 'custom'
    ? new Date()
    : new Date(selectedMonth + '-01');
  const totalLiabilities = liabilities.reduce((sum, l) => sum + getRemainingBalance(l, selectedMonthDate), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Calculate monthly summaries
  const monthsWithDataArray = Array.from(monthsWithData).sort().reverse();
  const monthlySummaries: MonthlySummaryType[] = monthsWithDataArray.map((monthKey) => {
    const [year, month] = monthKey.split('-');
    const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthTransactions = transactions.filter((tx) => isInFinancialMonth(tx.date, monthKey, financialMonthStartDay));

    const txIncome = monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + getAmountInILS(tx.amount, tx.currency || 'ILS', exchangeRate), 0);
    const txExpenses = monthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + getAmountInILS(tx.amount, tx.currency || 'ILS', exchangeRate), 0);

    const monthlyLiabilityPaymentsForMonth = liabilities
      .filter((l) => isLiabilityActiveInCashFlow(l, monthDate))
      .reduce((sum, l) => sum + getAmountInILS(getEffectiveMonthlyExpense(l, monthDate), l.currency || 'ILS', exchangeRate), 0);

    const income = txIncome + fixedIncome;
    const expenses = txExpenses + fixedExpenses + monthlyLiabilityPaymentsForMonth;

    return {
      month,
      year: parseInt(year),
      income,
      expenses,
      balance: income - expenses,
      transactionCount: monthTransactions.length,
      savingsRate: calculateSavingsRate(income, expenses),
    };
  });

  // Monthly cashflow
  const monthlyCashflow = totalIncome - totalExpenses;

  // Calculate previous month values for comparison
  const previousMonthData = useMemo(() => {
    if (selectedMonth === 'all' || selectedMonth === 'custom') {
      return { income: undefined, expenses: undefined, cashflow: undefined };
    }
    
    // Find the previous month
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // month - 1 (0-indexed) - 1 (previous)
    const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Find the previous month in monthlySummaries
    const prevMonthSummary = monthlySummaries.find(
      (s) => `${s.year}-${String(s.month).padStart(2, '0')}` === prevMonthKey
    );
    
    if (!prevMonthSummary) {
      return { income: undefined, expenses: undefined, cashflow: undefined };
    }
    
    return {
      income: prevMonthSummary.income,
      expenses: prevMonthSummary.expenses,
      cashflow: prevMonthSummary.balance,
    };
  }, [selectedMonth, monthlySummaries]);

  // Transaction handlers
  const handleAddTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await apiFetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add transaction');
      }
      refetchTransactions();
      toast.success('העסקה נוספה בהצלחה');
      analytics.trackAddTransaction(data.type, data.category, data.amount);
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בהוספת עסקה');
    }
  }, [refetchTransactions, toast, analytics]);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      refetchTransactions();
      toast.success('העסקה נמחקה');
      analytics.trackDeleteTransaction();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('שגיאה במחיקת עסקה');
    }
  }, [refetchTransactions, toast, analytics]);

  const handleDeleteMultipleTransactions = useCallback(async (ids: string[]) => {
    try {
      const results = await Promise.all(
        ids.map(id => apiFetch(`/api/transactions/${id}`, { method: 'DELETE' }))
      );

      const failedCount = results.filter(r => !r.ok).length;
      refetchTransactions();

      if (failedCount === 0) {
        toast.success(`${ids.length} עסקאות נמחקו בהצלחה`);
      } else {
        toast.error(`${failedCount} עסקאות נכשלו במחיקה`);
      }
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast.error('שגיאה במחיקת עסקאות');
    }
  }, [refetchTransactions, toast]);

  const handleBulkUpdateCategory = useCallback(async (ids: string[], category: string) => {
    try {
      const res = await apiFetch('/api/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: ids, category }),
      });
      if (!res.ok) throw new Error('Failed to bulk update');
      const data = await res.json();
      refetchTransactions();
      toast.success(`${data.updatedCount} עסקאות עודכנו בהצלחה`);
    } catch (error) {
      console.error('Error bulk updating transactions:', error);
      toast.error('שגיאה בעדכון עסקאות');
      throw error;
    }
  }, [refetchTransactions, toast]);

  const handleUpdateTransaction = useCallback(async (
    transactionId: string,
    newCategory: string,
    merchantName: string,
    saveBehavior: 'once' | 'always' | 'alwaysAsk',
    newDescription?: string,
    newAmount?: number,
    updateExistingTransactions?: boolean,
    newDate?: string,
    needsDetailsReview?: boolean
  ) => {
    try {
      const updateBody: Record<string, unknown> = { 
        category: newCategory,
        updateExistingTransactions,
        merchantName,
      };
      if (newDescription !== undefined) {
        updateBody.description = newDescription;
      }
      if (newAmount !== undefined) {
        updateBody.amount = newAmount;
      }
      if (newDate !== undefined) {
        updateBody.date = newDate;
      }
      if (needsDetailsReview !== undefined) {
        updateBody.needsDetailsReview = needsDetailsReview;
      }

      const res = await apiFetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      });

      if (!res.ok) throw new Error('Failed to update transaction');
      
      const responseData = await res.json();

      if (saveBehavior !== 'once') {
        await apiFetch('/api/merchant-category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantName,
            category: saveBehavior === 'always' ? newCategory : '',
            alwaysAsk: saveBehavior === 'alwaysAsk',
          }),
        });
      }

      refetchTransactions();
      analytics.trackEditTransaction();

      if (responseData.updatedTransactionsCount > 0) {
        toast.success(`העסקה עודכנה ו-${responseData.updatedTransactionsCount} עסקאות נוספות עודכנו`);
      } else if (saveBehavior === 'once') {
        toast.success('העסקה עודכנה');
      } else if (saveBehavior === 'always') {
        toast.success('העסקה עודכנה ותישמר לפעמים הבאות');
      } else {
        toast.success('העסקה עודכנה, תישאל שוב בפעם הבאה');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('שגיאה בעדכון עסקה');
      throw error;
    }
  }, [refetchTransactions, toast, analytics]);

  // Recurring transaction handlers
  const handleAddRecurring = async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const isNewRecurring = !editingRecurring;

    try {
      const url = editingRecurring
        ? `/api/recurring/${editingRecurring.id}`
        : '/api/recurring';
      const method = editingRecurring ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save');
      }
      setEditingRecurring(null);
      refetchRecurring();
      toast.success(isNewRecurring ? 'העסקה הקבועה נוספה' : 'העסקה הקבועה עודכנה');
      if (isNewRecurring) {
        analytics.trackAddRecurring(data.type, data.category, data.amount);
      }
    } catch (error) {
      console.error('Error saving recurring transaction:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת עסקה קבועה');
      throw error; // Re-throw to let the modal know about the error
    }
  };

  const handleToggleRecurring = useCallback(async (id: string, isActive: boolean) => {
    try {
      const res = await apiFetch(`/api/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      refetchRecurring();
    } catch (error) {
      console.error('Error toggling recurring transaction:', error);
      toast.error('שגיאה בעדכון סטטוס');
    }
  }, [refetchRecurring, toast]);

  const handleDeleteRecurring = useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`/api/recurring/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      refetchRecurring();
      toast.success('העסקה הקבועה נמחקה');
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      toast.error('שגיאה במחיקה');
    }
  }, [refetchRecurring, toast]);

  // Asset handlers
  const handleAddAsset = async (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    const isNewAsset = !editingAsset;

    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : '/api/assets';
      const method = editingAsset ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save');
      }
      setEditingAsset(null);
      refetchAssets();
      toast.success(isNewAsset ? 'הנכס נוסף בהצלחה' : 'הנכס עודכן');
      if (isNewAsset) {
        analytics.trackAddAsset(data.category, data.value);
      }
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת נכס');
    }
  };

  const handleDeleteAsset = useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`/api/assets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      refetchAssets();
      toast.success('הנכס נמחק');
      analytics.trackDeleteAsset();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('שגיאה במחיקת נכס');
    }
  }, [refetchAssets, toast, analytics]);

  // Liability handlers
  const handleAddMortgage = async (data: Record<string, unknown>) => {
    const isEdit = !!editingMortgage;
    try {
      const url = isEdit ? `/api/liabilities/${editingMortgage!.id}` : '/api/liabilities';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save mortgage');
      }
      setEditingMortgage(null);
      refetchLiabilities();
      toast.success(isEdit ? 'המשכנתא עודכנה בהצלחה' : 'המשכנתא נוספה בהצלחה');
    } catch (error) {
      console.error('Error saving mortgage:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת משכנתא');
    }
  };

  const handleAddLiability = async (data: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>) => {
    const isNewLiability = !editingLiability;

    try {
      const url = editingLiability
        ? `/api/liabilities/${editingLiability.id}`
        : '/api/liabilities';
      const method = editingLiability ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save');
      }
      setEditingLiability(null);
      refetchLiabilities();
      toast.success(isNewLiability ? 'ההתחייבות נוספה' : 'ההתחייבות עודכנה');
      if (isNewLiability) {
        analytics.trackAddLiability(data.type, data.totalAmount);
      }
    } catch (error) {
      console.error('Error saving liability:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת התחייבות');
    }
  };

  const handleDeleteLiability = useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`/api/liabilities/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      refetchLiabilities();
      toast.success('ההתחייבות נמחקה');
      analytics.trackDeleteLiability();
    } catch (error) {
      console.error('Error deleting liability:', error);
      toast.error('שגיאה במחיקה');
    }
  }, [refetchLiabilities, toast, analytics]);

  // Gemach Plan handler
  const handleCreateGemach = async (data: {
    name: string;
    monthlyDeposit: number;
    totalMonths: number;
    monthsAlreadyPaid: number;
  }) => {
    try {
      const res = await apiFetch('/api/gemach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create gemach plan');
      }
      refetchLiabilities();
      toast.success('תוכנית גמ"ח נוצרה בהצלחה');
    } catch (error) {
      console.error('Error creating gemach plan:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה ביצירת תוכנית גמ"ח');
      throw error;
    }
  };

  // Optimistic toggle for cash flow inclusion
  const handleToggleLiabilityCashFlow = useCallback((id: string, isActive: boolean) => {
    setLiabilitiesOptimistic((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActiveInCashFlow: isActive } : l))
    );
  }, [setLiabilitiesOptimistic]);

  const layoutConfig = dashboardLayout ?? DEFAULT_DASHBOARD_CONFIG;

  const sectionPropsBundles = useMemo<DashboardSectionPropsBundles>(() => ({
    financial_status: {
      netWorth,
      totalAssets,
      totalLiabilities,
      totalIncome,
      totalExpenses,
      fixedIncome,
      fixedExpenses,
      monthlyLiabilityPayments,
      netWorthHistory,
      assets,
    },
    cash_flow: {
      totalIncome,
      totalExpenses,
      monthlyCashflow,
      previousMonthIncome: previousMonthData.income,
      previousMonthExpenses: previousMonthData.expenses,
      previousMonthCashflow: previousMonthData.cashflow,
    },
    activity: {
      monthFilteredTransactions,
      filteredTransactions,
      recurringTransactions,
      customExpenseCategories: expenseCats.custom,
      customIncomeCategories: incomeCats.custom,
      selectedCategory,
      onCategoryClick: handleCategoryClick,
      onClearCategoryFilter: handleClearCategoryFilter,
      effectiveMonth,
      transactionsRef,
      onDelete: handleDeleteTransaction,
      onDeleteMultiple: handleDeleteMultipleTransactions,
      onUpdateTransaction: handleUpdateTransaction,
      onBulkUpdateCategory: handleBulkUpdateCategory,
      onNewTransaction: () => setIsTransactionModalOpen(true),
      onSaveTransaction: async (data) => {
        await handleAddTransaction({
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date,
        });
      },
      onImport: () => router.push('/workspace'),
      onOpenMaaserCalculator: () => setIsMaaserModalOpen(true),
      onIvrSetupSuccess: () => toast.success('מוכן לשיחה! המספר שלך אומת במערכת. נסה לחייג אלינו עכשיו.'),
      onAddCategory: addCustomCategory,
      onDeleteCategory: handleDeleteCategory,
      onEditRecurring: (r) => {
        setEditingRecurring(r);
        setIsRecurringModalOpen(true);
      },
    },
    portfolio: {
      assets,
      selectedMonth,
      assetHistory,
      liabilities,
      recurringTransactions,
      customExpenseCategories: expenseCats.custom,
      customIncomeCategories: incomeCats.custom,
      isHaredi,
      assetsRef,
      liabilitiesRef,
      recurringRef,
      onAddAsset: () => {
        setEditingAsset(null);
        setIsAssetModalOpen(true);
      },
      onEditAsset: (asset) => {
        setEditingAsset(asset);
        setIsAssetModalOpen(true);
      },
      onDeleteAsset: handleDeleteAsset,
      onViewAssetDocuments: (asset) => {
        setDocumentsEntity({ type: 'asset', id: asset.id, name: asset.name });
        setIsDocumentsModalOpen(true);
      },
      onAddLiability: () => {
        setEditingLiability(null);
        if (isHaredi) {
          setIsLiabilityTypeSelectionOpen(true);
        } else {
          setIsLiabilityModalOpen(true);
        }
      },
      onEditLiability: (liability) => {
        if (liability.isMortgage) {
          setEditingMortgage(liability);
          setIsMortgageModalOpen(true);
        } else {
          setEditingLiability(liability);
          setIsLiabilityModalOpen(true);
        }
      },
      onDeleteLiability: handleDeleteLiability,
      onToggleLiabilityCashFlow: handleToggleLiabilityCashFlow,
      onViewAmortization: (liability) => {
        setViewingLiability(liability);
        setIsAmortizationModalOpen(true);
      },
      onViewLiabilityDocuments: (liability) => {
        setDocumentsEntity({ type: 'liability', id: liability.id, name: liability.name });
        setIsDocumentsModalOpen(true);
      },
      onAddRecurring: () => {
        setEditingRecurring(null);
        setIsRecurringModalOpen(true);
      },
      onEditRecurring: (tx) => {
        setEditingRecurring(tx);
        setIsRecurringModalOpen(true);
      },
      onDeleteRecurring: handleDeleteRecurring,
      onToggleRecurring: handleToggleRecurring,
    },
    trends: {
      monthlySummaries,
      totalIncome,
      totalExpenses,
      totalBalance,
    },
    investment_portfolio: {
      portfolioAnalysis,
      portfolioHistory,
      isLoading: isPortfolioLoading,
      error: portfolioError,
    },
    goals: {
      financialGoals,
      isLoading: isGoalsLoading,
      error: goalsError,
    },
    budgets: {
      budgetSummary,
      isLoading: isBudgetLoading,
      error: budgetError,
      customExpenseCategories: expenseCats.custom,
      month: budgetMonth,
      year: budgetYear,
    },
  }), [
    netWorth, totalAssets, totalLiabilities, totalIncome, totalExpenses,
    fixedIncome, fixedExpenses, monthlyLiabilityPayments, netWorthHistory, assets,
    monthlyCashflow, previousMonthData,
    monthFilteredTransactions, filteredTransactions, recurringTransactions,
    expenseCats.custom, incomeCats.custom, selectedCategory,
    handleCategoryClick, handleClearCategoryFilter, effectiveMonth, transactionsRef,
    handleDeleteTransaction, handleDeleteMultipleTransactions,
    handleUpdateTransaction, handleBulkUpdateCategory,
    handleAddTransaction, router, toast,
    addCustomCategory, handleDeleteCategory,
    selectedMonth, assetHistory, liabilities, isHaredi,
    assetsRef, liabilitiesRef, recurringRef,
    handleDeleteAsset, handleDeleteLiability, handleToggleLiabilityCashFlow,
    handleDeleteRecurring, handleToggleRecurring,
    monthlySummaries, totalBalance,
    portfolioAnalysis, portfolioHistory, isPortfolioLoading, portfolioError,
    financialGoals, isGoalsLoading, goalsError,
    budgetSummary, isBudgetLoading, budgetError, budgetMonth, budgetYear,
  ]);

  return (
    <AppLayout
      pageTitle="דשבורד"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showQuickAddFab={true}
      showMonthFilter={true}
    >
      <div className="flex items-center justify-end gap-4 mb-6">
        <PeriodicReportTrigger />
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-12 pb-12">
          {[...layoutConfig]
            .filter((s) => s.isVisible)
            .sort((a, b) => a.order - b.order)
            .map((cfg) => (
              <Fragment key={cfg.id}>
                {renderDashboardSection(cfg.id, sectionPropsBundles)}
              </Fragment>
            ))}
        </div>
      )}

      {/* MODALS - Always rendered regardless of loading state */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleAddTransaction}
        expenseCategories={expenseCats}
        incomeCategories={incomeCats}
        onAddCategory={addCustomCategory}
        customCategoriesRaw={[
          ...rawCustomCategories.expense.map(c => ({ ...c, type: 'expense' as const, icon: c.icon ?? undefined, color: c.color ?? undefined })),
          ...rawCustomCategories.income.map(c => ({ ...c, type: 'income' as const, icon: c.icon ?? undefined, color: c.color ?? undefined })),
        ]}
        onUpdateCategory={(updated) => updateCustomCategory(updated.id, updated.type as 'expense' | 'income' | 'asset' | 'liability', updated.isMaaserEligible ?? false)}
        onDeleteCategory={handleDeleteCategory}
      />

      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setEditingRecurring(null);
        }}
        onSave={handleAddRecurring}
        transaction={editingRecurring}
        expenseCategories={expenseCats}
        incomeCategories={incomeCats}
        onAddCategory={addCustomCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => {
          setIsAssetModalOpen(false);
          setEditingAsset(null);
        }}
        onSave={handleAddAsset}
        asset={editingAsset}
        assetCategories={assetCats}
        onAddCategory={(name) => addCustomCategory(name, 'asset')}
        onDeleteCategory={handleDeleteCategory}
      />

      <LiabilityModal
        isOpen={isLiabilityModalOpen}
        onClose={() => {
          setIsLiabilityModalOpen(false);
          setEditingLiability(null);
        }}
        onSave={handleAddLiability}
        liability={editingLiability}
        liabilityTypes={liabilityCats}
        onAddCategory={(name) => addCustomCategory(name, 'liability')}
        onDeleteCategory={handleDeleteCategory}
      />

      <LiabilityTypeSelectionModal
        isOpen={isLiabilityTypeSelectionOpen}
        onClose={() => setIsLiabilityTypeSelectionOpen(false)}
        onSelectLoan={() => {
          setEditingLiability(null);
          setIsLiabilityModalOpen(true);
        }}
        onSelectMortgage={() => {
          setIsMortgageModalOpen(true);
        }}
        onSelectGemach={() => {
          setIsGemachFormOpen(true);
        }}
      />

      <MortgageModal
        isOpen={isMortgageModalOpen}
        onClose={() => {
          setIsMortgageModalOpen(false);
          setEditingMortgage(null);
        }}
        onSave={handleAddMortgage}
        mortgage={editingMortgage}
      />

      <GemachFormModal
        isOpen={isGemachFormOpen}
        onClose={() => setIsGemachFormOpen(false)}
        onSave={handleCreateGemach}
      />

      <AmortizationModal
        isOpen={isAmortizationModalOpen}
        onClose={() => {
          setIsAmortizationModalOpen(false);
          setViewingLiability(null);
        }}
        liability={viewingLiability}
      />

      {documentsEntity && (
        <DocumentsModal
          isOpen={isDocumentsModalOpen}
          onClose={() => {
            setIsDocumentsModalOpen(false);
            setDocumentsEntity(null);
          }}
          entityType={documentsEntity.type}
          entityId={documentsEntity.id}
          entityName={documentsEntity.name}
        />
      )}

      <QuickAddModal
        expenseCategories={expenseCats}
        incomeCategories={incomeCats}
        assetCategories={assetCats}
        liabilityCategories={liabilityCats}
        onSaveTransaction={async (data) => {
          await handleAddTransaction({
            type: data.type,
            amount: data.amount,
            category: data.category,
            description: data.description,
            date: data.date,
          });
        }}
        onSaveAsset={async (data) => {
          await handleAddAsset({
            name: data.name,
            category: data.category,
            value: data.value,
          });
        }}
        onSaveLiability={async (data) => {
          // Calculate loan term based on total amount and monthly payment
          const loanTermMonths = data.monthlyPayment > 0 
            ? Math.ceil(data.totalAmount / data.monthlyPayment)
            : 12;
          
          await handleAddLiability({
            name: data.name,
            type: data.type,
            totalAmount: data.totalAmount,
            monthlyPayment: data.monthlyPayment,
            interestRate: data.interestRate ?? 0,
            startDate: data.startDate,
            loanTermMonths,
            loanMethod: 'spitzer',
            hasInterestRebate: false,
          });
        }}
        onAddCategory={addCustomCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <MaaserCalculatorModal
        isOpen={isMaaserModalOpen}
        onClose={() => setIsMaaserModalOpen(false)}
        transactions={transactions}
        recurringTransactions={recurringTransactions}
        selectedMonth={selectedMonth === 'all' || selectedMonth === 'custom' ? currentMonth : selectedMonth}
        customCategories={[
          ...rawCustomCategories.expense.map(c => ({ ...c, type: 'expense' as const, icon: c.icon ?? undefined, color: c.color ?? undefined })),
          ...rawCustomCategories.income.map(c => ({ ...c, type: 'income' as const, icon: c.icon ?? undefined, color: c.color ?? undefined })),
        ]}
      />

      <QuickStartModal
        isOpen={showQuickStart}
        onClose={() => setShowQuickStart(false)}
        onImport={() => router.push('/workspace')}
      />

      <NewUserOnboardingModal
        isOpen={isWizardOpen}
        onClose={handleOnboardingClose}
        onImport={handleOnboardingImport}
        onGoals={handleOnboardingGoals}
        onCourses={handleOnboardingCourses}
        onAddAsset={handleOnboardingAddAsset}
        onAddLiability={handleOnboardingAddLiability}
      />

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </AppLayout>
  );
}

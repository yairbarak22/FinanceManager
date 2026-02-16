'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { 
  SectionHeader, 
  NetWorthHeroCard, 
  MonthlySummaryCards,
  PortfolioList
} from '@/components/dashboard';
import AssetAllocationChart from '@/components/AssetAllocationChart';
import AssetsSection from '@/components/AssetsSection';
import LiabilitiesSection from '@/components/LiabilitiesSection';
import RecurringTransactions from '@/components/RecurringTransactions';
import MonthlyTrendsCharts from '@/components/MonthlyTrendsCharts';
import MonthlySummary from '@/components/MonthlySummary';
import ExpensesPieChart from '@/components/ExpensesPieChart';
import RecentTransactions from '@/components/RecentTransactions';
import TransactionModal from '@/components/modals/TransactionModal';
import RecurringModal from '@/components/modals/RecurringModal';
import AssetModal from '@/components/modals/AssetModal';
import LiabilityModal from '@/components/modals/LiabilityModal';
import AmortizationModal from '@/components/modals/AmortizationModal';
import ImportModal from '@/components/modals/ImportModal';
import DocumentsModal from '@/components/modals/DocumentsModal';
import ProfileModal from '@/components/ProfileModal';
import AccountSettings from '@/components/AccountSettings';
import { QuickAddModal } from '@/components/quick-add';
import {
  Transaction,
  RecurringTransaction,
  Asset,
  AssetValueHistory,
  Liability,
  NetWorthHistory,
  MonthlySummary as MonthlySummaryType,
} from '@/lib/types';
import { getMonthKey, calculateSavingsRate, apiFetch } from '@/lib/utils';
import { getEffectiveMonthlyExpense, getRemainingBalance } from '@/lib/loanCalculations';
import { getTotalAssetsForMonth } from '@/lib/assetUtils';
import { useCategories } from '@/hooks/useCategories';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToast } from '@/hooks/useToast';
import { useOnboarding } from '@/context/OnboardingContext';
import { useMonth } from '@/context/MonthContext';
import { useModal } from '@/context/ModalContext';
import { useSession } from 'next-auth/react';
import ToastContainer from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import {
  expenseCategories as defaultExpenseCategories,
  incomeCategories as defaultIncomeCategories,
  assetCategories as defaultAssetCategories,
  liabilityTypes as defaultLiabilityTypes,
} from '@/lib/categories';

export default function DashboardPage() {
  // Use shared month context
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    setMonthsWithData,
    currentMonth,
  } = useMonth();
  
  // Use shared modal context
  const { openModal, isModalOpen, closeModal } = useModal();

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetHistory, setAssetHistory] = useState<AssetValueHistory[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthHistory[]>([]);

  // Local modal state (for modals with edit data)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Edit state
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

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

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Section refs for scrolling
  const transactionsRef = useRef<HTMLDivElement>(null);
  const recurringRef = useRef<HTMLDivElement>(null);
  const assetsRef = useRef<HTMLDivElement>(null);
  const liabilitiesRef = useRef<HTMLDivElement>(null);

  // Categories hook
  const { getCustomByType, addCustomCategory } = useCategories();

  // Analytics hook
  const analytics = useAnalytics();

  // Toast notifications
  const toast = useToast();

  // Onboarding
  const { startTour, startHarediTour } = useOnboarding();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
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

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [txRes, recRes, assetsRes, liabRes, detailedHistoryRes, netWorthHistoryRes] = await Promise.all([
        apiFetch('/api/transactions', { cache: 'no-store' }),
        apiFetch('/api/recurring', { cache: 'no-store' }),
        apiFetch('/api/assets', { cache: 'no-store' }),
        apiFetch('/api/liabilities', { cache: 'no-store' }),
        apiFetch('/api/assets/history?detailed=true', { cache: 'no-store' }),
        apiFetch('/api/networth/history', { cache: 'no-store' }),
      ]);

      if (!txRes.ok || !recRes.ok || !assetsRes.ok || !liabRes.ok || !detailedHistoryRes.ok || !netWorthHistoryRes.ok) {
        throw new Error('Failed to fetch data from one or more endpoints');
      }

      const [txData, recData, assetsData, liabData, detailedHistoryData, netWorthHistoryData] = await Promise.all([
        txRes.json(),
        recRes.json(),
        assetsRes.json(),
        liabRes.json(),
        detailedHistoryRes.json(),
        netWorthHistoryRes.json(),
      ]);

      setTransactions(txData);
      setRecurringTransactions(recData);
      setAssets(assetsData);
      setAssetHistory(detailedHistoryData);
      setLiabilities(liabData);

      // Track which months have transaction data
      const dataMonths = new Set<string>();
      txData.forEach((tx: Transaction) => {
        dataMonths.add(getMonthKey(tx.date));
      });
      setMonthsWithData(dataMonths);

      // Use net worth history from database
      const netWorthData: NetWorthHistory[] = netWorthHistoryData.map((item: { id: string; date: string; netWorth: number; assets: number; liabilities: number }) => ({
        id: item.id,
        date: item.date,
        netWorth: item.netWorth,
        assets: item.assets,
        liabilities: item.liabilities,
      }));

      // If no history exists, calculate current values as fallback
      if (netWorthData.length === 0) {
        const totalAssets = assetsData.reduce((sum: number, a: Asset) => sum + a.value, 0);
        const totalLiabilities = liabData.reduce((sum: number, l: Liability) => sum + getRemainingBalance(l, new Date()), 0);
        netWorthData.push({
          id: '1',
          date: new Date().toISOString(),
          netWorth: totalAssets - totalLiabilities,
          assets: totalAssets,
          liabilities: totalLiabilities,
        });
      }

      setNetWorthHistory(netWorthData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  }, [setMonthsWithData]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for onboarding data additions
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const handleOnboardingAdd = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        fetchData();
      }, 2000);
    };

    window.addEventListener('onboarding-data-added', handleOnboardingAdd);
    return () => {
      window.removeEventListener('onboarding-data-added', handleOnboardingAdd);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [fetchData]);

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

  // Calculate recurring totals
  const fixedIncome = recurringTransactions
    .filter((t) => t.type === 'income' && t.isActive)
    .reduce((sum, t) => sum + t.amount, 0);

  const fixedExpenses = recurringTransactions
    .filter((t) => t.type === 'expense' && t.isActive)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyLiabilityPayments = liabilities
    .filter((l) => l.isActiveInCashFlow !== false)
    .reduce((sum, l) => sum + getEffectiveMonthlyExpense(l), 0);

  // Calculate totals - filter by month only (for summaries)
  const monthFilteredTransactions = selectedMonth === 'all'
    ? transactions
    : transactions.filter((tx) => getMonthKey(tx.date) === selectedMonth);

  // Filter by category as well (for display in Activity section)
  const filteredTransactions = monthFilteredTransactions.filter((tx) => {
    const matchesCategory = !selectedCategory || tx.category === selectedCategory;
    return matchesCategory;
  });

  // Category filter handlers
  const handleCategoryClick = (category: string) => {
    // Toggle: if already selected, clear it
    setSelectedCategory(prev => prev === category ? null : category);
  };

  const handleClearCategoryFilter = () => {
    setSelectedCategory(null);
  };

  const monthsCount = selectedMonth === 'all' ? Math.max(monthsWithData.size, 1) : 1;

  const transactionIncome = monthFilteredTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const transactionExpenses = monthFilteredTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalIncome = transactionIncome + (fixedIncome * monthsCount);
  const totalExpenses = transactionExpenses + ((fixedExpenses + monthlyLiabilityPayments) * monthsCount);
  const totalBalance = totalIncome - totalExpenses;

  const totalAssets = getTotalAssetsForMonth(assets, assetHistory, selectedMonth);
  const selectedMonthDate = selectedMonth === 'all'
    ? new Date()
    : new Date(selectedMonth + '-01');
  const totalLiabilities = liabilities.reduce((sum, l) => sum + getRemainingBalance(l, selectedMonthDate), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Calculate monthly summaries
  const monthsWithDataArray = Array.from(monthsWithData).sort().reverse();
  const monthlySummaries: MonthlySummaryType[] = monthsWithDataArray.map((monthKey) => {
    const [year, month] = monthKey.split('-');
    const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthTransactions = transactions.filter((tx) => getMonthKey(tx.date) === monthKey);

    const txIncome = monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const txExpenses = monthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate liability payments for this specific month (respects loan end dates)
    const monthlyLiabilityPaymentsForMonth = liabilities
      .filter((l) => l.isActiveInCashFlow !== false)
      .reduce((sum, l) => sum + getEffectiveMonthlyExpense(l, monthDate), 0);

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
    if (selectedMonth === 'all') {
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
  const handleAddTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
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
      await fetchData();
      toast.success('העסקה נוספה בהצלחה');
      analytics.trackAddTransaction(data.type, data.category, data.amount);
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בהוספת עסקה');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchData();
      toast.success('העסקה נמחקה');
      analytics.trackDeleteTransaction();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('שגיאה במחיקת עסקה');
    }
  };

  const handleDeleteMultipleTransactions = async (ids: string[]) => {
    try {
      const results = await Promise.all(
        ids.map(id => apiFetch(`/api/transactions/${id}`, { method: 'DELETE' }))
      );

      const failedCount = results.filter(r => !r.ok).length;
      await fetchData();

      if (failedCount === 0) {
        toast.success(`${ids.length} עסקאות נמחקו בהצלחה`);
      } else {
        toast.error(`${failedCount} עסקאות נכשלו במחיקה`);
      }
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast.error('שגיאה במחיקת עסקאות');
    }
  };

  const handleUpdateTransaction = async (
    transactionId: string,
    newCategory: string,
    merchantName: string,
    saveBehavior: 'once' | 'always' | 'alwaysAsk',
    newDescription?: string,
    newAmount?: number,
    updateExistingTransactions?: boolean
  ) => {
    try {
      // Build update body with all changed fields
      const updateBody: Record<string, unknown> = { 
        category: newCategory,
        updateExistingTransactions,
        merchantName, // Pass merchant name for batch update
      };
      if (newDescription !== undefined) {
        updateBody.description = newDescription;
      }
      if (newAmount !== undefined) {
        updateBody.amount = newAmount;
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

      await fetchData();
      analytics.trackEditTransaction();

      // Show appropriate toast message
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
      throw error; // Re-throw to let the modal know about the error
    }
  };

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
      await fetchData();
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

  const handleToggleRecurring = async (id: string, isActive: boolean) => {
    try {
      const res = await apiFetch(`/api/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      await fetchData();
    } catch (error) {
      console.error('Error toggling recurring transaction:', error);
      toast.error('שגיאה בעדכון סטטוס');
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    try {
      const res = await apiFetch(`/api/recurring/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchData();
      toast.success('העסקה הקבועה נמחקה');
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      toast.error('שגיאה במחיקה');
    }
  };

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
      await fetchData();
      toast.success(isNewAsset ? 'הנכס נוסף בהצלחה' : 'הנכס עודכן');
      if (isNewAsset) {
        analytics.trackAddAsset(data.category, data.value);
      }
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת נכס');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      const res = await apiFetch(`/api/assets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchData();
      toast.success('הנכס נמחק');
      analytics.trackDeleteAsset();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('שגיאה במחיקת נכס');
    }
  };

  // Liability handlers
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
      await fetchData();
      toast.success(isNewLiability ? 'ההתחייבות נוספה' : 'ההתחייבות עודכנה');
      if (isNewLiability) {
        analytics.trackAddLiability(data.type, data.totalAmount);
      }
    } catch (error) {
      console.error('Error saving liability:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת התחייבות');
    }
  };

  const handleDeleteLiability = async (id: string) => {
    try {
      const res = await apiFetch(`/api/liabilities/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchData();
      toast.success('ההתחייבות נמחקה');
      analytics.trackDeleteLiability();
    } catch (error) {
      console.error('Error deleting liability:', error);
      toast.error('שגיאה במחיקה');
    }
  };

  // Optimistic toggle for cash flow inclusion
  const handleToggleLiabilityCashFlow = useCallback((id: string, isActive: boolean) => {
    setLiabilities((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActiveInCashFlow: isActive } : l))
    );
  }, []);

  return (
    <AppLayout
      pageTitle="דשבורד"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      onOpenProfile={() => openModal('profile')}
      onOpenAccountSettings={() => openModal('accountSettings')}
      showQuickAddFab={true}
      showMonthFilter={true}
    >
      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div 
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: '#69ADFF', borderTopColor: 'transparent' }}
            />
            <p style={{ color: 'var(--text-secondary, #7E7F90)' }}>טוען נתונים...</p>
          </div>
        </div>
      ) : (
        /* Main Dashboard Content - Fincheck Style */
        <div className="space-y-12 pb-12">

          {/* ============================================
              SECTION 1: Financial Snapshot (המצב הפיננסי)
              ============================================ */}
          <section>
            <SectionHeader
              title="המצב הפיננסי"
              subtitle="השווי הנקי שלך וחלוקת הנכסים"
            />
            
            {/* 12-column grid: 8 cols for hero, 4 cols for chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Net Worth Hero Card - 8 columns */}
              <div className="lg:col-span-8">
                <NetWorthHeroCard
                  netWorth={netWorth}
                  totalAssets={totalAssets}
                  totalLiabilities={totalLiabilities}
                  totalIncome={totalIncome}
                  totalExpenses={totalExpenses}
                  fixedIncome={fixedIncome}
                  fixedExpenses={fixedExpenses}
                  monthlyLiabilityPayments={monthlyLiabilityPayments}
                  netWorthHistory={netWorthHistory}
                  className="h-full"
                />
              </div>
              
              {/* Asset Allocation Chart - 4 columns */}
              <div className="lg:col-span-4">
                <AssetAllocationChart assets={assets} />
              </div>
            </div>
          </section>

          {/* ============================================
              SECTION 2: Monthly Cashflow (תזרים חודשי)
              ============================================ */}
          <section>
            <SectionHeader
              title="תזרים חודשי"
              subtitle="הכנסות מול הוצאות החודש"
            />
            
            {/* 3 cards in a row: Income, Expenses, Cashflow */}
            <MonthlySummaryCards
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              monthlyCashflow={monthlyCashflow}
              previousMonthIncome={previousMonthData.income}
              previousMonthExpenses={previousMonthData.expenses}
              previousMonthCashflow={previousMonthData.cashflow}
            />
          </section>

          {/* ============================================
              SECTION 3: Portfolio Details (פירוט תיק)
              ============================================ */}
          <section>
            <SectionHeader
              title="פירוט תיק"
              subtitle="פירוט מלא של נכסים, התחייבויות ותשלומים קבועים"
            />
            
            {/* 12-column grid: 4 cols each */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Assets List */}
              <Card ref={assetsRef} padding="sm" className="h-[500px] flex flex-col">
                <AssetsSection
                  assets={assets}
                  selectedMonth={selectedMonth}
                  assetHistory={assetHistory}
                  onAdd={() => {
                    setEditingAsset(null);
                    setIsAssetModalOpen(true);
                  }}
                  onEdit={(asset) => {
                    setEditingAsset(asset);
                    setIsAssetModalOpen(true);
                  }}
                  onDelete={handleDeleteAsset}
                  onViewDocuments={(asset) => {
                    setDocumentsEntity({ type: 'asset', id: asset.id, name: asset.name });
                    setIsDocumentsModalOpen(true);
                  }}
                />
              </Card>

              {/* Liabilities List */}
              <Card ref={liabilitiesRef} padding="sm" className="h-[500px] flex flex-col">
                <LiabilitiesSection
                  liabilities={liabilities}
                  selectedMonth={selectedMonth}
                  onAdd={() => {
                    setEditingLiability(null);
                    setIsLiabilityModalOpen(true);
                  }}
                  onEdit={(liability) => {
                    setEditingLiability(liability);
                    setIsLiabilityModalOpen(true);
                  }}
                  onDelete={handleDeleteLiability}
                  onToggleCashFlow={handleToggleLiabilityCashFlow}
                  onViewAmortization={(liability) => {
                    setViewingLiability(liability);
                    setIsAmortizationModalOpen(true);
                  }}
                  onViewDocuments={(liability) => {
                    setDocumentsEntity({ type: 'liability', id: liability.id, name: liability.name });
                    setIsDocumentsModalOpen(true);
                  }}
                />
              </Card>

              {/* Recurring Transactions */}
              <Card ref={recurringRef} padding="sm" className="h-[500px] flex flex-col md:col-span-2 lg:col-span-1">
                <RecurringTransactions
                  transactions={recurringTransactions}
                  onAdd={() => {
                    setEditingRecurring(null);
                    setIsRecurringModalOpen(true);
                  }}
                  onEdit={(tx) => {
                    setEditingRecurring(tx);
                    setIsRecurringModalOpen(true);
                  }}
                  onDelete={handleDeleteRecurring}
                  onToggle={handleToggleRecurring}
                  customExpenseCategories={expenseCats.custom}
                  customIncomeCategories={incomeCats.custom}
                />
              </Card>
            </div>
          </section>

          {/* ============================================
              SECTION 4: Monthly Trends (מגמות חודשיות)
              ============================================ */}
          <section>
            <SectionHeader
              title="מגמות חודשיות"
              subtitle="ניתוח הכנסות והוצאות לאורך זמן"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="min-h-[350px] md:min-h-[420px]">
                <MonthlyTrendsCharts data={monthlySummaries} />
              </div>
              <div className="min-h-[350px] md:min-h-[420px]">
                <MonthlySummary
                  summaries={monthlySummaries}
                  totalIncome={totalIncome}
                  totalExpenses={totalExpenses}
                  totalBalance={totalBalance}
                />
              </div>
            </div>
          </section>

          {/* ============================================
              SECTION 5: Activity (פעילות)
              ============================================ */}
          <section>
            <SectionHeader
              title="פעילות"
              subtitle="פילוח הוצאות ועסקאות אחרונות"
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card padding="sm" className="h-[500px] flex flex-col lg:col-span-1">
                <ExpensesPieChart 
                  transactions={monthFilteredTransactions} 
                  recurringExpenses={recurringTransactions}
                  customExpenseCategories={expenseCats.custom}
                  selectedCategory={selectedCategory}
                  onCategoryClick={handleCategoryClick}
                />
              </Card>

              <Card ref={transactionsRef} padding="sm" className="h-[500px] flex flex-col lg:col-span-2">
                <RecentTransactions
                  transactions={filteredTransactions}
                  onDelete={handleDeleteTransaction}
                  onDeleteMultiple={handleDeleteMultipleTransactions}
                  onUpdateTransaction={handleUpdateTransaction}
                  onNewTransaction={() => setIsTransactionModalOpen(true)}
                  onImport={() => setIsImportModalOpen(true)}
                  customExpenseCategories={expenseCats.custom}
                  customIncomeCategories={incomeCats.custom}
                  selectedCategory={selectedCategory}
                  onClearCategoryFilter={handleClearCategoryFilter}
                />
              </Card>
            </div>
          </section>
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
      />

      <AmortizationModal
        isOpen={isAmortizationModalOpen}
        onClose={() => {
          setIsAmortizationModalOpen(false);
          setViewingLiability(null);
        }}
        liability={viewingLiability}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => fetchData()}
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

      <ProfileModal
        isOpen={isModalOpen('profile')}
        onClose={closeModal}
      />

      <AccountSettings
        isOpen={isModalOpen('accountSettings')}
        onClose={closeModal}
      />

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
      />

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </AppLayout>
  );
}

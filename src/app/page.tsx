'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import HeaderBar, { NavSection } from '@/components/HeaderBar';
import MonthFilter from '@/components/MonthFilter';
import SummaryCards from '@/components/SummaryCards';
import RecurringTransactions from '@/components/RecurringTransactions';
import NetWorthSection from '@/components/NetWorthSection';
import AssetsSection from '@/components/AssetsSection';
import LiabilitiesSection from '@/components/LiabilitiesSection';
import AssetAllocationChart from '@/components/AssetAllocationChart';
import MonthlySummary from '@/components/MonthlySummary';
import MonthlyTrendsCharts from '@/components/MonthlyTrendsCharts';
import ExpensesPieChart from '@/components/ExpensesPieChart';
import RecentTransactions from '@/components/RecentTransactions';
import TransactionModal from '@/components/modals/TransactionModal';
import RecurringModal from '@/components/modals/RecurringModal';
import AssetModal from '@/components/modals/AssetModal';
import LiabilityModal from '@/components/modals/LiabilityModal';
import AmortizationModal from '@/components/modals/AmortizationModal';
import ImportModal from '@/components/modals/ImportModal';
import DocumentsModal from '@/components/modals/DocumentsModal';
import AdvisorModal from '@/components/modals/AdvisorModal';
import InvestmentsTab from '@/components/investments/InvestmentsTab';
import UserMenu from '@/components/UserMenu';
import ProfileModal from '@/components/ProfileModal';
import AccountSettings from '@/components/AccountSettings';
import {
  Transaction,
  RecurringTransaction,
  Asset,
  Liability,
  NetWorthHistory,
  MonthlySummary as MonthlySummaryType,
} from '@/lib/types';
import { getMonthKey, calculateSavingsRate, apiFetch } from '@/lib/utils';
import { getEffectiveMonthlyExpense } from '@/lib/loanCalculations';
import { useCategories } from '@/hooks/useCategories';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';
import {
  expenseCategories as defaultExpenseCategories,
  incomeCategories as defaultIncomeCategories,
  assetCategories as defaultAssetCategories,
  liabilityTypes as defaultLiabilityTypes,
} from '@/lib/categories';
import Card from '@/components/ui/Card';

export default function Home() {
  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthHistory[]>([]);

  // Filter state - default to current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthsWithData, setMonthsWithData] = useState<Set<string>>(new Set());

  // Generate all months (past 12 + current + future 6 = 19 months)
  const allMonths = useMemo(() => {
    const months: string[] = [];
    const now = new Date();

    for (let i = -12; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }

    return months;
  }, []);

  // Get current month key
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Modal state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);

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

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Account settings modal state
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Section navigation state
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');

  // Section refs for scrolling (only used within dashboard view)
  const transactionsRef = useRef<HTMLDivElement>(null);
  const recurringRef = useRef<HTMLDivElement>(null);
  const assetsRef = useRef<HTMLDivElement>(null);
  const liabilitiesRef = useRef<HTMLDivElement>(null);

  // Categories hook - custom categories from API
  const { getCustomByType, addCustomCategory } = useCategories();

  // Analytics hook
  const analytics = useAnalytics();

  // Toast notifications
  const toast = useToast();


  // Memoized categories: defaults from client-side + custom from API
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
      const [txRes, recRes, assetsRes, liabRes, historyRes] = await Promise.all([
        apiFetch('/api/transactions'),
        apiFetch('/api/recurring'),
        apiFetch('/api/assets'),
        apiFetch('/api/liabilities'),
        apiFetch('/api/assets/history'),
      ]);

      // Check all responses before parsing
      if (!txRes.ok || !recRes.ok || !assetsRes.ok || !liabRes.ok || !historyRes.ok) {
        throw new Error('Failed to fetch data from one or more endpoints');
      }

      const [txData, recData, assetsData, liabData, historyData] = await Promise.all([
        txRes.json(),
        recRes.json(),
        assetsRes.json(),
        liabRes.json(),
        historyRes.json(),
      ]);

      setTransactions(txData);
      setRecurringTransactions(recData);
      setAssets(assetsData);
      setLiabilities(liabData);

      // Track which months have transaction data
      const dataMonths = new Set<string>();
      txData.forEach((tx: Transaction) => {
        dataMonths.add(getMonthKey(tx.date));
      });
      setMonthsWithData(dataMonths);

      // Calculate current liabilities total
      const totalLiabilities = liabData.reduce((sum: number, l: Liability) => sum + l.totalAmount, 0);

      // Build net worth history from actual asset history data
      const netWorthData: NetWorthHistory[] = historyData.map((item: { monthKey: string; totalAssets: number }, index: number) => {
        // Parse month key to create date (first day of month)
        const [year, month] = item.monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);

        return {
          id: String(index + 1),
          date: date.toISOString(),
          netWorth: item.totalAssets - totalLiabilities,
          assets: item.totalAssets,
          liabilities: totalLiabilities,
        };
      });

      // If no history data, create a single entry with current values
      if (netWorthData.length === 0) {
        const totalAssets = assetsData.reduce((sum: number, a: Asset) => sum + a.value, 0);
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
  }, []);

  // Fetch data on mount - new users start with empty data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate recurring totals (only active ones)
  const fixedIncome = recurringTransactions
    .filter((t) => t.type === 'income' && t.isActive)
    .reduce((sum, t) => sum + t.amount, 0);

  const fixedExpenses = recurringTransactions
    .filter((t) => t.type === 'expense' && t.isActive)
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate liability payments using effective expense (considering interest rebate)
  const monthlyLiabilityPayments = liabilities.reduce((sum, l) => sum + getEffectiveMonthlyExpense(l), 0);

  // Calculate totals
  const filteredTransactions = selectedMonth === 'all'
    ? transactions
    : transactions.filter((tx) => getMonthKey(tx.date) === selectedMonth);

  // Count how many months to multiply recurring by
  const monthsCount = selectedMonth === 'all' ? Math.max(monthsWithData.size, 1) : 1;

  const transactionIncome = filteredTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const transactionExpenses = filteredTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Total includes: regular transactions + recurring + liability payments (all multiplied by months)
  const totalIncome = transactionIncome + (fixedIncome * monthsCount);
  const totalExpenses = transactionExpenses + ((fixedExpenses + monthlyLiabilityPayments) * monthsCount);
  const totalBalance = totalIncome - totalExpenses;

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.totalAmount, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Calculate monthly summaries (including recurring transactions)
  const monthsWithDataArray = Array.from(monthsWithData).sort().reverse();
  const monthlySummaries: MonthlySummaryType[] = monthsWithDataArray.map((monthKey) => {
    const [year, month] = monthKey.split('-');
    const monthTransactions = transactions.filter((tx) => getMonthKey(tx.date) === monthKey);

    // Regular transactions for this month
    const txIncome = monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const txExpenses = monthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Add recurring transactions + liability payments to each month
    const income = txIncome + fixedIncome;
    const expenses = txExpenses + fixedExpenses + monthlyLiabilityPayments;

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
      // Delete all selected transactions in parallel
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

  const handleUpdateTransactionCategory = async (
    transactionId: string,
    newCategory: string,
    merchantName: string,
    saveBehavior: 'once' | 'always' | 'alwaysAsk'
  ) => {
    try {
      // Update the transaction category
      const res = await apiFetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });

      if (!res.ok) throw new Error('Failed to update transaction');

      // Handle merchant category mapping based on save behavior
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

      if (saveBehavior === 'once') {
        toast.success('הקטגוריה עודכנה');
      } else if (saveBehavior === 'always') {
        toast.success('הקטגוריה עודכנה ותישמר לפעמים הבאות');
      } else {
        toast.success('הקטגוריה עודכנה, תישאל שוב בפעם הבאה');
      }
    } catch (error) {
      console.error('Error updating transaction category:', error);
      toast.error('שגיאה בעדכון קטגוריה');
    }
  };

  // Recurring transaction handlers
  const handleAddRecurring = async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Capture editing state before any changes
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
      // Track analytics event (only for new recurring transactions)
      if (isNewRecurring) {
        analytics.trackAddRecurring(data.type, data.category, data.amount);
      }
    } catch (error) {
      console.error('Error saving recurring transaction:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת עסקה קבועה');
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
    // Capture editing state before any changes
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
      // Track analytics event (only for new assets)
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
    // Capture editing state before any changes
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
      // Track analytics event (only for new liabilities)
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* HeaderBar */}
      <HeaderBar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          analytics.trackTabChange(section);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        allMonths={allMonths}
        monthsWithData={monthsWithData}
        currentMonth={currentMonthKey}
      />

      <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 lg:px-8">
        {/* Investments View - Replaces Dashboard */}
        {activeSection === 'investments' && (
          <InvestmentsTab />
        )}

        {/* Dashboard View */}
        {activeSection !== 'investments' && (
          <>

        {/* All sections with consistent spacing */}
        <div className="flex flex-col gap-6">

          {/* Dashboard Title */}
          <h1 className="text-2xl font-bold text-slate-900">דשבורד</h1>

          {/* ============================================
              SECTION 1: Summary Cards (Full Width)
              ============================================ */}
          <SummaryCards
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
          />

          {/* ============================================
              SECTION 2: Net Worth + Charts (Summary Graphs)
              ============================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Net Worth Main Card */}
            <div className="lg:col-span-1">
              <NetWorthSection
                netWorth={netWorth}
                totalAssets={totalAssets}
                totalLiabilities={totalLiabilities}
                monthlyLiabilityPayments={monthlyLiabilityPayments}
                fixedIncome={fixedIncome}
                fixedExpenses={fixedExpenses}
              />
            </div>

            {/* Asset Allocation Chart */}
            <div className="lg:col-span-2">
              <AssetAllocationChart
                assets={assets}
                onGetRecommendations={() => setIsAdvisorModalOpen(true)}
              />
            </div>
          </div>

          {/* ============================================
              SECTION 3: Assets, Liabilities, Recurring (3 Columns)
              ============================================ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Assets */}
            <Card ref={assetsRef} padding="sm" className="max-h-[500px] overflow-y-auto">
              <AssetsSection
                assets={assets}
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

            {/* Liabilities */}
            <Card ref={liabilitiesRef} padding="sm" className="max-h-[500px] overflow-y-auto">
              <LiabilitiesSection
                liabilities={liabilities}
                onAdd={() => {
                  setEditingLiability(null);
                  setIsLiabilityModalOpen(true);
                }}
                onEdit={(liability) => {
                  setEditingLiability(liability);
                  setIsLiabilityModalOpen(true);
                }}
                onDelete={handleDeleteLiability}
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
          <div ref={recurringRef} className="max-h-[500px] overflow-y-auto md:col-span-2 lg:col-span-1">
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
            />
          </div>
        </div>

        {/* ============================================
              SECTION 4: Monthly Trends + Monthly Summary (2 Columns)
              ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Trends Chart */}
          <div className="min-h-[350px] md:min-h-[420px]">
            <MonthlyTrendsCharts data={monthlySummaries} />
          </div>

          {/* Monthly Summary */}
          <div className="min-h-[350px] md:min-h-[420px]">
            <MonthlySummary
              summaries={monthlySummaries}
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              totalBalance={totalBalance}
            />
          </div>
        </div>

        {/* ============================================
              SECTION 6: Expenses Pie (1/3) + Transactions (2/3) - Same Height
              ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses Pie Chart - 1/3 */}
          <Card padding="sm" className="max-h-[500px] overflow-y-auto lg:col-span-1">
            <ExpensesPieChart transactions={filteredTransactions} />
          </Card>

          {/* Recent Transactions - 2/3 */}
          <Card ref={transactionsRef} padding="sm" className="max-h-[500px] overflow-y-auto lg:col-span-2">
            <RecentTransactions
              transactions={filteredTransactions}
              onDelete={handleDeleteTransaction}
              onDeleteMultiple={handleDeleteMultipleTransactions}
              onUpdateCategory={handleUpdateTransactionCategory}
              onNewTransaction={() => setIsTransactionModalOpen(true)}
              onImport={() => setIsImportModalOpen(true)}
            />
          </Card>
        </div>

      </div>{/* End of flex container */}
          </>
        )}
    </div>

      {/* ============================================
          MODALS
          ============================================ */}
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

  {
    documentsEntity && (
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
    )
  }

  {/* Profile Modal */ }
  <ProfileModal
    isOpen={isProfileModalOpen}
    onClose={() => setIsProfileModalOpen(false)}
  />

  {/* Account Settings Modal */ }
  <AccountSettings
    isOpen={isAccountSettingsOpen}
    onClose={() => setIsAccountSettingsOpen(false)}
  />

  {/* Advisor Recommendations Modal */ }
  <AdvisorModal
    isOpen={isAdvisorModalOpen}
    onClose={() => setIsAdvisorModalOpen(false)}
  />

  {/* Toast Notifications */ }
  <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </main >
  );
}

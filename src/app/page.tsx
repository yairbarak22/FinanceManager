'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import MonthFilter from '@/components/MonthFilter';
import SummaryCards from '@/components/SummaryCards';
import RecurringTransactions from '@/components/RecurringTransactions';
import NetWorthSection from '@/components/NetWorthSection';
import AssetsSection from '@/components/AssetsSection';
import LiabilitiesSection from '@/components/LiabilitiesSection';
import NetWorthChart from '@/components/NetWorthChart';
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
import InvestmentsTab from '@/components/investments/InvestmentsTab';
import UserMenu from '@/components/UserMenu';
import { LayoutDashboard, TrendingUp } from 'lucide-react';
import {
  Transaction,
  RecurringTransaction,
  Asset,
  Liability,
  NetWorthHistory,
  MonthlySummary as MonthlySummaryType,
} from '@/lib/types';
import { getMonthKey, calculateSavingsRate } from '@/lib/utils';
import { getEffectiveMonthlyExpense } from '@/lib/loanCalculations';
import { useCategories } from '@/hooks/useCategories';
import {
  expenseCategories as defaultExpenseCategories,
  incomeCategories as defaultIncomeCategories,
  assetCategories as defaultAssetCategories,
  liabilityTypes as defaultLiabilityTypes,
} from '@/lib/categories';

export default function Home() {
  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthHistory[]>([]);
  
  // Filter state
  const [selectedMonth, setSelectedMonth] = useState('all');
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
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'investments'>('dashboard');

  // Categories hook - custom categories from API
  const { getCustomByType, addCustomCategory } = useCategories();

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
        fetch('/api/transactions'),
        fetch('/api/recurring'),
        fetch('/api/assets'),
        fetch('/api/liabilities'),
        fetch('/api/assets/history'),
      ]);

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
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchData();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Recurring transaction handlers
  const handleAddRecurring = async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const url = editingRecurring
        ? `/api/recurring/${editingRecurring.id}`
        : '/api/recurring';
      const method = editingRecurring ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditingRecurring(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving recurring transaction:', error);
    }
  };

  const handleToggleRecurring = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      await fetchData();
    } catch (error) {
      console.error('Error toggling recurring transaction:', error);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    try {
      await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
    }
  };

  // Asset handlers
  const handleAddAsset = async (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : '/api/assets';
      const method = editingAsset ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditingAsset(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  // Liability handlers
  const handleAddLiability = async (data: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const url = editingLiability
        ? `/api/liabilities/${editingLiability.id}`
        : '/api/liabilities';
      const method = editingLiability ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditingLiability(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving liability:', error);
    }
  };

  const handleDeleteLiability = async (id: string) => {
    try {
      await fetch(`/api/liabilities/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting liability:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-6 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ============================================
            TOP NAVIGATION BAR (Tabs + User Menu)
            ============================================ */}
        <div className="flex items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              ראשי
            </button>
            <button
              onClick={() => setActiveTab('investments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'investments'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              השקעות
            </button>
          </div>
          
          {/* User Menu */}
          <UserMenu />
        </div>

        {/* ============================================
            INVESTMENTS TAB
            ============================================ */}
        {activeTab === 'investments' && <InvestmentsTab />}

        {/* ============================================
            DASHBOARD TAB
            ============================================ */}
        {activeTab === 'dashboard' && (
          <>
        {/* ============================================
            SECTION 1: Header + Filter (Single Row)
            ============================================ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Header 
            onNewTransaction={() => setIsTransactionModalOpen(true)} 
            onImport={() => setIsImportModalOpen(true)}
          />
          <MonthFilter
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            allMonths={allMonths}
            monthsWithData={monthsWithData}
            currentMonth={currentMonthKey}
          />
        </div>

        {/* ============================================
            SECTION 2: Summary Cards (Full Width)
            ============================================ */}
        <SummaryCards
          totalBalance={totalBalance}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
        />

        {/* ============================================
            SECTION 3: Net Worth + Charts (Summary Graphs)
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
          
          {/* Net Worth Chart */}
          <div className="lg:col-span-2">
            <NetWorthChart
              data={netWorthHistory}
              currentNetWorth={netWorth + totalBalance}
              transactionBalance={totalBalance}
            />
          </div>
        </div>

        {/* Monthly Trends Chart (Full Width) */}
        <MonthlyTrendsCharts data={monthlySummaries} />

        {/* ============================================
            SECTION 4: Assets, Liabilities, Recurring (3 Columns)
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Assets */}
          <div className="card p-4 max-h-[500px] overflow-y-auto">
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
          </div>

          {/* Liabilities */}
          <div className="card p-4 max-h-[500px] overflow-y-auto">
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
          </div>

          {/* Recurring Transactions */}
          <div className="card p-4 max-h-[500px] overflow-y-auto">
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
            SECTION 5: Charts (2 Columns)
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expenses Pie Chart */}
          <div className="max-h-[500px]">
            <ExpensesPieChart transactions={filteredTransactions} />
          </div>
          
          <MonthlySummary
            summaries={monthlySummaries}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            totalBalance={totalBalance}
          />
        </div>

        {/* ============================================
            SECTION 6: Recent Transactions (Full Width)
            ============================================ */}
        <div className="card p-4 max-h-[500px] overflow-hidden flex flex-col">
          <RecentTransactions
            transactions={filteredTransactions}
            onDelete={handleDeleteTransaction}
          />
        </div>
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
    </main>
  );
}

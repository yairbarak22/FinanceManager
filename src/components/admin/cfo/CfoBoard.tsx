'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import type { CfoData, AdminSubscription, AdminTransaction } from '@/types/admin-cfo';
import {
  updateSubscription,
  createSubscription,
  deleteSubscription,
  updateTransaction,
  createTransaction,
  deleteTransaction,
} from '@/actions/admin-cfo-actions';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';
import CfoSummaryCards from './CfoSummaryCards';
import CfoAnalytics from './CfoAnalytics';
import CfoToolbar from './CfoToolbar';
import CfoSubscriptionsTable from './CfoSubscriptionsTable';
import CfoTransactionsTable from './CfoTransactionsTable';
import CfoViewToggle, { type CfoView } from './CfoViewToggle';
import CfoMonthPicker from './CfoMonthPicker';
import CfoPnlReport from './CfoPnlReport';
import type { AddTransactionRowHandle } from './AddTransactionRow';

export type FilterConfig = {
  type: 'ALL' | 'INCOME' | 'EXPENSE';
  status: string[];
  category: string;
};

export type SortConfig<K extends string> = {
  key: K;
  direction: 'asc' | 'desc';
};

export type SubSortKey = 'title' | 'amount' | 'nextBillingDate';
export type TxnSortKey = 'title' | 'amount' | 'date';

interface CfoBoardProps {
  initialData: CfoData;
}

export default function CfoBoard({ initialData }: CfoBoardProps) {
  const [data, setData] = useState<CfoData>(initialData);
  const prevDataRef = useRef<CfoData | null>(null);
  const { toasts, removeToast, error: showError } = useToast();
  const transactionsRef = useRef<HTMLDivElement>(null);
  const addTransactionRef = useRef<AddTransactionRowHandle>(null);

  // ─── View & month state ─────────────────────────────────────────
  const [view, setView] = useState<CfoView>('month');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // ─── Toolbar state ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({ type: 'ALL', status: [], category: '' });
  const [sortConfigSubs, setSortConfigSubs] = useState<SortConfig<SubSortKey>>({ key: 'nextBillingDate', direction: 'asc' });
  const [sortConfigTxns, setSortConfigTxns] = useState<SortConfig<TxnSortKey>>({ key: 'date', direction: 'desc' });

  const saveSnapshot = useCallback(() => {
    prevDataRef.current = JSON.parse(JSON.stringify(data));
  }, [data]);

  const rollback = useCallback((msg?: string) => {
    if (prevDataRef.current) {
      setData(prevDataRef.current);
      prevDataRef.current = null;
    }
    if (msg) showError(msg);
  }, [showError]);

  // ─── Subscription handlers ────────────────────────────────────

  const handleUpdateSubscription = useCallback(
    async (id: string, updates: Record<string, unknown>) => {
      saveSnapshot();
      setData((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.map((s) =>
          s.id === id ? { ...s, ...updates } as AdminSubscription : s
        ),
      }));
      try {
        await updateSubscription(id, updates);
      } catch {
        rollback('שגיאה בעדכון המנוי');
      }
    },
    [saveSnapshot, rollback]
  );

  const handleCreateSubscription = useCallback(
    async (title: string) => {
      saveSnapshot();
      const tempId = `temp_sub_${Date.now()}`;
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const optimisticSub: AdminSubscription = {
        id: tempId,
        title,
        type: 'EXPENSE',
        amount: 0,
        currency: 'ILS',
        category: '',
        billingCycle: 'MONTHLY',
        nextBillingDate: nextMonth,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setData((prev) => ({
        ...prev,
        subscriptions: [...prev.subscriptions, optimisticSub],
      }));
      try {
        const serverSub = await createSubscription({
          title,
          type: 'EXPENSE',
          amount: 0,
          currency: 'ILS',
          category: '',
          billingCycle: 'MONTHLY',
          nextBillingDate: nextMonth.toISOString(),
          status: 'ACTIVE',
        });
        setData((prev) => ({
          ...prev,
          subscriptions: prev.subscriptions.map((s) =>
            s.id === tempId ? serverSub : s
          ),
        }));
      } catch {
        rollback('שגיאה ביצירת מנוי');
      }
    },
    [saveSnapshot, rollback]
  );

  const handleDeleteSubscription = useCallback(
    async (id: string) => {
      saveSnapshot();
      setData((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.filter((s) => s.id !== id),
      }));
      try {
        await deleteSubscription(id);
      } catch {
        rollback('שגיאה במחיקת מנוי');
      }
    },
    [saveSnapshot, rollback]
  );

  // ─── Transaction handlers ─────────────────────────────────────

  const handleUpdateTransaction = useCallback(
    async (id: string, updates: Record<string, unknown>) => {
      saveSnapshot();
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === id ? { ...t, ...updates } as AdminTransaction : t
        ),
      }));
      try {
        await updateTransaction(id, updates);
      } catch {
        rollback('שגיאה בעדכון התנועה');
      }
    },
    [saveSnapshot, rollback]
  );

  const handleCreateTransaction = useCallback(
    async (title: string) => {
      saveSnapshot();
      const tempId = `temp_txn_${Date.now()}`;

      const optimisticTxn: AdminTransaction = {
        id: tempId,
        title,
        type: 'EXPENSE',
        amount: 0,
        currency: 'ILS',
        category: '',
        date: new Date(),
        status: 'COMPLETED',
        receiptUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setData((prev) => ({
        ...prev,
        transactions: [...prev.transactions, optimisticTxn],
      }));
      try {
        const serverTxn = await createTransaction({
          title,
          type: 'EXPENSE',
          amount: 0,
          currency: 'ILS',
          category: '',
          date: new Date().toISOString(),
          status: 'COMPLETED',
        });
        setData((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.id === tempId ? serverTxn : t
          ),
        }));
      } catch {
        rollback('שגיאה ביצירת תנועה');
      }
    },
    [saveSnapshot, rollback]
  );

  const handleDeleteTransaction = useCallback(
    async (id: string) => {
      saveSnapshot();
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
      }));
      try {
        await deleteTransaction(id);
      } catch {
        rollback('שגיאה במחיקת תנועה');
      }
    },
    [saveSnapshot, rollback]
  );

  // ─── Memoized filtering & sorting ───────────────────────────────

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    data.subscriptions.forEach((s) => { if (s.category) cats.add(s.category); });
    data.transactions.forEach((t) => { if (t.category) cats.add(t.category); });
    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'he'));
  }, [data.subscriptions, data.transactions]);

  const filteredSubscriptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = [...data.subscriptions];

    if (q) {
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || (s.category ?? '').toLowerCase().includes(q)
      );
    }
    if (filterConfig.type !== 'ALL') {
      result = result.filter((s) => s.type === filterConfig.type);
    }
    if (filterConfig.status.length > 0) {
      result = result.filter((s) => filterConfig.status.includes(s.status));
    }
    if (filterConfig.category) {
      result = result.filter((s) => s.category === filterConfig.category);
    }

    result.sort((a, b) => {
      const dir = sortConfigSubs.direction === 'asc' ? 1 : -1;
      switch (sortConfigSubs.key) {
        case 'title':
          return a.title.localeCompare(b.title, 'he') * dir;
        case 'amount':
          return (a.amount - b.amount) * dir;
        case 'nextBillingDate':
          return (new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime()) * dir;
        default:
          return 0;
      }
    });

    return result;
  }, [data.subscriptions, searchQuery, filterConfig, sortConfigSubs]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = [...data.transactions];

    if (q) {
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.category ?? '').toLowerCase().includes(q)
      );
    }
    if (filterConfig.type !== 'ALL') {
      result = result.filter((t) => t.type === filterConfig.type);
    }
    if (filterConfig.status.length > 0) {
      result = result.filter((t) => filterConfig.status.includes(t.status));
    }
    if (filterConfig.category) {
      result = result.filter((t) => t.category === filterConfig.category);
    }

    result.sort((a, b) => {
      const dir = sortConfigTxns.direction === 'asc' ? 1 : -1;
      switch (sortConfigTxns.key) {
        case 'title':
          return a.title.localeCompare(b.title, 'he') * dir;
        case 'amount':
          return (a.amount - b.amount) * dir;
        case 'date':
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
        default:
          return 0;
      }
    });

    return result;
  }, [data.transactions, searchQuery, filterConfig, sortConfigTxns]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterConfig({ type: 'ALL', status: [], category: '' });
  }, []);

  // ─── Header button handler ────────────────────────────────────

  const scrollToAddTransaction = useCallback(() => {
    transactionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      addTransactionRef.current?.activate();
    }, 400);
  }, []);

  return (
    <div className="space-y-6">
      {/* ─── View toggle + month picker ─── */}
      <div className="flex flex-wrap items-center gap-3" dir="rtl">
        <CfoViewToggle view={view} onChange={setView} />
        {view === 'month' && (
          <CfoMonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} />
        )}
      </div>

      {view === 'pnl' ? (
        /* ─── P&L Report ─── */
        <CfoPnlReport data={data} />
      ) : (
        /* ─── Month view ─── */
        <div className="space-y-8">
          <CfoSummaryCards data={data} selectedMonth={selectedMonth} />

          <CfoToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterConfig={filterConfig}
            onFilterChange={setFilterConfig}
            sortConfigSubs={sortConfigSubs}
            onSortSubsChange={setSortConfigSubs}
            sortConfigTxns={sortConfigTxns}
            onSortTxnsChange={setSortConfigTxns}
            onClearFilters={clearFilters}
            availableCategories={availableCategories}
          />

          <CfoAnalytics
            subscriptions={filteredSubscriptions}
            transactions={filteredTransactions}
            selectedMonth={selectedMonth}
          />

          <CfoSubscriptionsTable
            subscriptions={filteredSubscriptions}
            onUpdate={handleUpdateSubscription}
            onCreate={handleCreateSubscription}
            onDelete={handleDeleteSubscription}
          />

          <div ref={transactionsRef}>
            <CfoTransactionsTable
              transactions={filteredTransactions}
              onUpdate={handleUpdateTransaction}
              onCreate={handleCreateTransaction}
              onDelete={handleDeleteTransaction}
              addRowRef={addTransactionRef}
              selectedMonth={selectedMonth}
            />
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <button
        id="cfo-add-transaction-trigger"
        type="button"
        className="hidden"
        onClick={scrollToAddTransaction}
      />
    </div>
  );
}

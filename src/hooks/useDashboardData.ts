'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/utils';
import { getRemainingBalance } from '@/lib/loanCalculations';
import type {
  Transaction,
  RecurringTransaction,
  Asset,
  AssetValueHistory,
  Liability,
  NetWorthHistory,
} from '@/lib/types';

// ────────────────────────────────────────────────
// Query key factories
// ────────────────────────────────────────────────

export const dashboardKeys = {
  transactions: ['dashboard', 'transactions'] as const,
  recurring: ['dashboard', 'recurring'] as const,
  assets: ['dashboard', 'assets'] as const,
  liabilities: ['dashboard', 'liabilities'] as const,
  assetHistory: ['dashboard', 'assetHistory'] as const,
  netWorthHistory: ['dashboard', 'netWorthHistory'] as const,
};

// ────────────────────────────────────────────────
// Fetchers
// ────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await apiFetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

function parseNetWorthHistory(
  data: Array<{ id: string; date: string; netWorth: number; assets: number; liabilities: number }>,
  assets: Asset[],
  liabilities: Liability[],
): NetWorthHistory[] {
  if (data.length > 0) {
    return data.map((item) => ({
      id: item.id,
      date: item.date,
      netWorth: item.netWorth,
      assets: item.assets,
      liabilities: item.liabilities,
    }));
  }
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + getRemainingBalance(l, new Date()),
    0,
  );
  return [
    {
      id: '1',
      date: new Date().toISOString(),
      netWorth: totalAssets - totalLiabilities,
      assets: totalAssets,
      liabilities: totalLiabilities,
    },
  ];
}

// ────────────────────────────────────────────────
// Main hook
// ────────────────────────────────────────────────

const STALE_TIME = 30_000; // 30 seconds

export function useDashboardData() {
  const queryClient = useQueryClient();

  // ── Critical path queries (block dashboard render) ──

  const transactionsQ = useQuery({
    queryKey: dashboardKeys.transactions,
    queryFn: () => fetchJSON<Transaction[]>('/api/transactions'),
    staleTime: STALE_TIME,
  });

  const recurringQ = useQuery({
    queryKey: dashboardKeys.recurring,
    queryFn: () => fetchJSON<RecurringTransaction[]>('/api/recurring'),
    staleTime: STALE_TIME,
  });

  const assetsQ = useQuery({
    queryKey: dashboardKeys.assets,
    queryFn: () => fetchJSON<Asset[]>('/api/assets'),
    staleTime: STALE_TIME,
  });

  const liabilitiesQ = useQuery({
    queryKey: dashboardKeys.liabilities,
    queryFn: () => fetchJSON<Liability[]>('/api/liabilities'),
    staleTime: STALE_TIME,
  });

  // ── Deferred queries (below the fold — don't block initial render) ──

  const primaryDataReady =
    !transactionsQ.isLoading &&
    !recurringQ.isLoading &&
    !assetsQ.isLoading &&
    !liabilitiesQ.isLoading;

  const assetHistoryQ = useQuery({
    queryKey: dashboardKeys.assetHistory,
    queryFn: () =>
      fetchJSON<AssetValueHistory[]>('/api/assets/history?detailed=true'),
    staleTime: 60_000,
    enabled: primaryDataReady,
  });

  const netWorthHistoryQ = useQuery({
    queryKey: dashboardKeys.netWorthHistory,
    queryFn: () =>
      fetchJSON<
        Array<{ id: string; date: string; netWorth: number; assets: number; liabilities: number }>
      >('/api/networth/history'),
    staleTime: 60_000,
    enabled: primaryDataReady,
    select: (data) =>
      parseNetWorthHistory(
        data,
        assetsQ.data ?? [],
        liabilitiesQ.data ?? [],
      ),
  });

  // Only critical-path queries block the loading skeleton
  const isLoading = !primaryDataReady;

  // ── Targeted invalidation helpers ──

  const refetchTransactions = () =>
    queryClient.invalidateQueries({ queryKey: dashboardKeys.transactions });

  const refetchRecurring = () =>
    queryClient.invalidateQueries({ queryKey: dashboardKeys.recurring });

  const refetchAssets = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.assets });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.assetHistory });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.netWorthHistory });
  };

  const refetchLiabilities = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.liabilities });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.netWorthHistory });
  };

  const refetchAll = () =>
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });

  // Local setter for optimistic liability toggle
  const setLiabilitiesOptimistic = (
    updater: (prev: Liability[]) => Liability[],
  ) => {
    queryClient.setQueryData<Liability[]>(
      dashboardKeys.liabilities,
      (old) => (old ? updater(old) : old),
    );
  };

  return {
    transactions: transactionsQ.data ?? [],
    recurringTransactions: recurringQ.data ?? [],
    assets: assetsQ.data ?? [],
    assetHistory: assetHistoryQ.data ?? [],
    liabilities: liabilitiesQ.data ?? [],
    netWorthHistory: netWorthHistoryQ.data ?? [],
    isLoading,

    refetchTransactions,
    refetchRecurring,
    refetchAssets,
    refetchLiabilities,
    refetchAll,
    setLiabilitiesOptimistic,
  };
}

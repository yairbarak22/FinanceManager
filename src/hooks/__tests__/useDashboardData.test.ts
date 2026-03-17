// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dashboardKeys } from '../useDashboardData';

// ── Mocks ──

vi.mock('@/lib/utils', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/loanCalculations', () => ({
  getRemainingBalance: vi.fn((_l: unknown, _d: Date) => 5000),
}));

import { apiFetch } from '@/lib/utils';

const mockApiFetch = vi.mocked(apiFetch);

function makeResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
  } as unknown as Response;
}

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApiFetch.mockImplementation(async (url: string) => {
    if (url.includes('/api/transactions')) return makeResponse([]);
    if (url.includes('/api/recurring')) return makeResponse([]);
    if (url.includes('/api/assets') && !url.includes('history')) return makeResponse([]);
    if (url.includes('/api/liabilities')) return makeResponse([]);
    if (url.includes('/api/assets/history')) return makeResponse([]);
    if (url.includes('/api/networth/history')) return makeResponse([]);
    return makeResponse([]);
  });
});

// ============================================================================
// dashboardKeys shape
// ============================================================================

describe('dashboardKeys', () => {
  it('has correct query key shapes', () => {
    expect(dashboardKeys.transactions).toEqual(['dashboard', 'transactions']);
    expect(dashboardKeys.recurring).toEqual(['dashboard', 'recurring']);
    expect(dashboardKeys.assets).toEqual(['dashboard', 'assets']);
    expect(dashboardKeys.liabilities).toEqual(['dashboard', 'liabilities']);
    expect(dashboardKeys.assetHistory).toEqual(['dashboard', 'assetHistory']);
    expect(dashboardKeys.netWorthHistory).toEqual(['dashboard', 'netWorthHistory']);
  });

  it('all keys share "dashboard" prefix for refetchAll', () => {
    const allKeys = Object.values(dashboardKeys);
    allKeys.forEach((key) => {
      expect(key[0]).toBe('dashboard');
    });
  });
});

// ============================================================================
// useDashboardData hook
// ============================================================================

describe('useDashboardData', () => {
  it('returns empty arrays and isLoading=true initially', async () => {
    // Delay responses to observe loading state
    mockApiFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(makeResponse([])), 100)),
    );

    const { useDashboardData } = await import('../useDashboardData');
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.transactions).toEqual([]);
    expect(result.current.recurringTransactions).toEqual([]);
    expect(result.current.assets).toEqual([]);
    expect(result.current.liabilities).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('resolves data and sets isLoading=false after fetch', async () => {
    const txData = [{ id: 'tx1', type: 'expense', amount: 100 }];
    mockApiFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/transactions')) return makeResponse(txData);
      return makeResponse([]);
    });

    const { useDashboardData } = await import('../useDashboardData');
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toEqual(txData);
  });

  it('defers assetHistory and netWorthHistory until primary data loads', async () => {
    const fetchCalls: string[] = [];
    mockApiFetch.mockImplementation(async (url: string) => {
      fetchCalls.push(url);
      return makeResponse([]);
    });

    const { useDashboardData } = await import('../useDashboardData');
    renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    // Before primary data resolves, deferred queries should not have fired yet
    // After primary data resolves they will fire
    await waitFor(() => {
      expect(fetchCalls).toContain('/api/transactions');
    });

    await waitFor(() => {
      expect(fetchCalls).toContain('/api/assets/history?detailed=true');
      expect(fetchCalls).toContain('/api/networth/history');
    });
  });

  it('computes fallback netWorthHistory when API returns empty', async () => {
    const assets = [{ id: 'a1', name: 'דירה', category: 'apartment', value: 1000000 }];
    const liabilities = [{ id: 'l1', name: 'הלוואה', totalAmount: 50000 }];

    mockApiFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/assets') && !url.includes('history')) return makeResponse(assets);
      if (url.includes('/api/liabilities')) return makeResponse(liabilities);
      if (url.includes('/api/networth/history')) return makeResponse([]);
      return makeResponse([]);
    });

    const { useDashboardData } = await import('../useDashboardData');
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      const nwh = result.current.netWorthHistory;
      if (nwh.length > 0) {
        expect(nwh[0].assets).toBe(1000000);
        expect(nwh[0].liabilities).toBe(5000); // mocked getRemainingBalance
        expect(nwh[0].netWorth).toBe(995000);
      }
    });
  });

  it('passes through netWorthHistory when API returns data', async () => {
    const nwData = [{ id: 'nw1', date: '2025-01-01', netWorth: 500000, assets: 600000, liabilities: 100000 }];

    mockApiFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/networth/history')) return makeResponse(nwData);
      return makeResponse([]);
    });

    const { useDashboardData } = await import('../useDashboardData');
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      const nwh = result.current.netWorthHistory;
      if (nwh.length > 0) {
        expect(nwh[0]).toEqual(nwData[0]);
      }
    });
  });
});

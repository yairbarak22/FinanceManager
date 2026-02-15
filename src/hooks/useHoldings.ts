'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/utils';

export interface Holding {
  id: string;
  userId: string;
  name: string;
  symbol: string | null;
  type: string;
  currentValue: number;
  targetAllocation: number;
  currency: string;
  provider: string;
  priceDisplayUnit?: string;
  createdAt: string;
  updatedAt: string;
}

// Query keys
export const holdingKeys = {
  all: ['holdings'] as const,
  lists: () => [...holdingKeys.all, 'list'] as const,
};

async function fetchHoldings(): Promise<Holding[]> {
  const res = await apiFetch('/api/holdings');
  if (!res.ok) throw new Error('Failed to fetch holdings');
  return res.json();
}

// Hook to fetch holdings
export function useHoldings() {
  return useQuery({
    queryKey: holdingKeys.lists(),
    queryFn: fetchHoldings,
    staleTime: 30000,
  });
}



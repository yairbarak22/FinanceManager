'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPortfolioAnalysis, searchFinance } from '@/lib/api/portfolio';

// Query keys
export const portfolioKeys = {
  all: ['portfolio'] as const,
  analysis: () => [...portfolioKeys.all, 'analysis'] as const,
  search: (query: string) => [...portfolioKeys.all, 'search', query] as const,
};

// Hook to fetch portfolio analysis
export function usePortfolioAnalysis() {
  return useQuery({
    queryKey: portfolioKeys.analysis(),
    queryFn: fetchPortfolioAnalysis,
    staleTime: 60000, // 1 minute
  });
}

// Hook to search financial instruments
export function useFinanceSearch(query: string) {
  return useQuery({
    queryKey: portfolioKeys.search(query),
    queryFn: () => searchFinance(query),
    enabled: query.length >= 2,
    staleTime: 300000, // 5 minutes
  });
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/utils';

interface UseMostUsedCategoriesOptions {
  type: 'expense' | 'income';
  enabled?: boolean;
}

export function useMostUsedCategories({ type, enabled = true }: UseMostUsedCategoriesOptions) {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/categories/most-used?type=${type}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch most used categories');
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching most used categories:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [type, enabled]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}

export default useMostUsedCategories;


'use client';

import { useState, useEffect, useCallback } from 'react';
import { CategoryInfo } from '@/lib/categories';

interface CategoriesData {
  expense: { default: CategoryInfo[]; custom: CategoryInfo[] };
  income: { default: CategoryInfo[]; custom: CategoryInfo[] };
  asset: { default: CategoryInfo[]; custom: CategoryInfo[] };
  liability: { default: CategoryInfo[]; custom: CategoryInfo[] };
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCustomCategory = useCallback(
    async (
      name: string,
      type: 'expense' | 'income' | 'asset' | 'liability'
    ): Promise<CategoryInfo> => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }

      const newCategory = await response.json();
      
      // Update local state
      setCategories((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [type]: {
            ...prev[type],
            custom: [...prev[type].custom, newCategory],
          },
        };
      });

      return newCategory;
    },
    []
  );

  const deleteCustomCategory = useCallback(
    async (id: string, type: 'expense' | 'income' | 'asset' | 'liability') => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      // Update local state
      setCategories((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [type]: {
            ...prev[type],
            custom: prev[type].custom.filter((c) => c.id !== id),
          },
        };
      });
    },
    []
  );

  // Helper to get categories by type
  const getByType = useCallback(
    (type: 'expense' | 'income' | 'asset' | 'liability') => {
      if (!categories) return { default: [], custom: [] };
      return categories[type];
    },
    [categories]
  );

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCustomCategory,
    deleteCustomCategory,
    getByType,
  };
}


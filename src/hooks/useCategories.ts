'use client';

import { useState, useEffect, useCallback } from 'react';
import { CategoryInfo, customCategoryToInfo } from '@/lib/categories';
import { apiFetch } from '@/lib/utils';

// API response type (serializable)
interface CustomCategoryResponse {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  isCustom: boolean;
}

interface CustomCategoriesData {
  expense: CustomCategoryResponse[];
  income: CustomCategoryResponse[];
  asset: CustomCategoryResponse[];
  liability: CustomCategoryResponse[];
}

export function useCategories() {
  const [customCategories, setCustomCategories] = useState<CustomCategoriesData>({
    expense: [],
    income: [],
    asset: [],
    liability: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiFetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCustomCategories(data);
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

  // Convert API response to CategoryInfo with actual icon components
  const convertToInfo = useCallback((cat: CustomCategoryResponse): CategoryInfo => {
    return customCategoryToInfo({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
    });
  }, []);

  // Get custom categories as CategoryInfo for a specific type
  const getCustomByType = useCallback(
    (type: 'expense' | 'income' | 'asset' | 'liability'): CategoryInfo[] => {
      return customCategories[type].map(convertToInfo);
    },
    [customCategories, convertToInfo]
  );

  const addCustomCategory = useCallback(
    async (
      name: string,
      type: 'expense' | 'income' | 'asset' | 'liability'
    ): Promise<CategoryInfo> => {
      const response = await apiFetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }

      const newCategory: CustomCategoryResponse = await response.json();

      // Update local state
      setCustomCategories((prev) => ({
        ...prev,
        [type]: [...prev[type], newCategory],
      }));

      return convertToInfo(newCategory);
    },
    [convertToInfo]
  );

  const deleteCustomCategory = useCallback(
    async (id: string, type: 'expense' | 'income' | 'asset' | 'liability') => {
      const response = await apiFetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      // Update local state
      setCustomCategories((prev) => ({
        ...prev,
        [type]: prev[type].filter((c) => c.id !== id),
      }));
    },
    []
  );

  return {
    customCategories,
    loading,
    error,
    fetchCategories,
    addCustomCategory,
    deleteCustomCategory,
    getCustomByType,
  };
}

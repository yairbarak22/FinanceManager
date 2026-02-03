'use client';

import { useState, useEffect, useCallback } from 'react';
import { CategoryInfo, customCategoryToInfo } from '@/lib/categories';
import { apiFetch } from '@/lib/utils';

// Goal category color - matching the API
const GOAL_CATEGORY_COLOR = '#0DBACC';

// API response type (serializable)
interface CustomCategoryResponse {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  isCustom: boolean;
  isGoalCategory?: boolean; // Added to mark goal categories
}

interface CustomCategoriesData {
  expense: CustomCategoryResponse[];
  income: CustomCategoryResponse[];
  asset: CustomCategoryResponse[];
  liability: CustomCategoryResponse[];
}

// Simple goal interface for category matching
interface GoalForCategory {
  id: string;
  name: string;
  category: string;
}

export function useCategories() {
  const [customCategories, setCustomCategories] = useState<CustomCategoriesData>({
    expense: [],
    income: [],
    asset: [],
    liability: [],
  });
  const [goalCategories, setGoalCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      // Fetch both categories and goals in parallel
      const [categoriesResponse, goalsResponse] = await Promise.all([
        apiFetch('/api/categories'),
        apiFetch('/api/goals'),
      ]);
      
      if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
      const categoriesData = await categoriesResponse.json();
      
      // Extract goal category names
      let goalCategoryNames = new Set<string>();
      if (goalsResponse.ok) {
        const goalsData: GoalForCategory[] = await goalsResponse.json();
        goalCategoryNames = new Set(goalsData.map(g => g.category || g.name));
      }
      
      setGoalCategories(goalCategoryNames);
      
      // Mark and sort expense categories - goal categories first
      const expenseCategories = categoriesData.expense.map((cat: CustomCategoryResponse) => ({
        ...cat,
        isGoalCategory: goalCategoryNames.has(cat.name),
      }));
      
      // Sort: goal categories first, then others
      expenseCategories.sort((a: CustomCategoryResponse, b: CustomCategoryResponse) => {
        if (a.isGoalCategory && !b.isGoalCategory) return -1;
        if (!a.isGoalCategory && b.isGoalCategory) return 1;
        return 0;
      });
      
      setCustomCategories({
        ...categoriesData,
        expense: expenseCategories,
      });
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
  const convertToInfo = useCallback((cat: CustomCategoryResponse): CategoryInfo & { isGoalCategory?: boolean } => {
    const info = customCategoryToInfo({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      // Use goal color for goal categories
      color: cat.isGoalCategory ? GOAL_CATEGORY_COLOR : cat.color,
    });
    return {
      ...info,
      isGoalCategory: cat.isGoalCategory,
    };
  }, []);

  // Get custom categories as CategoryInfo for a specific type
  const getCustomByType = useCallback(
    (type: 'expense' | 'income' | 'asset' | 'liability'): (CategoryInfo & { isGoalCategory?: boolean })[] => {
      return customCategories[type].map(convertToInfo);
    },
    [customCategories, convertToInfo]
  );
  
  // Check if a category name is a goal category
  const isGoalCategory = useCallback(
    (categoryName: string): boolean => {
      return goalCategories.has(categoryName);
    },
    [goalCategories]
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
    isGoalCategory,
    goalCategories,
  };
}

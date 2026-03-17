'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PassoverOnboarding from './PassoverOnboarding';
import BudgetSummaryCards from './BudgetSummaryCards';
import BudgetVisualCard from './BudgetVisualCard';
import AddBudgetVisual from './AddBudgetVisual';
import BudgetSkeleton from './BudgetSkeleton';
import { SectionHeader } from '@/components/dashboard';
import { useCategories } from '@/hooks/useCategories';
import { getCategoryInfo, CategoryInfo } from '@/lib/categories';
import { apiFetch } from '@/lib/utils';

interface PassoverSection {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  plannedAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  orderIndex: number;
}

interface PassoverBudgetData {
  sections: PassoverSection[];
  totalPlanned: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
}

interface PassoverWorkspaceProps {
  month: number;
  year: number;
}

const MONTH_NAMES_HE: Record<number, string> = {
  1: 'ינואר', 2: 'פברואר', 3: 'מרץ', 4: 'אפריל', 5: 'מאי', 6: 'יוני',
  7: 'יולי', 8: 'אוגוסט', 9: 'ספטמבר', 10: 'אוקטובר', 11: 'נובמבר', 12: 'דצמבר',
};

export default function PassoverWorkspace({ month, year }: PassoverWorkspaceProps) {
  const [data, setData] = useState<PassoverBudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { getCustomByType, addCustomCategory } = useCategories();

  const monthDisplayName = `פסח ${MONTH_NAMES_HE[month]} ${year}`;

  const customExpenseCategories: CategoryInfo[] = useMemo(
    () => getCustomByType('expense'),
    [getCustomByType]
  );

  const resolveCategoryInfo = useCallback(
    (categoryId: string) => getCategoryInfo(categoryId, 'expense', customExpenseCategories),
    [customExpenseCategories]
  );

  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/passover-budget?month=${month}&year=${year}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result: PassoverBudgetData = await res.json();
      setData(result);
      setShowOnboarding(result.sections.length === 0);
    } catch {
      setData(null);
      setShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  const handleSelectTemplate = useCallback(
    async (template: 'hosting' | 'guest') => {
      const res = await apiFetch('/api/passover-budget/sections', {
        method: 'POST',
        body: JSON.stringify({ template, month, year }),
      });
      if (!res.ok) throw new Error('Failed to create template');
      setShowOnboarding(false);
      await fetchData();
    },
    [month, year, fetchData]
  );

  const handleSaveBudget = useCallback(
    async (categoryId: string, amount: number) => {
      const res = await apiFetch('/api/passover-budget', {
        method: 'POST',
        body: JSON.stringify({
          categoryId,
          plannedAmount: amount,
          month,
          year,
          orderIndex: data?.sections.length || 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      await fetchData();
    },
    [month, year, data, fetchData]
  );

  const handleUpdateAmount = useCallback(
    async (categoryId: string, newAmount: number) => {
      const res = await apiFetch('/api/passover-budget', {
        method: 'POST',
        body: JSON.stringify({ categoryId, plannedAmount: newAmount, month, year }),
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchData();
    },
    [month, year, fetchData]
  );

  const handleDelete = useCallback(
    async (sectionId: string) => {
      const res = await apiFetch('/api/passover-budget', {
        method: 'DELETE',
        body: JSON.stringify({ sectionId }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchData();
    },
    [fetchData]
  );

  const existingCategoryIds = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(data.sections.map(s => s.categoryId));
  }, [data]);

  const sortedSections = useMemo(() => {
    if (!data) return [];
    return [...data.sections].sort((a, b) => b.percentage - a.percentage);
  }, [data]);

  if (isLoading) {
    return <BudgetSkeleton />;
  }

  if (showOnboarding) {
    return <PassoverOnboarding onSelectTemplate={handleSelectTemplate} />;
  }

  if (!data || data.sections.length === 0) {
    return <PassoverOnboarding onSelectTemplate={handleSelectTemplate} />;
  }

  return (
    <div className="space-y-12 pb-12">
      <section>
        <BudgetSummaryCards
          totalBudget={data.totalPlanned}
          totalSpent={data.totalSpent}
          totalRemaining={data.totalRemaining}
          overallPercentage={data.overallPercentage}
          monthDisplayName={monthDisplayName}
          month={month}
          year={year}
          isPassover
        />
      </section>

      <section>
        <SectionHeader
          title="תקציבי פסח לפי קטגוריה"
          subtitle="ניהול תקציב לכל סעיף הוצאה לחג"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSections.map((section) => (
            <BudgetVisualCard
              key={section.id}
              categoryInfo={resolveCategoryInfo(section.categoryId)}
              categoryId={section.categoryId}
              displayName={section.categoryName}
              budgetAmount={section.plannedAmount}
              spent={section.spent}
              remaining={section.remaining}
              percentage={section.percentage}
              onUpdateAmount={handleUpdateAmount}
              onDelete={() => handleDelete(section.id)}
            />
          ))}

          <AddBudgetVisual
            onSave={handleSaveBudget}
            existingBudgetCategoryIds={existingCategoryIds}
            customCategories={customExpenseCategories}
            onAddCategory={(name, isMaaserEligible) =>
              addCustomCategory(name, 'passover', isMaaserEligible)
            }
          />
        </div>
      </section>
    </div>
  );
}

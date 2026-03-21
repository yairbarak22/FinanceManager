'use client';

import { SectionHeader } from '@/components/dashboard';
import Card from '@/components/ui/Card';
import { Target } from 'lucide-react';
import type { FinancialGoal } from '@/lib/api/goals';
import GoalsSummaryCard from './GoalsSummaryCard';
import GoalsBoardRows from './GoalsBoardRows';

export interface GoalsSectionProps {
  financialGoals: FinancialGoal[];
  isLoading: boolean;
  error: Error | null;
}

export default function GoalsSection({
  financialGoals,
  isLoading,
  error,
}: GoalsSectionProps) {
  const hasGoals = financialGoals.length > 0;

  return (
    <section>
      <SectionHeader
        title="יעדים"
        subtitle="מעקב אחר היעדים הפיננסיים שהגדרת"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Card className="h-[300px] animate-pulse">
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#69ADFF] border-t-transparent rounded-full animate-spin" />
              </div>
            </Card>
          </div>
          <div className="lg:col-span-8">
            <Card className="h-[300px] animate-pulse">
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#69ADFF] border-t-transparent rounded-full animate-spin" />
              </div>
            </Card>
          </div>
        </div>
      ) : error || !hasGoals ? (
        <Card>
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(13, 186, 204, 0.1)' }}
            >
              <Target className="w-8 h-8" style={{ color: '#0DBACC' }} strokeWidth={1.5} />
            </div>
            <p className="text-sm" style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
              {error ? 'שגיאה בטעינת היעדים' : 'אין יעדים פיננסיים'}
            </p>
            <p className="text-xs" style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
              {error ? 'נסה לרענן את הדף' : 'צור יעדים בעמוד היעדים כדי לעקוב אחריהם כאן'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <GoalsSummaryCard goals={financialGoals} />
          </div>
          <div className="lg:col-span-8">
            <GoalsBoardRows goals={financialGoals} />
          </div>
        </div>
      )}
    </section>
  );
}

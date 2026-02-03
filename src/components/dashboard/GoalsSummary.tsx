'use client';

import { Target, ChevronLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useGoals } from '@/hooks/useGoals';
import { formatCurrency } from '@/lib/utils';
import { calculateProgressPercentage } from '@/lib/goalCalculations';
import GoalProgressBar from '@/components/goals/GoalProgressBar';

interface GoalsSummaryProps {
  className?: string;
  maxItems?: number;
}

/**
 * GoalsSummary - Compact goals list for dashboard
 * Shows top active goals with progress bars
 */
export default function GoalsSummary({ 
  className = '',
  maxItems = 3 
}: GoalsSummaryProps) {
  const { data: goals, isLoading } = useGoals();

  // Sort goals by closest deadline and take top items
  const displayGoals = goals
    ?.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, maxItems);

  return (
    <div
      className={`bg-white rounded-3xl p-6 h-full flex flex-col ${className}`}
      style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: '#69ADFF' }} strokeWidth={1.5} />
          <h3 
            className="text-lg font-semibold"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#303150'
            }}
          >
            יעדים פיננסיים
          </h3>
        </div>
        <Link
          href="/goals"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F7F7F8]"
          aria-label="צפייה בכל היעדים"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: '#69ADFF' }} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Goals List */}
      <div className="flex-1 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-[#F7F7F8] rounded w-1/2 mb-2" />
                <div className="h-2 bg-[#F7F7F8] rounded w-full" />
              </div>
            ))}
          </div>
        ) : !displayGoals || displayGoals.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <Target 
              className="w-10 h-10 mb-3"
              style={{ color: '#BDBDCB' }}
            />
            <p 
              className="text-sm text-center mb-3"
              style={{ color: '#7E7F90' }}
            >
              אין יעדים עדיין
            </p>
            <Link
              href="/goals"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ 
                backgroundColor: 'rgba(105, 173, 255, 0.1)',
                color: '#69ADFF',
              }}
            >
              <Plus className="w-4 h-4" />
              צור יעד חדש
            </Link>
          </div>
        ) : (
          displayGoals.map((goal) => {
            const progress = calculateProgressPercentage(goal.currentAmount, goal.targetAmount);
            const deadline = new Date(goal.deadline);
            const deadlineStr = deadline.toLocaleDateString('he-IL', {
              month: 'short',
              year: '2-digit',
            });

            return (
              <div key={goal.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <span 
                    className="font-medium text-sm truncate flex-1"
                    style={{ color: '#303150' }}
                  >
                    {goal.name}
                  </span>
                  <span 
                    className="text-xs mr-2"
                    style={{ color: '#BDBDCB' }}
                  >
                    {deadlineStr}
                  </span>
                </div>
                <GoalProgressBar progress={progress} segments={10} />
                <div className="flex items-center justify-between mt-1.5">
                  <span 
                    className="text-xs"
                    style={{ color: '#7E7F90' }}
                  >
                    {formatCurrency(goal.currentAmount)}
                  </span>
                  <span 
                    className="text-xs"
                    style={{ color: '#7E7F90' }}
                  >
                    {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View all link */}
      {displayGoals && displayGoals.length > 0 && goals && goals.length > maxItems && (
        <Link
          href="/goals"
          className="mt-4 pt-4 border-t border-[#F7F7F8] flex items-center justify-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: '#69ADFF' }}
        >
          <span>צפייה ב-{goals.length} יעדים</span>
          <ChevronLeft className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}


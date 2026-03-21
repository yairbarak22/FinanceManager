'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { SensitiveData } from '@/components/common/SensitiveData';
import { formatCurrency } from '@/lib/utils';
import {
  calculateProgressPercentage,
  calculateGoalStatus,
  formatGoalStatus,
} from '@/lib/goalCalculations';
import { GOAL_ICONS } from '@/components/goals/goalIcons';
import { Wallet } from 'lucide-react';
import type { FinancialGoal } from '@/lib/api/goals';

interface GoalsBoardRowsProps {
  goals: FinancialGoal[];
}

function StatusBadge({ status }: { status: ReturnType<typeof calculateGoalStatus> }) {
  const { label, color } = formatGoalStatus(status);

  const bgMap: Record<string, string> = {
    '#0DBACC': 'rgba(13, 186, 204, 0.1)',
    '#F18AB5': 'rgba(241, 138, 181, 0.1)',
    '#7E7F90': 'rgba(126, 127, 144, 0.1)',
  };

  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-lg whitespace-nowrap"
      style={{
        color,
        backgroundColor: bgMap[color] || 'rgba(126, 127, 144, 0.1)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
    >
      {label}
    </span>
  );
}

function CompactProgressBar({ progress }: { progress: number }) {
  const segments = 8;
  const filled = Math.round((Math.min(100, Math.max(0, progress)) / 100) * segments);

  return (
    <div className="flex w-full min-w-0 items-center gap-2" dir="ltr">
      <span
        className="w-9 shrink-0 text-center text-xs font-semibold tabular-nums"
        style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        {Math.round(progress)}%
      </span>
      <div className="flex min-w-0 flex-1 gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 min-w-0 flex-1 rounded-full"
            style={{ backgroundColor: i < filled ? '#0DBACC' : '#F7F7F8' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function GoalsBoardRows({ goals }: GoalsBoardRowsProps) {
  const displayGoals = useMemo(() => {
    const incomplete = goals.filter(
      (g) => calculateProgressPercentage(g.currentAmount, g.targetAmount) < 100,
    );
    if (incomplete.length >= 4) return incomplete.slice(0, 4);
    const completed = goals.filter(
      (g) => calculateProgressPercentage(g.currentAmount, g.targetAmount) >= 100,
    );
    return [...incomplete, ...completed].slice(0, 4);
  }, [goals]);

  return (
    <Card className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex items-center justify-between flex-shrink-0">
        <h3
          className="text-lg font-semibold"
          style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          מעקב יעדים
        </h3>
        <Link
          href="/goals"
          className="text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: '#69ADFF', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          לכל היעדים
        </Link>
      </div>

      {/* Rows: shared column template; badge column must be fixed width (not auto) or 1fr shifts per row */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-ghost px-6 pb-4">
        <div className="grid w-full gap-x-3 max-sm:[grid-template-columns:2.5rem_minmax(0,1fr)_9rem] sm:max-md:[grid-template-columns:2.5rem_minmax(0,1fr)_9rem_9rem] md:[grid-template-columns:2.5rem_minmax(0,1fr)_9.5rem_9rem_9rem]">
          {displayGoals.map((goal, i) => {
            const Icon = GOAL_ICONS[goal.category] || Wallet;
            const progress = calculateProgressPercentage(goal.currentAmount, goal.targetAmount);
            const status = calculateGoalStatus(
              goal.targetAmount,
              goal.currentAmount,
              goal.deadline,
              goal.recurringTransaction?.amount,
            );
            const deadline = new Date(goal.deadline);
            const deadlineStr = deadline.toLocaleDateString('he-IL', {
              month: 'short',
              year: 'numeric',
            });

            return (
              <div key={goal.id} className="contents">
                {/* Icon */}
                <div
                  className="flex w-10 shrink-0 items-center justify-center justify-self-end py-3.5 pe-1"
                  style={{
                    borderBottom: i < displayGoals.length - 1 ? '1px solid #F7F7F8' : 'none',
                  }}
                >
                  <div
                    className="flex size-10 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(13, 186, 204, 0.1)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: '#0DBACC' }} strokeWidth={1.5} />
                  </div>
                </div>

                {/* Name + deadline */}
                <div
                  className="min-w-0 self-center py-3.5 pe-1"
                  style={{
                    borderBottom: i < displayGoals.length - 1 ? '1px solid #F7F7F8' : 'none',
                  }}
                >
                  <SensitiveData
                    as="p"
                    className="line-clamp-2 break-words text-sm font-semibold"
                    style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    {goal.name}
                  </SensitiveData>
                  <p
                    className="mt-0.5 text-xs tabular-nums"
                    style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    יעד: {deadlineStr}
                  </p>
                </div>

                {/* Compact progress — md+ only; hidden items are omitted from grid so sm/max-sm column counts stay 4 / 3 */}
                <div
                  className="hidden w-full min-w-0 justify-self-end self-center py-3.5 md:block"
                  style={{
                    borderBottom: i < displayGoals.length - 1 ? '1px solid #F7F7F8' : 'none',
                  }}
                >
                  <CompactProgressBar progress={progress} />
                </div>

                {/* Amounts */}
                <div
                  className="w-full min-w-0 justify-self-end self-center py-3.5 text-start tabular-nums"
                  dir="ltr"
                  style={{
                    borderBottom: i < displayGoals.length - 1 ? '1px solid #F7F7F8' : 'none',
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  }}
                >
                  <SensitiveData as="p" className="text-sm font-bold" style={{ color: '#303150' }}>
                    {formatCurrency(goal.currentAmount)}
                  </SensitiveData>
                  <SensitiveData as="p" className="text-xs" style={{ color: '#BDBDCB' }}>
                    / {formatCurrency(goal.targetAmount)}
                  </SensitiveData>
                </div>

                {/* Status badge — fixed track; inline-end (visual left in RTL) */}
                <div
                  className="hidden w-full min-w-0 justify-self-end self-center py-3.5 sm:flex sm:items-center sm:justify-end"
                  style={{
                    borderBottom: i < displayGoals.length - 1 ? '1px solid #F7F7F8' : 'none',
                  }}
                >
                  <StatusBadge status={status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

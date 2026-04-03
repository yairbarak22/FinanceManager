'use client';

import { useMemo } from 'react';
import { TrendingDown, Layers, TrendingUp, DollarSign, Scale, type LucideIcon } from 'lucide-react';
import { formatCurrencyAmount, type CurrencyCode } from '@/lib/utils';
import type { CfoData } from '@/types/admin-cfo';

interface CfoSummaryCardsProps {
  data: CfoData;
  selectedMonth: string | null; // "YYYY-MM" | null = all time / current month
}

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  valueColor?: string;
  subtitle?: string;
}

function KpiCard({ title, value, icon: Icon, iconColor, valueColor, subtitle }: KpiCardProps) {
  return (
    <div className="bg-white border border-[#F7F7F8] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}14` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#7E7F90] mb-1">{title}</p>
          <p
            className="text-xl font-bold truncate"
            style={{ color: valueColor || '#303150' }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] font-medium text-[#7E7F90] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CfoSummaryCards({ data, selectedMonth }: CfoSummaryCardsProps) {
  const metrics = useMemo(() => {
    const activeSubs = data.subscriptions.filter((s) => s.status === 'ACTIVE');

    const monthlyBurn = activeSubs
      .filter((s) => s.type === 'EXPENSE')
      .reduce((sum, s) => sum + s.amount, 0);

    const activeSubCount = activeSubs.length;

    const recurringIncome = activeSubs
      .filter((s) => s.type === 'INCOME')
      .reduce((sum, s) => sum + s.amount, 0);

    // Determine date range to filter one-time transactions
    let monthStart: Date;
    let monthEnd: Date;
    let isSpecificMonth = false;

    if (selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      monthStart = new Date(y, m - 1, 1);
      monthEnd = new Date(y, m, 0, 23, 59, 59);
      isSpecificMonth = true;
    } else {
      const now = new Date();
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const txnsInRange = data.transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });

    const oneTimeIncome = txnsInRange
      .filter((t) => t.type === 'INCOME' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);

    const oneTimeExpense = txnsInRange
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    // Net for selected period:
    // When a specific month is selected, balance = txns only (subscriptions have no historical dates)
    // When all-time / current: include active subscriptions
    const periodBalance = isSpecificMonth
      ? oneTimeIncome - oneTimeExpense
      : (recurringIncome + oneTimeIncome) - (monthlyBurn + oneTimeExpense);

    return { monthlyBurn, activeSubCount, recurringIncome, oneTimeIncome, periodBalance, isSpecificMonth };
  }, [data, selectedMonth]);

  const monthSuffix = selectedMonth
    ? (() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
      })()
    : 'החודש';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <KpiCard
        title={metrics.isSpecificMonth ? `מאזן ${monthSuffix}` : 'מאזן כולל'}
        value={formatCurrencyAmount(Math.abs(metrics.periodBalance), 'ILS' as CurrencyCode)}
        icon={Scale}
        iconColor={metrics.periodBalance >= 0 ? '#00C875' : '#E2445C'}
        valueColor={metrics.periodBalance >= 0 ? '#00C875' : '#E2445C'}
        subtitle={metrics.periodBalance >= 0 ? 'רווח' : 'הפסד'}
      />
      <KpiCard
        title="קצב שריפה חודשי"
        value={formatCurrencyAmount(metrics.monthlyBurn, 'ILS' as CurrencyCode)}
        icon={TrendingDown}
        iconColor="#E2445C"
        valueColor="#E2445C"
      />
      <KpiCard
        title="מנויים פעילים"
        value={String(metrics.activeSubCount)}
        icon={Layers}
        iconColor="#4F46E5"
      />
      <KpiCard
        title="הכנסות מחזוריות"
        value={formatCurrencyAmount(metrics.recurringIncome, 'ILS' as CurrencyCode)}
        icon={TrendingUp}
        iconColor="#00C875"
        valueColor="#00C875"
      />
      <KpiCard
        title={`הכנסות חד-פעמיות (${monthSuffix})`}
        value={formatCurrencyAmount(metrics.oneTimeIncome, 'ILS' as CurrencyCode)}
        icon={DollarSign}
        iconColor="#00C875"
        valueColor="#00C875"
      />
    </div>
  );
}

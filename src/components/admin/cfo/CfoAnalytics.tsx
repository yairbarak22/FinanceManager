'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrencyAmount, type CurrencyCode } from '@/lib/utils';
import type { AdminSubscription, AdminTransaction } from '@/types/admin-cfo';

interface CfoAnalyticsProps {
  subscriptions: AdminSubscription[];
  transactions: AdminTransaction[];
}

const PIE_COLORS = ['#2B4699', '#0DBACC', '#69ADFF', '#8B5CF6', '#E2E8F0', '#F18AB5'];

function formatILS(value: number): string {
  return formatCurrencyAmount(value, 'ILS' as CurrencyCode);
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

function PieTooltipContent({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white rounded-lg px-3 py-2 shadow-lg border border-[#F7F7F8] text-sm" dir="rtl">
      <p className="font-medium text-[#303150]">{name}</p>
      <p className="text-[#7E7F90]">{formatILS(value)}</p>
    </div>
  );
}

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
}

function BarTooltipContent({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg px-3 py-2 shadow-lg border border-[#F7F7F8] text-sm" dir="rtl">
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatILS(entry.value)}
        </p>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <p className="text-sm text-[#7E7F90]">אין מספיק נתונים להצגת תרשים</p>
    </div>
  );
}

export default function CfoAnalytics({ subscriptions, transactions }: CfoAnalyticsProps) {
  // ─── Expense breakdown (Donut) ────────────────────────────────

  const expenseChartData = useMemo(() => {
    const activeExpenses = subscriptions.filter(
      (s) => s.type === 'EXPENSE' && s.status === 'ACTIVE'
    );

    const expenseMap = new Map<string, number>();
    activeExpenses.forEach((sub) => {
      const key = sub.category || sub.title;
      expenseMap.set(key, (expenseMap.get(key) || 0) + sub.amount);
    });

    const sorted = Array.from(expenseMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const top5 = sorted.slice(0, 5);
    const otherSum = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);

    return [
      ...top5,
      ...(otherSum > 0 ? [{ name: 'אחר', value: otherSum }] : []),
    ];
  }, [subscriptions]);

  const hasExpenseData = expenseChartData.length > 0 && expenseChartData.some((d) => d.value > 0);

  // ─── Cashflow comparison (Bar) ────────────────────────────────

  const { cashflowData, totalIncome, totalExpense } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const activeIncomeSubs = subscriptions
      .filter((s) => s.type === 'INCOME' && s.status === 'ACTIVE')
      .reduce((sum, s) => sum + s.amount, 0);

    const thisMonthIncomeTxns = transactions
      .filter((t) => {
        if (t.type !== 'INCOME' || t.status !== 'COMPLETED') return false;
        const d = new Date(t.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const income = activeIncomeSubs + thisMonthIncomeTxns;

    const activeExpenseSubs = subscriptions
      .filter((s) => s.type === 'EXPENSE' && s.status === 'ACTIVE')
      .reduce((sum, s) => sum + s.amount, 0);

    const thisMonthExpenseTxns = transactions
      .filter((t) => {
        if (t.type !== 'EXPENSE') return false;
        const d = new Date(t.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = activeExpenseSubs + thisMonthExpenseTxns;

    return {
      cashflowData: [{ name: 'תזרים', הכנסות: income, הוצאות: expense }],
      totalIncome: income,
      totalExpense: expense,
    };
  }, [subscriptions, transactions]);

  const hasCashflowData = totalIncome > 0 || totalExpense > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Expense Breakdown Donut */}
      <div className="bg-white border border-[#F7F7F8] rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#303150] mb-4">התפלגות הוצאות קבועות</h3>
        {hasExpenseData ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseChartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {expenseChartData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltipContent />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs text-[#7E7F90] mr-1">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Cashflow Comparison Bar */}
      <div className="bg-white border border-[#F7F7F8] rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#303150] mb-4">הכנסות מול הוצאות - חודש נוכחי</h3>
        {hasCashflowData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashflowData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8ED" />
              <XAxis dataKey="name" hide />
              <YAxis
                tickFormatter={(v: number) => formatILS(v)}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#7E7F90' }}
                width={80}
              />
              <Tooltip content={<BarTooltipContent />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs text-[#7E7F90] mr-1">{value}</span>
                )}
              />
              <Bar dataKey="הכנסות" fill="#00C875" radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Bar dataKey="הוצאות" fill="#E2445C" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

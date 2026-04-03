'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Scale, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrencyAmount, type CurrencyCode } from '@/lib/utils';
import type { CfoData } from '@/types/admin-cfo';

interface CfoPnlReportProps {
  data: CfoData;
}

interface MonthRow {
  key: string;       // "YYYY-MM"
  label: string;     // "אפריל 2026"
  income: number;
  expense: number;
  net: number;
}

function formatILS(v: number) {
  return formatCurrencyAmount(Math.abs(v), 'ILS' as CurrencyCode);
}

function monthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('he-IL', {
    month: 'short',
    year: '2-digit',
  });
}

function monthLabelFull(ym: string): string {
  const [year, month] = ym.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('he-IL', {
    month: 'long',
    year: 'numeric',
  });
}

interface LineTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}
function LineTooltipContent({ active, payload, label }: LineTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-3 py-2.5 shadow-lg border border-[#F7F7F8] text-sm min-w-[160px]" dir="rtl">
      <p className="font-bold text-[#303150] mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
          <span className="text-[#303150] font-semibold" dir="ltr">
            {entry.value < 0 ? '-' : ''}{formatILS(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: number;
  positive: boolean | null; // null = neutral
  icon: typeof TrendingUp;
}

function KpiCard({ title, value, positive, icon: Icon }: KpiCardProps) {
  const color = positive === null ? '#7E7F90' : positive ? '#00C875' : '#E2445C';
  return (
    <div className="bg-white border border-[#F7F7F8] rounded-xl p-5 shadow-sm flex items-start gap-3">
      <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#7E7F90] mb-1">{title}</p>
        <p className="text-xl font-bold" style={{ color }}>
          {positive === false && value > 0 ? '-' : ''}{formatILS(value)}
        </p>
      </div>
    </div>
  );
}

export default function CfoPnlReport({ data }: CfoPnlReportProps) {
  const { rows, totals, chartData } = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();

    data.transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = map.get(key) ?? { income: 0, expense: 0 };
      if (t.type === 'INCOME' && t.status === 'COMPLETED') entry.income += t.amount;
      if (t.type === 'EXPENSE') entry.expense += t.amount;
      map.set(key, entry);
    });

    // Sort months chronologically
    const sorted: MonthRow[] = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { income, expense }]) => ({
        key,
        label: monthLabelFull(key),
        income,
        expense,
        net: income - expense,
      }));

    const totals = sorted.reduce(
      (acc, r) => ({
        income: acc.income + r.income,
        expense: acc.expense + r.expense,
        net: acc.net + r.net,
      }),
      { income: 0, expense: 0, net: 0 },
    );

    const chartData = sorted.map((r) => ({
      name: monthLabel(r.key),
      'הכנסות': r.income,
      'הוצאות': r.expense,
      'נטו': r.net,
    }));

    return { rows: sorted.reverse(), totals, chartData: chartData };
  }, [data.transactions]);

  const monthlyBurnRate = useMemo(() => {
    return data.subscriptions
      .filter((s) => s.status === 'ACTIVE' && s.type === 'EXPENSE')
      .reduce((sum, s) => sum + s.amount, 0);
  }, [data.subscriptions]);

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-[#F7F7F8] rounded-xl p-12 text-center shadow-sm">
        <p className="text-[#7E7F90] text-sm">אין תנועות להצגה עדיין</p>
        <p className="text-xs text-[#B0B1C0] mt-1">הוסף תנועות חד-פעמיות בספר הקופה</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="סה״כ הכנסות (כל הזמן)" value={totals.income} positive={true} icon={TrendingUp} />
        <KpiCard title="סה״כ הוצאות (כל הזמן)" value={totals.expense} positive={false} icon={TrendingDown} />
        <KpiCard title="רווח / הפסד נטו" value={Math.abs(totals.net)} positive={totals.net >= 0} icon={Scale} />
      </div>

      {/* Burn rate note */}
      {monthlyBurnRate > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
          <TrendingDown className="w-4 h-4 shrink-0" />
          <span>
            <strong>עלות קבועה חודשית (מנויים פעילים):</strong>{' '}
            {formatILS(monthlyBurnRate)} — לא כלול בחישוב הדוח
          </span>
        </div>
      )}

      {/* Trend Chart */}
      {chartData.length > 1 && (
        <div className="bg-white border border-[#F7F7F8] rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#303150] mb-5">מגמת הכנסות / הוצאות / נטו</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8ED" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#7E7F90' }}
              />
              <YAxis
                tickFormatter={(v: number) => formatILS(v)}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#7E7F90' }}
                width={80}
              />
              <Tooltip content={<LineTooltipContent />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs text-[#7E7F90] ms-1">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="הכנסות"
                stroke="#00C875"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#00C875' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="הוצאות"
                stroke="#E2445C"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#E2445C' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="נטו"
                stroke="#4F46E5"
                strokeWidth={2.5}
                strokeDasharray="5 3"
                dot={{ r: 4, fill: '#4F46E5' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Table */}
      <div className="bg-white border border-[#F7F7F8] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F7F7F8]">
          <h3 className="text-base font-bold text-[#303150]">פירוט חודשי</h3>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_120px_130px_44px] px-6 py-2 bg-[#F7F7F8] text-xs font-semibold text-[#7E7F90] border-b border-[#E8E8ED]">
          <span>חודש</span>
          <span className="text-end">הכנסות</span>
          <span className="text-end">הוצאות</span>
          <span className="text-end">רווח / הפסד</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#F7F7F8]">
          {rows.map((row) => {
            const isPositive = row.net >= 0;
            return (
              <div
                key={row.key}
                className="grid grid-cols-[1fr_120px_120px_130px_44px] px-6 py-3.5 items-center hover:bg-[#F7F7F8]/60 transition-colors"
              >
                {/* Month */}
                <span className="text-sm font-medium text-[#303150]">{row.label}</span>

                {/* Income */}
                <span className="text-sm font-semibold text-[#00C875] text-end">
                  {row.income > 0 ? formatILS(row.income) : '—'}
                </span>

                {/* Expense */}
                <span className="text-sm font-semibold text-[#E2445C] text-end">
                  {row.expense > 0 ? formatILS(row.expense) : '—'}
                </span>

                {/* Net */}
                <span
                  className="text-sm font-bold text-end"
                  style={{ color: isPositive ? '#00C875' : '#E2445C' }}
                >
                  {isPositive ? '+' : '-'}{formatILS(row.net)}
                </span>

                {/* Trend icon */}
                <div className="flex justify-center">
                  {row.net > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-[#00C875]" />
                  ) : row.net < 0 ? (
                    <ArrowDownRight className="w-4 h-4 text-[#E2445C]" />
                  ) : (
                    <Minus className="w-4 h-4 text-[#B0B1C0]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals footer */}
        <div className="grid grid-cols-[1fr_120px_120px_130px_44px] px-6 py-3.5 bg-[#F7F7F8] border-t border-[#E8E8ED]">
          <span className="text-sm font-bold text-[#303150]">סה&quot;כ</span>
          <span className="text-sm font-bold text-[#00C875] text-end">{formatILS(totals.income)}</span>
          <span className="text-sm font-bold text-[#E2445C] text-end">{formatILS(totals.expense)}</span>
          <span
            className="text-sm font-bold text-end"
            style={{ color: totals.net >= 0 ? '#00C875' : '#E2445C' }}
          >
            {totals.net >= 0 ? '+' : '-'}{formatILS(totals.net)}
          </span>
          <div className="flex justify-center">
            {totals.net >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-[#00C875]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#E2445C]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

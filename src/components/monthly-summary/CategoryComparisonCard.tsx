'use client';

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { CategoryBreakdownItem } from '@/lib/monthlyReport/calculations';

interface CategoryHistoryItem {
  monthKey: string;
  categories: CategoryBreakdownItem[];
}

interface CategoryComparisonCardProps {
  categoryHistory: CategoryHistoryItem[];
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'ינואר',
  '02': 'פברואר',
  '03': 'מרץ',
  '04': 'אפריל',
  '05': 'מאי',
  '06': 'יוני',
  '07': 'יולי',
  '08': 'אוגוסט',
  '09': 'ספטמבר',
  '10': 'אוקטובר',
  '11': 'נובמבר',
  '12': 'דצמבר',
};

const MONTH_COLORS = ['#B8D9FF', '#69ADFF', '#303150'];

function getMonthLabel(monthKey: string): string {
  const [, month] = monthKey.split('-');
  return MONTH_NAMES[month] || monthKey;
}

export default function CategoryComparisonCard({
  categoryHistory,
}: CategoryComparisonCardProps) {
  if (categoryHistory.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] flex items-center justify-center">
            <BarChart3
              className="w-4 h-4 text-[#69ADFF]"
              strokeWidth={1.75}
            />
          </div>
          <h3 className="text-[1.125rem] font-semibold text-[#303150]">
            השוואה לחודשים קודמים
          </h3>
        </div>
        <div className="py-8 text-center">
          <p className="text-[0.9375rem] text-[#7E7F90]">
            אין מספיק דוחות להשוואה
          </p>
          <p className="text-[0.8125rem] text-[#BDBDCB] mt-1">
            צור דוחות נוספים כדי לראות השוואה
          </p>
        </div>
      </motion.div>
    );
  }

  // Get top 4 categories from the latest month
  const latestCategories = categoryHistory[categoryHistory.length - 1].categories
    .slice(0, 4)
    .map((c) => c.category);

  // Build grouped bar data: each category is a group, each month is a bar
  const chartData = latestCategories.map((catId) => {
    const row: Record<string, string | number> = { category: '' };
    categoryHistory.forEach((monthData) => {
      const match = monthData.categories.find((c) => c.category === catId);
      const label = getMonthLabel(monthData.monthKey);
      row[label] = match?.amount || 0;
      if (!row.category) {
        row.category = match?.categoryName || catId;
      }
    });
    // Fall back to last match for category name
    const lastMatch = categoryHistory[categoryHistory.length - 1].categories.find(
      (c) => c.category === catId
    );
    if (lastMatch) row.category = lastMatch.categoryName;
    return row;
  });

  const monthLabels = categoryHistory.map((m) => getMonthLabel(m.monthKey));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
      className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] flex items-center justify-center">
          <BarChart3
            className="w-4 h-4 text-[#69ADFF]"
            strokeWidth={1.75}
          />
        </div>
        <h3 className="text-[1.125rem] font-semibold text-[#303150]">
          השוואה לחודשים קודמים
        </h3>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            barGap={2}
            barCategoryGap="20%"
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#BDBDCB' }}
              tickFormatter={(v: number) => `₪${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#303150' }}
              width={80}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-[#F7F7F8] text-[0.8125rem]">
                    <p className="font-semibold text-[#303150] mb-1">
                      {label}
                    </p>
                    {payload.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-[#7E7F90]">{p.name}:</span>
                        <span className="font-semibold text-[#303150]">
                          {formatCurrency(p.value as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '0.75rem', color: '#7E7F90' }}
            />
            {monthLabels.map((label, idx) => (
              <Bar
                key={label}
                dataKey={label}
                fill={MONTH_COLORS[idx % MONTH_COLORS.length]}
                radius={[0, 4, 4, 0]}
                maxBarSize={12}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

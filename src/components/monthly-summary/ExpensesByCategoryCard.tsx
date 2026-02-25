'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { SensitiveData } from '@/components/common/SensitiveData';
import type { CategoryBreakdownItem } from '@/lib/monthlyReport/calculations';

const CATEGORY_COLORS: Record<string, string> = {
  housing: '#303150',
  food: '#69ADFF',
  transport: '#0DBACC',
  entertainment: '#9F7FE0',
  bills: '#74ACEF',
  shopping: '#F18AB5',
  health: '#0DBACC',
  education: '#69ADFF',
  subscriptions: '#9F7FE0',
  savings: '#0DBACC',
  pets: '#74ACEF',
  gifts: '#F18AB5',
  personal_care: '#E9A800',
  communication: '#69ADFF',
  other: '#BDBDCB',
};

interface ExpensesByCategoryCardProps {
  categoryBreakdown: CategoryBreakdownItem[];
  totalExpenses: number;
  isFirstMonth: boolean;
  onCategoryClick: (category: string) => void;
}

export default function ExpensesByCategoryCard({
  categoryBreakdown,
  totalExpenses,
  isFirstMonth,
  onCategoryClick,
}: ExpensesByCategoryCardProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const chartData = categoryBreakdown.map((item) => ({
    ...item,
    color: CATEGORY_COLORS[item.category] || '#BDBDCB',
  }));

  const isEmpty = chartData.length === 0;
  const maxAmount = Math.max(...chartData.map((c) => c.amount), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
    >
      <h3 className="text-[1.125rem] font-semibold text-[#303150] mb-5">
        לאן הלך הכסף?
      </h3>

      {isEmpty ? (
        <div className="py-10 text-center">
          <p className="text-[0.9375rem] text-[#7E7F90]">
            לא נמצאו הוצאות לחודש זה
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Donut Chart with center total */}
          <div className="relative w-full lg:w-[200px] h-[200px] flex-shrink-0 mx-auto lg:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="categoryName"
                  onMouseEnter={(_, idx) =>
                    setHoveredId(chartData[idx]?.category || null)
                  }
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={entry.color}
                      opacity={
                        hoveredId && hoveredId !== entry.category ? 0.4 : 1
                      }
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as (typeof chartData)[0];
                    return (
                      <div className="bg-white rounded-xl px-3 py-2 shadow-lg border border-[#F7F7F8] text-[0.8125rem]">
                        <p className="font-semibold text-[#303150]">
                          {d.categoryName}
                        </p>
                        <p className="text-[#7E7F90]">
                          {formatCurrency(d.amount)} ({d.percentage}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <SensitiveData>
                <span className="text-[1.125rem] font-bold text-[#303150]">
                  {formatCurrency(totalExpenses)}
                </span>
              </SensitiveData>
              <span className="text-[0.6875rem] text-[#BDBDCB]">
                סה&quot;כ
              </span>
            </div>
          </div>

          {/* Category list with percentage bars */}
          <div className="flex-1 space-y-1.5 min-w-0">
            {chartData.map((item) => {
              const barWidth = (item.amount / maxAmount) * 100;

              return (
                <button
                  key={item.category}
                  onClick={() => onCategoryClick(item.category)}
                  onMouseEnter={() => setHoveredId(item.category)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    hoveredId === item.category
                      ? 'bg-[#F7F7F8] scale-[1.01]'
                      : 'hover:bg-[#F7F7F8]'
                  }`}
                >
                  {/* Color dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />

                  {/* Name */}
                  <span className="text-[0.875rem] text-[#303150] text-start truncate min-w-[5rem]">
                    {item.categoryName}
                  </span>

                  {/* Percentage bar */}
                  <div className="flex-1 h-2 bg-[#F5F5F7] rounded-full overflow-hidden min-w-[4rem]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color, opacity: 0.6 }}
                    />
                  </div>

                  {/* Amount + trend */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SensitiveData>
                      <span className="text-[0.8125rem] font-semibold text-[#303150]">
                        {formatCurrency(item.amount)}
                      </span>
                    </SensitiveData>

                    <span className="text-[0.6875rem] font-medium min-w-[3.5rem] text-start">
                      {isFirstMonth || item.changeFromPrev === null ? (
                        <span className="text-[#BDBDCB]">—</span>
                      ) : item.changeFromPrev > 0 ? (
                        <span className="text-[#F18AB5]">
                          ▲ {item.changeFromPrev}%
                        </span>
                      ) : item.changeFromPrev < 0 ? (
                        <span className="text-[#0DBACC]">
                          ▼ {Math.abs(item.changeFromPrev)}%
                        </span>
                      ) : (
                        <span className="text-[#BDBDCB]">—</span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

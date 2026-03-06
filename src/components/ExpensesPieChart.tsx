'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Transaction, RecurringTransaction } from '@/lib/types';
import { getCategoryInfo, CategoryInfo } from '@/lib/categories';
import { SensitiveData } from './common/SensitiveData';

type BreakdownMode = 'expense' | 'income';

interface ExpensesPieChartProps {
  transactions: Transaction[];
  recurringExpenses?: RecurringTransaction[];
  customExpenseCategories?: CategoryInfo[];
  customIncomeCategories?: CategoryInfo[];
  selectedCategory?: string | null;
  onCategoryClick?: (category: string) => void;
}

const EXPENSE_COLORS: Record<string, string> = {
  food: '#F18AB5',
  transportation: '#69ADFF',
  housing: '#0DBACC',
  utilities: '#9F7FE0',
  entertainment: '#74ACEF',
  shopping: '#F18AB5',
  health: '#0DBACC',
  education: '#69ADFF',
  other: '#BDBDCB',
};

const INCOME_COLORS: Record<string, string> = {
  salary: '#0DBACC',
  freelance: '#69ADFF',
  rental: '#74ACEF',
  investments: '#9F7FE0',
  gifts: '#F18AB5',
  government: '#0DBACC',
  business: '#69ADFF',
  pension: '#74ACEF',
  other_income: '#BDBDCB',
  other: '#BDBDCB',
};

const MODE_CONFIG = {
  expense: {
    label: 'הוצאות',
    totalLabel: 'סה"כ הוצאות',
    emptyTitle: 'אין הוצאות להצגה',
    emptySubtitle: 'הוסף הוצאות כדי לראות את הפילוח',
    srTitle: 'סיכום התפלגות הוצאות',
    accentColor: '#F18AB5',
    accentBg: 'rgba(241, 138, 181, 0.1)',
  },
  income: {
    label: 'הכנסות',
    totalLabel: 'סה"כ הכנסות',
    emptyTitle: 'אין הכנסות להצגה',
    emptySubtitle: 'הוסף הכנסות כדי לראות את הפילוח',
    srTitle: 'סיכום התפלגות הכנסות',
    accentColor: '#0DBACC',
    accentBg: 'rgba(13, 186, 204, 0.1)',
  },
} as const;

const MODES: BreakdownMode[] = ['expense', 'income'];

function useAnimatedNumber(value: number, duration = 500): number {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    let startTs: number | null = null;
    let raf: number;

    function tick(now: number) {
      if (startTs === null) startTs = now;
      const progress = Math.min((now - startTs) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

export default function ExpensesPieChart({
  transactions,
  recurringExpenses = [],
  customExpenseCategories = [],
  customIncomeCategories = [],
  selectedCategory = null,
  onCategoryClick,
}: ExpensesPieChartProps) {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [mode, setMode] = useState<BreakdownMode>('expense');
  const [direction, setDirection] = useState(0);
  const prefersReduced = useReducedMotion();

  const hasSelection = selectedCategory !== null;
  const config = MODE_CONFIG[mode];

  const { data: expenseData, total: totalExpenses } = useMemo(() => {
    const byCategory = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    recurringExpenses
      .filter((r) => r.type === 'expense' && r.isActive)
      .forEach((r) => {
        byCategory[r.category] = (byCategory[r.category] || 0) + r.amount;
      });

    const total = Object.values(byCategory).reduce((a, b) => a + b, 0);

    const chartData = Object.entries(byCategory)
      .map(([category, amount]) => {
        const categoryInfo = getCategoryInfo(category, 'expense', customExpenseCategories);
        return {
          id: category,
          name: categoryInfo?.nameHe || category,
          value: amount,
          color: EXPENSE_COLORS[category] || categoryInfo?.color || '#BDBDCB',
          percentage: total > 0 ? ((amount / total) * 100).toFixed(0) : '0',
        };
      })
      .sort((a, b) => b.value - a.value);

    return { data: chartData, total };
  }, [transactions, recurringExpenses, customExpenseCategories]);

  const { data: incomeData, total: totalIncome } = useMemo(() => {
    const byCategory = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    recurringExpenses
      .filter((r) => r.type === 'income' && r.isActive)
      .forEach((r) => {
        byCategory[r.category] = (byCategory[r.category] || 0) + r.amount;
      });

    const total = Object.values(byCategory).reduce((a, b) => a + b, 0);

    const chartData = Object.entries(byCategory)
      .map(([category, amount]) => {
        const categoryInfo = getCategoryInfo(category, 'income', customIncomeCategories);
        return {
          id: category,
          name: categoryInfo?.nameHe || category,
          value: amount,
          color: INCOME_COLORS[category] || categoryInfo?.color || '#BDBDCB',
          percentage: total > 0 ? ((amount / total) * 100).toFixed(0) : '0',
        };
      })
      .sort((a, b) => b.value - a.value);

    return { data: chartData, total };
  }, [transactions, recurringExpenses, customIncomeCategories]);

  const data = mode === 'expense' ? expenseData : incomeData;
  const total = mode === 'expense' ? totalExpenses : totalIncome;
  const animatedTotal = useAnimatedNumber(total);

  const handleModeSwitch = (newMode: BreakdownMode) => {
    if (newMode === mode) return;
    setDirection(newMode === 'income' ? 1 : -1);
    setHoveredItemId(null);
    setMode(newMode);
  };

  const slideVariants = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: (d: number) => ({ opacity: 0, x: d * 40, scale: 0.96 }),
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: (d: number) => ({ opacity: 0, x: d * -40, scale: 0.96 }),
      };

  const legendItemVariants = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: (i: number) => ({
          opacity: 1,
          y: 0,
          transition: { delay: 0.04 * i, duration: 0.25, ease: 'easeOut' },
        }),
      };

  return (
    <div className="flex flex-col h-full">
      {/* Segmented Control with animated indicator */}
      <div
        className="relative flex rounded-xl p-1 mb-4 flex-shrink-0"
        style={{ backgroundColor: '#F7F7F8' }}
        role="tablist"
        aria-label="בחר סוג פילוח"
      >
        {MODES.map((m) => {
          const isActive = mode === m;
          const mConfig = MODE_CONFIG[m];
          return (
            <button
              key={m}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleModeSwitch(m)}
              className="relative z-10 flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              style={{
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: isActive ? '#303150' : '#7E7F90',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="pie-mode-indicator"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10">{mConfig.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content area with AnimatePresence */}
      <AnimatePresence mode="wait" custom={direction}>
        {data.length === 0 ? (
          <motion.div
            key={`empty-${mode}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: config.accentBg }}
            >
              <PieChartIcon className="w-8 h-8" style={{ color: config.accentColor }} strokeWidth={1.5} />
            </div>
            <p className="text-sm mb-1" style={{ color: '#7E7F90' }}>
              {config.emptyTitle}
            </p>
            <p className="text-xs" style={{ color: '#BDBDCB' }}>
              {config.emptySubtitle}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={mode}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Accessible Summary */}
            <div className="sr-only">
              <h4>{config.srTitle}</h4>
              <p>{config.totalLabel}: {formatCurrency(total)}</p>
              <table>
                <caption>פירוט לפי קטגוריה</caption>
                <thead>
                  <tr><th>קטגוריה</th><th>סכום</th><th>אחוז</th></tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{formatCurrency(item.value)}</td>
                      <td>{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Header + Donut */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-1">
                <h3
                  className="text-sm font-medium mb-2"
                  style={{
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    color: '#7E7F90',
                  }}
                >
                  התפלגות {config.label}
                </h3>
                <SensitiveData
                  as="p"
                  className="text-3xl font-bold mb-1"
                  style={{
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    color: '#303150',
                  }}
                >
                  {formatCurrency(animatedTotal)}
                </SensitiveData>
                <p className="text-xs" style={{ color: '#7E7F90' }}>
                  {config.totalLabel}
                </p>
              </div>

              <div className="relative w-32 h-32 flex-shrink-0" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                      animationDuration={500}
                      animationEasing="ease-out"
                    >
                      {data.map((entry) => {
                        const isSelected = selectedCategory === entry.id;
                        const isHovered = hoveredItemId === entry.id;
                        const isDimmed = hasSelection && !isSelected;

                        return (
                          <Cell
                            key={entry.id}
                            fill={entry.color}
                            style={{
                              filter: (isHovered || isSelected)
                                ? `drop-shadow(0 0 8px ${entry.color}66)`
                                : 'none',
                              transform: isSelected
                                ? 'scale(1.12)'
                                : isHovered
                                  ? 'scale(1.07)'
                                  : 'scale(1)',
                              opacity: isDimmed ? 0.4 : 1,
                              transformOrigin: 'center',
                              transition: 'all 250ms ease-out',
                              cursor: onCategoryClick ? 'pointer' : 'default',
                            }}
                            onClick={() => onCategoryClick?.(entry.id)}
                            onMouseEnter={() => setHoveredItemId(entry.id)}
                            onMouseLeave={() => setHoveredItemId(null)}
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend with staggered entry */}
            <div
              className="flex-1 flex flex-col px-2 overflow-y-auto max-h-[250px] scrollbar-ghost"
              onMouseLeave={() => setHoveredItemId(null)}
            >
              {data.map((item, i) => {
                const isHovered = hoveredItemId === item.id;
                const isSelected = selectedCategory === item.id;
                const isActive = isHovered || isSelected;
                const isDimmed = hasSelection && !isSelected && !isHovered;

                return (
                  <motion.div
                    key={item.id}
                    custom={i}
                    variants={legendItemVariants}
                    initial="initial"
                    animate="animate"
                    role="button"
                    tabIndex={0}
                    className="flex items-center justify-between py-2 rounded-lg px-2 -mx-2"
                    style={{
                      opacity: isDimmed ? 0.4 : 1,
                      backgroundColor: isSelected ? `${item.color}15` : 'transparent',
                      boxShadow: isSelected ? `inset 0 0 0 1px ${item.color}40` : 'none',
                      cursor: onCategoryClick ? 'pointer' : 'default',
                      transition: 'background-color 250ms ease-out, box-shadow 250ms ease-out, opacity 250ms ease-out',
                    }}
                    onClick={() => onCategoryClick?.(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onCategoryClick?.(item.id);
                      }
                    }}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                  >
                    <div className="flex items-center gap-2 pr-4">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: item.color,
                          transform: isActive ? 'scale(1.3)' : 'scale(1)',
                          boxShadow: isActive ? `0 0 6px ${item.color}66` : 'none',
                          transition: 'all 250ms ease-out',
                        }}
                      />
                      <SensitiveData
                        as="span"
                        className="text-right"
                        style={{
                          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          color: isActive ? '#303150' : '#7E7F90',
                          fontWeight: isActive ? 700 : 400,
                          fontSize: isActive ? '16px' : '14px',
                          transition: 'all 250ms ease-out',
                        }}
                      >
                        {item.name}
                      </SensitiveData>
                    </div>

                    <div className="flex items-center gap-2 pl-4">
                      <SensitiveData
                        as="span"
                        style={{
                          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          color: '#303150',
                          fontWeight: 600,
                          fontSize: '14px',
                          opacity: isActive ? 1 : 0,
                          maxWidth: isActive ? '120px' : '0px',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          transform: isActive ? 'translateX(0)' : 'translateX(-12px)',
                          transition: 'all 250ms ease-out',
                        }}
                      >
                        {formatCurrency(item.value)}
                      </SensitiveData>

                      <SensitiveData
                        as="span"
                        className="text-left"
                        style={{
                          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                          color: isActive ? '#303150' : '#7E7F90',
                          fontWeight: isActive ? 700 : 400,
                          fontSize: isActive ? '16px' : '14px',
                          minWidth: '40px',
                          transition: 'all 250ms ease-out',
                        }}
                      >
                        {item.percentage}%
                      </SensitiveData>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

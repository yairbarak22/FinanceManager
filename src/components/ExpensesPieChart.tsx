'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Transaction, RecurringTransaction } from '@/lib/types';
import { getCategoryInfo, CategoryInfo } from '@/lib/categories';
import { SensitiveData } from './common/SensitiveData';

interface ExpensesPieChartProps {
  transactions: Transaction[];
  recurringExpenses?: RecurringTransaction[];
  customExpenseCategories?: CategoryInfo[];
  selectedCategory?: string | null;
  onCategoryClick?: (category: string) => void;
}

// Fincheck style color palette
const EXPENSE_COLORS: Record<string, string> = {
  food: '#F18AB5',           // Cotton Candy
  transportation: '#69ADFF', // Dodger Blue
  housing: '#0DBACC',        // Turquoise
  utilities: '#9F7FE0',      // Lavender
  entertainment: '#74ACEF',  // Baby Blue
  shopping: '#F18AB5',       // Cotton Candy
  health: '#0DBACC',         // Turquoise
  education: '#69ADFF',      // Dodger Blue
  other: '#BDBDCB',          // Light Grey
};

export default function ExpensesPieChart({ 
  transactions, 
  recurringExpenses = [], 
  customExpenseCategories = [],
  selectedCategory = null,
  onCategoryClick
}: ExpensesPieChartProps) {
  // Hover state for synchronized chart/legend interaction
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
  // Check if any category is selected (for dimming non-selected items)
  const hasSelection = selectedCategory !== null;

  // Calculate expenses by category - memoized
  // Includes both regular transactions and recurring expenses
  const { data, totalExpenses } = useMemo(() => {
    // Start with regular transaction expenses
    const expensesByCategory = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Add recurring expenses by their categories
    recurringExpenses
      .filter((r) => r.type === 'expense' && r.isActive)
      .forEach((r) => {
        expensesByCategory[r.category] = (expensesByCategory[r.category] || 0) + r.amount;
      });

    const total = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);

    const chartData = Object.entries(expensesByCategory)
      .map(([category, amount]) => {
        const categoryInfo = getCategoryInfo(category, 'expense', customExpenseCategories);
        return {
          id: category,
          name: categoryInfo?.nameHe || category,
          value: amount,
          color: EXPENSE_COLORS[category] || categoryInfo?.color || '#BDBDCB',
          percentage: ((amount / total) * 100).toFixed(0),
        };
      })
      .sort((a, b) => b.value - a.value);

    return { data: chartData, totalExpenses: total };
  }, [transactions, recurringExpenses, customExpenseCategories]);

  if (data.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(241, 138, 181, 0.1)' }}
        >
          <PieChartIcon className="w-8 h-8" style={{ color: '#F18AB5' }} strokeWidth={1.5} />
        </div>
        <p 
          className="text-sm mb-1"
          style={{ color: '#7E7F90' }}
        >
          אין הוצאות להצגה
        </p>
        <p 
          className="text-xs"
          style={{ color: '#BDBDCB' }}
        >
          הוסף הוצאות כדי לראות את הפילוח
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Accessible Summary for Screen Readers */}
      <div className="sr-only">
        <h4>סיכום התפלגות הוצאות</h4>
        <p>סה"כ הוצאות: {formatCurrency(totalExpenses)}</p>
        <table>
          <caption>פירוט הוצאות לפי קטגוריה</caption>
          <thead>
            <tr>
              <th>קטגוריה</th>
              <th>סכום</th>
              <th>אחוז</th>
            </tr>
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

      {/* Hybrid Layout: Header/Summary on Left, Chart on Right */}
      <div className="flex items-start gap-4 mb-6">
        {/* Left Side: Title & Summary */}
        <div className="flex-1">
          <h3 
            className="text-sm font-medium mb-2"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#7E7F90'
            }}
          >
            התפלגות הוצאות
          </h3>
          <SensitiveData 
            as="p" 
            className="text-3xl font-bold mb-1"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#1D1D35'
            }}
          >
            {formatCurrency(totalExpenses)}
          </SensitiveData>
          <p 
            className="text-xs"
            style={{ color: '#7E7F90' }}
          >
            סה"כ הוצאות
          </p>
        </div>

        {/* Right Side: Donut Chart */}
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
          
          {/* Center - subtle icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <PieChartIcon className="w-5 h-5" style={{ color: '#BDBDCB' }} strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Legend - Right-aligned text, left-aligned percentages, with scrolling */}
      <div 
        className="flex-1 flex flex-col mt-5 px-2 overflow-y-auto max-h-[250px]"
        onMouseLeave={() => setHoveredItemId(null)}
      >
        {data.map((item) => {
          const isHovered = hoveredItemId === item.id;
          const isSelected = selectedCategory === item.id;
          const isActive = isHovered || isSelected;
          const isDimmed = hasSelection && !isSelected && !isHovered;
          
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              className="flex items-center justify-between py-2 rounded-lg px-2 -mx-2"
              style={{
                opacity: isDimmed ? 0.4 : 1,
                backgroundColor: isSelected ? `${item.color}15` : 'transparent',
                boxShadow: isSelected ? `inset 0 0 0 1px ${item.color}40` : 'none',
                cursor: onCategoryClick ? 'pointer' : 'default',
                transition: 'all 250ms ease-out',
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
              {/* Left Side: Colored Dot + Name */}
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
              
              {/* Right Side: Amount (slides in) + Percentage */}
              <div className="flex items-center gap-2 pl-4">
                {/* Amount - slides in from left, pushes percentage right */}
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
                
                {/* Percentage */}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Transaction } from '@/lib/types';
import { getCategoryInfo, CategoryInfo } from '@/lib/categories';
import { SensitiveData } from './common/SensitiveData';

interface ExpensesPieChartProps {
  transactions: Transaction[];
  customExpenseCategories?: CategoryInfo[];
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

export default function ExpensesPieChart({ transactions, customExpenseCategories = [] }: ExpensesPieChartProps) {
  // Hover state for synchronized chart/legend interaction
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Calculate expenses by category - memoized
  const { data, totalExpenses } = useMemo(() => {
    const expensesByCategory = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

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
  }, [transactions, customExpenseCategories]);

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
                {data.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.color}
                    style={{
                      filter: hoveredItemId === entry.id 
                        ? `drop-shadow(0 0 8px ${entry.color}33)` 
                        : 'none',
                      transform: hoveredItemId === entry.id 
                        ? 'scale(1.07)' 
                        : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'all 250ms ease-out',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setHoveredItemId(entry.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                  />
                ))}
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
          const hasHover = hoveredItemId !== null;
          
          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 cursor-pointer"
              style={{
                opacity: hasHover && !isHovered ? 0.4 : 1,
                transition: 'all 250ms ease-out',
              }}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              {/* Left Side: Colored Dot + Name */}
              <div className="flex items-center gap-2 pr-4">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <SensitiveData 
                  as="span"
                  className="text-right"
                  style={{ 
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    color: isHovered ? '#303150' : '#7E7F90',
                    fontWeight: isHovered ? 700 : 400,
                    fontSize: isHovered ? '16px' : '14px',
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
                    opacity: isHovered ? 1 : 0,
                    maxWidth: isHovered ? '120px' : '0px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transform: isHovered ? 'translateX(0)' : 'translateX(-12px)',
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
                    color: isHovered ? '#303150' : '#7E7F90',
                    fontWeight: isHovered ? 700 : 400,
                    fontSize: isHovered ? '16px' : '14px',
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

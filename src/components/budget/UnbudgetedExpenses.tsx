'use client';

import React from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { CategoryInfo } from '@/lib/categories';

interface UnbudgetedItem {
  categoryId: string;
  totalSpent: number;
}

interface UnbudgetedExpensesProps {
  expenses: UnbudgetedItem[];
  getCategoryInfo: (categoryId: string) => CategoryInfo | undefined;
  onAddBudget: (categoryId: string) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function UnbudgetedExpenses({
  expenses,
  getCategoryInfo,
  onAddBudget,
}: UnbudgetedExpensesProps) {
  if (expenses.length === 0) return null;

  return (
    <div
      className="rounded-3xl p-6"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-[#E9A800]" strokeWidth={1.75} />
        <h3
          style={{
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            fontWeight: 700,
            fontSize: '18px',
            color: '#303150',
          }}
        >
          הוצאות לא מתוקצבות
        </h3>
      </div>
      <p
        className="mb-4"
        style={{
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          fontWeight: 400,
          fontSize: '13px',
          color: '#7E7F90',
        }}
      >
        קטגוריות עם הוצאות שלא הוגדר להן תקציב החודש
      </p>

      <div className="space-y-2">
        {expenses.map((expense) => {
          const info = getCategoryInfo(expense.categoryId);
          const Icon = info?.icon;
          const iconBg = info?.bgColor || 'bg-gray-100';
          const iconText = info?.textColor || 'text-gray-600';

          return (
            <div
              key={expense.categoryId}
              className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-[#F7F7F8] transition-colors group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                {Icon && <Icon className={`w-[18px] h-[18px] ${iconText}`} strokeWidth={1.75} />}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  style={{
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#303150',
                  }}
                >
                  {info?.nameHe || expense.categoryId}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#F18AB5',
                }}
              >
                {formatCurrency(expense.totalSpent)}
              </span>
              <button
                onClick={() => onAddBudget(expense.categoryId)}
                className="p-1.5 rounded-lg hover:bg-[#69ADFF]/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="הוסף תקציב לקטגוריה"
              >
                <Plus className="w-4 h-4 text-[#69ADFF]" strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

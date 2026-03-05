'use client';

import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { CategoryInfo } from '@/lib/categories';
import BudgetProgressBar from './BudgetProgressBar';

interface BudgetCategoryRowProps {
  categoryInfo: CategoryInfo | undefined;
  categoryId: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  onEdit: () => void;
  onDelete: () => void;
  animationDelay?: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BudgetCategoryRow({
  categoryInfo,
  categoryId,
  budgetAmount,
  spent,
  remaining,
  percentage,
  onEdit,
  onDelete,
  animationDelay = 0,
}: BudgetCategoryRowProps) {
  const Icon = categoryInfo?.icon;
  const iconBgColor = categoryInfo?.bgColor || 'bg-gray-100';
  const iconTextColor = categoryInfo?.textColor || 'text-gray-600';
  const categoryName = categoryInfo?.nameHe || categoryId;

  const remainingColor = remaining >= 0 ? '#0DBACC' : '#F18AB5';

  return (
    <div
      className="flex items-center gap-4 py-4 px-2 rounded-2xl transition-all duration-200 hover:bg-[#F7F7F8] group"
      style={{
        animation: `fadeSlideIn 400ms ease-out ${animationDelay}ms both`,
      }}
    >
      {/* Category icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgColor}`}
      >
        {Icon && <Icon className={`w-5 h-5 ${iconTextColor}`} strokeWidth={1.75} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              fontWeight: 600,
              fontSize: '15px',
              color: '#303150',
            }}
          >
            {categoryName}
          </span>
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                color: '#303150',
              }}
              dir="ltr"
            >
              {formatCurrency(spent)} / {formatCurrency(budgetAmount)}
            </span>
          </div>
        </div>

        <BudgetProgressBar percentage={percentage} height={6} />

        <div className="flex items-center justify-between mt-1.5">
          <span
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              color: remainingColor,
            }}
          >
            {remaining >= 0
              ? `נותרו ${formatCurrency(remaining)}`
              : `חריגה של ${formatCurrency(Math.abs(remaining))}`}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              fontWeight: 500,
              fontSize: '12px',
              color: '#BDBDCB',
            }}
            dir="ltr"
          >
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-[#E8E8ED] transition-colors cursor-pointer"
          aria-label="ערוך תקציב"
        >
          <Pencil className="w-4 h-4 text-[#7E7F90]" strokeWidth={1.75} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-[#F18AB5]/10 transition-colors cursor-pointer"
          aria-label="מחק תקציב"
        >
          <Trash2 className="w-4 h-4 text-[#BDBDCB] hover:text-[#F18AB5]" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { CategoryInfo } from '@/lib/categories';
import { BUDGET_GRID_COLS } from './budgetGridCols';

interface BudgetCategoryRowProps {
  categoryInfo: CategoryInfo | undefined;
  categoryId: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  onUpdateAmount: (categoryId: string, newAmount: number) => Promise<void>;
  onDelete: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPercentColor(pct: number): string {
  if (pct > 100) return '#F18AB5';
  if (pct > 75) return '#E9A800';
  return '#0DBACC';
}

export default function BudgetCategoryRow({
  categoryInfo,
  categoryId,
  budgetAmount,
  spent,
  remaining,
  percentage,
  onUpdateAmount,
  onDelete,
}: BudgetCategoryRowProps) {
  const Icon = categoryInfo?.icon;
  const iconBgColor = categoryInfo?.bgColor || 'bg-gray-100';
  const iconTextColor = categoryInfo?.textColor || 'text-gray-600';
  const categoryName = categoryInfo?.nameHe || categoryId;
  const remainingColor = remaining >= 0 ? '#0DBACC' : '#F18AB5';
  const pctColor = getPercentColor(percentage);

  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState(budgetAmount.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedAmount(budgetAmount.toString());
  }, [budgetAmount]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    const parsed = parseFloat(editedAmount);
    if (parsed && parsed > 0 && parsed !== budgetAmount) {
      try {
        await onUpdateAmount(categoryId, parsed);
      } catch {
        setEditedAmount(budgetAmount.toString());
      }
    } else {
      setEditedAmount(budgetAmount.toString());
    }
    setIsEditing(false);
  }, [editedAmount, budgetAmount, categoryId, onUpdateAmount]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditedAmount(budgetAmount.toString());
      setIsEditing(false);
    }
  }, [handleSave, budgetAmount]);

  return (
    <div
      className={`${BUDGET_GRID_COLS} group items-center border-b transition-colors hover:bg-[#F7F7F8]`}
      style={{
        borderColor: '#F7F7F8',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
    >
      {/* Icon */}
      <div className="flex items-center justify-center py-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
          {Icon && <Icon className={`w-[18px] h-[18px] ${iconTextColor}`} strokeWidth={1.75} />}
        </div>
      </div>

      {/* Category name */}
      <div className="py-3 pe-3 min-w-0">
        <span className="block truncate" style={{ fontSize: '14px', fontWeight: 600, color: '#303150' }}>
          {categoryName}
        </span>
      </div>

      {/* Budget amount - inline editable */}
      <div className="py-3 px-2">
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={editedAmount}
            onChange={(e) => setEditedAmount(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            min="1"
            step="1"
            dir="ltr"
            className="w-full px-2 py-1 rounded-lg border text-sm text-center"
            style={{
              borderColor: '#69ADFF',
              boxShadow: '0 0 0 3px rgba(105,173,255,0.2)',
              color: '#303150',
              outline: 'none',
              fontFamily: 'var(--font-nunito)',
            }}
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="block text-center cursor-text px-2 py-1 rounded-lg transition-colors hover:bg-[#F7F7F8]"
            style={{ fontSize: '14px', fontWeight: 500, color: '#303150' }}
            dir="ltr"
          >
            {formatCurrency(budgetAmount)}
          </span>
        )}
      </div>

      {/* Spent */}
      <div className="py-3 px-2 text-center" dir="ltr">
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#303150' }}>
          {formatCurrency(spent)}
        </span>
      </div>

      {/* Remaining */}
      <div className="py-3 px-2 text-center" dir="ltr">
        <span style={{ fontSize: '14px', fontWeight: 600, color: remainingColor }}>
          {formatCurrency(remaining)}
        </span>
      </div>

      {/* Percentage badge */}
      <div className="py-3 px-2 flex items-center justify-center">
        <div
          className="w-full h-7 rounded flex items-center justify-center"
          style={{ backgroundColor: `${pctColor}18` }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: pctColor }} dir="ltr">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Delete */}
      <div className="py-3 flex items-center justify-center">
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[#F18AB5]/10 cursor-pointer"
          aria-label="מחק תקציב"
        >
          <Trash2 className="w-4 h-4 text-[#BDBDCB] hover:text-[#F18AB5] transition-colors" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

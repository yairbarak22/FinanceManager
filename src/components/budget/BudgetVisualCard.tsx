'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Loader2, Pencil, Check } from 'lucide-react';
import { CategoryInfo } from '@/lib/categories';
import BudgetPieRing from './BudgetPieRing';

interface BudgetVisualCardProps {
  categoryInfo: CategoryInfo | undefined;
  categoryId: string;
  displayName?: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  onUpdateAmount: (categoryId: string, newAmount: number) => Promise<void>;
  onDelete: () => void | Promise<void>;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BudgetVisualCard({
  categoryInfo,
  categoryId,
  displayName,
  budgetAmount,
  spent,
  remaining,
  percentage,
  onUpdateAmount,
  onDelete,
}: BudgetVisualCardProps) {
  const Icon = categoryInfo?.icon;
  const iconBgColor = categoryInfo?.bgColor || 'bg-gray-100';
  const iconTextColor = categoryInfo?.textColor || 'text-gray-600';
  const categoryName = displayName || categoryInfo?.nameHe || categoryId;
  const remainingColor = remaining >= 0 ? '#0DBACC' : '#F18AB5';

  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState(budgetAmount.toString());
  const [isSavingAmount, setIsSavingAmount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
      setIsSavingAmount(true);
      try {
        await onUpdateAmount(categoryId, parsed);
      } catch {
        setEditedAmount(budgetAmount.toString());
      } finally {
        setIsSavingAmount(false);
      }
    } else {
      setEditedAmount(budgetAmount.toString());
    }
    setIsEditing(false);
  }, [editedAmount, budgetAmount, categoryId, onUpdateAmount]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        setEditedAmount(budgetAmount.toString());
        setIsEditing(false);
      }
    },
    [handleSave, budgetAmount],
  );

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [onDelete]);

  return (
    <div
      className="group rounded-3xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-md"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
    >
      {/* Top row: icon + name + delete */}
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgColor}`}
        >
          {Icon && (
            <Icon
              className={`w-[18px] h-[18px] ${iconTextColor}`}
              strokeWidth={1.75}
            />
          )}
        </div>
        <span
          className="flex-1 min-w-0 truncate"
          style={{ fontSize: '15px', fontWeight: 600, color: '#303150' }}
        >
          {categoryName}
        </span>
        {isDeleting ? (
          <Loader2
            className="w-4 h-4 animate-spin text-[#F18AB5] flex-shrink-0"
            strokeWidth={2}
          />
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[#F18AB5]/10 cursor-pointer"
            aria-label="מחק תקציב"
          >
            <Trash2
              className="w-4 h-4 text-[#BDBDCB] hover:text-[#F18AB5] transition-colors"
              strokeWidth={1.75}
            />
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: '#FFF5F7', border: '1px solid #F18AB520' }}
        >
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#303150', flex: 1 }}>
            למחוק את התקציב?
          </span>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{ background: '#F18AB5', color: '#FFFFFF' }}
          >
            {isDeleting ? '...' : 'מחק'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{ color: '#7E7F90' }}
          >
            ביטול
          </button>
        </div>
      )}

      {/* Center: pie ring */}
      <div className="flex items-center justify-center">
        <BudgetPieRing percentage={percentage} size={72} strokeWidth={5} />
      </div>

      {/* Bottom: budget / spent / remaining */}
      <div className="grid grid-cols-3 gap-2 text-center min-w-0">
        {/* Budget – inline editable */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            style={{ fontSize: '11px', fontWeight: 500, color: '#7E7F90' }}
          >
            תקציב
          </span>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={editedAmount}
                onChange={(e) => setEditedAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                min="1"
                step="1"
                dir="ltr"
                className="flex-1 min-w-0 px-1.5 text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{
                  background: '#F4F5F7',
                  borderRadius: '6px',
                  border: '1.5px solid #69ADFF',
                  boxShadow: '0 0 0 3px rgba(105,173,255,0.15)',
                  color: '#303150',
                  outline: 'none',
                  fontFamily: 'var(--font-nunito)',
                  fontWeight: 600,
                  height: '30px',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={isSavingAmount}
                className="flex-shrink-0 flex items-center justify-center cursor-pointer transition-opacity"
                style={{
                  width: '20px',
                  height: '20px',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  opacity: isSavingAmount ? 0.5 : 1,
                }}
                aria-label="אישור"
              >
                {isSavingAmount ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#69ADFF]" strokeWidth={2} />
                ) : (
                  <Check className="w-3.5 h-3.5 text-[#69ADFF]" strokeWidth={2.5} />
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center gap-1 cursor-pointer min-w-0 w-full"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                height: '30px',
              }}
            >
              {budgetAmount === 0 ? (
                <span className="whitespace-nowrap" style={{ fontSize: '13px', fontWeight: 500, color: '#69ADFF' }}>
                  קבע תקציב
                </span>
              ) : (
                <>
                  <span
                    className="whitespace-nowrap"
                    style={{ fontSize: '14px', fontWeight: 600, color: '#303150' }}
                    dir="ltr"
                  >
                    {formatCurrency(budgetAmount)}
                  </span>
                  <Pencil
                    className="w-2.5 h-2.5 flex-shrink-0"
                    style={{ color: '#BDBDCB' }}
                    strokeWidth={2}
                  />
                </>
              )}
            </button>
          )}
        </div>

        {/* Spent */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            style={{ fontSize: '11px', fontWeight: 500, color: '#7E7F90' }}
          >
            הוצאות
          </span>
          <span
            className="flex items-center justify-center"
            style={{ fontSize: '14px', fontWeight: 500, color: '#303150', height: '30px' }}
            dir="ltr"
          >
            {formatCurrency(spent)}
          </span>
        </div>

        {/* Remaining */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            style={{ fontSize: '11px', fontWeight: 500, color: '#7E7F90' }}
          >
            יתרה
          </span>
          <span
            className="flex items-center justify-center"
            style={{ fontSize: '14px', fontWeight: 600, color: remainingColor, height: '30px' }}
            dir="ltr"
          >
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>
    </div>
  );
}

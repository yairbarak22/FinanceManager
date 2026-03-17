'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { CategoryInfo } from '@/lib/categories';

interface UnbudgetedItem {
  categoryId: string;
  totalSpent: number;
}

interface UnbudgetedExpensesProps {
  expenses: UnbudgetedItem[];
  getCategoryInfo: (categoryId: string) => CategoryInfo | undefined;
  onAddBudget: (categoryId: string, amount: number) => void;
  onRefetch?: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

function UnbudgetedRow({
  expense,
  getCategoryInfo,
  onSave,
  onRefetch,
  inputRef,
  onTabToNext,
}: {
  expense: UnbudgetedItem;
  getCategoryInfo: (categoryId: string) => CategoryInfo | undefined;
  onSave: (categoryId: string, amount: number) => Promise<void>;
  onRefetch?: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
  onTabToNext?: () => void;
}) {
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const info = getCategoryInfo(expense.categoryId);
  const Icon = info?.icon;
  const iconBg = info?.bgColor || 'bg-gray-100';
  const iconText = info?.textColor || 'text-gray-600';
  const hasValue = value.trim().length > 0 && parseFloat(value) > 0;

  const handleSave = useCallback(async () => {
    const parsed = parseFloat(value);
    if (!parsed || parsed <= 0 || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(expense.categoryId, parsed);
      setIsSaved(true);
      setTimeout(() => {
        setIsAnimatingOut(true);
        setTimeout(() => {
          onRefetch?.();
        }, 500);
      }, 300);
    } catch {
      setIsSaving(false);
    }
  }, [value, isSaving, expense.categoryId, onSave, onRefetch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
        return;
      }
      if (e.key === 'Tab' && !e.shiftKey && onTabToNext) {
        e.preventDefault();
        onTabToNext();
      }
    },
    [handleSave, onTabToNext]
  );

  const inputElRef = useRef<HTMLInputElement | null>(null);

  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      inputElRef.current = el;
      inputRef?.(el);
    },
    [inputRef]
  );

  const focusInput = useCallback(() => {
    inputElRef.current?.focus();
  }, []);

  return (
    <div
      className={`flex items-center gap-4 py-3 px-3 rounded-xl transition-all duration-500 ${
        isAnimatingOut
          ? 'opacity-0 -translate-y-4 pointer-events-none'
          : 'hover:bg-[#F7F7F8]'
      } ${isSaved ? 'ring-2 ring-[#0DBACC] bg-[#0DBACC]/5' : ''}`}
      style={{
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
    >
      {/* Identity block (right in RTL) */}
      <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          {Icon && (
            <Icon className={`w-4 h-4 ${iconText}`} strokeWidth={1.75} />
          )}
        </div>
        <span
          className="truncate"
          style={{ fontSize: '14px', fontWeight: 500, color: '#303150' }}
        >
          {info?.nameHe || expense.categoryId}
        </span>
      </div>

      {/* Context block (middle) - fixed width for alignment */}
      <div
        className="flex-shrink-0 w-[140px] text-end"
        style={{ fontSize: '13px', fontWeight: 600, color: '#7E7F90' }}
      >
        <span style={{ color: '#7E7F90' }}>הוצאות בפועל: </span>
        <span dir="ltr" style={{ color: '#F18AB5', fontWeight: 700 }}>
          {formatCurrency(expense.totalSpent)}
        </span>
      </div>

      {/* Edit block (left in RTL) - input + external add button */}
      <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
        <div
          className="relative flex items-center flex-1 max-w-[120px]"
          style={{
            background: '#F7F7F8',
            border: '1px solid #E8E8ED',
            borderRadius: '12px',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        >
          <input
            ref={setRef}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="₪ הזן סכום"
            min="1"
            step="1"
            dir="ltr"
            disabled={isSaving || isSaved}
            className="w-full px-3 py-2 rounded-xl text-sm bg-transparent outline-none text-end [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{
              color: '#303150',
              fontFamily: 'var(--font-nunito)',
            }}
            onFocus={(e) => {
              e.currentTarget.parentElement!.style.borderColor = '#69ADFF';
              e.currentTarget.parentElement!.style.boxShadow =
                '0 0 0 3px rgba(105,173,255,0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.parentElement!.style.borderColor = '#E8E8ED';
              e.currentTarget.parentElement!.style.boxShadow = 'none';
            }}
          />
        </div>
        <button
          type="button"
          onClick={hasValue ? handleSave : focusInput}
          disabled={isSaving || isSaved}
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
          style={{
            background: hasValue ? '#0DBACC' : 'rgba(105,173,255,0.15)',
            color: hasValue ? '#FFFFFF' : '#69ADFF',
          }}
          onMouseEnter={(e) => {
            if (!isSaving && !isSaved) {
              e.currentTarget.style.background = hasValue
                ? '#0DBACC'
                : 'rgba(105,173,255,0.25)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = hasValue
              ? '#0DBACC'
              : 'rgba(105,173,255,0.15)';
          }}
          aria-label={hasValue ? 'שמור' : 'הוסף תקציב'}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
          ) : (
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
}

export default function UnbudgetedExpenses({
  expenses,
  getCategoryInfo,
  onAddBudget,
  onRefetch,
}: UnbudgetedExpensesProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSave = useCallback(
    async (categoryId: string, amount: number) => {
      await onAddBudget(categoryId, amount);
    },
    [onAddBudget]
  );

  const setInputRef = useCallback((index: number, el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  }, []);

  if (expenses.length === 0) return null;

  return (
    <div
      style={{
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#BDBDCB' }}>
          {expenses.length} קטגוריות
        </span>
      </div>

      <div
        className="relative overflow-y-auto max-h-[280px]"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(126,127,144,0.3) transparent',
        }}
      >
        <div className="space-y-1 pe-1">
          {expenses.map((expense, index) => (
            <UnbudgetedRow
              key={expense.categoryId}
              expense={expense}
              getCategoryInfo={getCategoryInfo}
              onSave={handleSave}
              onRefetch={onRefetch}
              inputRef={(el) => setInputRef(index, el)}
              onTabToNext={
                index < expenses.length - 1
                  ? () => inputRefs.current[index + 1]?.focus()
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { CategoryInfo, getCategoryInfo as getBuiltinCategoryInfo, expenseCategories } from '@/lib/categories';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryId: string, amount: number) => Promise<void>;
  existingBudgetCategoryIds: Set<string>;
  customCategories: CategoryInfo[];
  editingCategoryId?: string | null;
  editingAmount?: number | null;
}

export default function AddBudgetModal({
  isOpen,
  onClose,
  onSave,
  existingBudgetCategoryIds,
  customCategories,
  editingCategoryId,
  editingAmount,
}: AddBudgetModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const isEditMode = !!editingCategoryId;

  useEffect(() => {
    if (isOpen) {
      if (editingCategoryId) {
        setSelectedCategory(editingCategoryId);
        setAmount(editingAmount?.toString() || '');
      } else {
        setSelectedCategory('');
        setAmount('');
      }
      setError('');
    }
  }, [isOpen, editingCategoryId, editingAmount]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const availableCategories = [
    ...expenseCategories.filter(c => !existingBudgetCategoryIds.has(c.id)),
    ...customCategories.filter(c => !existingBudgetCategoryIds.has(c.id)),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const categoryId = isEditMode ? editingCategoryId! : selectedCategory;
    const parsedAmount = parseFloat(amount);

    if (!categoryId) {
      setError('יש לבחור קטגוריה');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('יש להזין סכום חיובי');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(categoryId, parsedAmount);
      onClose();
    } catch {
      setError('שגיאה בשמירת התקציב');
    } finally {
      setIsLoading(false);
    }
  }

  function getCategoryDisplay(categoryId: string): { name: string; Icon?: React.ElementType } {
    const builtin = getBuiltinCategoryInfo(categoryId, 'expense', customCategories);
    if (builtin) return { name: builtin.nameHe, Icon: builtin.icon };
    return { name: categoryId };
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="modal-content animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-modal-title"
        style={{ maxWidth: '28rem' }}
      >
        {/* Header */}
        <div className="modal-header">
          <h2
            id="budget-modal-title"
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              fontWeight: 700,
              fontSize: '18px',
              color: '#303150',
            }}
          >
            {isEditMode ? 'עריכת תקציב' : 'הוספת קטגוריה לתקציב'}
          </h2>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="סגור"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {/* Category selector */}
            {isEditMode ? (
              <div>
                <label className="label">קטגוריה</label>
                <div className="input flex items-center gap-2 cursor-not-allowed opacity-70">
                  {(() => {
                    const display = getCategoryDisplay(editingCategoryId!);
                    return (
                      <>
                        {display.Icon && <display.Icon className="w-4 h-4 text-[#7E7F90]" strokeWidth={1.75} />}
                        <span>{display.name}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="budget-category">קטגוריה</label>
                <select
                  id="budget-category"
                  className="select w-full"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">בחר קטגוריה...</option>
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameHe}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="label" htmlFor="budget-amount">סכום תקציב (₪)</label>
              <input
                id="budget-amount"
                type="number"
                className="input w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="למשל: 2000"
                min="1"
                step="1"
                dir="ltr"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <p
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  fontSize: '13px',
                  color: '#F18AB5',
                }}
              >
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              ביטול
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'שומר...' : isEditMode ? 'עדכן' : 'הוסף'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

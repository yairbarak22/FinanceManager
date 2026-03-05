'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Check } from 'lucide-react';
import { CategoryInfo, getCategoryInfo as getBuiltinCategoryInfo, expenseCategories } from '@/lib/categories';

interface DropdownRect {
  top: number;
  left: number;
  width: number;
}

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
      if (e.key === 'Escape') {
        if (dropdownOpen) setDropdownOpen(false);
        else onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, dropdownOpen]);

  // Close dropdown when clicking outside trigger or portal list
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideTrigger = dropdownRef.current?.contains(target);
      const portalEl = document.getElementById('budget-dropdown-portal');
      const insidePortal = portalEl?.contains(target);
      if (!insideTrigger && !insidePortal) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const openDropdown = useCallback(() => {
    if (!triggerRef.current || isLoading) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
    setDropdownOpen(true);
  }, [isLoading]);

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
              <div ref={dropdownRef}>
                <label className="label">קטגוריה</label>
                {/* Custom dropdown trigger */}
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => dropdownOpen ? setDropdownOpen(false) : openDropdown()}
                  disabled={isLoading}
                  className="input w-full flex items-center justify-between cursor-pointer"
                  style={{
                    textAlign: 'right',
                    borderColor: dropdownOpen ? '#69ADFF' : '#E8E8ED',
                    boxShadow: dropdownOpen ? '0 0 0 3px rgba(105,173,255,0.2)' : 'none',
                    transition: 'border-color 200ms, box-shadow 200ms',
                  }}
                >
                  <span style={{ color: selectedCategory ? '#303150' : '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif', fontSize: '15px' }}>
                    {selectedCategory
                      ? (() => {
                          const d = getCategoryDisplay(selectedCategory);
                          return (
                            <span className="flex items-center gap-2">
                              {d.Icon && <d.Icon className="w-4 h-4 text-[#7E7F90]" strokeWidth={1.75} />}
                              {d.name}
                            </span>
                          );
                        })()
                      : 'בחר קטגוריה...'}
                  </span>
                  <ChevronDown
                    className="w-4 h-4 text-[#7E7F90] flex-shrink-0"
                    strokeWidth={2}
                    style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
                  />
                </button>

                {/* Dropdown list rendered in a portal to escape modal overflow clipping */}
                {dropdownOpen && dropdownRect && createPortal(
                  <div
                    id="budget-dropdown-portal"
                    className="rounded-2xl overflow-hidden"
                    style={{
                      position: 'absolute',
                      top: dropdownRect.top,
                      left: dropdownRect.left,
                      width: dropdownRect.width,
                      zIndex: 10000,
                      background: '#FFFFFF',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                      border: '1px solid #F7F7F8',
                      direction: 'rtl',
                    }}
                  >
                    <div
                      className="overflow-y-auto"
                      style={{
                        maxHeight: '240px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(126,127,144,0.3) transparent',
                      }}
                    >
                      {availableCategories.length === 0 ? (
                        <div
                          className="px-4 py-3 text-center"
                          style={{ fontFamily: 'var(--font-nunito)', fontSize: '14px', color: '#BDBDCB' }}
                        >
                          אין קטגוריות זמינות
                        </div>
                      ) : (
                        availableCategories.map((cat, idx) => {
                          const isSelected = selectedCategory === cat.id;
                          const Icon = cat.icon;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5"
                              style={{
                                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                                fontSize: '14px',
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? '#69ADFF' : '#303150',
                                background: isSelected ? 'rgba(105,173,255,0.08)' : 'transparent',
                                borderTop: idx > 0 ? '1px solid #F7F7F8' : 'none',
                                textAlign: 'right',
                                cursor: 'pointer',
                                transition: 'background 100ms',
                              }}
                              onMouseEnter={e => {
                                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#F7F7F8';
                              }}
                              onMouseLeave={e => {
                                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = isSelected ? 'rgba(105,173,255,0.08)' : 'transparent';
                              }}
                            >
                              {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? '#69ADFF' : '#7E7F90' }} strokeWidth={1.75} />}
                              <span className="flex-1">{cat.nameHe}</span>
                              {isSelected && <Check className="w-4 h-4 flex-shrink-0 text-[#69ADFF]" strokeWidth={2} />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>,
                  document.body
                )}
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

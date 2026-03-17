'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ChevronDown, Check } from 'lucide-react';
import {
  CategoryInfo,
  getCategoryInfo as getBuiltinCategoryInfo,
  expenseCategories,
} from '@/lib/categories';
import AddCategoryModal from '@/components/ui/AddCategoryModal';

interface DropdownRect {
  top: number;
  left: number;
  width: number;
}

interface AddBudgetVisualProps {
  onSave: (categoryId: string, amount: number) => Promise<void>;
  existingBudgetCategoryIds: Set<string>;
  customCategories: CategoryInfo[];
  onAddCategory?: (name: string, isMaaserEligible?: boolean) => Promise<CategoryInfo>;
}

export default function AddBudgetVisual({
  onSave,
  existingBudgetCategoryIds,
  customCategories,
  onAddCategory,
}: AddBudgetVisualProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const availableCategories = [
    ...expenseCategories.filter((c) => !existingBudgetCategoryIds.has(c.id)),
    ...customCategories.filter((c) => !existingBudgetCategoryIds.has(c.id)),
  ];

  const reset = useCallback(() => {
    setIsCreating(false);
    setSelectedCategory('');
    setAmount('');
    setDropdownOpen(false);
    setIsSaving(false);
  }, []);

  const openDropdown = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 240),
    });
    setDropdownOpen(true);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const portalEl = document.getElementById('add-budget-visual-dropdown');
      const insidePortal = portalEl?.contains(target);
      if (!insideTrigger && !insidePortal) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (selectedCategory && amountRef.current) {
      amountRef.current.focus();
    }
  }, [selectedCategory]);

  const handleSave = useCallback(async () => {
    if (!selectedCategory || isSaving) return;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      amountRef.current?.focus();
      return;
    }
    setIsSaving(true);
    try {
      await onSave(selectedCategory, parsedAmount);
      reset();
    } catch {
      setIsSaving(false);
    }
  }, [selectedCategory, amount, isSaving, onSave, reset]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        reset();
      }
    },
    [handleSave, reset],
  );

  function getCategoryDisplay(
    categoryId: string,
  ): { name: string; Icon?: React.ElementType } {
    const builtin = getBuiltinCategoryInfo(
      categoryId,
      'expense',
      customCategories,
    );
    if (builtin) return { name: builtin.nameHe, Icon: builtin.icon };
    return { name: categoryId };
  }

  if (!isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className="rounded-3xl p-5 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md cursor-pointer min-h-[200px]"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          border: '2px dashed #E8E8ED',
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(105,173,255,0.1)' }}
        >
          <Plus className="w-5 h-5 text-[#69ADFF]" strokeWidth={2} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#BDBDCB' }}>
          + הוסף קטגוריה לתקציב
        </span>
      </button>
    );
  }

  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-4 min-h-[200px]"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        border: '2px solid #69ADFF',
      }}
    >
      {/* Category dropdown */}
      <div>
        <span
          className="block mb-1.5"
          style={{ fontSize: '12px', fontWeight: 500, color: '#7E7F90' }}
        >
          קטגוריה
        </span>
        <button
          ref={triggerRef}
          type="button"
          onClick={() =>
            dropdownOpen ? setDropdownOpen(false) : openDropdown()
          }
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm cursor-pointer"
          style={{
            borderColor: dropdownOpen ? '#69ADFF' : '#E8E8ED',
            boxShadow: dropdownOpen
              ? '0 0 0 3px rgba(105,173,255,0.2)'
              : 'none',
            background: '#FFFFFF',
            transition: 'border-color 200ms, box-shadow 200ms',
          }}
        >
          <span
            style={{
              color: selectedCategory ? '#303150' : '#BDBDCB',
              fontSize: '13px',
            }}
          >
            {selectedCategory
              ? (() => {
                  const d = getCategoryDisplay(selectedCategory);
                  return (
                    <span className="flex items-center gap-1.5">
                      {d.Icon && (
                        <d.Icon
                          className="w-3.5 h-3.5 text-[#7E7F90]"
                          strokeWidth={1.75}
                        />
                      )}
                      {d.name}
                    </span>
                  );
                })()
              : 'בחר קטגוריה...'}
          </span>
          <ChevronDown
            className="w-3 h-3 text-[#7E7F90] flex-shrink-0"
            strokeWidth={2}
            style={{
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </button>

        {dropdownOpen &&
          dropdownRect &&
          createPortal(
            <div
              id="add-budget-visual-dropdown"
              className="rounded-xl overflow-hidden"
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
                  maxHeight: '220px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(126,127,144,0.3) transparent',
                }}
              >
                {onAddCategory && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        setShowAddCategory(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right"
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#69ADFF',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'background 100ms',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(105,173,255,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(105,173,255,0.15)' }}
                      >
                        <Plus className="w-3.5 h-3.5 text-[#69ADFF]" strokeWidth={2} />
                      </div>
                      <span>הוסף קטגוריה חדשה...</span>
                    </button>
                    <div
                      style={{
                        height: 1,
                        background: '#F7F7F8',
                        margin: '0 12px',
                      }}
                    />
                  </>
                )}
                {availableCategories.length === 0 ? (
                  <div
                    className="px-4 py-3 text-center"
                    style={{ fontSize: '13px', color: '#BDBDCB' }}
                  >
                    אין קטגוריות זמינות
                  </div>
                ) : (
                  availableCategories.map((cat, idx) => {
                    const isSelected = selectedCategory === cat.id;
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2"
                        style={{
                          fontSize: '13px',
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? '#69ADFF' : '#303150',
                          background: isSelected
                            ? 'rgba(105,173,255,0.08)'
                            : 'transparent',
                          borderTop:
                            idx > 0 ? '1px solid #F7F7F8' : 'none',
                          textAlign: 'right',
                          cursor: 'pointer',
                          transition: 'background 100ms',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = '#F7F7F8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isSelected
                            ? 'rgba(105,173,255,0.08)'
                            : 'transparent';
                        }}
                      >
                        {CatIcon && (
                          <CatIcon
                            className="w-3.5 h-3.5 flex-shrink-0"
                            style={{
                              color: isSelected ? '#69ADFF' : '#7E7F90',
                            }}
                            strokeWidth={1.75}
                          />
                        )}
                        <span className="flex-1">{cat.nameHe}</span>
                        {isSelected && (
                          <Check
                            className="w-3.5 h-3.5 flex-shrink-0 text-[#69ADFF]"
                            strokeWidth={2}
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )}
      </div>

      {/* Amount input */}
      <div>
        <span
          className="block mb-1.5"
          style={{ fontSize: '12px', fontWeight: 500, color: '#7E7F90' }}
        >
          סכום תקציב
        </span>
        <input
          ref={amountRef}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="₪"
          min="1"
          step="1"
          dir="ltr"
          disabled={isSaving}
          className="w-full px-3 py-2 rounded-xl border text-sm text-center"
          style={{
            borderColor: '#E8E8ED',
            color: '#303150',
            background: '#FFFFFF',
            outline: 'none',
            fontFamily: 'var(--font-nunito)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#69ADFF';
            e.currentTarget.style.boxShadow =
              '0 0 0 3px rgba(105,173,255,0.2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E8E8ED';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={handleSave}
          disabled={!selectedCategory || !amount || isSaving}
          className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            background: selectedCategory && amount ? '#69ADFF' : '#E8E8ED',
            color: selectedCategory && amount ? '#FFFFFF' : '#BDBDCB',
            cursor:
              selectedCategory && amount ? 'pointer' : 'not-allowed',
          }}
        >
          {isSaving ? '...' : 'הוסף'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-xl text-sm transition-colors hover:bg-[#F7F7F8]"
          style={{ color: '#7E7F90' }}
        >
          ביטול
        </button>
      </div>

      {onAddCategory && (
        <AddCategoryModal
          isOpen={showAddCategory}
          onClose={() => setShowAddCategory(false)}
          categoryType="expense"
          onSave={async (name, isMaaserEligible) => {
            const newCat = await onAddCategory(name, isMaaserEligible);
            setSelectedCategory(newCat.id);
            setShowAddCategory(false);
          }}
        />
      )}
    </div>
  );
}

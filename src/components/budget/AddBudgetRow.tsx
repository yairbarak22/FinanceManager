'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ChevronDown, Check } from 'lucide-react';
import { CategoryInfo, getCategoryInfo as getBuiltinCategoryInfo, expenseCategories } from '@/lib/categories';
import { BUDGET_GRID_COLS } from './budgetGridCols';

interface DropdownRect {
  top: number;
  left: number;
  width: number;
}

interface AddBudgetRowProps {
  onSave: (categoryId: string, amount: number) => Promise<void>;
  existingBudgetCategoryIds: Set<string>;
  customCategories: CategoryInfo[];
}

export default function AddBudgetRow({
  onSave,
  existingBudgetCategoryIds,
  customCategories,
}: AddBudgetRowProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const availableCategories = [
    ...expenseCategories.filter(c => !existingBudgetCategoryIds.has(c.id)),
    ...customCategories.filter(c => !existingBudgetCategoryIds.has(c.id)),
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
      const portalEl = document.getElementById('add-budget-row-dropdown');
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      reset();
    }
  }, [handleSave, reset]);

  function getCategoryDisplay(categoryId: string): { name: string; Icon?: React.ElementType } {
    const builtin = getBuiltinCategoryInfo(categoryId, 'expense', customCategories);
    if (builtin) return { name: builtin.nameHe, Icon: builtin.icon };
    return { name: categoryId };
  }

  if (!isCreating) {
    return (
      <div
        className={`${BUDGET_GRID_COLS} items-center cursor-pointer transition-colors hover:bg-[#F7F7F8]`}
        onClick={() => setIsCreating(true)}
        style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        <div className="flex items-center justify-center py-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F7F7F8]">
            <Plus className="w-4 h-4 text-[#BDBDCB]" strokeWidth={2} />
          </div>
        </div>
        <div className="py-3 col-span-6">
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#BDBDCB' }}>
            + הוסף קטגוריה לתקציב
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${BUDGET_GRID_COLS} items-center bg-[#F7F7F8]/40`}
      style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
    >
      {/* Icon placeholder */}
      <div className="flex items-center justify-center py-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#69ADFF]/10">
          <Plus className="w-4 h-4 text-[#69ADFF]" strokeWidth={2} />
        </div>
      </div>

      {/* Category dropdown */}
      <div className="py-2 pe-2 min-w-0">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => dropdownOpen ? setDropdownOpen(false) : openDropdown()}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-sm cursor-pointer"
          style={{
            borderColor: dropdownOpen ? '#69ADFF' : '#E8E8ED',
            boxShadow: dropdownOpen ? '0 0 0 3px rgba(105,173,255,0.2)' : 'none',
            background: '#FFFFFF',
            transition: 'border-color 200ms, box-shadow 200ms',
          }}
        >
          <span style={{ color: selectedCategory ? '#303150' : '#BDBDCB', fontSize: '13px' }}>
            {selectedCategory ? (() => {
              const d = getCategoryDisplay(selectedCategory);
              return (
                <span className="flex items-center gap-1.5">
                  {d.Icon && <d.Icon className="w-3.5 h-3.5 text-[#7E7F90]" strokeWidth={1.75} />}
                  {d.name}
                </span>
              );
            })() : 'בחר קטגוריה...'}
          </span>
          <ChevronDown
            className="w-3 h-3 text-[#7E7F90] flex-shrink-0"
            strokeWidth={2}
            style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
          />
        </button>

        {dropdownOpen && dropdownRect && createPortal(
          <div
            id="add-budget-row-dropdown"
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
              {availableCategories.length === 0 ? (
                <div className="px-4 py-3 text-center" style={{ fontSize: '13px', color: '#BDBDCB' }}>
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
                        background: isSelected ? 'rgba(105,173,255,0.08)' : 'transparent',
                        borderTop: idx > 0 ? '1px solid #F7F7F8' : 'none',
                        textAlign: 'right',
                        cursor: 'pointer',
                        transition: 'background 100ms',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = '#F7F7F8';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = isSelected ? 'rgba(105,173,255,0.08)' : 'transparent';
                      }}
                    >
                      {CatIcon && <CatIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isSelected ? '#69ADFF' : '#7E7F90' }} strokeWidth={1.75} />}
                      <span className="flex-1">{cat.nameHe}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-[#69ADFF]" strokeWidth={2} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Amount input */}
      <div className="py-2 px-2">
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
          className="w-full px-2 py-1.5 rounded-lg border text-sm text-center"
          style={{
            borderColor: '#E8E8ED',
            color: '#303150',
            background: '#FFFFFF',
            outline: 'none',
            fontFamily: 'var(--font-nunito)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#69ADFF';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(105,173,255,0.2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E8E8ED';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Action buttons span remaining columns */}
      <div className="py-2 px-2 col-span-4 flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={!selectedCategory || !amount || isSaving}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            background: selectedCategory && amount ? '#69ADFF' : '#E8E8ED',
            color: selectedCategory && amount ? '#FFFFFF' : '#BDBDCB',
            cursor: selectedCategory && amount ? 'pointer' : 'not-allowed',
          }}
        >
          {isSaving ? '...' : 'הוסף'}
        </button>
        <button
          onClick={reset}
          className="px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-[#E8E8ED]"
          style={{ color: '#7E7F90' }}
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

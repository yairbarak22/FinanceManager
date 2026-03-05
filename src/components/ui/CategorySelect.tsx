'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, Check, Star, Target, Pencil, Trash2 } from 'lucide-react';
import { CategoryInfo } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { SensitiveData } from '../common/SensitiveData';
import ConfirmDialog from '../modals/ConfirmDialog';

// Goal category color
const GOAL_CATEGORY_COLOR = '#0DBACC';

// Extended CategoryInfo that may include goal flag and type
interface ExtendedCategoryInfo extends CategoryInfo {
  isGoalCategory?: boolean;
  type?: string;
}

interface DeleteConfirmState {
  categoryId: string;
  categoryName: string;
  categoryType: string;
}

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  defaultCategories: CategoryInfo[];
  customCategories: ExtendedCategoryInfo[];
  placeholder?: string;
  onAddNew?: () => void;
  onEditCategory?: (categoryId: string) => void;
  onDeleteCategory?: (categoryId: string, type: string) => Promise<void> | void;
  required?: boolean;
}

interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

export default function CategorySelect({
  value,
  onChange,
  defaultCategories,
  customCategories,
  placeholder = 'בחר קטגוריה',
  onAddNew,
  onEditCategory,
  onDeleteCategory,
  required = false,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition>({ left: 0, width: 0, maxHeight: 320 });
  const [mounted, setMounted] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected category
  const allCategories = [...defaultCategories, ...customCategories];
  const selectedCategory = allCategories.find((cat) => cat.id === value);

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const preferredHeight = 320;

      const openBelow = spaceBelow >= Math.min(preferredHeight, 150) || spaceBelow >= spaceAbove;

      if (openBelow) {
        setPosition({
          top: rect.bottom + 8,
          bottom: undefined,
          left: rect.left,
          width: rect.width,
          maxHeight: Math.min(preferredHeight, spaceBelow),
        });
      } else {
        setPosition({
          top: undefined,
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left,
          width: rect.width,
          maxHeight: Math.min(preferredHeight, spaceAbove),
        });
      }
    }
  }, []);

  // Update position when opening and on resize/scroll
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

      if (isOutsideTrigger && isOutsideDropdown) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, category: ExtendedCategoryInfo) => {
    e.stopPropagation();
    setIsOpen(false);
    setDeleteConfirm({
      categoryId: category.id,
      categoryName: category.nameHe,
      categoryType: category.type || 'expense',
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !onDeleteCategory) return;
    try {
      await onDeleteCategory(deleteConfirm.categoryId, deleteConfirm.categoryType);
    } catch {
      // Deletion failed for a reason other than 404 — silently ignore for now
    }
    setDeleteConfirm(null);
  };

  const renderCategoryOption = (category: ExtendedCategoryInfo, showCheckmark: boolean) => {
    const isSelected = value === category.id;
    const IconComponent = typeof category.icon === 'function' ? category.icon : Star;
    const isGoal = category.isGoalCategory;
    const isEditable = category.isCustom && !isGoal && onEditCategory;
    const isDeletable = category.isCustom && !isGoal && onDeleteCategory;

    return (
      <div key={category.id} className="relative group flex items-center">
        <button
          type="button"
          onClick={() => handleSelect(category.id)}
          className={cn(
            'category-option flex-1',
            isSelected && 'selected',
            isGoal && 'bg-gradient-to-l from-[rgba(13,186,204,0.05)] to-transparent'
          )}
          style={(isEditable || isDeletable) ? { paddingInlineEnd: isDeletable && isEditable ? '4rem' : '2rem' } : undefined}
        >
          <div
            className={cn('category-option-icon', isGoal ? 'bg-[rgba(13,186,204,0.15)]' : category.bgColor)}
            style={{ color: isGoal ? GOAL_CATEGORY_COLOR : category.color }}
          >
            {isGoal ? (
              <Target className="w-4 h-4" />
            ) : (
              <IconComponent className="w-4 h-4" />
            )}
          </div>
          <SensitiveData as="span" className="flex-1 text-right">{category.nameHe}</SensitiveData>
          {isGoal && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: 'rgba(13, 186, 204, 0.1)',
                color: GOAL_CATEGORY_COLOR,
              }}
            >
              יעד
            </span>
          )}
          {showCheckmark && isSelected && (
            <Check className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {/* Action icons for custom non-goal categories */}
        {(isEditable || isDeletable) && (
          <div className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {isEditable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onEditCategory!(category.id);
                }}
                className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                title="ערוך קטגוריה"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
            {isDeletable && (
              <button
                type="button"
                onClick={(e) => handleDeleteClick(e, category)}
                className="p-1 rounded-md hover:bg-red-50 transition-colors"
                title="מחק קטגוריה"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-[#F18AB5]" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Separate goal categories from regular custom categories
  const goalCategories = customCategories.filter(cat => cat.isGoalCategory);
  const regularCustomCategories = customCategories.filter(cat => !cat.isGoalCategory);

  // Dropdown content - NEW ORDER: Add New → Goals → Custom → Defaults
  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed z-[10000] bg-white rounded-xl shadow-lg border border-slate-100 py-2 overflow-y-auto animate-scale-in"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
      }}
      dir="rtl"
    >
      {/* 1. Add New Button - FIRST */}
      {onAddNew && (
        <>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAddNew();
            }}
            className="category-add-new"
          >
            <div className="category-option-icon bg-indigo-100 text-indigo-500">
              <Plus className="w-4 h-4" />
            </div>
            <span className="flex-1 text-right text-indigo-600 font-medium">
              הוסף קטגוריה חדשה...
            </span>
          </button>
          <div className="category-divider" />
        </>
      )}

      {/* 2. Goal Categories */}
      {goalCategories.length > 0 && (
        <>
          <div
            className="category-group-header flex items-center gap-2"
            style={{ color: GOAL_CATEGORY_COLOR }}
          >
            <Target className="w-3.5 h-3.5" />
            <span>יעדים פיננסיים</span>
          </div>
          <div className="category-options-list">
            {goalCategories.map((cat) => renderCategoryOption(cat, true))}
          </div>
          <div className="category-divider" />
        </>
      )}

      {/* 3. Regular Custom Categories */}
      {regularCustomCategories.length > 0 && (
        <>
          <div className="category-group-header">הקטגוריות שלי</div>
          <div className="category-options-list">
            {regularCustomCategories.map((cat) => renderCategoryOption(cat, true))}
          </div>
          <div className="category-divider" />
        </>
      )}

      {/* 4. Default Categories - LAST */}
      <div className="category-group-header">קטגוריות ברירת מחדל</div>
      <div className="category-options-list">
        {defaultCategories.map((cat) => renderCategoryOption(cat, true))}
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'category-select-trigger',
          !selectedCategory && 'text-slate-400'
        )}
      >
        {selectedCategory ? (
          <>
            <div
              className={cn('category-option-icon', selectedCategory.bgColor)}
              style={{ color: selectedCategory.color }}
            >
              {typeof selectedCategory.icon === 'function' ? (
                <selectedCategory.icon className="w-4 h-4" />
              ) : (
                <Star className="w-4 h-4" />
              )}
            </div>
            <SensitiveData as="span" className="flex-1 text-right text-slate-900">
              {selectedCategory.nameHe}
            </SensitiveData>
          </>
        ) : (
          <>
            <div className="category-option-icon bg-slate-100 text-slate-400">
              <Star className="w-4 h-4" />
            </div>
            <span className="flex-1 text-right">{placeholder}</span>
          </>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => { }}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown - rendered via Portal */}
      {mounted && isOpen && createPortal(dropdownContent, document.body)}

      {/* Delete Confirmation Dialog */}
      {mounted && deleteConfirm && createPortal(
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDeleteConfirm}
          title="מחיקת קטגוריה"
          message={`האם אתה בטוח שברצונך למחוק את הקטגוריה "${deleteConfirm.categoryName}"?`}
        />,
        document.body
      )}
    </div>
  );
}

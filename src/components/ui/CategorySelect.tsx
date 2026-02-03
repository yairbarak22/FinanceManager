'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, Check, Star, Target } from 'lucide-react';
import { CategoryInfo, defaultCustomIcon } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { SensitiveData } from '../common/SensitiveData';

// Goal category color
const GOAL_CATEGORY_COLOR = '#0DBACC';

// Extended CategoryInfo that may include goal flag
interface ExtendedCategoryInfo extends CategoryInfo {
  isGoalCategory?: boolean;
}

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  defaultCategories: CategoryInfo[];
  customCategories: ExtendedCategoryInfo[];
  placeholder?: string;
  onAddNew?: () => void;
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
  required = false,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition>({ left: 0, width: 0, maxHeight: 320 });
  const [mounted, setMounted] = useState(false);
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
      const spaceBelow = window.innerHeight - rect.bottom - 16; // 16px padding from viewport edge
      const spaceAbove = rect.top - 16;
      const preferredHeight = 320; // max-h-80 = 320px

      // Decide whether to open below or above based on available space
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

  const renderCategoryOption = (category: ExtendedCategoryInfo, showCheckmark: boolean) => {
    const isSelected = value === category.id;
    // Ensure we have a valid icon component - fallback to Star if not
    const IconComponent = typeof category.icon === 'function' ? category.icon : Star;
    const isGoal = category.isGoalCategory;

    return (
      <button
        key={category.id}
        type="button"
        onClick={() => handleSelect(category.id)}
        className={cn(
          'category-option',
          isSelected && 'selected',
          isGoal && 'bg-gradient-to-l from-[rgba(13,186,204,0.05)] to-transparent'
        )}
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
        {category.isCustom && !isGoal && (
          <span className="text-xs text-slate-400 px-1">מותאם</span>
        )}
      </button>
    );
  };

  // Separate goal categories from regular custom categories
  const goalCategories = customCategories.filter(cat => cat.isGoalCategory);
  const regularCustomCategories = customCategories.filter(cat => !cat.isGoalCategory);

  // Dropdown content
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
      {/* Goal Categories - shown first */}
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

      {/* Default Categories */}
      <div className="category-group-header">קטגוריות ברירת מחדל</div>
      <div className="category-options-list">
        {defaultCategories.map((cat) => renderCategoryOption(cat, true))}
      </div>

      {/* Regular Custom Categories (non-goal) */}
      {regularCustomCategories.length > 0 && (
        <>
          <div className="category-divider" />
          <div className="category-group-header">הקטגוריות שלי</div>
          <div className="category-options-list">
            {regularCustomCategories.map((cat) => renderCategoryOption(cat, true))}
          </div>
        </>
      )}

      {/* Add New Button */}
      {onAddNew && (
        <>
          <div className="category-divider" />
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
        </>
      )}
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
    </div>
  );
}


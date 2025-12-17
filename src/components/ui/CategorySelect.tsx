'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, Star } from 'lucide-react';
import { CategoryInfo, defaultCustomIcon } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  defaultCategories: CategoryInfo[];
  customCategories: CategoryInfo[];
  placeholder?: string;
  onAddNew?: () => void;
  required?: boolean;
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected category
  const allCategories = [...defaultCategories, ...customCategories];
  const selectedCategory = allCategories.find((cat) => cat.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const renderCategoryOption = (category: CategoryInfo, showCheckmark: boolean) => {
    const Icon = category.icon;
    const isSelected = value === category.id;

    return (
      <button
        key={category.id}
        type="button"
        onClick={() => handleSelect(category.id)}
        className={cn(
          'category-option',
          isSelected && 'selected'
        )}
      >
        <div
          className={cn('category-option-icon', category.bgColor)}
          style={{ color: category.color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="flex-1 text-right">{category.nameHe}</span>
        {showCheckmark && isSelected && (
          <Check className="w-4 h-4 text-pink-500" />
        )}
        {category.isCustom && (
          <span className="text-xs text-gray-400 px-1">מותאם</span>
        )}
      </button>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'category-select-trigger',
          !selectedCategory && 'text-gray-400'
        )}
      >
        {selectedCategory ? (
          <>
            <div
              className={cn('category-option-icon', selectedCategory.bgColor)}
              style={{ color: selectedCategory.color }}
            >
              <selectedCategory.icon className="w-4 h-4" />
            </div>
            <span className="flex-1 text-right text-gray-900">
              {selectedCategory.nameHe}
            </span>
          </>
        ) : (
          <>
            <div className="category-option-icon bg-gray-100 text-gray-400">
              <Star className="w-4 h-4" />
            </div>
            <span className="flex-1 text-right">{placeholder}</span>
          </>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="category-dropdown animate-scale-in">
          {/* Default Categories */}
          <div className="category-group-header">קטגוריות ברירת מחדל</div>
          <div className="category-options-list">
            {defaultCategories.map((cat) => renderCategoryOption(cat, true))}
          </div>

          {/* Custom Categories */}
          {customCategories.length > 0 && (
            <>
              <div className="category-divider" />
              <div className="category-group-header">הקטגוריות שלי</div>
              <div className="category-options-list">
                {customCategories.map((cat) => renderCategoryOption(cat, true))}
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
                <div className="category-option-icon bg-pink-100 text-pink-500">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="flex-1 text-right text-pink-600 font-medium">
                  הוסף קטגוריה חדשה...
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}


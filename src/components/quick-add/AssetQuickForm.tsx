'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { CategoryInfo } from '@/lib/categories';
import CategorySelect from '@/components/ui/CategorySelect';
import AddCategoryModal from '@/components/ui/AddCategoryModal';

// Field order for auto-scroll
const FIELD_ORDER = ['name', 'category', 'value'];

interface AssetQuickFormProps {
  assetCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  onSave: (data: {
    name: string;
    category: string;
    value: number;
  }) => Promise<void>;
  onAddCategory: (name: string) => Promise<CategoryInfo>;
}

export default function AssetQuickForm({
  assetCategories,
  onSave,
  onAddCategory,
}: AssetQuickFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for auto-scroll to next field
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-scroll to next field when current field is filled
  const scrollToNextField = useCallback((currentField: string) => {
    const currentIndex = FIELD_ORDER.indexOf(currentField);
    if (currentIndex >= 0 && currentIndex < FIELD_ORDER.length - 1) {
      const nextField = FIELD_ORDER[currentIndex + 1];
      const nextFieldElement = fieldRefs.current.get(nextField);
      if (nextFieldElement) {
        setTimeout(() => {
          nextFieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, []);

  // Auto-focus name input on mount
  useEffect(() => {
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !value) return;

    setIsLoading(true);
    try {
      await onSave({
        name,
        category,
        value: parseFloat(value),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    const newCategory = await onAddCategory(categoryName);
    setCategory(newCategory.id);
    setShowAddCategory(false);
  };

  const handleCategoryChange = (categoryId: string) => {
    setCategory(categoryId);
    if (categoryId) {
      scrollToNextField('category');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div ref={(el) => { if (el) fieldRefs.current.set('name', el); }}>
          <label
            htmlFor="asset-name"
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            שם הנכס
          </label>
          <input
            ref={nameInputRef}
            id="asset-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { if (name) scrollToNextField('name'); }}
            placeholder="לדוגמה: דירה בתל אביב"
            className="input"
            required
            aria-required="true"
          />
        </div>

        {/* Category */}
        <div ref={(el) => { if (el) fieldRefs.current.set('category', el); }}>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            קטגוריה
          </label>
          <CategorySelect
            value={category}
            onChange={handleCategoryChange}
            defaultCategories={assetCategories.default}
            customCategories={assetCategories.custom}
            placeholder="בחר קטגוריה"
            onAddNew={() => setShowAddCategory(true)}
            required
          />
        </div>

        {/* Value */}
        <div ref={(el) => { if (el) fieldRefs.current.set('value', el); }}>
          <label
            htmlFor="asset-value"
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            שווי נוכחי (₪)
          </label>
          <input
            id="asset-value"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            className="input"
            required
            min="0"
            step="0.01"
            aria-required="true"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !name || !category || !value}
          className="btn-primary w-full py-3 text-base"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            'שמור'
          )}
        </button>
      </form>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSave={handleAddCategory}
        categoryType="asset"
      />
    </>
  );
}

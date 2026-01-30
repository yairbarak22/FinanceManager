'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Asset } from '@/lib/types';
import { CategoryInfo } from '@/lib/categories';
import CategorySelect from '@/components/ui/CategorySelect';
import AddCategoryModal from '@/components/ui/AddCategoryModal';

// Field order for auto-scroll
const FIELD_ORDER = ['name', 'category', 'value'];

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  asset?: Asset | null;
  assetCategories: { default: CategoryInfo[]; custom: CategoryInfo[] };
  onAddCategory: (name: string) => Promise<CategoryInfo>;
}

export default function AssetModal({
  isOpen,
  onClose,
  onSave,
  asset,
  assetCategories,
  onAddCategory,
}: AssetModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('investments');
  const [value, setValue] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for auto-scroll to next field
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to next field when current field is filled
  const scrollToNextField = useCallback((currentField: string) => {
    const currentIndex = FIELD_ORDER.indexOf(currentField);
    if (currentIndex >= 0 && currentIndex < FIELD_ORDER.length - 1) {
      const nextField = FIELD_ORDER[currentIndex + 1];
      const nextFieldElement = fieldRefs.current.get(nextField);
      if (nextFieldElement && modalBodyRef.current) {
        setTimeout(() => {
          nextFieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setCategory(asset.category);
      setValue(asset.value.toString());
    } else {
      setName('');
      setCategory('investments');
      setValue('');
    }
  }, [asset, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        name,
        category,
        value: parseFloat(value),
      });
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    const newCategory = await onAddCategory(categoryName);
    setCategory(newCategory.id);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={() => !isLoading && onClose()}>
        <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <h2 
              className="text-xl font-bold"
              style={{ 
                color: '#303150', 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif' 
              }}
            >
              {asset ? 'עריכת נכס' : 'נכס חדש'}
            </h2>
            <button onClick={onClose} className="btn-icon" disabled={isLoading}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body" ref={modalBodyRef}>
              {/* Name */}
              <div ref={(el) => { if (el) fieldRefs.current.set('name', el); }}>
                <label className="label">שם הנכס</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => { if (name) scrollToNextField('name'); }}
                  placeholder="לדוגמה: דירה ברמת גן"
                  className="input"
                  required
                />
              </div>

              {/* Category */}
              <div ref={(el) => { if (el) fieldRefs.current.set('category', el); }}>
                <label className="label">סוג נכס</label>
                <CategorySelect
                  value={category}
                  onChange={(val) => {
                    setCategory(val);
                    if (val) scrollToNextField('category');
                  }}
                  defaultCategories={assetCategories.default}
                  customCategories={assetCategories.custom}
                  placeholder="בחר סוג נכס"
                  onAddNew={() => setShowAddCategory(true)}
                  required
                />
              </div>

              {/* Value */}
              <div ref={(el) => { if (el) fieldRefs.current.set('value', el); }}>
                <label className="label">שווי (₪)</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
                  className="input"
                  required
                  min="0"
                  step="1"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={isLoading}>
                ביטול
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  asset ? 'עדכן' : 'הוסף'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

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

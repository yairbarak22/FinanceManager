'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Asset } from '@/lib/types';
import { CategoryInfo } from '@/lib/categories';
import CategorySelect from '@/components/ui/CategorySelect';
import AddCategoryModal from '@/components/ui/AddCategoryModal';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      category,
      value: parseFloat(value),
    });
    onClose();
  };

  const handleAddCategory = async (categoryName: string) => {
    const newCategory = await onAddCategory(categoryName);
    setCategory(newCategory.id);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <h2 className="text-xl font-bold text-gray-900">
              {asset ? 'עריכת נכס' : 'נכס חדש'}
            </h2>
            <button onClick={onClose} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Name */}
              <div>
                <label className="label">שם הנכס</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="לדוגמה: דירה ברמת גן"
                  className="input"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="label">סוג נכס</label>
                <CategorySelect
                  value={category}
                  onChange={setCategory}
                  defaultCategories={assetCategories.default}
                  customCategories={assetCategories.custom}
                  placeholder="בחר סוג נכס"
                  onAddNew={() => setShowAddCategory(true)}
                  required
                />
              </div>

              {/* Value */}
              <div>
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
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                ביטול
              </button>
              <button type="submit" className="btn-primary flex-1">
                {asset ? 'עדכן' : 'הוסף'}
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

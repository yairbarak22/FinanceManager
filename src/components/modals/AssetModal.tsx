'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Asset } from '@/lib/types';
import { assetCategories } from '@/lib/categories';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  asset?: Asset | null;
}

export default function AssetModal({
  isOpen,
  onClose,
  onSave,
  asset,
}: AssetModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'investments' | 'real_estate'>('investments');
  const [value, setValue] = useState('');

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

  if (!isOpen) return null;

  return (
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
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'investments' | 'real_estate')}
                className="select"
                required
              >
                {assetCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameHe}
                  </option>
                ))}
              </select>
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
  );
}


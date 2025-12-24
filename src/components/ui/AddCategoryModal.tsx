'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  categoryType: 'expense' | 'income' | 'asset' | 'liability';
}

const typeLabels: Record<string, string> = {
  expense: 'הוצאה',
  income: 'הכנסה',
  asset: 'נכס',
  liability: 'התחייבות',
};

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSave,
  categoryType,
}: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('נא להזין שם לקטגוריה');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave(name.trim());
      setName('');
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('אירעה שגיאה בשמירת הקטגוריה');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header py-4">
          <h2 className="text-lg font-bold text-slate-900">
            הוסף קטגוריית {typeLabels[categoryType]}
          </h2>
          <button onClick={handleClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* Name Input */}
            <div>
              <label className="label">שם הקטגוריה</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="לדוגמה: ספורט"
                className="input"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Info */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm text-slate-500">
                הקטגוריה תישמר ותהיה זמינה בכל הרשימות מסוג {typeLabels[categoryType]}.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer py-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              ביטול
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  שומר...
                </span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  הוסף
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import { CustomCategory } from '@/lib/types';

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CustomCategory | null;
  onSave: (updated: CustomCategory) => void;
}

export default function EditCategoryModal({
  isOpen,
  onClose,
  category,
  onSave,
}: EditCategoryModalProps) {
  const [isMaaserEligible, setIsMaaserEligible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setIsMaaserEligible(category.isMaaserEligible ?? false);
      setError('');
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await apiFetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMaaserEligible }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'שגיאה בעדכון הקטגוריה');
      }

      const updated = await response.json();
      onSave({ ...category, isMaaserEligible: updated.isMaaserEligible });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'אירעה שגיאה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen || !category) return null;

  const showMaaserOption = category.type === 'income' || category.type === 'expense';
  const maaserLabel =
    category.type === 'income'
      ? 'הכנסה זו חייבת במעשרות'
      : 'הוצאה זו נחשבת למעשרות/תרומה';

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header py-4">
          <h2
            className="text-lg font-bold"
            style={{
              color: '#303150',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          >
            עריכת קטגוריה
          </h2>
          <button onClick={handleClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* Category Name (read-only) */}
            <div>
              <label className="label">שם הקטגוריה</label>
              <div
                className="input flex items-center opacity-70 cursor-not-allowed"
                style={{ backgroundColor: '#F7F7F8' }}
              >
                <span className="text-sm" style={{ color: '#303150' }}>
                  {category.name}
                </span>
              </div>
            </div>

            {/* Maaser Toggle */}
            {showMaaserOption && (
              <div>
                <label className="label">הגדרות מעשרות</label>
                <button
                  type="button"
                  onClick={() => setIsMaaserEligible((v) => !v)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all text-right"
                  style={{
                    backgroundColor: isMaaserEligible ? 'rgba(105,173,255,0.08)' : '#F7F7F8',
                    border: `1px solid ${isMaaserEligible ? '#69ADFF' : '#E8E8ED'}`,
                  }}
                  aria-pressed={isMaaserEligible}
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: isMaaserEligible ? '#69ADFF' : '#FFFFFF',
                      border: `2px solid ${isMaaserEligible ? '#69ADFF' : '#BDBDCB'}`,
                    }}
                  >
                    {isMaaserEligible && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: isMaaserEligible ? '#303150' : '#7E7F90',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    {maaserLabel}
                  </span>
                </button>
              </div>
            )}

            {!showMaaserOption && (
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: '#F7F7F8' }}
              >
                <p
                  className="text-sm"
                  style={{
                    color: '#7E7F90',
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  }}
                >
                  הגדרות מעשרות זמינות רק לקטגוריות הכנסה והוצאה.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="rounded-xl p-3 text-sm"
                style={{
                  backgroundColor: 'rgba(241,138,181,0.1)',
                  border: '1px solid rgba(241,138,181,0.3)',
                  color: '#F18AB5',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
              >
                {error}
              </div>
            )}
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
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  שומר...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  שמור
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

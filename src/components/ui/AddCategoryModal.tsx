'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, isMaaserEligible?: boolean) => Promise<void>;
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
  const [isMaaserEligible, setIsMaaserEligible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const showMaaserOption = categoryType === 'income' || categoryType === 'expense';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('נא להזין שם לקטגוריה');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave(name.trim(), showMaaserOption ? isMaaserEligible : undefined);
      setName('');
      setIsMaaserEligible(false);
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
    setIsMaaserEligible(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const maaserLabel =
    categoryType === 'income'
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

            {/* Maaser Checkbox — income/expense only */}
            {showMaaserOption && (
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
                {/* Custom checkbox */}
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
            )}

            {/* Error Message */}
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

            {/* Info */}
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

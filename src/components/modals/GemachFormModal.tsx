'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';

// Field order for auto-scroll
const FIELD_ORDER = ['name', 'monthlyDeposit', 'totalMonths', 'monthsAlreadyPaid'];

interface GemachFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    monthlyDeposit: number;
    totalMonths: number;
    monthsAlreadyPaid: number;
  }) => Promise<void>;
}

export default function GemachFormModal({
  isOpen,
  onClose,
  onSave,
}: GemachFormModalProps) {
  const [name, setName] = useState('');
  const [monthlyDeposit, setMonthlyDeposit] = useState('');
  const [totalMonths, setTotalMonths] = useState('');
  const [monthsAlreadyPaid, setMonthsAlreadyPaid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Refs for auto-scroll to next field
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  // Reset form on open/close
  useEffect(() => {
    if (isOpen) {
      setName('');
      setMonthlyDeposit('');
      setTotalMonths('');
      setMonthsAlreadyPaid('');
      setValidationError('');
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Live validation
  useEffect(() => {
    if (totalMonths && monthsAlreadyPaid) {
      const total = parseInt(totalMonths);
      const paid = parseInt(monthsAlreadyPaid);
      if (paid > total) {
        setValidationError('מספר חודשים ששולמו לא יכול לעלות על מספר החודשים הכולל');
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  }, [totalMonths, monthsAlreadyPaid]);

  // Calculate preview values
  const previewAssetValue = monthlyDeposit && monthsAlreadyPaid
    ? parseFloat(monthlyDeposit) * parseInt(monthsAlreadyPaid)
    : 0;
  const previewLiabilityValue = monthlyDeposit && totalMonths && monthsAlreadyPaid
    ? parseFloat(monthlyDeposit) * (parseInt(totalMonths) - parseInt(monthsAlreadyPaid))
    : 0;
  const showPreview = previewAssetValue > 0 || previewLiabilityValue > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !monthlyDeposit || !totalMonths || !monthsAlreadyPaid) return;

    const total = parseInt(totalMonths);
    const paid = parseInt(monthsAlreadyPaid);

    if (paid > total) {
      setValidationError('מספר חודשים ששולמו לא יכול לעלות על מספר החודשים הכולל');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        name,
        monthlyDeposit: parseFloat(monthlyDeposit),
        totalMonths: total,
        monthsAlreadyPaid: paid,
      });
      onClose();
    } catch {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => !isLoading && onClose()}>
      <div className="modal-content max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 
            className="text-xl font-bold"
            style={{ 
              color: '#303150', 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif' 
            }}
          >
            תוכנית גמ&quot;ח חדשה
          </h2>
          <button onClick={onClose} className="btn-icon" disabled={isLoading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4" ref={modalBodyRef}>
            {/* Name */}
            <div ref={(el) => { if (el) fieldRefs.current.set('name', el); }}>
              <label className="label">שם הגמ&quot;ח</label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => { if (name) scrollToNextField('name'); }}
                placeholder='לדוגמה: גמ"ח משפחת כהן'
                className="input"
                required
              />
            </div>

            {/* Monthly Deposit */}
            <div ref={(el) => { if (el) fieldRefs.current.set('monthlyDeposit', el); }}>
              <label className="label">סכום חודשי (₪)</label>
              <input
                type="number"
                value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(e.target.value)}
                onBlur={() => { if (monthlyDeposit) scrollToNextField('monthlyDeposit'); }}
                placeholder="0"
                className="input"
                required
                min="1"
                step="1"
              />
            </div>

            {/* Total Months */}
            <div ref={(el) => { if (el) fieldRefs.current.set('totalMonths', el); }}>
              <label className="label">מספר חודשים כולל</label>
              <input
                type="number"
                value={totalMonths}
                onChange={(e) => setTotalMonths(e.target.value)}
                onBlur={() => { if (totalMonths) scrollToNextField('totalMonths'); }}
                placeholder="לדוגמה: 24"
                className="input"
                required
                min="1"
                step="1"
              />
            </div>

            {/* Months Already Paid */}
            <div ref={(el) => { if (el) fieldRefs.current.set('monthsAlreadyPaid', el); }}>
              <label className="label">חודשים ששולמו עד כה</label>
              <input
                type="number"
                value={monthsAlreadyPaid}
                onChange={(e) => setMonthsAlreadyPaid(e.target.value)}
                placeholder="0"
                className="input"
                required
                min="0"
                step="1"
              />
              {validationError && (
                <p className="text-xs mt-1 text-red-500">{validationError}</p>
              )}
            </div>

            {/* Preview Calculation */}
            {showPreview && !validationError && (
              <div 
                className="rounded-xl p-4 space-y-2"
                style={{ 
                  background: 'rgba(105, 173, 255, 0.06)',
                  border: '1px solid rgba(105, 173, 255, 0.15)'
                }}
              >
                <p 
                  className="text-xs font-semibold mb-2"
                  style={{ color: '#303150' }}
                >
                  סיכום:
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#7E7F90' }}>
                    נכס (סכום ששולם)
                  </span>
                  <span 
                    className="text-sm font-semibold"
                    style={{ 
                      color: '#0DBACC',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif'
                    }}
                  >
                    ₪{previewAssetValue.toLocaleString('he-IL')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#7E7F90' }}>
                    התחייבות (סכום שנותר)
                  </span>
                  <span 
                    className="text-sm font-semibold"
                    style={{ 
                      color: '#F18AB5',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif'
                    }}
                  >
                    ₪{previewLiabilityValue.toLocaleString('he-IL')}
                  </span>
                </div>
                <div 
                  className="flex justify-between items-center pt-2 mt-2"
                  style={{ borderTop: '1px solid rgba(105, 173, 255, 0.15)' }}
                >
                  <span className="text-xs" style={{ color: '#7E7F90' }}>
                    סה&quot;כ תוכנית
                  </span>
                  <span 
                    className="text-sm font-semibold"
                    style={{ 
                      color: '#303150',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif'
                    }}
                  >
                    ₪{(previewAssetValue + previewLiabilityValue).toLocaleString('he-IL')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary flex-1" 
              disabled={isLoading}
            >
              ביטול
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1" 
              disabled={isLoading || !!validationError}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'צור תוכנית'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


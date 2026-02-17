'use client';

import { X, Banknote, Handshake } from 'lucide-react';

interface LiabilityTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLoan: () => void;
  onSelectGemach: () => void;
}

export default function LiabilityTypeSelectionModal({
  isOpen,
  onClose,
  onSelectLoan,
  onSelectGemach,
}: LiabilityTypeSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 
            className="text-xl font-bold"
            style={{ 
              color: '#303150', 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif' 
            }}
          >
            הוספת התחייבות
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Options */}
        <div className="modal-body space-y-3">
          <p className="text-sm mb-4" style={{ color: '#7E7F90' }}>
            בחר/י את סוג ההתחייבות:
          </p>

          {/* Regular Loan */}
          <button
            onClick={() => {
              onClose();
              onSelectLoan();
            }}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border transition-all duration-200 hover:shadow-md hover:border-[#69ADFF] active:scale-[0.98] text-right"
            style={{ borderColor: '#F7F7F8' }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(241, 138, 181, 0.1)' }}
            >
              <Banknote className="w-6 h-6" style={{ color: '#F18AB5' }} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p 
                className="font-semibold text-sm"
                style={{ 
                  color: '#303150',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif'
                }}
              >
                הלוואה רגילה
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#7E7F90' }}>
                משכנתא, הלוואה בנקאית, כרטיס אשראי ועוד
              </p>
            </div>
          </button>

          {/* Gemach Plan */}
          <button
            onClick={() => {
              onClose();
              onSelectGemach();
            }}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border transition-all duration-200 hover:shadow-md hover:border-[#69ADFF] active:scale-[0.98] text-right"
            style={{ borderColor: '#F7F7F8' }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(30, 50, 105, 0.1)' }}
            >
              <Handshake className="w-6 h-6" style={{ color: '#1E3269' }} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p 
                className="font-semibold text-sm"
                style={{ 
                  color: '#303150',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif'
                }}
              >
                תוכנית גמ&quot;ח
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#7E7F90' }}>
                תוכנית גמ&quot;ח - נכס והתחייבות מקושרים
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-secondary flex-1"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}


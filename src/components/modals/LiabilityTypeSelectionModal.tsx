'use client';

import { X, Banknote, Home, Handshake } from 'lucide-react';

interface LiabilityTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLoan: () => void;
  onSelectMortgage: () => void;
  onSelectGemach: () => void;
}

const OPTIONS = [
  {
    id: 'loan',
    icon: Banknote,
    title: 'הלוואה רגילה',
    subtitle: 'הלוואה בנקאית, כרטיס אשראי, רכב ועוד',
    iconBg: 'rgba(241, 138, 181, 0.1)',
    iconColor: '#F18AB5',
  },
  {
    id: 'mortgage',
    icon: Home,
    title: 'משכנתא',
    subtitle: 'הלוואה לדיור עם מספר מסלולים',
    iconBg: 'rgba(105, 173, 255, 0.1)',
    iconColor: '#69ADFF',
  },
  {
    id: 'gemach',
    icon: Handshake,
    title: 'תוכנית גמ\u05F4ח',
    subtitle: 'נכס והתחייבות מקושרים',
    iconBg: 'rgba(30, 50, 105, 0.1)',
    iconColor: '#1E3269',
  },
] as const;

export default function LiabilityTypeSelectionModal({
  isOpen,
  onClose,
  onSelectLoan,
  onSelectMortgage,
  onSelectGemach,
}: LiabilityTypeSelectionModalProps) {
  if (!isOpen) return null;

  const handlers: Record<string, () => void> = {
    loan: () => { onClose(); onSelectLoan(); },
    mortgage: () => { onClose(); onSelectMortgage(); },
    gemach: () => { onClose(); onSelectGemach(); },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2
            className="text-xl font-bold"
            style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            הוספת התחייבות
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body space-y-3">
          <p className="text-sm mb-4" style={{ color: '#7E7F90' }}>
            בחר/י את סוג ההתחייבות:
          </p>

          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={handlers[opt.id]}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border transition-all duration-200 hover:shadow-md hover:border-[#69ADFF] active:scale-[0.98] text-right"
                style={{ borderColor: '#F7F7F8' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: opt.iconBg }}
                >
                  <Icon className="w-6 h-6" style={{ color: opt.iconColor }} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    {opt.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#7E7F90' }}>
                    {opt.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

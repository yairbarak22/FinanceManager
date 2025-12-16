'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Holding } from '@/lib/types';

interface HoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Holding, 'id' | 'createdAt' | 'updatedAt'>) => void;
  holding?: Holding | null;
}

export default function HoldingModal({ isOpen, onClose, onSave, holding }: HoldingModalProps) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<'etf' | 'index_fund'>('etf');
  const [currentValue, setCurrentValue] = useState('');
  const [targetAllocation, setTargetAllocation] = useState('');

  useEffect(() => {
    if (holding) {
      setName(holding.name);
      setSymbol(holding.symbol || '');
      setType(holding.type);
      setCurrentValue(holding.currentValue.toString());
      setTargetAllocation(holding.targetAllocation.toString());
    } else {
      setName('');
      setSymbol('');
      setType('etf');
      setCurrentValue('');
      setTargetAllocation('');
    }
  }, [holding, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      symbol: symbol || undefined,
      type,
      currentValue: parseFloat(currentValue) || 0,
      targetAllocation: parseFloat(targetAllocation) || 0,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900">
            {holding ? 'עריכת נכס' : 'הוספת נכס חדש'}
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Name */}
            <div>
              <label className="label">שם הנכס</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: S&P 500 ETF"
                className="input"
                required
              />
            </div>

            {/* Symbol */}
            <div>
              <label className="label">סימול (אופציונלי)</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="לדוגמה: VOO"
                className="input"
              />
            </div>

            {/* Type */}
            <div>
              <label className="label">סוג</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'etf' | 'index_fund')}
                className="select"
              >
                <option value="etf">קרן סל (ETF)</option>
                <option value="index_fund">קרן מחקה</option>
              </select>
            </div>

            {/* Current Value */}
            <div>
              <label className="label">שווי נוכחי (₪)</label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0"
                className="input"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Target Allocation */}
            <div>
              <label className="label">פילוח יעד (%)</label>
              <input
                type="number"
                value={targetAllocation}
                onChange={(e) => setTargetAllocation(e.target.value)}
                placeholder="0"
                className="input"
                min="0"
                max="100"
                step="0.1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                סכום כל הפילוחים צריך להיות 100%
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              ביטול
            </button>
            <button type="submit" className="btn-primary flex-1">
              {holding ? 'עדכון' : 'הוספה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import { Liability } from '@/lib/types';
import { liabilityTypes } from '@/lib/categories';
import { calculateSpitzerPayment } from '@/lib/loanCalculations';
import { formatCurrency, cn } from '@/lib/utils';

interface LiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (liability: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>) => void;
  liability?: Liability | null;
}

export default function LiabilityModal({
  isOpen,
  onClose,
  onSave,
  liability,
}: LiabilityModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'loan' | 'mortgage'>('loan');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanTermMonths, setLoanTermMonths] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanMethod, setLoanMethod] = useState<'spitzer' | 'equal_principal'>('spitzer');
  const [hasInterestRebate, setHasInterestRebate] = useState(false);

  useEffect(() => {
    if (liability) {
      setName(liability.name);
      setType(liability.type as 'loan' | 'mortgage');
      setTotalAmount(liability.totalAmount.toString());
      setMonthlyPayment(liability.monthlyPayment.toString());
      setInterestRate((liability.interestRate || 0).toString());
      setLoanTermMonths((liability.loanTermMonths || 0).toString());
      setStartDate(liability.startDate ? new Date(liability.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setLoanMethod(liability.loanMethod || 'spitzer');
      setHasInterestRebate(liability.hasInterestRebate || false);
    } else {
      setName('');
      setType('loan');
      setTotalAmount('');
      setMonthlyPayment('');
      setInterestRate('');
      setLoanTermMonths('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setLoanMethod('spitzer');
      setHasInterestRebate(false);
    }
  }, [liability, isOpen]);

  // Calculate monthly payment when loan details change
  const calculatePayment = () => {
    const amount = parseFloat(totalAmount);
    const rate = parseFloat(interestRate);
    const term = parseInt(loanTermMonths);
    
    if (amount > 0 && rate >= 0 && term > 0) {
      const payment = calculateSpitzerPayment(amount, rate, term);
      setMonthlyPayment(Math.round(payment).toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      type,
      totalAmount: parseFloat(totalAmount),
      monthlyPayment: parseFloat(monthlyPayment),
      interestRate: parseFloat(interestRate) || 0,
      loanTermMonths: parseInt(loanTermMonths) || 0,
      startDate: startDate,
      loanMethod,
      hasInterestRebate,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900">
            {liability ? 'עריכת התחייבות' : 'התחייבות חדשה'}
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {/* Name */}
            <div>
              <label className="label">שם ההתחייבות</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: משכנתא לדירה"
                className="input"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="label">סוג התחייבות</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'loan' | 'mortgage')}
                className="select"
                required
              >
                {liabilityTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameHe}
                  </option>
                ))}
              </select>
            </div>

            {/* Loan Method */}
            <div>
              <label className="label">שיטת ההלוואה</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoanMethod('spitzer')}
                  className={cn(
                    "py-2.5 px-4 rounded-xl text-sm font-medium transition-all",
                    loanMethod === 'spitzer'
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  שפיצר
                </button>
                <button
                  type="button"
                  onClick={() => setLoanMethod('equal_principal')}
                  className={cn(
                    "py-2.5 px-4 rounded-xl text-sm font-medium transition-all",
                    loanMethod === 'equal_principal'
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  קרן שווה
                </button>
              </div>
            </div>

            {/* Total Amount + Interest Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">סכום הלוואה (₪)</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0"
                  className="input"
                  required
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="label">ריבית שנתית (%)</label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="0"
                  className="input"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Term + Start Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">תקופה (חודשים)</label>
                <input
                  type="number"
                  value={loanTermMonths}
                  onChange={(e) => setLoanTermMonths(e.target.value)}
                  placeholder="0"
                  className="input"
                  min="1"
                  step="1"
                />
              </div>
              <div>
                <label className="label">תאריך התחלה</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Calculate Payment Button */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="label">תשלום חודשי (₪)</label>
                <input
                  type="number"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value)}
                  placeholder="0"
                  className="input"
                  required
                  min="0"
                  step="1"
                />
              </div>
              <button
                type="button"
                onClick={calculatePayment}
                className="btn-secondary h-[46px]"
                title="חשב תשלום לפי פרטי ההלוואה"
              >
                <Calculator className="w-4 h-4" />
                חשב
              </button>
            </div>

            {/* Interest Rebate */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">זיכוי על הריבית</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    אם פעיל, רק הקרן נחשבת כהוצאה (לדוגמה: משכנתא עם החזר מס)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHasInterestRebate(!hasInterestRebate)}
                  className={cn(
                    'toggle',
                    hasInterestRebate ? 'toggle-checked' : 'toggle-unchecked'
                  )}
                >
                  <span
                    className={cn(
                      'toggle-thumb',
                      hasInterestRebate ? 'toggle-thumb-checked' : 'toggle-thumb-unchecked'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              ביטול
            </button>
            <button type="submit" className="btn-primary flex-1">
              {liability ? 'עדכן' : 'הוסף'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { X, Calendar, TrendingDown, Banknote, Percent } from 'lucide-react';
import { Liability, AmortizationRow } from '@/lib/types';
import { generateAmortizationSchedule, getCurrentMonthPayment } from '@/lib/loanCalculations';
import { formatCurrency, cn } from '@/lib/utils';

interface AmortizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  liability: Liability | null;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function AmortizationModal({
  isOpen,
  onClose,
  liability,
}: AmortizationModalProps) {
  if (!isOpen || !liability) return null;

  const hasLoanDetails = liability.interestRate > 0 && liability.loanTermMonths > 0;
  
  const schedule = hasLoanDetails
    ? generateAmortizationSchedule(
        liability.totalAmount,
        liability.interestRate,
        liability.loanTermMonths,
        new Date(liability.startDate),
        liability.loanMethod || 'spitzer'
      )
    : [];

  const currentPayment = getCurrentMonthPayment(liability);
  const currentMonth = currentPayment?.currentMonth || 0;

  // Calculate totals
  const totalPayments = schedule.reduce((sum, row) => sum + row.payment, 0);
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  const totalPrincipal = schedule.reduce((sum, row) => sum + row.principal, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-w-3xl animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              לוח סילוקין - {liability.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {liability.loanMethod === 'spitzer' ? 'שיטת שפיצר' : 'קרן שווה'}
              {liability.hasInterestRebate && ' • זיכוי ריבית פעיל'}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          {/* Loan Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-500">סכום הלוואה</span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(liability.totalAmount)}
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-500">ריבית שנתית</span>
              </div>
              <p className="text-lg font-bold text-purple-600">
                {liability.interestRate}%
              </p>
            </div>
            
            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-gray-500">תקופה</span>
              </div>
              <p className="text-lg font-bold text-orange-600">
                {liability.loanTermMonths} חודשים
              </p>
            </div>
            
            <div className="bg-pink-50 rounded-xl p-3 border border-pink-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-pink-600" />
                <span className="text-xs text-gray-500">סה"כ ריבית</span>
              </div>
              <p className="text-lg font-bold text-pink-600">
                {formatCurrency(totalInterest)}
              </p>
            </div>
          </div>

          {/* Current Month Highlight */}
          {currentPayment && currentMonth > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">החודש הנוכחי (חודש {currentMonth})</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">תשלום</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(currentPayment.payment)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">קרן</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(currentPayment.principal)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">ריבית</p>
                  <p className="text-lg font-bold text-pink-600">{formatCurrency(currentPayment.interest)}</p>
                </div>
              </div>
              {liability.hasInterestRebate && (
                <div className="mt-3 text-center">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    החיוב בפועל (עם זיכוי): {formatCurrency(currentPayment.principal)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Amortization Table */}
          {hasLoanDetails ? (
            <div className="max-h-[400px] overflow-y-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-right p-3 font-medium text-gray-600">חודש</th>
                    <th className="text-right p-3 font-medium text-gray-600">תאריך</th>
                    <th className="text-right p-3 font-medium text-gray-600">תשלום</th>
                    <th className="text-right p-3 font-medium text-gray-600">קרן</th>
                    <th className="text-right p-3 font-medium text-gray-600">ריבית</th>
                    <th className="text-right p-3 font-medium text-gray-600">יתרה</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr 
                      key={row.month}
                      className={cn(
                        "border-t border-gray-100 transition-colors",
                        row.month === currentMonth 
                          ? "bg-green-50 font-medium" 
                          : row.month < currentMonth 
                            ? "bg-gray-50 text-gray-400"
                            : "hover:bg-gray-50"
                      )}
                    >
                      <td className="p-3">{row.month}</td>
                      <td className="p-3">{formatDate(row.date)}</td>
                      <td className="p-3">{formatCurrency(row.payment)}</td>
                      <td className="p-3 text-green-600">{formatCurrency(row.principal)}</td>
                      <td className="p-3 text-pink-600">{formatCurrency(row.interest)}</td>
                      <td className="p-3 font-medium">{formatCurrency(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-medium sticky bottom-0">
                  <tr className="border-t-2 border-gray-300">
                    <td className="p-3" colSpan={2}>סה"כ</td>
                    <td className="p-3">{formatCurrency(totalPayments)}</td>
                    <td className="p-3 text-green-600">{formatCurrency(totalPrincipal)}</td>
                    <td className="p-3 text-pink-600">{formatCurrency(totalInterest)}</td>
                    <td className="p-3">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>לא הוגדרו פרטי הלוואה מלאים</p>
              <p className="text-sm mt-1">ערוך את ההתחייבות והוסף ריבית ותקופה כדי לראות את לוח הסילוקין</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary flex-1">
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}


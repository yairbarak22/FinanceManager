'use client';

import { X, Calendar, TrendingDown, Banknote, Percent } from 'lucide-react';
import { Liability, AmortizationRow } from '@/lib/types';
import { generateAmortizationSchedule, getCurrentMonthPayment } from '@/lib/loanCalculations';
import { formatCurrency, cn } from '@/lib/utils';
import { SensitiveData } from '../common/SensitiveData';

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
            <h2 
              className="text-xl font-bold"
              style={{ 
                color: '#303150', 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif' 
              }}
            >
              לוח סילוקין - {liability.name}
            </h2>
            <p 
              className="text-sm mt-1"
              style={{ 
                color: '#7E7F90', 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif' 
              }}
            >
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
            <div 
              className="rounded-xl p-3"
              style={{ 
                backgroundColor: 'rgba(105, 173, 255, 0.1)',
                border: '1px solid rgba(105, 173, 255, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="w-4 h-4" style={{ color: '#69ADFF' }} />
                <span className="text-xs" style={{ color: '#7E7F90' }}>סכום הלוואה</span>
              </div>
              <SensitiveData as="p" className="text-lg font-bold" style={{ color: '#69ADFF' }}>
                {formatCurrency(liability.totalAmount)}
              </SensitiveData>
            </div>
            
            <div 
              className="rounded-xl p-3"
              style={{ 
                backgroundColor: 'rgba(159, 127, 224, 0.1)',
                border: '1px solid rgba(159, 127, 224, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Percent className="w-4 h-4" style={{ color: '#9F7FE0' }} />
                <span className="text-xs" style={{ color: '#7E7F90' }}>ריבית שנתית</span>
              </div>
              <p className="text-lg font-bold" style={{ color: '#9F7FE0' }}>
                {liability.interestRate}%
              </p>
            </div>
            
            <div 
              className="rounded-xl p-3"
              style={{ 
                backgroundColor: 'rgba(241, 138, 181, 0.1)',
                border: '1px solid rgba(241, 138, 181, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" style={{ color: '#F18AB5' }} />
                <span className="text-xs" style={{ color: '#7E7F90' }}>תקופה</span>
              </div>
              <p className="text-lg font-bold" style={{ color: '#F18AB5' }}>
                {liability.loanTermMonths} חודשים
              </p>
            </div>
            
            <div 
              className="rounded-xl p-3"
              style={{ 
                backgroundColor: 'rgba(13, 186, 204, 0.1)',
                border: '1px solid rgba(13, 186, 204, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4" style={{ color: '#0DBACC' }} />
                <span className="text-xs" style={{ color: '#7E7F90' }}>סה"כ ריבית</span>
              </div>
              <SensitiveData as="p" className="text-lg font-bold" style={{ color: '#0DBACC' }}>
                {formatCurrency(totalInterest)}
              </SensitiveData>
            </div>
          </div>

          {/* Current Month Highlight */}
          {currentPayment && currentMonth > 0 && (
            <div 
              className="rounded-xl p-4 mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(13, 186, 204, 0.08) 0%, rgba(116, 172, 239, 0.08) 100%)',
                border: '1px solid rgba(13, 186, 204, 0.15)',
              }}
            >
              <h3 
                className="text-sm font-semibold mb-3"
                style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                החודש הנוכחי (חודש {currentMonth})
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs" style={{ color: '#7E7F90' }}>תשלום</p>
                  <SensitiveData as="p" className="text-lg font-bold" style={{ color: '#303150' }}>
                    {formatCurrency(currentPayment.payment)}
                  </SensitiveData>
                </div>
                <div className="text-center">
                  <p className="text-xs" style={{ color: '#7E7F90' }}>קרן</p>
                  <SensitiveData as="p" className="text-lg font-bold" style={{ color: '#0DBACC' }}>
                    {formatCurrency(currentPayment.principal)}
                  </SensitiveData>
                </div>
                <div className="text-center">
                  <p className="text-xs" style={{ color: '#7E7F90' }}>ריבית</p>
                  <SensitiveData as="p" className="text-lg font-bold" style={{ color: '#F18AB5' }}>
                    {formatCurrency(currentPayment.interest)}
                  </SensitiveData>
                </div>
              </div>
              {liability.hasInterestRebate && (
                <div className="mt-3 text-center">
                  <SensitiveData 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: 'rgba(13, 186, 204, 0.15)',
                      color: '#0DBACC',
                    }}
                  >
                    החיוב בפועל (עם זיכוי): {formatCurrency(currentPayment.principal)}
                  </SensitiveData>
                </div>
              )}
            </div>
          )}

          {/* Amortization Table */}
          {hasLoanDetails ? (
            <div className="max-h-[400px] overflow-y-auto rounded-xl" style={{ border: '1px solid #F7F7F8' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0" style={{ backgroundColor: '#F7F7F8' }}>
                  <tr>
                    <th className="text-right p-3 font-medium" style={{ color: '#7E7F90' }}>חודש</th>
                    <th className="text-right p-3 font-medium" style={{ color: '#7E7F90' }}>תאריך</th>
                    <th className="text-right p-3 font-medium" style={{ color: '#7E7F90' }}>תשלום</th>
                    <th className="text-right p-3 font-medium" style={{ color: '#7E7F90' }}>קרן</th>
                    <th className="text-right p-3 font-medium" style={{ color: '#7E7F90' }}>ריבית</th>
                    <th className="text-right p-3 font-medium" style={{ color: '#7E7F90' }}>יתרה</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr 
                      key={row.month}
                      className={cn(
                        "transition-colors",
                        row.month === currentMonth 
                          ? "font-medium" 
                          : row.month < currentMonth 
                            ? ""
                            : "hover:bg-[#F7F7F8]"
                      )}
                      style={{
                        borderTop: '1px solid #F7F7F8',
                        backgroundColor: row.month === currentMonth 
                          ? 'rgba(13, 186, 204, 0.08)' 
                          : row.month < currentMonth 
                            ? '#F7F7F8'
                            : 'transparent',
                        color: row.month < currentMonth ? '#BDBDCB' : '#303150',
                      }}
                    >
                      <td className="p-3">{row.month}</td>
                      <td className="p-3">{formatDate(row.date)}</td>
                      <SensitiveData as="td" className="p-3">{formatCurrency(row.payment)}</SensitiveData>
                      <SensitiveData as="td" className="p-3" style={{ color: row.month < currentMonth ? '#BDBDCB' : '#0DBACC' }}>{formatCurrency(row.principal)}</SensitiveData>
                      <SensitiveData as="td" className="p-3" style={{ color: row.month < currentMonth ? '#BDBDCB' : '#F18AB5' }}>{formatCurrency(row.interest)}</SensitiveData>
                      <SensitiveData as="td" className="p-3 font-medium">{formatCurrency(row.balance)}</SensitiveData>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-medium sticky bottom-0" style={{ backgroundColor: '#F7F7F8' }}>
                  <tr style={{ borderTop: '2px solid #E8E8ED' }}>
                    <td className="p-3" colSpan={2} style={{ color: '#303150' }}>סה"כ</td>
                    <SensitiveData as="td" className="p-3" style={{ color: '#303150' }}>{formatCurrency(totalPayments)}</SensitiveData>
                    <SensitiveData as="td" className="p-3" style={{ color: '#0DBACC' }}>{formatCurrency(totalPrincipal)}</SensitiveData>
                    <SensitiveData as="td" className="p-3" style={{ color: '#F18AB5' }}>{formatCurrency(totalInterest)}</SensitiveData>
                    <td className="p-3" style={{ color: '#7E7F90' }}>-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: '#7E7F90' }}>
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


'use client';

import { X, Target, RefreshCw, PlusCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface GoalCreationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  goalName: string;
  monthlyContribution: number;
  isCreating?: boolean;
}

export default function GoalCreationInfoModal({
  isOpen,
  onClose,
  onConfirm,
  goalName,
  monthlyContribution,
  isCreating,
}: GoalCreationInfoModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[4px] z-[9999] animate-fade-in"
        onClick={() => !isCreating && onClose()}
      />
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        onClick={() => !isCreating && onClose()}
      >
        <div
          className="bg-white rounded-3xl shadow-xl max-w-md w-full animate-scale-in"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#F7F7F8]">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)' }}
              >
                <Target className="w-5 h-5 text-white" />
              </div>
              <h2 
                className="text-xl font-bold"
                style={{ 
                  color: '#303150',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
              >
                הוספת יעד חדש
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" style={{ color: '#7E7F90' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p 
              className="text-sm leading-relaxed"
              style={{ color: '#7E7F90' }}
            >
              ביצירת היעד <strong style={{ color: '#303150' }}>&quot;{goalName}&quot;</strong> יתרחשו הפעולות הבאות:
            </p>

            {/* Info Items */}
            <div className="space-y-3">
              {/* Item 1 - Recurring expense */}
              <div 
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ backgroundColor: 'rgba(105, 173, 255, 0.08)' }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'rgba(105, 173, 255, 0.15)' }}
                >
                  <RefreshCw className="w-4 h-4" style={{ color: '#69ADFF' }} />
                </div>
                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ color: '#303150' }}
                  >
                    תיווצר הוצאה קבועה
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: '#7E7F90' }}
                  >
                    הוצאה חודשית של <strong style={{ color: '#69ADFF' }}>{formatCurrency(monthlyContribution)}</strong> תתווסף אוטומטית עם שם היעד
                  </p>
                </div>
              </div>

              {/* Item 2 - Monthly update */}
              <div 
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ backgroundColor: 'rgba(13, 186, 204, 0.08)' }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'rgba(13, 186, 204, 0.15)' }}
                >
                  <ArrowLeft className="w-4 h-4" style={{ color: '#0DBACC' }} />
                </div>
                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ color: '#303150' }}
                  >
                    עדכון אוטומטי כל חודש
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: '#7E7F90' }}
                  >
                    הסכום שנצבר ליעד יתעדכן אוטומטית בתחילת כל חודש לפי ההוצאה הקבועה
                  </p>
                </div>
              </div>

              {/* Item 3 - Manual additions */}
              <div 
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ backgroundColor: 'rgba(241, 138, 181, 0.08)' }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'rgba(241, 138, 181, 0.15)' }}
                >
                  <PlusCircle className="w-4 h-4" style={{ color: '#F18AB5' }} />
                </div>
                <div>
                  <p 
                    className="text-sm font-medium mb-1"
                    style={{ color: '#303150' }}
                  >
                    הוספת כספים ידנית
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: '#7E7F90' }}
                  >
                    תוכל להוסיף הוצאות עם קטגוריית היעד כדי להגדיל את החיסכון ולקרב את מועד ההגעה
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-[#F7F7F8]">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: '#F7F7F8',
                color: '#7E7F90',
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              }}
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isCreating}
              className="flex-1 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#69ADFF',
                color: 'white',
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              }}
            >
              {isCreating ? (
                <>
                  יוצר יעד...
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                'אישור והמשך'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


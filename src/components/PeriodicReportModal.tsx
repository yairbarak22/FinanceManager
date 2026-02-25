'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileText,
  Download,
  Mail,
  Check,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { HDate } from '@hebcal/core';
import { getHebrewMonthsForYear, formatHebrewYear } from '@/lib/date/hebrewCalendar';
import { apiFetch } from '@/lib/utils';
import ReportLoadingPlayer from './ReportLoadingPlayer';

const GREGORIAN_MONTHS = [
  { value: 1, label: 'ינואר' },
  { value: 2, label: 'פברואר' },
  { value: 3, label: 'מרץ' },
  { value: 4, label: 'אפריל' },
  { value: 5, label: 'מאי' },
  { value: 6, label: 'יוני' },
  { value: 7, label: 'יולי' },
  { value: 8, label: 'אוגוסט' },
  { value: 9, label: 'ספטמבר' },
  { value: 10, label: 'אוקטובר' },
  { value: 11, label: 'נובמבר' },
  { value: 12, label: 'דצמבר' },
];

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-xl p-1" style={{ backgroundColor: '#F7F7F8' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            backgroundColor: value === opt.value ? '#FFFFFF' : 'transparent',
            color: value === opt.value ? '#303150' : '#7E7F90',
            boxShadow:
              value === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface SelectOption {
  value: string | number;
  label: string;
}

function StyledSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectMounted, setSelectMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    setSelectMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white rounded-xl text-sm flex items-center justify-between gap-2 transition-all duration-200"
        style={{
          border: isOpen ? '1px solid #69ADFF' : '1px solid #E8E8ED',
          color: selectedOption ? '#303150' : '#BDBDCB',
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          boxShadow: isOpen ? '0 0 0 3px rgba(105, 173, 255, 0.2)' : 'none',
        }}
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex-1 text-right truncate">
          {selectedOption?.label ?? ''}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: '#7E7F90' }}
        />
      </button>

      {selectMounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
              }}
              className="z-[12000] bg-white rounded-2xl shadow-xl border border-[#F7F7F8] overflow-hidden"
              dir="rtl"
              role="listbox"
            >
              <div className="max-h-48 overflow-y-auto py-1">
                {options.map((option) => {
                  const isSelected = String(value) === String(option.value);
                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(String(option.value));
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors text-right"
                      style={{
                        backgroundColor: isSelected ? '#F7F7F8' : 'transparent',
                        color: isSelected ? '#69ADFF' : '#303150',
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#F7F7F8';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span className="flex-1">{option.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#69ADFF' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

function DeliveryCard({
  selected,
  onClick,
  icon: Icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: typeof Download;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer"
      style={{
        borderColor: selected ? '#0DBACC' : '#E8E8ED',
        backgroundColor: selected ? 'rgba(13, 186, 204, 0.04)' : '#FFFFFF',
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200"
        style={{
          backgroundColor: selected
            ? 'rgba(13, 186, 204, 0.12)'
            : '#F7F7F8',
        }}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: selected ? '#0DBACC' : '#7E7F90' }}
          strokeWidth={1.75}
        />
      </div>
      <span
        className="text-sm font-medium"
        style={{ color: selected ? '#303150' : '#7E7F90' }}
      >
        {label}
      </span>
      {selected && (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#0DBACC' }}
        >
          <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
        </div>
      )}
    </button>
  );
}

interface PeriodicReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PeriodicReportModal({
  isOpen,
  onClose,
}: PeriodicReportModalProps) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [calendarType, setCalendarType] = useState<'gregorian' | 'hebrew'>(
    'gregorian',
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    () => new Date().getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    () => new Date().getFullYear(),
  );
  const [deliveryMethod, setDeliveryMethod] = useState<'download' | 'email'>(
    'download',
  );
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const apiDoneRef = useRef(false);
  const apiResultRef = useRef<{ success?: string; error?: string } | null>(null);
  const pendingBlobRef = useRef<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const finishAfterAnimation = useCallback(() => {
    const result = apiResultRef.current;
    if (!result) return;

    const blob = pendingBlobRef.current;
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'myNETO_report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      pendingBlobRef.current = null;
    }

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(result.success);
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    }
    setShowAnimation(false);
    setIsLoading(false);
    apiDoneRef.current = false;
    apiResultRef.current = null;
    setAnimationDone(false);
  }, [onClose]);

  const handleAnimationEnd = useCallback(() => {
    setAnimationDone(true);
    if (apiDoneRef.current) {
      finishAfterAnimation();
    }
  }, [finishAfterAnimation]);

  useEffect(() => {
    if (animationDone && apiDoneRef.current) {
      finishAfterAnimation();
    }
  }, [animationDone, finishAfterAnimation]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading && !showAnimation) {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    },
    [onClose, isLoading, showAnimation],
  );

  const handleCalendarTypeChange = useCallback((type: string) => {
    const next = type as 'gregorian' | 'hebrew';
    setCalendarType(next);
    setError(null);
    if (next === 'gregorian') {
      const now = new Date();
      setSelectedMonth(now.getMonth() + 1);
      setSelectedYear(now.getFullYear());
    } else {
      const hd = new HDate();
      setSelectedMonth(hd.getMonth());
      setSelectedYear(hd.getFullYear());
    }
  }, []);

  const monthOptions = useMemo(() => {
    if (calendarType === 'gregorian') {
      return GREGORIAN_MONTHS;
    }
    return getHebrewMonthsForYear(selectedYear).map((m) => ({
      value: m.month,
      label: m.name,
    }));
  }, [calendarType, selectedYear]);

  const yearOptions = useMemo(() => {
    if (calendarType === 'gregorian') {
      const cur = new Date().getFullYear();
      const years: number[] = [];
      for (let y = cur; y >= cur - 6; y--) years.push(y);
      return years;
    }
    const cur = new HDate().getFullYear();
    const years: number[] = [];
    for (let y = cur; y >= cur - 6; y--) years.push(y);
    return years;
  }, [calendarType]);

  useEffect(() => {
    if (calendarType === 'hebrew') {
      const months = getHebrewMonthsForYear(selectedYear);
      if (!months.some((m) => m.month === selectedMonth)) {
        setSelectedMonth(months[0].month);
      }
    }
  }, [selectedYear, calendarType, selectedMonth]);

  const handleSubmit = async () => {
    if (deliveryMethod === 'email' && password.length < 4) {
      setError('הסיסמה חייבת להכיל לפחות 4 תווים');
      return;
    }

    setIsLoading(true);
    setShowAnimation(true);
    setAnimationDone(false);
    apiDoneRef.current = false;
    apiResultRef.current = null;
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        calendarType,
        month: selectedMonth,
        year: selectedYear,
        deliveryMethod,
        ...(deliveryMethod === 'email' && {
          email: session?.user?.email || '',
          password,
        }),
      };

      const response = await apiFetch('/api/periodic-reports/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (deliveryMethod === 'download') {
        if (!response.ok) {
          const data = await response.json();
          const msg =
            response.status === 404 && data.code === 'NO_DATA'
              ? 'לא נמצאו נתונים פיננסיים לחודש זה. נסה לבחור תקופה אחרת.'
              : data.error || 'שגיאה ביצירת הדוח';
          apiResultRef.current = { error: msg };
          apiDoneRef.current = true;
          if (animationDone) finishAfterAnimation();
          return;
        }
        const blob = await response.blob();
        pendingBlobRef.current = blob;
        apiResultRef.current = { success: 'הדוח הורד בהצלחה' };
      } else {
        const data = await response.json();
        if (!response.ok) {
          const msg =
            response.status === 404 && data.code === 'NO_DATA'
              ? 'לא נמצאו נתונים פיננסיים לחודש זה. נסה לבחור תקופה אחרת.'
              : data.error || 'שגיאה ביצירת הדוח';
          apiResultRef.current = { error: msg };
          apiDoneRef.current = true;
          if (animationDone) finishAfterAnimation();
          return;
        }
        apiResultRef.current = { success: data.message || 'הדוח נשלח למייל שלך בצורה מאובטחת.' };
      }

      apiDoneRef.current = true;
      if (animationDone) finishAfterAnimation();
    } catch {
      apiResultRef.current = { error: 'שגיאה ביצירת הדוח. נסה שוב מאוחר יותר.' };
      apiDoneRef.current = true;
      if (animationDone) finishAfterAnimation();
    }
  };

  const handleClose = () => {
    if (isLoading || showAnimation) return;
    setError(null);
    setSuccess(null);
    setPassword('');
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
      }}
      onClick={handleClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="periodic-report-title"
        dir="rtl"
        className="modal-content max-w-md rounded-3xl max-h-[85vh] h-[85vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {showAnimation && <ReportLoadingPlayer onAnimationEnd={handleAnimationEnd} />}

        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(105, 173, 255, 0.1)' }}
            >
              <FileText
                className="w-5 h-5"
                style={{ color: '#69ADFF' }}
                strokeWidth={1.75}
              />
            </div>
            <h2
              id="periodic-report-title"
              className="text-lg font-semibold"
              style={{ color: '#303150' }}
            >
              הפקת דוח חודשי
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="btn-icon"
            aria-label="סגור"
            disabled={isLoading || showAnimation}
          >
            <X className="w-5 h-5" style={{ color: '#7E7F90' }} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body overflow-y-auto flex-1">
          {/* Calendar Type Toggle */}
          <div>
            <label
              className="label"
              style={{ marginBottom: '0.5rem', display: 'block' }}
            >
              סוג לוח שנה
            </label>
            <SegmentedControl
              options={[
                { value: 'gregorian', label: 'לועזי' },
                { value: 'hebrew', label: 'עברי' },
              ]}
              value={calendarType}
              onChange={handleCalendarTypeChange}
            />
          </div>

          {/* Month & Year Selectors */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="label">
                חודש
              </label>
              <StyledSelect
                value={selectedMonth}
                onChange={(v) => {
                  setSelectedMonth(Number(v));
                  setError(null);
                }}
                options={monthOptions.map((m) => ({ value: m.value, label: m.label }))}
                label="חודש"
              />
            </div>
            <div className="flex-1">
              <label className="label">
                שנה
              </label>
              <StyledSelect
                value={selectedYear}
                onChange={(v) => {
                  setSelectedYear(Number(v));
                  setError(null);
                }}
                options={yearOptions.map((y) => ({
                  value: y,
                  label: calendarType === 'hebrew' ? formatHebrewYear(y) : String(y),
                }))}
                label="שנה"
              />
            </div>
          </div>

          {/* Delivery Method */}
          <div>
            <label
              className="label"
              style={{ marginBottom: '0.5rem', display: 'block' }}
            >
              אופן קבלת הדוח
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <DeliveryCard
                selected={deliveryMethod === 'download'}
                onClick={() => {
                  setDeliveryMethod('download');
                  setError(null);
                }}
                icon={Download}
                label="הורדה למכשיר"
              />
              <DeliveryCard
                selected={deliveryMethod === 'email'}
                onClick={() => {
                  setDeliveryMethod('email');
                  setError(null);
                }}
                icon={Mail}
                label="שליחה למייל"
              />
            </div>
          </div>

          {/* Password Input (conditional) */}
          {deliveryMethod === 'email' && (
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: '#F7F7F8' }}
            >
              <div className="flex items-start gap-2 mb-3">
                <Lock
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: '#7E7F90' }}
                  strokeWidth={1.75}
                />
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: '#7E7F90' }}
                >
                  לשמירה על פרטיותך, הקובץ יינעל בסיסמה.
                  <br />
                  בחר/י סיסמה לפתיחת הדוח:
                </p>
              </div>
              <input
                type="password"
                className="input"
                placeholder="סיסמה (לפחות 4 תווים)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                minLength={4}
                dir="ltr"
                aria-label="סיסמה להגנת הקובץ"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'rgba(241, 138, 181, 0.1)',
                border: '1px solid rgba(241, 138, 181, 0.3)',
                color: '#F18AB5',
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'rgba(13, 186, 204, 0.1)',
                border: '1px solid rgba(13, 186, 204, 0.3)',
                color: '#0DBACC',
              }}
              role="status"
            >
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !!success}
            className="btn-primary w-full"
          >
            {deliveryMethod === 'download' ? (
              <>
                הורד דוח מאובטח
                <Download className="w-4 h-4" strokeWidth={1.75} />
              </>
            ) : (
              <>
                שלח דוח למייל
                <Mail className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export function PeriodicReportTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-secondary hover:border-[#E8E8ED] hover:shadow-[0_4px_16px_rgba(105,173,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
      >
        הפקת דוח חודשי
        <FileText
          className="w-4 h-4"
          style={{ color: '#7E7F90' }}
          strokeWidth={1.75}
        />
      </button>
      <PeriodicReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

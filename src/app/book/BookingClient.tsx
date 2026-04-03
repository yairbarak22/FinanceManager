'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Phone,
  Mail,
  User,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  CalendarDays,
  Flame,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface SlotData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface BookingResult {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
}

type Step = 1 | 2 | 3;

// ============================================
// DATE HELPERS
// ============================================

function formatHebrewDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

function formatGregorianDate(date: Date, short = false): string {
  return date.toLocaleDateString('he-IL', {
    weekday: short ? 'short' : 'long',
    day: 'numeric',
    month: short ? 'numeric' : 'long',
    year: short ? undefined : 'numeric',
  });
}

// ============================================
// STEP INDICATOR
// ============================================

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { num: 1, label: 'תאריך' },
    { num: 2, label: 'שעה' },
    { num: 3, label: 'פרטים' },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => {
        const isDone = step > s.num;
        const isCurrent = step === s.num;
        return (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-indigo-600 text-white'
                    : isCurrent
                      ? 'bg-white border-2 border-indigo-600 text-indigo-600 shadow-md shadow-indigo-100'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  isCurrent ? 'text-indigo-600' : isDone ? 'text-indigo-400' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mb-5 mx-1 transition-all duration-300 ${
                  step > s.num ? 'bg-indigo-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// COUNTER
// ============================================

function SlotsCounter({ remaining, total }: { remaining: number; total: number }) {
  const pct = Math.round((remaining / total) * 100);
  const isLow = remaining <= 10;

  return (
    <div
      className={`rounded-2xl p-3.5 border flex items-center gap-3 ${
        isLow ? 'border-orange-200 bg-orange-50' : 'border-indigo-100 bg-indigo-50/60'
      }`}
    >
      {isLow ? (
        <Flame className="w-5 h-5 text-orange-500 flex-shrink-0 animate-pulse" />
      ) : (
        <div className="w-5 h-5 flex-shrink-0 relative">
          <svg viewBox="0 0 20 20" className="w-5 h-5 -rotate-90">
            <circle cx="10" cy="10" r="8" fill="none" stroke="#e0e7ff" strokeWidth="3" />
            <circle
              cx="10" cy="10" r="8" fill="none"
              stroke="#6366f1" strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 8}`}
              strokeDashoffset={`${2 * Math.PI * 8 * (1 - pct / 100)}`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isLow ? 'text-orange-700' : 'text-indigo-700'}`}>
          {isLow ? '⚡ כמעט אזלו!' : `נותרו ${remaining} מקומות`}
        </p>
        <p className={`text-xs ${isLow ? 'text-orange-500' : 'text-indigo-500'}`}>
          {remaining} מתוך {total} מקומות פנויים
        </p>
      </div>
    </div>
  );
}

// ============================================
// CALENDAR (Step 1)
// ============================================

function CalendarStep({
  currentMonth,
  selectedDate,
  availableDates,
  onSelectDate,
  onChangeMonth,
}: {
  currentMonth: Date;
  selectedDate: string | null;
  availableDates: Set<string>;
  onSelectDate: (date: string) => void;
  onChangeMonth: (delta: number) => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const monthName = currentMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const canGoNext = new Date(year, month + 1, 1) <= maxMonth;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => onChangeMonth(1)}
          disabled={!canGoNext}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 disabled:opacity-25 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-base font-bold text-gray-800">{monthName}</h3>
        <button
          onClick={() => onChangeMonth(-1)}
          disabled={!canGoPrev}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 disabled:opacity-25 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-xs font-semibold text-gray-400 py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dateObj = new Date(year, month, day);
          const isPast = dateObj < today;
          const isAvailable = availableDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateObj.getTime() === today.getTime();

          return (
            <button
              key={dateStr}
              onClick={() => isAvailable && !isPast && onSelectDate(dateStr)}
              disabled={!isAvailable || isPast}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold
                transition-all duration-150
                ${isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105 z-10'
                  : isAvailable && !isPast
                    ? 'bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white hover:scale-105 hover:shadow-md hover:shadow-indigo-100 cursor-pointer border border-indigo-100'
                    : isPast
                      ? 'text-gray-250 cursor-default bg-transparent'
                      : 'text-gray-300 cursor-default bg-transparent'
                }
                ${isToday && !isSelected ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}
              `}
            >
              {day}
              {isAvailable && !isPast && !isSelected && (
                <span className="absolute bottom-1.5 w-1 h-1 bg-indigo-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-center text-gray-400">
        ימים עם נקודה · = זמן פנוי זמין
      </p>
    </div>
  );
}

// ============================================
// TIME SLOTS (Step 2)
// ============================================

function TimeSlotsStep({
  slots,
  selectedSlot,
  selectedDate,
  onSelectSlot,
  onBack,
}: {
  slots: SlotData[];
  selectedSlot: string | null;
  selectedDate: string;
  onSelectSlot: (id: string) => void;
  onBack: () => void;
}) {
  const dateObj = new Date(selectedDate + 'T00:00:00');

  return (
    <div>
      {/* Selected date badge */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex flex-col items-center justify-center leading-none">
          <span className="text-[10px] font-medium opacity-80">
            {dateObj.toLocaleDateString('he-IL', { month: 'short' })}
          </span>
          <span className="text-base font-bold leading-none">{dateObj.getDate()}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{formatGregorianDate(dateObj)}</p>
          <p className="text-xs text-indigo-600">{formatHebrewDate(dateObj)}</p>
        </div>
      </div>

      {slots.length === 0 ? (
        <p className="text-center text-gray-400 py-8">אין שעות פנויות ביום זה</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">בחרו שעה מתאימה:</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {slots.map((slot) => {
              const isSelected = selectedSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => onSelectSlot(slot.id)}
                  className={`
                    py-3.5 rounded-xl text-sm font-semibold transition-all duration-150 border
                    ${isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-105'
                      : 'bg-white text-gray-700 border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:scale-[1.03]'
                    }
                  `}
                >
                  {slot.startTime}
                </button>
              );
            })}
          </div>
        </>
      )}

      <button
        onClick={onBack}
        className="mt-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        חזרה לבחירת תאריך
      </button>
    </div>
  );
}

// ============================================
// DETAILS FORM (Step 3)
// ============================================

function DetailsStep({
  selectedDate,
  selectedSlotData,
  name, setName,
  phone, setPhone,
  email, setEmail,
  submitting,
  error,
  onSubmit,
  onBack,
}: {
  selectedDate: string;
  selectedSlotData: SlotData;
  name: string; setName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  submitting: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  const dateObj = new Date(selectedDate + 'T00:00:00');

  return (
    <div>
      {/* Summary pill */}
      <div className="flex gap-2 mb-6">
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-sm text-indigo-700">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>{formatGregorianDate(dateObj, true)}</span>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-sm text-indigo-700">
          <Clock className="w-3.5 h-3.5" />
          <span dir="ltr">{selectedSlotData.startTime}</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">שם מלא</label>
          <div className="relative">
            <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              placeholder="ישראל ישראלי"
              autoFocus
              className="w-full border border-gray-200 rounded-xl ps-10 pe-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">טלפון</label>
          <div className="relative">
            <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              pattern="^0[2-9]\d{7,8}$"
              placeholder="0501234567"
              dir="ltr"
              inputMode="tel"
              className="w-full border border-gray-200 rounded-xl ps-10 pe-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-start"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">נתקשר אליך במספר הזה בזמן השיחה</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">מייל</label>
          <div className="relative">
            <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              dir="ltr"
              inputMode="email"
              className="w-full border border-gray-200 rounded-xl ps-10 pe-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-start"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-4 rounded-xl text-base font-bold disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-2"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              קביעת שיחת ליווי
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <button
        onClick={onBack}
        className="mt-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        חזרה לבחירת שעה
      </button>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function BookingClient() {
  const cardRef = useRef<HTMLDivElement>(null);

  // Data
  const [allSlots, setAllSlots] = useState<SlotData[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [total, setTotal] = useState(50);
  const [loading, setLoading] = useState(true);

  // Navigation
  const [step, setStep] = useState<Step>(1);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Success
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch('/api/book/slots');
      if (res.ok) {
        const data = await res.json();
        setAllSlots(data.slots);
        setAvailableDates(data.availableDates);
        setRemaining(data.remaining);
        setTotal(data.total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // Scroll card into view on step change
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const slotsForDate = useMemo(
    () => (selectedDate ? allSlots.filter((s) => s.date === selectedDate) : []),
    [allSlots, selectedDate],
  );

  const selectedSlotData = useMemo(
    () => (selectedSlot ? allSlots.find((s) => s.id === selectedSlot) ?? null : null),
    [allSlots, selectedSlot],
  );

  const availableDatesSet = useMemo(() => new Set(availableDates), [availableDates]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setError('');
    setStep(2);
  };

  const handleSelectSlot = (slotId: string) => {
    setSelectedSlot(slotId);
    setError('');
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/book/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: selectedSlot, name, email, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookingResult({
          name: data.appointment.name,
          date: data.appointment.date,
          startTime: data.appointment.startTime,
          endTime: data.appointment.endTime,
        });
        setRemaining(data.remaining);
      } else {
        setError(data.error || 'שגיאה בקביעת הפגישה');
        if (res.status === 409) {
          fetchSlots();
          setSelectedSlot(null);
          setStep(2);
        }
      }
    } catch {
      setError('שגיאה בקביעת הפגישה, נסה שוב');
    } finally {
      setSubmitting(false);
    }
  };

  // ── SUCCESS ─────────────────────────────────

  if (bookingResult) {
    const dateObj = new Date(bookingResult.date + 'T00:00:00');
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">הפגישה נקבעה!</h1>
            <p className="text-gray-500 text-sm">ניצור איתך קשר בטלפון שהשארת</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">שם</p>
                <p className="font-semibold text-gray-900">{bookingResult.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">תאריך</p>
                <p className="font-semibold text-gray-900">{formatGregorianDate(dateObj)}</p>
                <p className="text-xs text-indigo-500">{formatHebrewDate(dateObj)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">שעה</p>
                <p className="font-semibold text-gray-900" dir="ltr">
                  {bookingResult.startTime} – {bookingResult.endTime}
                </p>
                <p className="text-xs text-gray-400">שיחה טלפונית · 10 דקות</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SOLD OUT ─────────────────────────────────

  if (!loading && remaining === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">כל המקומות אזלו</h1>
          <p className="text-gray-500 text-sm">כל 50 שיחות הליווי נתפסו. תודה על ההתעניינות!</p>
        </div>
      </div>
    );
  }

  // ── LOADING ───────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ── STEP TITLES ───────────────────────────────

  const stepTitles: Record<Step, { title: string; sub: string }> = {
    1: { title: 'בחרו תאריך', sub: 'ימים המסומנים בנקודה פנויים לקביעת שיחה' },
    2: { title: 'בחרו שעה', sub: 'בחרו שעה נוחה לשיחת הליווי' },
    3: { title: 'השלימו פרטים', sub: 'נחזור אליכם בטלפון שתשאירו' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 to-white">
      <div className="max-w-md mx-auto px-4 py-8 sm:py-12">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-200">
            <Phone className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
            שיחת ליווי אישית
          </h1>
          <p className="text-gray-500 text-sm">10 דקות · ללא עלות · לפתיחת תיק מסחר</p>
        </div>

        {/* Counter */}
        {remaining !== null && <SlotsCounter remaining={remaining} total={total} />}

        {/* Step indicator */}
        <div className="mt-6 mb-2">
          <StepIndicator step={step} />
        </div>

        {/* Card */}
        <div
          ref={cardRef}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-4"
        >
          {/* Step heading */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-900">{stepTitles[step].title}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{stepTitles[step].sub}</p>
          </div>

          {/* Step content */}
          <div className="p-5 sm:p-6">
            {step === 1 && (
              <CalendarStep
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                availableDates={availableDatesSet}
                onSelectDate={handleSelectDate}
                onChangeMonth={(delta) =>
                  setCurrentMonth((prev) => {
                    const next = new Date(prev);
                    next.setMonth(next.getMonth() + delta);
                    return next;
                  })
                }
              />
            )}

            {step === 2 && selectedDate && (
              <TimeSlotsStep
                slots={slotsForDate}
                selectedSlot={selectedSlot}
                selectedDate={selectedDate}
                onSelectSlot={handleSelectSlot}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && selectedDate && selectedSlotData && (
              <DetailsStep
                selectedDate={selectedDate}
                selectedSlotData={selectedSlotData}
                name={name} setName={setName}
                phone={phone} setPhone={setPhone}
                email={email} setEmail={setEmail}
                submitting={submitting}
                error={error}
                onSubmit={handleSubmit}
                onBack={() => setStep(2)}
              />
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © MyNeto {new Date().getFullYear()} · שיחת הליווי ללא עלות ובלי התחייבות
        </p>
      </div>
    </div>
  );
}

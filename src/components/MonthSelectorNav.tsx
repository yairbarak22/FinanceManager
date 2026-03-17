'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Calendar, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonth } from '@/context/MonthContext';

const MONTH_NAMES: Record<string, string> = {
  '01': 'ינואר',
  '02': 'פברואר',
  '03': 'מרץ',
  '04': 'אפריל',
  '05': 'מאי',
  '06': 'יוני',
  '07': 'יולי',
  '08': 'אוגוסט',
  '09': 'ספטמבר',
  '10': 'אוקטובר',
  '11': 'נובמבר',
  '12': 'דצמבר',
};

function formatPillLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${MONTH_NAMES[month]} ${year.slice(2)}`;
}

const SCROLL_STEP = 200;

export default function MonthSelectorNav() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
    customDateRange,
    setCustomDateRange,
  } = useMonth();

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const isCustomActive = selectedMonth === 'custom' && customDateRange !== null;

  const scrollToActive = useCallback(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const pill = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const pillRect = pill.getBoundingClientRect();

      const offset = pillRect.left - containerRect.left - containerRect.width / 2 + pillRect.width / 2;
      container.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    requestAnimationFrame(scrollToActive);
  }, [selectedMonth, scrollToActive]);

  const scrollCarousel = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? SCROLL_STEP : -SCROLL_STEP;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  const handleCustomClick = () => {
    if (!isCustomActive) {
      const today = new Date();
      const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const lastDay = `${lastOfMonth.getFullYear()}-${String(lastOfMonth.getMonth() + 1).padStart(2, '0')}-${String(lastOfMonth.getDate()).padStart(2, '0')}`;
      setCustomDateRange({ start: firstOfMonth, end: lastDay });
    }
  };

  const pillBase =
    'flex-shrink-0 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer select-none relative';
  const pillActive = 'bg-indigo-600 text-white shadow-sm';
  const pillInactive = 'text-slate-500 hover:bg-slate-100 hover:text-slate-700';

  const isActive = (key: string) =>
    selectedMonth === key && !isCustomActive;

  const chevronClass =
    'flex-shrink-0 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer';

  return (
    <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center gap-2 px-4 lg:px-6 py-2" dir="rtl">
        {/* Special pills */}
        <button
          type="button"
          onClick={() => setSelectedMonth('all')}
          className={`${pillBase} ${isActive('all') ? pillActive : pillInactive} flex items-center gap-1`}
        >
          <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>הכל</span>
        </button>

        <button
          type="button"
          onClick={handleCustomClick}
          className={`${pillBase} ${isCustomActive ? pillActive : pillInactive} flex items-center gap-1`}
        >
          <CalendarRange className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>מותאם</span>
        </button>

        <div className="w-px h-5 bg-slate-200 flex-shrink-0" />

        {/* Chevron: navigate toward start (newer months in RTL) */}
        <button
          type="button"
          onClick={() => scrollCarousel('right')}
          className={chevronClass}
          aria-label="חודשים חדשים יותר"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </button>

        {/* Scrollable month carousel */}
        <div className="relative flex-1 min-w-0 max-w-xs overflow-hidden">
          {/* Edge fade: right */}
          <div className="absolute inset-y-0 right-0 w-6 z-10 pointer-events-none bg-gradient-to-l from-white/80 to-transparent" />
          {/* Edge fade: left */}
          <div className="absolute inset-y-0 left-0 w-6 z-10 pointer-events-none bg-gradient-to-r from-white/80 to-transparent" />

          <div
            ref={scrollRef}
            className="flex items-center gap-1.5 overflow-x-auto month-selector-scroll"
          >
            {allMonths.map((monthKey) => {
              const active = isActive(monthKey);
              const isCurrent = monthKey === currentMonth;
              const hasData = monthsWithData.has(monthKey);

              return (
                <button
                  key={monthKey}
                  ref={active ? activeRef : undefined}
                  type="button"
                  onClick={() => setSelectedMonth(monthKey)}
                  className={`${pillBase} ${active ? pillActive : pillInactive} ${isCurrent && !active ? 'ring-1 ring-indigo-200' : ''}`}
                >
                  {formatPillLabel(monthKey)}
                  {hasData && !active && (
                    <span className="absolute top-0.5 start-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chevron: navigate toward end (older months in RTL) */}
        <button
          type="button"
          onClick={() => scrollCarousel('left')}
          className={chevronClass}
          aria-label="חודשים ישנים יותר"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

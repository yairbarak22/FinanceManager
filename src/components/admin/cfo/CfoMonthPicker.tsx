'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CfoMonthPickerProps {
  selectedMonth: string | null; // "YYYY-MM" or null = all time
  onChange: (month: string | null) => void;
}

function monthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
}

function addMonths(ym: string, delta: number): string {
  const [year, month] = ym.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function currentYM(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function CfoMonthPicker({ selectedMonth, onChange }: CfoMonthPickerProps) {
  const current = currentYM();
  const active = selectedMonth ?? current;
  const isAllTime = selectedMonth === null;
  const isCurrentMonth = active === current;

  const handlePrev = () => onChange(addMonths(active, -1));
  const handleNext = () => {
    if (isCurrentMonth) return;
    onChange(addMonths(active, 1));
  };

  return (
    <div className="flex items-center gap-2" dir="rtl">
      {/* All time toggle */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
          isAllTime
            ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
            : 'border-[#E8E8ED] bg-white text-[#7E7F90] hover:bg-[#F7F7F8] hover:text-[#303150]'
        }`}
      >
        כל הזמן
      </button>

      {/* Month navigator */}
      <div
        className={`flex items-center gap-1 h-9 rounded-lg border transition-all ${
          !isAllTime
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-[#E8E8ED] bg-white'
        }`}
      >
        {/* Next (future) — ChevronRight in RTL goes forward */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isCurrentMonth}
          className="w-8 h-full flex items-center justify-center text-[#7E7F90] hover:text-[#303150] disabled:opacity-30 transition-colors rounded-s-lg hover:bg-black/5"
          title="חודש הבא"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Month label — click to activate current month */}
        <button
          type="button"
          onClick={() => onChange(isAllTime ? current : active)}
          className={`px-3 text-sm font-medium min-w-[130px] text-center transition-colors ${
            !isAllTime ? 'text-indigo-600' : 'text-[#303150]'
          }`}
        >
          {isAllTime ? monthLabel(current) : monthLabel(active)}
        </button>

        {/* Prev (past) */}
        <button
          type="button"
          onClick={handlePrev}
          className="w-8 h-full flex items-center justify-center text-[#7E7F90] hover:text-[#303150] transition-colors rounded-e-lg hover:bg-black/5"
          title="חודש קודם"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Clear — show only when a specific month is selected */}
      {!isAllTime && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#7E7F90] hover:text-[#E2445C] hover:bg-red-50 transition-colors"
          title="נקה פילטר חודש"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

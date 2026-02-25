'use client';

import { ChevronRight, ChevronLeft } from 'lucide-react';

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

interface MonthSelectorProps {
  monthKey: string;
  onMonthChange: (monthKey: string) => void;
  exportMode?: boolean;
}

function getAdjacentMonth(monthKey: string, direction: -1 | 1): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1 + direction, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthDisplay(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${MONTH_NAMES[month]} ${year}`;
}

export default function MonthSelector({
  monthKey,
  onMonthChange,
  exportMode,
}: MonthSelectorProps) {
  if (exportMode) {
    return (
      <h1 className="text-[1.5rem] font-bold text-[#303150] text-center">
        {formatMonthDisplay(monthKey)}
      </h1>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onMonthChange(getAdjacentMonth(monthKey, 1))}
        className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors cursor-pointer"
        aria-label="חודש הבא"
      >
        <ChevronRight className="w-5 h-5 text-[#7E7F90]" strokeWidth={1.75} />
      </button>

      <span className="text-[1.125rem] font-semibold text-[#303150] min-w-[10rem] text-center select-none">
        {formatMonthDisplay(monthKey)}
      </span>

      <button
        onClick={() => onMonthChange(getAdjacentMonth(monthKey, -1))}
        className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors cursor-pointer"
        aria-label="חודש קודם"
      >
        <ChevronLeft className="w-5 h-5 text-[#7E7F90]" strokeWidth={1.75} />
      </button>
    </div>
  );
}

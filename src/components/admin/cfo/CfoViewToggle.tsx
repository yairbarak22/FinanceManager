'use client';

import { BarChart2, CalendarDays } from 'lucide-react';

export type CfoView = 'month' | 'pnl';

interface CfoViewToggleProps {
  view: CfoView;
  onChange: (v: CfoView) => void;
}

const tabs: { value: CfoView; label: string; icon: typeof CalendarDays }[] = [
  { value: 'month', label: 'תצוגת חודש', icon: CalendarDays },
  { value: 'pnl',   label: 'דוח רווח והפסד', icon: BarChart2 },
];

export default function CfoViewToggle({ view, onChange }: CfoViewToggleProps) {
  return (
    <div className="inline-flex bg-[#F7F7F8] rounded-xl p-1 gap-1" dir="rtl">
      {tabs.map(({ value, label, icon: Icon }) => {
        const active = view === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              active
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-[#7E7F90] hover:text-[#303150]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

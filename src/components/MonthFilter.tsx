'use client';

import { Calendar } from 'lucide-react';

interface MonthFilterProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
}

const monthNames: { [key: string]: string } = {
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

function formatMonthOption(monthKey: string): string {
  if (monthKey === 'all') return 'כל החודשים - תצוגה כללית';
  
  const [year, month] = monthKey.split('-');
  return `${monthNames[month]} ${year}`;
}

export default function MonthFilter({ selectedMonth, onMonthChange, availableMonths }: MonthFilterProps) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-400" />
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="select min-w-[200px]"
        >
          <option value="all">כל החודשים - תצוגה כללית</option>
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {formatMonthOption(month)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

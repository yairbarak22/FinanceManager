'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

interface MonthFilterProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  allMonths: string[];
  monthsWithData: Set<string>;
  currentMonth: string;
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

function formatMonthDisplay(monthKey: string): string {
  if (monthKey === 'all') return 'כל החודשים';
  
  const [year, month] = monthKey.split('-');
  return `${monthNames[month]} ${year}`;
}

export default function MonthFilter({ 
  selectedMonth, 
  onMonthChange, 
  allMonths, 
  monthsWithData,
  currentMonth 
}: MonthFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group months by category
  const futureMonths = allMonths.filter(m => m > currentMonth);
  const pastMonths = allMonths.filter(m => m < currentMonth).reverse();

  const handleSelect = (monthKey: string) => {
    onMonthChange(monthKey);
    setIsOpen(false);
  };

  const renderMonthOption = (monthKey: string) => {
    const hasData = monthsWithData.has(monthKey);
    const isSelected = selectedMonth === monthKey;
    const isCurrent = monthKey === currentMonth;

    return (
      <button
        key={monthKey}
        onClick={() => handleSelect(monthKey)}
        className={`month-option ${isSelected ? 'selected' : ''} ${hasData ? 'has-data' : 'no-data'} ${isCurrent ? 'current' : ''}`}
      >
        <span className={`indicator ${hasData ? 'bg-emerald-500' : 'bg-gray-300'}`} />
        <span className="flex-1 text-right">{formatMonthDisplay(monthKey)}</span>
        {isSelected && <Check className="w-4 h-4 text-pink-500" />}
        {isCurrent && !isSelected && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">נוכחי</span>
        )}
      </button>
    );
  };

  return (
    <div className="relative" ref={dropdownRef} >
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm min-w-[200px]"
      >
        <Calendar className="w-5 h-5 text-pink-500" />
        <span className="flex-1 text-right font-medium text-gray-800">
          {formatMonthDisplay(selectedMonth)}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="month-dropdown animate-scale-in">
          {/* All Months Option */}
          <button
            onClick={() => handleSelect('all')}
            className={`month-option all-months ${selectedMonth === 'all' ? 'selected' : ''}`}
          >
            <Calendar className="w-4 h-4 text-pink-500" />
            <span className="flex-1 text-right font-medium">כל החודשים</span>
            {selectedMonth === 'all' && <Check className="w-4 h-4 text-pink-500" />}
          </button>

          <div className="border-t border-gray-100 my-1" />

          {/* Future Months */}
          {futureMonths.length > 0 && (
            <>
              <div className="month-group-header">חודשים עתידיים</div>
              {futureMonths.map(renderMonthOption)}
            </>
          )}

          {/* Current Month */}
          <div className="month-group-header">החודש הנוכחי</div>
          {renderMonthOption(currentMonth)}

          {/* Past Months */}
          {pastMonths.length > 0 && (
            <>
              <div className="month-group-header">חודשים קודמים</div>
              {pastMonths.map(renderMonthOption)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

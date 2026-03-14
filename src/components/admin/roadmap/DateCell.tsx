'use client';

import { useState, useRef, useEffect } from 'react';

interface DateCellProps {
  date: Date | null;
  onChange?: (date: Date | null) => void;
}

const HEBREW_MONTHS: Record<number, string> = {
  0: 'בינו׳',
  1: 'בפבר׳',
  2: 'במרץ',
  3: 'באפר׳',
  4: 'במאי',
  5: 'ביוני',
  6: 'ביולי',
  7: 'באוג׳',
  8: 'בספט׳',
  9: 'באוק׳',
  10: 'בנוב׳',
  11: 'בדצמ׳',
};

function formatHebrewDate(date: Date): string {
  const d = new Date(date);
  return `${d.getDate()} ${HEBREW_MONTHS[d.getMonth()]}`;
}

function toInputValue(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DateCell({ date, onChange }: DateCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.showPicker?.();
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const newDate = val ? new Date(val + 'T00:00:00') : null;
    onChange?.(newDate);
    setIsEditing(false);
  };

  if (isEditing && onChange) {
    return (
      <div className="flex items-center justify-center h-9">
        <input
          ref={inputRef}
          type="date"
          defaultValue={toInputValue(date)}
          onChange={handleChange}
          onBlur={() => setIsEditing(false)}
          className="w-full h-8 text-sm text-[#303150] bg-white border border-[#69ADFF] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20 text-center"
        />
      </div>
    );
  }

  if (!date) {
    return (
      <div
        onClick={() => onChange && setIsEditing(true)}
        className="flex items-center justify-center h-9 text-sm text-[#BDBDCB] cursor-pointer hover:text-[#7E7F90] transition-colors"
      >
        —
      </div>
    );
  }

  return (
    <div
      onClick={() => onChange && setIsEditing(true)}
      className="flex items-center justify-center h-9 text-sm text-[#303150] cursor-pointer hover:bg-[#F7F7F8] rounded-lg transition-colors"
    >
      {formatHebrewDate(date)}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';

interface CopyBudgetButtonProps {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
  onCopy: () => Promise<void>;
  disabled?: boolean;
}

const MONTH_NAMES: Record<number, string> = {
  1: 'ינואר', 2: 'פברואר', 3: 'מרץ', 4: 'אפריל',
  5: 'מאי', 6: 'יוני', 7: 'יולי', 8: 'אוגוסט',
  9: 'ספטמבר', 10: 'אוקטובר', 11: 'נובמבר', 12: 'דצמבר',
};

export default function CopyBudgetButton({
  fromMonth,
  fromYear,
  onCopy,
  disabled = false,
}: CopyBudgetButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      await onCopy();
    } finally {
      setIsLoading(false);
    }
  }

  const sourceLabel = `${MONTH_NAMES[fromMonth]} ${fromYear}`;

  return (
    <div
      className="rounded-3xl p-8 text-center"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '2px dashed #E8E8ED',
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: '#69ADFF15' }}
        >
          <Copy className="w-7 h-7 text-[#69ADFF]" strokeWidth={1.5} />
        </div>

        <div>
          <h3
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              fontWeight: 700,
              fontSize: '18px',
              color: '#303150',
              marginBottom: '8px',
            }}
          >
            עדיין לא הגדרת תקציב לחודש זה
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              fontWeight: 400,
              fontSize: '14px',
              color: '#7E7F90',
            }}
          >
            העתק את הגדרות התקציב מ{sourceLabel} בלחיצה אחת
          </p>
        </div>

        <button
          onClick={handleClick}
          disabled={disabled || isLoading}
          className="btn-primary flex items-center gap-2 text-base px-8 py-3"
          style={{ fontSize: '15px' }}
        >
          העתק תקציב מחודש קודם
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Copy className="w-5 h-5" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  );
}

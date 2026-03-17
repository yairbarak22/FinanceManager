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
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="btn-secondary flex items-center gap-2 text-sm"
      style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
    >
      העתק מ{sourceLabel}
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Copy className="w-4 h-4" strokeWidth={1.75} />
      )}
    </button>
  );
}

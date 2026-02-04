'use client';

import { useState, useEffect } from 'react';

type Currency = 'ILS' | 'USD';

interface CurrencyToggleProps {
  /** Current selected currency */
  value: Currency;
  /** Callback when currency changes */
  onChange: (currency: Currency) => void;
  /** Current exchange rate (USD to ILS) */
  exchangeRate?: number;
  /** Show exchange rate below toggle */
  showRate?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CurrencyToggle - Toggle switch between ILS and USD display
 * Following Neto Design System - Apple Design Philosophy
 */
export function CurrencyToggle({
  value,
  onChange,
  exchangeRate = 3.65,
  showRate = true,
  className = '',
}: CurrencyToggleProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (currency: Currency) => {
    if (currency !== value) {
      setIsAnimating(true);
      onChange(currency);
    }
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  return (
    <div
      className={`flex flex-col gap-2 ${className}`}
      style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
    >
      {/* Toggle Container */}
      <div
        className="flex items-center p-1 rounded-xl bg-[#F7F7F8]"
        role="group"
        aria-label="בחירת מטבע תצוגה"
      >
        {/* ILS Button */}
        <button
          type="button"
          onClick={() => handleToggle('ILS')}
          className={`
            flex-1 h-9 px-3 rounded-lg text-sm font-medium
            transition-all duration-200 ease-in-out
            ${
              value === 'ILS'
                ? 'bg-[#FFFFFF] text-[#303150] shadow-sm font-bold'
                : 'bg-transparent text-[#7E7F90] hover:text-[#303150]'
            }
          `}
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          aria-pressed={value === 'ILS'}
        >
          ₪ שקל
        </button>

        {/* USD Button */}
        <button
          type="button"
          onClick={() => handleToggle('USD')}
          className={`
            flex-1 h-9 px-3 rounded-lg text-sm font-medium
            transition-all duration-200 ease-in-out
            ${
              value === 'USD'
                ? 'bg-[#FFFFFF] text-[#303150] shadow-sm font-bold'
                : 'bg-transparent text-[#7E7F90] hover:text-[#303150]'
            }
          `}
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          aria-pressed={value === 'USD'}
        >
          $ דולר
        </button>
      </div>

      {/* Exchange Rate Display - Below toggle */}
      {showRate && (
        <span className="text-xs text-[#BDBDCB]" dir="ltr">
          1$ = ₪{exchangeRate.toFixed(2)}
        </span>
      )}
    </div>
  );
}

export default CurrencyToggle;

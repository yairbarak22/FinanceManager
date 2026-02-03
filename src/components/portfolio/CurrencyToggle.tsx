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
  /** Show exchange rate in tooltip */
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
      className={`flex items-center gap-2 ${className}`}
      style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
    >
      {/* Exchange Rate Display */}
      {showRate && (
        <span className="text-xs text-[#BDBDCB] hidden sm:inline" dir="ltr">
          1$ = ₪{exchangeRate.toFixed(2)}
        </span>
      )}

      {/* Toggle Container */}
      <div
        className="flex items-center p-1 rounded-xl bg-[#F7F7F8] border border-[#E8E8ED]"
        role="group"
        aria-label="בחירת מטבע תצוגה"
      >
        {/* ILS Button */}
        <button
          type="button"
          onClick={() => handleToggle('ILS')}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${
              value === 'ILS'
                ? 'bg-[#FFFFFF] text-[#303150] shadow-sm'
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
            px-3 py-1.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${
              value === 'USD'
                ? 'bg-[#FFFFFF] text-[#303150] shadow-sm'
                : 'bg-transparent text-[#7E7F90] hover:text-[#303150]'
            }
          `}
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          aria-pressed={value === 'USD'}
        >
          $ דולר
        </button>
      </div>
    </div>
  );
}

export default CurrencyToggle;


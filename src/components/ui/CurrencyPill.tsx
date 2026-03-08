'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { CurrencyCode } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface CurrencyPillProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  amount?: number;
  exchangeRate?: number;
  showConversion?: boolean;
}

export default function CurrencyPill({
  value,
  onChange,
  amount,
  exchangeRate = 3.65,
  showConversion = true,
}: CurrencyPillProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    const next = value === 'ILS' ? 'USD' : 'ILS';
    setIsAnimating(true);
    onChange(next);
  };

  useEffect(() => {
    if (isAnimating) {
      const t = setTimeout(() => setIsAnimating(false), 250);
      return () => clearTimeout(t);
    }
  }, [isAnimating]);

  const isUSD = value === 'USD';
  const hasAmount = typeof amount === 'number' && amount > 0;
  const convertedAmount = hasAmount
    ? isUSD
      ? amount * exchangeRate
      : amount / exchangeRate
    : null;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={handleToggle}
        className="group inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm active:scale-95"
        style={{
          backgroundColor: isUSD ? 'rgba(105, 173, 255, 0.12)' : '#F7F7F8',
          border: isUSD ? '1px solid rgba(105, 173, 255, 0.3)' : '1px solid #E5E5EA',
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        }}
        aria-label={`מטבע: ${isUSD ? 'דולר' : 'שקל'}. לחץ להחלפה`}
        title="לחץ להחלפת מטבע"
      >
        <ArrowLeftRight
          className="w-3 h-3 transition-all duration-250 group-hover:scale-110"
          style={{
            color: isUSD ? '#69ADFF' : '#BDBDCB',
            transform: isAnimating ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 250ms ease, color 200ms ease',
          }}
          aria-hidden="true"
        />
        <span
          className="text-sm font-bold transition-all duration-200"
          style={{
            color: isUSD ? '#69ADFF' : '#303150',
            transform: isAnimating ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          {isUSD ? '$' : '₪'}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: '#7E7F90' }}
        >
          {isUSD ? 'דולר' : 'שקל'}
        </span>
      </button>

      {showConversion && hasAmount && convertedAmount !== null && (
        <span
          className="text-[11px] pe-1 transition-opacity duration-200"
          style={{
            color: '#BDBDCB',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
          dir="ltr"
        >
          ≈ {isUSD
            ? formatCurrency(convertedAmount)
            : `$${Math.round(convertedAmount).toLocaleString('en-US')}`
          }
        </span>
      )}
    </div>
  );
}

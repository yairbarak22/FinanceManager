'use client';

import { TrendingUp, TrendingDown, Wallet, Banknote } from 'lucide-react';
import { SensitiveData } from '../common/SensitiveData';
import InfoTooltip from '@/components/ui/InfoTooltip';

interface PortfolioSummaryHeroProps {
  /** Total portfolio value in ILS */
  totalValue: number;
  /** Daily change in ILS */
  dailyChangeILS: number;
  /** Daily change percentage */
  dailyChangePercent: number;
  /** Cash balance in portfolio */
  cashBalance: number;
  /** Cash weight percentage */
  cashWeight?: number;
  /** Currency display mode */
  currency?: 'ILS' | 'USD';
  /** USD to ILS exchange rate */
  exchangeRate?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PortfolioSummaryHero - Hero card displaying portfolio value with performance badge
 * Following Neto Design System - Apple Design Philosophy
 */
export function PortfolioSummaryHero({
  totalValue,
  dailyChangeILS,
  dailyChangePercent,
  cashBalance,
  cashWeight = 0,
  currency = 'ILS',
  exchangeRate = 3.65,
  className = '',
}: PortfolioSummaryHeroProps) {
  const isPositive = dailyChangePercent >= 0;

  // Format currency based on selected currency
  const formatValue = (value: number, showDecimals = false) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: showDecimals ? 2 : 0,
      }).format(value / exchangeRate);
    }
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(value);
  };

  // Format change value
  const formatChange = (value: number) => {
    const absValue = Math.abs(value);
    if (currency === 'USD') {
      return `$${(absValue / exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return `₪${absValue.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div
      className={`bg-[#FFFFFF] rounded-3xl p-6 lg:p-8 h-full ${className}`}
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
      dir="rtl"
    >
      {/* Header with icon and tooltip */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(13, 186, 204, 0.1)' }}
          >
            <Wallet className="w-6 h-6 text-[#0DBACC]" strokeWidth={1.75} />
          </div>
          <div>
            <span
              className="text-[0.8125rem] font-medium text-[#7E7F90]"
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              שווי התיק
            </span>
          </div>
        </div>
        <InfoTooltip
          content="שווי התיק הכולל כולל את כל ההחזקות שלך במניות, קרנות וניירות ערך אחרים, בתוספת מזומן בתיק."
          side="top"
        />
      </div>

      {/* Main Value - Hero Size */}
      <div className="flex items-center gap-4 mb-6">
        <SensitiveData
          as="p"
          className="text-[2.5rem] font-bold text-[#303150] leading-none"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          {formatValue(totalValue)}
        </SensitiveData>

        {/* Performance Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
            isPositive ? 'bg-[#B4F1F1]/30' : 'bg-[#FFC0DB]/30'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-[#0DBACC]" strokeWidth={2} />
          ) : (
            <TrendingDown className="w-4 h-4 text-[#F18AB5]" strokeWidth={2} />
          )}
          <span
            className={`text-sm font-semibold ${
              isPositive ? 'text-[#0DBACC]' : 'text-[#F18AB5]'
            }`}
            dir="ltr"
            style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            {isPositive ? '+' : ''}
            {dailyChangePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Daily Change Details */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[0.8125rem] text-[#7E7F90]">שינוי יומי:</span>
        <SensitiveData
          as="span"
          className={`text-[0.9375rem] font-medium ${
            isPositive ? 'text-[#0DBACC]' : 'text-[#F18AB5]'
          }`}
          dir="ltr"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          {isPositive ? '+' : '-'}
          {formatChange(dailyChangeILS)}
        </SensitiveData>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#F7F7F8] mb-6" />

      {/* Cash Balance Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(105, 173, 255, 0.1)' }}
          >
            <Banknote className="w-5 h-5 text-[#69ADFF]" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-[0.8125rem] font-medium text-[#7E7F90] block">
              מזומן בתיק
            </span>
            <SensitiveData
              as="span"
              className="text-lg font-semibold text-[#303150]"
              style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              {formatValue(cashBalance)}
            </SensitiveData>
          </div>
        </div>

        {/* Cash Weight */}
        {cashWeight > 0 && (
          <div className="text-left">
            <span className="text-xs text-[#BDBDCB] block">אחוז מהתיק</span>
            <span className="text-sm font-medium text-[#7E7F90]">
              {cashWeight.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PortfolioSummaryHero;


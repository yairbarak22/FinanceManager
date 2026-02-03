'use client';

import { Plus, RefreshCw, Settings } from 'lucide-react';
import { CurrencyToggle } from './CurrencyToggle';
import { AddAssetButton } from './AddAssetButton';

type Currency = 'ILS' | 'USD';

interface PortfolioSettingsCardProps {
  /** Current selected currency */
  currency: Currency;
  /** Callback when currency changes */
  onCurrencyChange: (currency: Currency) => void;
  /** Current exchange rate (USD to ILS) */
  exchangeRate: number;
  /** Callback to refresh portfolio data */
  onRefresh: () => void;
  /** Whether data is currently loading */
  loading: boolean;
  /** Last update timestamp */
  lastUpdated: Date | null;
  /** Callback when adding a new asset */
  onAddAsset: (data: {
    symbol: string;
    name: string;
    quantity: number;
    price: number;
    priceILS: number;
    provider: 'YAHOO' | 'EOD';
    currency: string;
    priceDisplayUnit: 'ILS' | 'ILS_AGOROT' | 'USD';
  }) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PortfolioSettingsCard - Settings card for portfolio configuration
 * Following Neto Design System - Apple Design Philosophy
 */
export function PortfolioSettingsCard({
  currency,
  onCurrencyChange,
  exchangeRate,
  onRefresh,
  loading,
  lastUpdated,
  onAddAsset,
  className = '',
}: PortfolioSettingsCardProps) {
  return (
    <div
      className={`bg-[#FFFFFF] rounded-3xl p-6 h-full ${className}`}
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(105, 173, 255, 0.1)' }}
        >
          <Settings className="w-5 h-5 text-[#69ADFF]" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#303150]">הגדרות תיק</h3>
          <p className="text-xs text-[#BDBDCB]">ניהול והגדרות התיק</p>
        </div>
      </div>

      {/* Settings Content */}
      <div className="space-y-4">
        {/* Add Asset Button */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[#7E7F90]">הוספת נכס</span>
          <AddAssetButton onAddAsset={onAddAsset} />
        </div>

        {/* Currency Toggle */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[#7E7F90]">מטבע תצוגה</span>
          <CurrencyToggle
            value={currency}
            onChange={onCurrencyChange}
            exchangeRate={exchangeRate}
            showRate={true}
          />
        </div>

        {/* Refresh Button */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[#7E7F90]">עדכון נתונים</span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-[#E8E8ED] bg-[#FFFFFF] hover:bg-[#F7F7F8] transition-colors disabled:opacity-50 text-sm font-medium text-[#303150]"
            style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            <RefreshCw
              className={`w-4 h-4 text-[#7E7F90] ${loading ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
            <span>רענן נתונים</span>
          </button>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="pt-3 border-t border-[#F7F7F8]">
            <p className="text-xs text-[#BDBDCB] text-center">
              עודכן לאחרונה: {lastUpdated.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PortfolioSettingsCard;


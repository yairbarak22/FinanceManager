'use client';

import { RefreshCw, Settings, Download, Upload } from 'lucide-react';
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
  /** Callback for importing portfolio data */
  onImport?: () => void;
  /** Callback for exporting portfolio data */
  onExport?: () => void;
  /** Callback for opening settings modal */
  onOpenSettings?: () => void;
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
  onImport,
  onExport,
  onOpenSettings,
  className = '',
}: PortfolioSettingsCardProps) {
  return (
    <div
      className={`bg-[#FFFFFF] rounded-3xl p-6 h-full flex flex-col ${className}`}
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
      dir="rtl"
    >
      {/* Header with Settings button */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#303150]">הגדרות תיק</h3>
          <p className="text-xs text-[#BDBDCB]">ניהול התיק שלך</p>
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#F7F7F8] transition-colors"
            aria-label="הגדרות נוספות"
          >
            <Settings className="w-5 h-5 text-[#7E7F90]" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Primary Action - Add Asset */}
      <div className="mt-4 mb-4">
        <AddAssetButton onAddAsset={onAddAsset} fullWidth exchangeRate={exchangeRate} />
      </div>

      {/* Secondary Actions Row - Import/Export */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={onImport}
          disabled={!onImport}
          className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border border-[#E8E8ED] bg-[#FFFFFF] hover:bg-[#F7F7F8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-[#303150]"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          <Download className="w-4 h-4 text-[#7E7F90]" strokeWidth={1.75} />
          <span>ייבוא</span>
        </button>
        <button
          onClick={onExport}
          disabled={!onExport}
          className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border border-[#E8E8ED] bg-[#FFFFFF] hover:bg-[#F7F7F8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-[#303150]"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          <Upload className="w-4 h-4 text-[#7E7F90]" strokeWidth={1.75} />
          <span>ייצוא</span>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-[#F7F7F8] my-4" />

      {/* Currency Toggle */}
      <div className="flex flex-col gap-2">
        <span className="text-[0.8125rem] font-medium text-[#7E7F90]">מטבע תצוגה</span>
        <CurrencyToggle
          value={currency}
          onChange={onCurrencyChange}
          exchangeRate={exchangeRate}
          showRate={true}
        />
      </div>

      {/* Refresh Section - Docked to bottom */}
      <div className="mt-auto pt-4 border-t border-[#F7F7F8]">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-[#E8E8ED] bg-[#FFFFFF] hover:bg-[#F7F7F8] transition-colors disabled:opacity-50 text-sm font-medium text-[#303150]"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          <RefreshCw
            className={`w-4 h-4 text-[#7E7F90] ${loading ? 'animate-spin' : ''}`}
            strokeWidth={1.75}
          />
          <span>רענן נתונים</span>
        </button>
        {lastUpdated && (
          <p className="text-xs text-[#BDBDCB] text-center mt-2">
            עודכן: {lastUpdated.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}

export default PortfolioSettingsCard;

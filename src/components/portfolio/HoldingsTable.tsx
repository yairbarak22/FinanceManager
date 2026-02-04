'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Trash2, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SensitiveData } from '../common/SensitiveData';
import InfoTooltip from '@/components/ui/InfoTooltip';

type PriceDisplayUnit = 'ILS' | 'ILS_AGOROT' | 'USD';

interface Holding {
  id?: string;
  symbol: string;
  name: string;
  nameHe?: string; // Hebrew name from enrichment
  quantity: number;
  priceILS: number;
  valueILS: number;
  beta: number;
  sector: string;
  sectorHe?: string; // Hebrew sector from enrichment
  currency?: 'USD' | 'ILS';
  provider?: 'YAHOO' | 'EOD';
  priceDisplayUnit?: PriceDisplayUnit;
  changePercent: number;
  weight: number;
  targetAllocation?: number;
  sparklineData: number[];
  isEnriched?: boolean; // Whether data was enriched from local DB
}

/**
 * Format price based on display unit
 */
function formatPriceByUnit(
  priceILS: number,
  unit: PriceDisplayUnit = 'ILS',
  exchangeRate: number = 3.65
): string {
  switch (unit) {
    case 'ILS_AGOROT':
      return `${(priceILS * 100).toLocaleString('he-IL', { maximumFractionDigits: 0 })} אג׳`;
    case 'USD':
      return `$${(priceILS / exchangeRate).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    default: // ILS
      return `₪${priceILS.toLocaleString('he-IL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
  }
}

/**
 * Format value based on display unit
 */
function formatValueByUnit(
  valueILS: number,
  unit: PriceDisplayUnit = 'ILS',
  exchangeRate: number = 3.65
): string {
  switch (unit) {
    case 'ILS_AGOROT':
      return `${(valueILS * 100).toLocaleString('he-IL', { maximumFractionDigits: 0 })} אג׳`;
    case 'USD':
      return `$${(valueILS / exchangeRate).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    default: // ILS
      return valueILS.toLocaleString('he-IL', {
        style: 'currency',
        currency: 'ILS',
        maximumFractionDigits: 0,
      });
  }
}

/**
 * Extract fund number from symbol for display
 * Examples: IS-FF702.TA -> FF702, ISFF505.TA -> FF505, HRL-F11.TA -> F11, LUMI.TA -> LUMI
 */
function extractFundNumber(symbol: string): string {
  // Remove exchange suffix (.TA, .US, etc.)
  const baseSymbol = symbol.split('.')[0];
  
  // Try to extract fund number from patterns like IS-FF702, HRL-F11
  const fundMatch = baseSymbol.match(/[-]?([A-Z]*F+\d+)$/i);
  if (fundMatch) {
    return fundMatch[1].toUpperCase();
  }
  
  // For patterns like ISFF505 (no dash)
  const inlineMatch = baseSymbol.match(/^[A-Z]{2,}(F+\d+)$/i);
  if (inlineMatch) {
    return inlineMatch[1].toUpperCase();
  }
  
  // Default: return the base symbol
  return baseSymbol;
}

interface HoldingsTableProps {
  holdings: Holding[];
  className?: string;
  maxHeight?: string;
  onEdit?: (holding: Holding) => void;
  onDelete?: (holding: Holding) => void;
  /** Currently selected sector for filtering */
  selectedSector?: string | null;
  /** Callback to clear the sector filter */
  onClearSectorFilter?: () => void;
}

// Sector translation map (same as in marketService.ts)
const SECTOR_TRANSLATIONS: Record<string, string> = {
  'US Equity': 'מניות - ארה"ב',
  'International': 'מניות - בינלאומי',
  'Technology': 'טכנולוגיה',
  'Healthcare': 'בריאות',
  'Financial Services': 'פיננסים',
  'Financials': 'פיננסים',
  'Finance': 'פיננסים',
  'Consumer Cyclical': 'צריכה מחזורית',
  'Consumer Defensive': 'צריכה בסיסית',
  'Industrials': 'תעשייה',
  'Energy': 'אנרגיה',
  'Utilities': 'תשתיות',
  'Real Estate': 'נדל"ן',
  'Basic Materials': 'חומרי גלם',
  'Communication Services': 'תקשורת',
  'Large Blend': 'מניות גדולות',
  'Large Growth': 'צמיחה גדולות',
  'Large Value': 'ערך גדולות',
  'Mid-Cap Blend': 'מניות בינוניות',
  'Small Blend': 'מניות קטנות',
  'Small Cap': 'מניות קטנות',
  'Total Market': 'שוק כולל',
  'Commodities': 'סחורות',
  'Commodities Focused': 'סחורות',
  'Emerging Markets': 'שווקים מתפתחים',
  'Bonds': 'אג"ח',
  'Israel': 'ישראל',
  'Growth': 'צמיחה',
  'Unknown': 'אחר',
  'Other': 'אחר',
};

/**
 * Normalize sector name to Hebrew
 */
function normalizeSectorToHebrew(sector: string, sectorHe?: string): string {
  if (sectorHe) return sectorHe;
  return SECTOR_TRANSLATIONS[sector] || sector;
}

/**
 * Sparkline component - tiny line chart without axes
 */
function Sparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (data.length < 2) {
    return <div className="w-16 h-8 flex items-center justify-center text-[#BDBDCB]">—</div>;
  }

  const chartData = data.map((value, index) => ({ value, index }));
  const color = isPositive ? '#0DBACC' : '#F18AB5'; // Turquoise / Rose

  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Change indicator component
 */
function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <div className="flex items-center gap-1 text-[#0DBACC]">
        <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span
          className="text-sm font-medium"
          dir="ltr"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          +{change.toFixed(2)}%
        </span>
      </div>
    );
  }
  if (change < 0) {
    return (
      <div className="flex items-center gap-1 text-[#F18AB5]">
        <TrendingDown className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span
          className="text-sm font-medium"
          dir="ltr"
          style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          {change.toFixed(2)}%
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-[#BDBDCB]">
      <Minus className="w-3.5 h-3.5" strokeWidth={1.75} />
      <span
        className="text-sm font-medium"
        dir="ltr"
        style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        0.00%
      </span>
    </div>
  );
}

/**
 * Allocation Progress Bar with target indicator
 */
function AllocationBar({
  weight,
  targetAllocation,
}: {
  weight: number;
  targetAllocation?: number;
}) {
  const hasTarget = targetAllocation !== undefined && targetAllocation > 0;
  const isOverTarget = hasTarget && weight > targetAllocation;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-16 h-1.5 bg-[#F7F7F8] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(weight, 100)}%`,
            backgroundColor: isOverTarget ? '#F18AB5' : '#69ADFF',
          }}
        />
        {/* Target marker */}
        {hasTarget && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-[#303150] rounded-full"
            style={{ left: `${Math.min(targetAllocation, 100)}%` }}
          />
        )}
      </div>
      <span
        className="text-sm text-[#7E7F90] min-w-[2.5rem]"
        style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        {weight.toFixed(1)}%
      </span>
    </div>
  );
}

/**
 * Delete button for each holding row
 */
function HoldingDeleteButton({
  holding,
  onDelete,
}: {
  holding: Holding;
  onDelete?: (holding: Holding) => void;
}) {
  if (!onDelete) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete(holding);
      }}
      className="p-2 rounded-lg bg-transparent hover:bg-[#FFC0DB]/20 transition-all duration-200"
      aria-label={`מחיקת ${holding.symbol}`}
    >
      <Trash2 className="w-4 h-4 text-[#7E7F90] hover:text-[#F18AB5]" strokeWidth={1.75} />
    </button>
  );
}

/**
 * HoldingsTable Component
 * A clean Apple-style table with sparkline charts
 * Following Neto Design System - Apple Design Philosophy
 */
export function HoldingsTable({ 
  holdings, 
  className = '', 
  maxHeight, 
  onEdit, 
  onDelete,
  selectedSector,
  onClearSectorFilter,
}: HoldingsTableProps) {
  // Filter holdings by selected sector
  const filteredHoldings = useMemo(() => {
    if (!selectedSector) return holdings;
    
    return holdings.filter(holding => {
      const holdingSectorHe = normalizeSectorToHebrew(holding.sector, holding.sectorHe);
      return holdingSectorHe === selectedSector;
    });
  }, [holdings, selectedSector]);

  if (holdings.length === 0) {
    return (
      <div
        className={`bg-[#FFFFFF] rounded-3xl p-8 text-center ${className}`}
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        }}
      >
        <p className="text-[#BDBDCB]">אין אחזקות להצגה</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-[#FFFFFF] rounded-3xl overflow-hidden flex flex-col ${className}`}
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        height: maxHeight || '35rem',
        minHeight: maxHeight || '35rem',
      }}
      dir="rtl"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#F7F7F8] flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#303150]">אחזקות</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#BDBDCB]">
              {selectedSector ? `${filteredHoldings.length} מתוך ${holdings.length}` : `${holdings.length} נכסים`}
            </span>
          </div>
        </div>
        
        {/* Sector Filter Chip */}
        <AnimatePresence>
          {selectedSector && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, y: -10, height: 0, marginTop: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  backgroundColor: '#F7F7F8',
                  border: '1px solid #69ADFF',
                }}
              >
                <Filter className="w-3.5 h-3.5" style={{ color: '#69ADFF' }} strokeWidth={2} />
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    color: '#303150',
                  }}
                >
                  {selectedSector}
                </span>
                {onClearSectorFilter && (
                  <button
                    onClick={onClearSectorFilter}
                    className="p-0.5 rounded-md hover:bg-[#E8E8ED] transition-colors"
                    style={{ color: '#7E7F90' }}
                    aria-label="בטל סינון סקטור"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table - Vertical scroll only, no horizontal scroll */}
      <div className="overflow-y-auto flex-1 scrollbar-ghost">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          {/* Column widths for fixed table layout */}
          <colgroup>{onEdit && <col style={{ width: '4px' }} />}<col style={{ width: '35%' }} /><col className="hidden lg:table-column" style={{ width: '70px' }} /><col style={{ width: '80px' }} /><col className="hidden md:table-column" style={{ width: '60px' }} /><col style={{ width: '110px' }} /><col style={{ width: '110px' }} />{onDelete && <col style={{ width: '40px' }} />}</colgroup>
          <thead>
            <tr className="text-xs text-[#BDBDCB] border-b border-[#F7F7F8]">
              {/* Empty header cell for edge indicator */}
              {onEdit && <th className="w-0 p-0"></th>}
              <th
                className="text-right font-medium px-4 py-2"
                style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                נייר ערך
              </th>
              <th
                className="hidden lg:table-cell text-center font-medium px-2 py-2"
                style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                7 ימים
              </th>
              <th
                className="text-center font-medium px-2 py-2"
                style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                שינוי
              </th>
              <th className="hidden md:table-cell text-center font-medium px-2 py-2">
                <div className="flex items-center justify-center gap-1">
                  <span style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                    Beta
                  </span>
                  <InfoTooltip
                    content="מדד לתנודתיות הנכס ביחס לשוק. Beta &gt; 1 = תנודתי יותר, Beta &lt; 1 = יציב יותר."
                    side="top"
                  />
                </div>
              </th>
              <th className="text-center font-medium px-2 py-2">
                <div className="flex items-center justify-center gap-1">
                  <span style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
                    אלוקציה
                  </span>
                  <InfoTooltip
                    content="אחוז הנכס מסך התיק. קו שחור מסמן את היעד שהגדרת."
                    side="top"
                  />
                </div>
              </th>
              <th
                className="text-start font-medium px-4 py-2"
                style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                שווי
              </th>
              {onDelete && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {filteredHoldings.map((holding, index) => (
              <tr
                key={holding.id || holding.symbol}
                onClick={onEdit ? () => onEdit(holding) : undefined}
                onKeyDown={
                  onEdit
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onEdit(holding);
                        }
                      }
                    : undefined
                }
                role={onEdit ? 'button' : undefined}
                tabIndex={onEdit ? 0 : undefined}
                aria-label={onEdit ? `ערוך אחזקה: ${holding.symbol}` : undefined}
                className={`
                  group relative transition-all duration-200
                  ${index === holdings.length - 1 ? '' : 'border-b border-[#F7F7F8]'}
                  ${
                    onEdit
                      ? 'hover:bg-[#F7F7F8] cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                      : 'hover:bg-[#F7F7F8]/50'
                  }
                `}
                style={{
                  transformOrigin: 'center',
                }}
              >
                {/* Edge Indicator */}
                {onEdit && (
                  <td className="w-0 p-0 relative">
                    <div className="absolute right-0 top-3 bottom-3 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full" />
                  </td>
                )}

                {/* Symbol & Name - Hebrew name as title, fund number + sector as description */}
                <td className="px-4 py-3">
                  <div className="text-right">
                    {/* Title: Hebrew name if enriched, otherwise English name */}
                    <SensitiveData
                      as="p"
                      className="text-sm font-bold text-[#303150] truncate"
                      style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      title={holding.nameHe || holding.name}
                    >
                      {holding.nameHe || holding.name}
                    </SensitiveData>
                    {/* Description: Fund number + sector for enriched, symbol for non-enriched */}
                    <SensitiveData
                      as="p"
                      className="text-xs text-[#BDBDCB] truncate"
                      style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                    >
                      {holding.isEnriched ? (
                        <>
                          {extractFundNumber(holding.symbol)}
                          {holding.sectorHe && <span className="text-[#7E7F90]"> • {holding.sectorHe}</span>}
                        </>
                      ) : (
                        holding.symbol
                      )}
                    </SensitiveData>
                  </div>
                </td>

                {/* Sparkline - hidden on small screens */}
                <td className="hidden lg:table-cell px-2 py-3">
                  <div className="flex justify-center">
                    <Sparkline data={holding.sparklineData} isPositive={holding.changePercent >= 0} />
                  </div>
                </td>

                {/* Change */}
                <td className="px-2 py-3">
                  <div className="flex justify-center">
                    <ChangeIndicator change={holding.changePercent} />
                  </div>
                </td>

                {/* Beta - hidden on small screens */}
                <td className="hidden md:table-cell px-2 py-3 text-center">
                  <span
                    className={`text-sm font-semibold ${
                      holding.beta < 0.8
                        ? 'text-[#0DBACC]'
                        : holding.beta <= 1.2
                        ? 'text-[#69ADFF]'
                        : 'text-[#F18AB5]'
                    }`}
                    style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    {holding.beta.toFixed(2)}
                  </span>
                </td>

                {/* Allocation */}
                <td className="px-2 py-3">
                  <div className="flex justify-center">
                    <AllocationBar weight={holding.weight} targetAllocation={holding.targetAllocation} />
                  </div>
                </td>

                {/* Value */}
                <td className="px-4 py-3 text-start">
                  <SensitiveData
                    as="p"
                    className="text-sm font-bold text-[#303150]"
                    style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    {formatValueByUnit(holding.valueILS, holding.priceDisplayUnit)}
                  </SensitiveData>
                  <SensitiveData
                    as="p"
                    className="text-xs text-[#BDBDCB] truncate"
                    style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    {holding.quantity.toLocaleString()} יח׳
                  </SensitiveData>
                </td>

                {/* Actions */}
                {onDelete && (
                  <td className="px-2 py-3">
                    <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <HoldingDeleteButton holding={holding} onDelete={onDelete} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Trash2 } from 'lucide-react';
import { SensitiveData } from '../common/SensitiveData';

type PriceDisplayUnit = 'ILS' | 'ILS_AGOROT' | 'USD';

interface Holding {
  id?: string;
  symbol: string;
  name: string;
  quantity: number;
  priceILS: number;
  valueILS: number;
  beta: number;
  sector: string;
  currency?: 'USD' | 'ILS';
  provider?: 'YAHOO' | 'EOD';
  priceDisplayUnit?: PriceDisplayUnit;
  changePercent: number;
  weight: number;
  sparklineData: number[];
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

interface HoldingsTableProps {
  holdings: Holding[];
  className?: string;
  onEdit?: (holding: Holding) => void;
  onDelete?: (holding: Holding) => void;
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
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="text-sm font-medium" dir="ltr">+{change.toFixed(2)}%</span>
      </div>
    );
  }
  if (change < 0) {
    return (
      <div className="flex items-center gap-1 text-[#F18AB5]">
        <TrendingDown className="w-3.5 h-3.5" />
        <span className="text-sm font-medium" dir="ltr">{change.toFixed(2)}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-[#BDBDCB]">
      <Minus className="w-3.5 h-3.5" />
      <span className="text-sm font-medium" dir="ltr">0.00%</span>
    </div>
  );
}

/**
 * Delete button for each holding row
 */
function HoldingDeleteButton({
  holding,
  onDelete
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
      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
      aria-label={`מחיקת ${holding.symbol}`}
    >
      <Trash2 className="w-4 h-4 text-[#7E7F90]" />
    </button>
  );
}

/**
 * HoldingsTable Component
 * A clean Apple-style table with sparkline charts
 */
export function HoldingsTable({ holdings, className = '', onEdit, onDelete }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className={`bg-white rounded-3xl border border-[#E8E8ED] p-8 text-center ${className}`}>
        <p className="text-[#BDBDCB]">אין אחזקות להצגה</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-3xl border border-[#E8E8ED] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F7F7F8]">
        <h3 className="text-base font-semibold text-[#303150]">אחזקות</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-[#BDBDCB] border-b border-[#F7F7F8]">
              <th className="text-center font-medium px-5 py-3">נייר</th>
              <th className="text-center font-medium px-3 py-3">7 ימים</th>
              <th className="text-center font-medium px-3 py-3">שינוי</th>
              <th className="text-center font-medium px-3 py-3">סיכון משוקלל</th>
              <th className="text-center font-medium px-3 py-3">אחוז מהתיק</th>
              <th className="text-center font-medium px-5 py-3">שווי בש&quot;ח</th>
              {onDelete && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => (
              <tr
                key={holding.id || holding.symbol}
                onClick={onEdit ? () => onEdit(holding) : undefined}
                onKeyDown={onEdit ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEdit(holding);
                  }
                } : undefined}
                role={onEdit ? 'button' : undefined}
                tabIndex={onEdit ? 0 : undefined}
                aria-label={onEdit ? `ערוך אחזקה: ${holding.symbol}` : undefined}
                className={`group relative border-b border-[#F7F7F8] transition-all duration-200 ${
                  onEdit ? 'hover:bg-[#F7F7F8] hover:shadow-sm cursor-pointer active:scale-[0.99]' : 'hover:bg-[#F7F7F8]/50'
                } ${index === holdings.length - 1 ? 'border-b-0' : ''}`}
              >
                {/* Edge Indicator */}
                {onEdit && (
                  <td className="w-0 p-0 relative">
                    <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                  </td>
                )}
                {/* Symbol & Name */}
                <td className="px-5 py-4">
                  <div>
                    <SensitiveData as="p" className="text-sm font-semibold text-[#303150]">
                      {holding.symbol}
                    </SensitiveData>
                    <SensitiveData as="p" className="text-xs text-[#BDBDCB] truncate max-w-[150px]">
                      {holding.name}
                    </SensitiveData>
                  </div>
                </td>

                {/* Sparkline */}
                <td className="px-3 py-4">
                  <Sparkline
                    data={holding.sparklineData}
                    isPositive={holding.changePercent >= 0}
                  />
                </td>

                {/* Change */}
                <td className="px-3 py-4">
                  <ChangeIndicator change={holding.changePercent} />
                </td>

                {/* Beta */}
                <td className="px-3 py-4">
                  <span
                    className={`text-sm font-medium ${
                      holding.beta < 0.8
                        ? 'text-[#0DBACC]'
                        : holding.beta <= 1.2
                        ? 'text-[#69ADFF]'
                        : 'text-[#F18AB5]'
                    }`}
                  >
                    {holding.beta.toFixed(2)}
                  </span>
                </td>

                {/* Weight */}
                <td className="px-3 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-[#F7F7F8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#69ADFF] rounded-full"
                        style={{ width: `${Math.min(holding.weight, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-[#7E7F90]">{holding.weight.toFixed(1)}%</span>
                  </div>
                </td>

                {/* Value */}
                <td className="px-5 py-4 text-left">
                  <SensitiveData as="p" className="text-sm font-semibold text-[#303150]">
                    {formatValueByUnit(holding.valueILS, holding.priceDisplayUnit)}
                  </SensitiveData>
                  <SensitiveData as="p" className="text-xs text-[#BDBDCB]">
                    {holding.quantity.toLocaleString()} יח׳ × {formatPriceByUnit(holding.priceILS, holding.priceDisplayUnit)}
                  </SensitiveData>
                </td>

                {/* Actions */}
                {onDelete && (
                  <td className="px-2 py-4">
                    <HoldingDeleteButton
                      holding={holding}
                      onDelete={onDelete}
                    />
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

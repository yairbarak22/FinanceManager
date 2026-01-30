'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlySummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  monthlyCashflow: number;
  previousMonthIncome?: number;
  previousMonthExpenses?: number;
  previousMonthCashflow?: number;
  className?: string;
}

// Color constants
const COLORS = {
  turquoise: '#0DBACC',
  pink: '#F18AB5',
  babyBlue: '#74ACEF',
  darkNavy: '#303150',
  steelGray: '#7E7F90',
  divider: '#F7F7F8',
};

// Individual Summary Card component - Ultra minimalist text design
function SummaryCard({
  title,
  value,
  previousValue,
  positiveColor,
  negativeColor,
  invertColors = false,
}: {
  title: string;
  value: number;
  previousValue?: number;
  positiveColor: string;
  negativeColor: string;
  invertColors?: boolean; // For expenses: positive change (more spending) is bad
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate percentage change
  const percentageChange = previousValue && previousValue !== 0
    ? ((value - previousValue) / Math.abs(previousValue)) * 100
    : null;

  // Determine if change is positive (good) based on context
  const isPositiveChange = percentageChange !== null && percentageChange >= 0;
  
  // For expenses, positive change means more spending (bad)
  // For income/cashflow, positive change is good
  const isGoodChange = invertColors ? !isPositiveChange : isPositiveChange;
  const pillColor = isGoodChange ? positiveColor : negativeColor;

  return (
    <div
      className="rounded-[20px] p-8 h-full flex flex-col"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Title */}
      <span
        className="text-sm mb-4"
        style={{
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          color: COLORS.steelGray,
        }}
      >
        {title}
      </span>

      {/* Main Value */}
      <h3
        className="mb-6"
        style={{
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          fontWeight: 700,
          fontSize: '32px',
          color: COLORS.darkNavy,
          lineHeight: 1.2,
        }}
      >
        {formatCurrency(value)}
      </h3>

      {/* Divider Line */}
      <div
        className="w-full mb-4"
        style={{
          borderTop: `1px solid ${COLORS.divider}`,
        }}
      />

      {/* Insight Row */}
      {percentageChange !== null ? (
        <div className="flex items-center gap-2">
          {/* Trend Pill */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              background: `${pillColor}15`,
            }}
          >
            {isPositiveChange ? (
              <TrendingUp className="w-3 h-3" style={{ color: pillColor }} strokeWidth={2} />
            ) : (
              <TrendingDown className="w-3 h-3" style={{ color: pillColor }} strokeWidth={2} />
            )}
            <span
              style={{
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                fontWeight: 600,
                fontSize: '12px',
                color: pillColor,
              }}
            >
              {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
            </span>
          </div>
          
          {/* Label Text */}
          <span
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              color: COLORS.steelGray,
            }}
          >
            מול חודש קודם
          </span>
        </div>
      ) : (
        <div className="flex items-center">
          <span
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              color: COLORS.steelGray,
            }}
          >
            אין נתונים מחודש קודם
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * MonthlySummaryCards - 3 ultra-minimalist text cards showing Income, Expenses, and Cashflow
 */
export default function MonthlySummaryCards({
  totalIncome,
  totalExpenses,
  monthlyCashflow,
  previousMonthIncome,
  previousMonthExpenses,
  previousMonthCashflow,
  className = '',
}: MonthlySummaryCardsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {/* Income Card */}
      <SummaryCard
        title="הכנסות"
        value={totalIncome}
        previousValue={previousMonthIncome}
        positiveColor={COLORS.turquoise}
        negativeColor={COLORS.pink}
      />

      {/* Expenses Card */}
      <SummaryCard
        title="הוצאות"
        value={totalExpenses}
        previousValue={previousMonthExpenses}
        positiveColor={COLORS.turquoise}
        negativeColor={COLORS.pink}
        invertColors={true} // For expenses, less spending (negative change) is good
      />

      {/* Cashflow Card */}
      <SummaryCard
        title="תזרים חודשי"
        value={monthlyCashflow}
        previousValue={previousMonthCashflow}
        positiveColor={COLORS.babyBlue}
        negativeColor={COLORS.pink}
      />
    </div>
  );
}

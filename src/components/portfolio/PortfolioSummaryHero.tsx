'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Banknote } from 'lucide-react';
import { SensitiveData } from '../common/SensitiveData';
import InfoTooltip from '@/components/ui/InfoTooltip';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PortfolioHistoryItem {
  date: string;
  value: number;
}

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
  /** Yearly return percentage (YTD) */
  yearlyReturnPercent?: number;
  /** Portfolio value history */
  portfolioHistory?: PortfolioHistoryItem[];
  /** Currency display mode */
  currency?: 'ILS' | 'USD';
  /** USD to ILS exchange rate */
  exchangeRate?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PortfolioSummaryHero - Hero card displaying portfolio value with performance badge and chart
 * Following Neto Design System - Apple Design Philosophy
 */
export function PortfolioSummaryHero({
  totalValue,
  dailyChangeILS,
  dailyChangePercent,
  cashBalance,
  cashWeight = 0,
  yearlyReturnPercent,
  portfolioHistory = [],
  currency = 'ILS',
  exchangeRate = 3.65,
  className = '',
}: PortfolioSummaryHeroProps) {
  const isYearlyPositive = (yearlyReturnPercent ?? 0) >= 0;

  // Format currency based on selected currency
  const formatCurrency = (amount: number) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(amount / exchangeRate);
    }
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare chart data from history (always show last 6 months)
  // Fill missing months with 0 to ensure 6 months are always shown
  const chartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result: Array<{ month: string; value: number; date: Date }> = [];

    // Create a map of existing history data by month key (YYYY-MM)
    const historyMap = new Map<string, number>();
    if (portfolioHistory && portfolioHistory.length > 0) {
      portfolioHistory.forEach((item) => {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        historyMap.set(monthKey, item.value);
      });
    }

    // Always generate 6 months back from current month
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[monthDate.getMonth()];
      
      // Use historical value if available, otherwise use 0
      // (don't assume current value for missing months - no historical data available)
      const value = historyMap.get(monthKey) ?? 0;
      
      result.push({
        month: monthName,
        value,
        date: monthDate,
      });
    }

    return result;
  }, [portfolioHistory]);

  // Find current point (last point)
  const currentPoint = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  // Calculate percentage change from previous month
  const percentageChange = useMemo(() => {
    if (chartData.length < 2) return null;
    
    const previousValue = chartData[chartData.length - 2].value;
    const currentValue = chartData[chartData.length - 1].value;
    
    if (previousValue === 0) return null;
    
    const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
    return change;
  }, [chartData]);

  // Custom dot renderer - only show dot on current (last) point
  const renderDot = (props: { cx?: number; cy?: number; index?: number }) => {
    const { cx, cy, index } = props;
    if (index === chartData.length - 1 && cx !== undefined && cy !== undefined) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="#69ADFF"
          stroke="#FFFFFF"
          strokeWidth={3}
          style={{ filter: 'drop-shadow(0 2px 4px rgba(105, 173, 255, 0.4))' }}
        />
      );
    }
    return null;
  };

  return (
    <div
      className={`rounded-[20px] p-6 relative overflow-hidden h-full flex flex-col ${className}`}
      style={{
        background: '#FFFFFF',
        boxShadow: '0 8px 32px rgba(13, 186, 204, 0.12), 0 4px 16px rgba(105, 173, 255, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
      dir="rtl"
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(105, 173, 255, 0.1)' }}
            >
              <Wallet className="w-5 h-5 text-[#69ADFF]" strokeWidth={1.5} />
            </div>
            <span 
              className="text-base font-medium"
              style={{ 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: '#7E7F90'
              }}
            >
              שווי התיק
            </span>
          </div>
          <InfoTooltip 
            content="שווי התיק הכולל כולל את כל ההחזקות שלך במניות, קרנות וניירות ערך אחרים, בתוספת מזומן בתיק."
            side="top"
          />
        </div>

        {/* Main Portfolio Value with Badge */}
        <div className="flex items-center gap-3 mb-4">
          <SensitiveData
            as="h3"
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#1D1D35'
            }}
          >
            {formatCurrency(totalValue)}
          </SensitiveData>
          
          {/* Percentage Change Badge - small with arrow */}
          {percentageChange !== null && (
            <div
              className="flex items-center gap-0.5 px-2 py-0.5 rounded-full"
              style={{
                background: percentageChange >= 0 ? 'rgba(13, 186, 204, 0.1)' : 'rgba(241, 138, 181, 0.1)',
              }}
            >
              {percentageChange >= 0 ? (
                <TrendingUp className="w-3 h-3" style={{ color: '#0DBACC' }} strokeWidth={2} />
              ) : (
                <TrendingDown className="w-3 h-3" style={{ color: '#F18AB5' }} strokeWidth={2} />
              )}
              <span
                className="text-xs font-semibold"
                style={{
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: percentageChange >= 0 ? '#0DBACC' : '#F18AB5'
                }}
                dir="ltr"
              >
                {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Cash and Yearly Return breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Cash Balance */}
          <div 
            className="p-3 rounded-xl border"
            style={{ 
              background: 'rgba(13, 186, 204, 0.05)',
              borderColor: 'rgba(13, 186, 204, 0.15)'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-3.5 h-3.5" style={{ color: '#0DBACC' }} strokeWidth={1.5} />
              <span 
                className="text-xs font-medium"
                style={{ 
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#7E7F90'
                }}
              >
                מזומן בתיק
              </span>
            </div>
            <SensitiveData
              as="p"
              className="text-lg font-bold"
              style={{ 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: '#0DBACC'
              }}
            >
              {formatCurrency(cashBalance)}
            </SensitiveData>
            {cashWeight > 0 && (
              <span className="text-xs text-[#7E7F90]">
                ({cashWeight.toFixed(1)}% מהתיק)
              </span>
            )}
          </div>

          {/* Yearly Return */}
          <div 
            className="p-3 rounded-xl border"
            style={{ 
              background: isYearlyPositive ? 'rgba(13, 186, 204, 0.05)' : 'rgba(241, 138, 181, 0.05)',
              borderColor: isYearlyPositive ? 'rgba(13, 186, 204, 0.15)' : 'rgba(241, 138, 181, 0.15)'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              {isYearlyPositive ? (
                <TrendingUp className="w-3.5 h-3.5" style={{ color: '#0DBACC' }} strokeWidth={1.5} />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" style={{ color: '#F18AB5' }} strokeWidth={1.5} />
              )}
              <span 
                className="text-xs font-medium"
                style={{ 
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  color: '#7E7F90'
                }}
              >
                תשואה שנתית
              </span>
            </div>
            <p 
              className="text-lg font-bold"
              style={{ 
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                color: isYearlyPositive ? '#0DBACC' : '#F18AB5'
              }}
            >
              {yearlyReturnPercent !== undefined 
                ? `${isYearlyPositive ? '+' : ''}${yearlyReturnPercent.toFixed(1)}%`
                : '—'
              }
            </p>
            <span className="text-xs text-[#7E7F90]">
              מתחילת השנה
            </span>
          </div>
        </div>

        {/* Area Chart */}
        {chartData.length > 1 && (
          <div style={{ height: '150px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#69ADFF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#69ADFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                
                {/* X-Axis with month labels */}
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#7E7F90',
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif'
                  }}
                  dy={8}
                />
                
                {/* Hidden Y-Axis for domain */}
                <YAxis
                  hide
                  domain={['dataMin - 50000', 'dataMax + 50000']}
                />
                
                {/* Dashed vertical line at current point */}
                {currentPoint && (
                  <ReferenceLine
                    x={currentPoint.month}
                    stroke="#BDBDCB"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                  />
                )}
                
                {/* Area with smooth spline */}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#69ADFF"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="url(#portfolioGradient)"
                  dot={renderDot}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default PortfolioSummaryHero;

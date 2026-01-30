'use client';

import React from 'react';
import { TrendingDown, ArrowDownRight } from 'lucide-react';

interface ExpenseCardProps {
  totalExpenses: number;
  previousMonthExpenses?: number;
  className?: string;
}

/**
 * ExpenseCard - Minimalist white card with Pink glow shadow
 */
export default function ExpenseCard({
  totalExpenses,
  previousMonthExpenses,
  className = ''
}: ExpenseCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate percentage change
  const percentageChange = previousMonthExpenses && previousMonthExpenses > 0
    ? ((totalExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
    : null;

  // For expenses, negative change (less spending) is good
  const isPositiveChange = percentageChange !== null && percentageChange < 0;

  return (
    <div
      className={`rounded-3xl p-6 relative overflow-hidden h-full ${className}`}
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(241, 138, 181, 0.15)'
      }}
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(241, 138, 181, 0.1)' }}
          >
            <TrendingDown className="w-5 h-5" style={{ color: '#F18AB5' }} strokeWidth={1.5} />
          </div>
          <span 
            className="text-sm font-medium"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#7E7F90'
            }}
          >
            סך הוצאות
          </span>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <h3 
            className="text-3xl font-bold tracking-tight"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#303150'
            }}
          >
            {formatCurrency(totalExpenses)}
          </h3>
        </div>

        {/* Percentage change indicator */}
        {percentageChange !== null && (
          <div 
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border"
            style={{ 
              background: isPositiveChange ? 'rgba(13, 186, 204, 0.05)' : 'rgba(241, 138, 181, 0.05)',
              borderColor: isPositiveChange ? 'rgba(13, 186, 204, 0.15)' : 'rgba(241, 138, 181, 0.15)',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: isPositiveChange ? '#0DBACC' : '#F18AB5'
            }}
          >
            <ArrowDownRight 
              className={`w-4 h-4 ${!isPositiveChange ? '' : 'rotate-180'}`} 
              strokeWidth={1.5} 
            />
            <span>{percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%</span>
            <span style={{ color: '#7E7F90' }} className="mr-1">מהחודש הקודם</span>
          </div>
        )}

        {/* Simple trend line visualization */}
        <div className="mt-4 flex items-end gap-1 h-12">
          {[60, 50, 70, 55, 75, 45, 60].map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${height}%`,
                background: '#F18AB5',
                opacity: 0.2 + (i * 0.1)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

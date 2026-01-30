'use client';

import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface IncomeCardProps {
  totalIncome: number;
  previousMonthIncome?: number;
  className?: string;
}

/**
 * IncomeCard - Minimalist white card with Blue glow shadow
 */
export default function IncomeCard({
  totalIncome,
  previousMonthIncome,
  className = ''
}: IncomeCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate percentage change
  const percentageChange = previousMonthIncome && previousMonthIncome > 0
    ? ((totalIncome - previousMonthIncome) / previousMonthIncome) * 100
    : null;

  return (
    <div
      className={`rounded-3xl p-6 relative overflow-hidden h-full ${className}`}
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(105, 173, 255, 0.15)'
      }}
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(105, 173, 255, 0.1)' }}
          >
            <TrendingUp className="w-5 h-5" style={{ color: '#69ADFF' }} strokeWidth={1.5} />
          </div>
          <span 
            className="text-sm font-medium"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: '#7E7F90'
            }}
          >
            סך הכנסות
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
            {formatCurrency(totalIncome)}
          </h3>
        </div>

        {/* Percentage change indicator */}
        {percentageChange !== null && (
          <div 
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border"
            style={{ 
              background: 'rgba(13, 186, 204, 0.05)',
              borderColor: 'rgba(13, 186, 204, 0.15)',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: percentageChange >= 0 ? '#0DBACC' : '#F18AB5'
            }}
          >
            <ArrowUpRight 
              className={`w-4 h-4 ${percentageChange >= 0 ? '' : 'rotate-90'}`} 
              strokeWidth={1.5} 
            />
            <span dir="ltr">{percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%</span>
            <span style={{ color: '#7E7F90' }} className="mr-1">מהחודש הקודם</span>
          </div>
        )}

        {/* Simple trend line visualization */}
        <div className="mt-4 flex items-end gap-1 h-12">
          {[40, 60, 45, 70, 55, 80, 65].map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${height}%`,
                background: '#0DBACC',
                opacity: 0.2 + (i * 0.1)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

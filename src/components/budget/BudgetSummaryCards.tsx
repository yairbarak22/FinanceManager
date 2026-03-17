'use client';

import React, { useMemo } from 'react';
import { useSession } from 'next-auth/react';

interface BudgetSummaryCardsProps {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  monthDisplayName: string;
  month: number;
  year: number;
  isPassover?: boolean;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatus(remaining: number, percentage: number) {
  if (remaining < 0 || percentage > 100)
    return {
      word: 'דורש התייחסות',
      color: '#F18AB5',
      barColor: '#F18AB5',
    };
  if (percentage > 75)
    return {
      word: 'קרוב לגבול',
      color: '#E9A800',
      barColor: '#E9A800',
    };
  return {
    word: 'מצוין',
    color: '#0DBACC',
    barColor: '#0DBACC',
  };
}

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

export default function BudgetSummaryCards({
  totalBudget,
  totalSpent,
  totalRemaining,
  overallPercentage,
  monthDisplayName,
  month,
  year,
  isPassover = false,
}: BudgetSummaryCardsProps) {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'משתמש';
  const status = getStatus(totalRemaining, overallPercentage);

  const fillPercent = totalBudget > 0
    ? Math.min((totalSpent / totalBudget) * 100, 100)
    : 0;

  const todayMarker = useMemo(() => {
    if (isPassover) return null;
    const now = new Date();
    const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === year;
    if (!isCurrentMonth) return null;
    const dayOfMonth = now.getDate();
    const daysInMonth = getDaysInMonth(month, year);
    return (dayOfMonth / daysInMonth) * 100;
  }, [month, year, isPassover]);

  const roundedPercentage = Math.round(overallPercentage);

  return (
    <div
      className="rounded-3xl px-6 py-7 sm:px-8 sm:py-8"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
    >
      {/* (a) Smart greeting */}
      <p style={{ fontSize: '15px', fontWeight: 500, color: '#7E7F90', lineHeight: 1.6 }}>
        שלום {firstName}, מצב התקציב שלך {isPassover ? 'לפסח' : `ל${monthDisplayName}`} הוא{' '}
        <span style={{ fontWeight: 700, color: status.color }}>{status.word}</span>.
      </p>

      {/* (a) Big bold remaining number */}
      <div className="mt-4">
        <span
          style={{
            fontSize: '44px',
            fontWeight: 700,
            color: '#303150',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
          dir="ltr"
          className="inline-block"
        >
          {formatCurrency(totalRemaining)}
        </span>
        {!isPassover && (
          <p className="mt-1.5" style={{ fontSize: '12px', fontWeight: 400, color: '#BDBDCB' }}>
            נותרו לשימוש עד סוף החודש
          </p>
        )}
      </div>

      {/* (b) Linear progress bar with today marker */}
      <div className="mt-6 relative">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: '12px', background: '#E8E8ED' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${fillPercent}%`,
              background: status.barColor,
              minWidth: fillPercent > 0 ? '4px' : '0',
            }}
          />
        </div>

        {todayMarker !== null && (
          <div
            className="absolute"
            style={{
              right: `${todayMarker}%`,
              top: '-4px',
              transform: 'translateX(50%)',
            }}
          >
            <div
              style={{
                width: '2px',
                height: '20px',
                background: '#303150',
                borderRadius: '1px',
              }}
            />
            <span
              className="absolute whitespace-nowrap"
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#303150',
                top: '22px',
                right: '50%',
                transform: 'translateX(50%)',
              }}
            >
              היום
            </span>
          </div>
        )}
      </div>

      {/* (c) Bottom metrics bar */}
      <div
        className="flex items-center mt-7 pt-5"
        style={{ borderTop: '1px solid #F7F7F8' }}
      >
        <div className="flex-1 flex flex-col gap-0.5 text-center">
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#7E7F90' }}>
            תקציב מתוכנן
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#303150' }} dir="ltr">
            {formatCurrency(totalBudget)}
          </span>
        </div>

        <div className="w-px h-9" style={{ background: '#E8E8ED' }} />

        <div className="flex-1 flex flex-col gap-0.5 text-center">
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#7E7F90' }}>
            הוצאות בפועל
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#303150' }} dir="ltr">
            {formatCurrency(totalSpent)}
          </span>
        </div>

        <div className="w-px h-9" style={{ background: '#E8E8ED' }} />

        <div className="flex-1 flex flex-col gap-0.5 text-center">
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#7E7F90' }}>
            ניצול תקציב
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: status.color }} dir="ltr">
            {roundedPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

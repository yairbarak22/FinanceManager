'use client';

import React from 'react';
import { Wallet, Receipt, Coins } from 'lucide-react';

const COLORS = {
  dodgerBlue: '#69ADFF',
  pink: '#F18AB5',
  turquoise: '#0DBACC',
  darkNavy: '#303150',
  steelGray: '#7E7F90',
  divider: '#F7F7F8',
};

interface BudgetSummaryCardsProps {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  accentColor,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  subtitle: string;
}) {
  return (
    <div
      className="rounded-3xl p-8 h-full flex flex-col transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          style={{
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
            color: COLORS.steelGray,
          }}
        >
          {title}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: accentColor }} strokeWidth={1.75} />
        </div>
      </div>

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

      <div className="w-full mb-4" style={{ borderTop: `1px solid ${COLORS.divider}` }} />

      <span
        style={{
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          fontWeight: 400,
          fontSize: '12px',
          color: COLORS.steelGray,
        }}
      >
        {subtitle}
      </span>
    </div>
  );
}

export default function BudgetSummaryCards({
  totalBudget,
  totalSpent,
  totalRemaining,
  overallPercentage,
}: BudgetSummaryCardsProps) {
  const remainingColor = totalRemaining >= 0 ? COLORS.turquoise : COLORS.pink;
  const remainingSubtitle = totalRemaining >= 0
    ? `${(100 - overallPercentage).toFixed(1)}% נותר מהתקציב`
    : `חריגה של ${Math.abs(overallPercentage - 100).toFixed(1)}%`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SummaryCard
        title="סה״כ תקציב מתוכנן"
        value={totalBudget}
        icon={Wallet}
        accentColor={COLORS.dodgerBlue}
        subtitle="הסכום הכולל שהגדרת לחודש זה"
      />
      <SummaryCard
        title="סה״כ הוצאות בפועל"
        value={totalSpent}
        icon={Receipt}
        accentColor={COLORS.pink}
        subtitle={`${overallPercentage.toFixed(1)}% מהתקציב נוצל`}
      />
      <SummaryCard
        title="יתרה כוללת"
        value={totalRemaining}
        icon={Coins}
        accentColor={remainingColor}
        subtitle={remainingSubtitle}
      />
    </div>
  );
}

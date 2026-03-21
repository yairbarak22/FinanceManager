'use client';

import { SectionHeader, MonthlySummaryCards } from '@/components/dashboard';

export interface CashFlowSectionProps {
  totalIncome: number;
  totalExpenses: number;
  monthlyCashflow: number;
  previousMonthIncome?: number;
  previousMonthExpenses?: number;
  previousMonthCashflow?: number;
}

export default function CashFlowSection({
  totalIncome,
  totalExpenses,
  monthlyCashflow,
  previousMonthIncome,
  previousMonthExpenses,
  previousMonthCashflow,
}: CashFlowSectionProps) {
  return (
    <section>
      <SectionHeader
        title="תזרים חודשי"
        subtitle="הכנסות מול הוצאות החודש"
      />

      <MonthlySummaryCards
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        monthlyCashflow={monthlyCashflow}
        previousMonthIncome={previousMonthIncome}
        previousMonthExpenses={previousMonthExpenses}
        previousMonthCashflow={previousMonthCashflow}
      />
    </section>
  );
}

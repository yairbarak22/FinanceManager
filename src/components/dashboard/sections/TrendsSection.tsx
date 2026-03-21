'use client';

import { SectionHeader } from '@/components/dashboard';
import MonthlyTrendsCharts from '@/components/MonthlyTrendsCharts';
import MonthlySummary from '@/components/MonthlySummary';
import type { MonthlySummary as MonthlySummaryType } from '@/lib/types';

export interface TrendsSectionProps {
  monthlySummaries: MonthlySummaryType[];
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
}

export default function TrendsSection({
  monthlySummaries,
  totalIncome,
  totalExpenses,
  totalBalance,
}: TrendsSectionProps) {
  return (
    <section>
      <SectionHeader
        title="מגמות חודשיות"
        subtitle="ניתוח הכנסות והוצאות לאורך זמן"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="min-h-[350px] md:min-h-[420px]">
          <MonthlyTrendsCharts data={monthlySummaries} />
        </div>
        <div className="min-h-[350px] md:min-h-[420px]">
          <MonthlySummary
            summaries={monthlySummaries}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            totalBalance={totalBalance}
          />
        </div>
      </div>
    </section>
  );
}

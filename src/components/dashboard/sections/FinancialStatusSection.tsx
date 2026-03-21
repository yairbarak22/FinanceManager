'use client';

import { SectionHeader, NetWorthHeroCard } from '@/components/dashboard';
import AssetAllocationChart from '@/components/AssetAllocationChart';
import type { Asset, NetWorthHistory } from '@/lib/types';

export interface FinancialStatusSectionProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalIncome: number;
  totalExpenses: number;
  fixedIncome: number;
  fixedExpenses: number;
  monthlyLiabilityPayments: number;
  netWorthHistory: NetWorthHistory[];
  assets: Asset[];
}

export default function FinancialStatusSection({
  netWorth,
  totalAssets,
  totalLiabilities,
  totalIncome,
  totalExpenses,
  fixedIncome,
  fixedExpenses,
  monthlyLiabilityPayments,
  netWorthHistory,
  assets,
}: FinancialStatusSectionProps) {
  return (
    <section>
      <SectionHeader
        title="המצב הפיננסי"
        subtitle="השווי הנקי שלך וחלוקת הנכסים"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <NetWorthHeroCard
            netWorth={netWorth}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            fixedIncome={fixedIncome}
            fixedExpenses={fixedExpenses}
            monthlyLiabilityPayments={monthlyLiabilityPayments}
            netWorthHistory={netWorthHistory}
            className="h-full"
          />
        </div>

        <div className="lg:col-span-4">
          <AssetAllocationChart assets={assets} />
        </div>
      </div>
    </section>
  );
}

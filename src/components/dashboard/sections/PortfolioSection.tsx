'use client';

import type { RefObject } from 'react';
import { SectionHeader } from '@/components/dashboard';
import Card from '@/components/ui/Card';
import AssetsSection from '@/components/AssetsSection';
import LiabilitiesSection from '@/components/LiabilitiesSection';
import RecurringTransactions from '@/components/RecurringTransactions';
import type {
  Asset,
  AssetValueHistory,
  Liability,
  RecurringTransaction,
} from '@/lib/types';
import type { CategoryInfo } from '@/lib/categories';

export interface PortfolioSectionProps {
  assets: Asset[];
  selectedMonth: string;
  assetHistory: AssetValueHistory[];
  liabilities: Liability[];
  recurringTransactions: RecurringTransaction[];
  customExpenseCategories: CategoryInfo[];
  customIncomeCategories: CategoryInfo[];
  isHaredi: boolean;
  assetsRef: RefObject<HTMLDivElement | null>;
  liabilitiesRef: RefObject<HTMLDivElement | null>;
  recurringRef: RefObject<HTMLDivElement | null>;
  // Asset handlers
  onAddAsset: () => void;
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  onViewAssetDocuments: (asset: Asset) => void;
  // Liability handlers
  onAddLiability: () => void;
  onEditLiability: (liability: Liability) => void;
  onDeleteLiability: (id: string) => void;
  onToggleLiabilityCashFlow: (id: string, isActive: boolean) => void;
  onViewAmortization: (liability: Liability) => void;
  onViewLiabilityDocuments: (liability: Liability) => void;
  // Recurring handlers
  onAddRecurring: () => void;
  onEditRecurring: (tx: RecurringTransaction) => void;
  onDeleteRecurring: (id: string) => void;
  onToggleRecurring: (id: string, isActive: boolean) => void;
}

export default function PortfolioSection({
  assets,
  selectedMonth,
  assetHistory,
  liabilities,
  recurringTransactions,
  customExpenseCategories,
  customIncomeCategories,
  assetsRef,
  liabilitiesRef,
  recurringRef,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  onViewAssetDocuments,
  onAddLiability,
  onEditLiability,
  onDeleteLiability,
  onToggleLiabilityCashFlow,
  onViewAmortization,
  onViewLiabilityDocuments,
  onAddRecurring,
  onEditRecurring,
  onDeleteRecurring,
  onToggleRecurring,
}: PortfolioSectionProps) {
  return (
    <section>
      <SectionHeader
        title="פירוט תיק"
        subtitle="פירוט מלא של נכסים, התחייבויות ותשלומים קבועים"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card ref={assetsRef} padding="sm" className="h-[500px] flex flex-col">
          <AssetsSection
            assets={assets}
            selectedMonth={selectedMonth}
            assetHistory={assetHistory}
            onAdd={onAddAsset}
            onEdit={onEditAsset}
            onDelete={onDeleteAsset}
            onViewDocuments={onViewAssetDocuments}
          />
        </Card>

        <Card ref={liabilitiesRef} padding="sm" className="h-[500px] flex flex-col">
          <LiabilitiesSection
            liabilities={liabilities}
            selectedMonth={selectedMonth}
            onAdd={onAddLiability}
            onEdit={onEditLiability}
            onDelete={onDeleteLiability}
            onToggleCashFlow={onToggleLiabilityCashFlow}
            onViewAmortization={onViewAmortization}
            onViewDocuments={onViewLiabilityDocuments}
          />
        </Card>

        <Card ref={recurringRef} padding="sm" className="h-[500px] flex flex-col md:col-span-2 lg:col-span-1">
          <RecurringTransactions
            transactions={recurringTransactions}
            onAdd={onAddRecurring}
            onEdit={onEditRecurring}
            onDelete={onDeleteRecurring}
            onToggle={onToggleRecurring}
            customExpenseCategories={customExpenseCategories}
            customIncomeCategories={customIncomeCategories}
          />
        </Card>
      </div>
    </section>
  );
}

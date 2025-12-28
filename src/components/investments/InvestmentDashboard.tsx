'use client';

import { useState } from 'react';
import HoldingsList from './HoldingsList';
import AllocationCharts from './AllocationCharts';
import InvestmentCalculator from './InvestmentCalculator';
import HoldingModal from './HoldingModal';
import type { Holding, InvestmentCalculation } from '@/lib/types';

interface Props {
  holdings: Holding[];
  calculations: InvestmentCalculation[];
  calculationSummary: any | null;
  isCalculating: boolean;
  onCalculate: (amount: number) => void;
  onApplyInvestment: (amount: number) => Promise<void>;
  onAddHolding: (data: any) => Promise<void>;
  onDeleteHolding: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export default function InvestmentDashboard({
  holdings,
  calculations,
  calculationSummary,
  isCalculating,
  onCalculate,
  onApplyInvestment,
  onAddHolding,
  onDeleteHolding,
  onRefresh,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);

  const handleOpenModal = (holding?: Holding) => {
    setEditingHolding(holding || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHolding(null);
  };

  const handleSave = async (data: any) => {
    await onAddHolding(data);
    handleCloseModal();
  };

  return (
    <>
      {/* מחשבון וגרפים */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <InvestmentCalculator
            onCalculate={onCalculate}
            onApplyInvestment={onApplyInvestment}
            calculations={calculations}
            summary={calculationSummary}
            isLoading={isCalculating}
          />
        </div>
        <div className="lg:col-span-2">
          <AllocationCharts holdings={holdings} />
        </div>
      </div>

      {/* רשימת אחזקות */}
      <HoldingsList
        holdings={holdings}
        calculations={calculations}
        onAdd={() => handleOpenModal()}
        onEdit={handleOpenModal}
        onDelete={onDeleteHolding}
      />

      {/* מודאל */}
      {isModalOpen && (
        <HoldingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          holding={editingHolding}
        />
      )}
    </>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Holding, InvestmentCalculation } from '@/lib/types';
import HoldingsList from './HoldingsList';
import AllocationCharts from './AllocationCharts';
import InvestmentCalculator from './InvestmentCalculator';
import HoldingModal from './HoldingModal';

export default function InvestmentsTab() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [calculations, setCalculations] = useState<InvestmentCalculation[]>([]);
  const [calculationSummary, setCalculationSummary] = useState<{
    investmentAmount: number;
    currentPortfolioValue: number;
    newPortfolioValue: number;
    totalAllocated: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);

  // Fetch holdings
  const fetchHoldings = useCallback(async () => {
    try {
      const res = await fetch('/api/holdings');
      const data = await res.json();
      setHoldings(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching holdings:', error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  // Calculate investment allocation
  const handleCalculate = async (amount: number) => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/holdings/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investmentAmount: amount }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'שגיאה בחישוב');
        setIsCalculating(false);
        return;
      }

      const data = await res.json();
      setCalculations(data.calculations);
      setCalculationSummary(data.summary);
    } catch (error) {
      console.error('Error calculating:', error);
      alert('שגיאה בחישוב');
    }
    setIsCalculating(false);
  };

  // Apply investment - actually update holding values
  const handleApplyInvestment = async (amount: number) => {
    try {
      const res = await fetch('/api/holdings/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investmentAmount: amount }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'שגיאה בהכנסת השקעה');
        return;
      }

      const data = await res.json();
      alert(data.message);
      
      // Refresh holdings and recalculate
      await fetchHoldings();
      // Recalculate with the same amount to show updated state
      await handleCalculate(amount);
    } catch (error) {
      console.error('Error applying investment:', error);
      alert('שגיאה בהכנסת השקעה');
    }
  };

  // CRUD handlers
  const handleAddHolding = async (data: Omit<Holding, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const url = editingHolding ? `/api/holdings/${editingHolding.id}` : '/api/holdings';
      const method = editingHolding ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'שגיאה בשמירה');
        return;
      }

      setEditingHolding(null);
      // Clear calculations when holdings change
      setCalculations([]);
      setCalculationSummary(null);
      await fetchHoldings();
    } catch (error) {
      console.error('Error saving holding:', error);
      alert('שגיאה בשמירה');
    }
  };

  const handleDeleteHolding = async (id: string) => {
    try {
      await fetch(`/api/holdings/${id}`, { method: 'DELETE' });
      // Clear calculations when holdings change
      setCalculations([]);
      setCalculationSummary(null);
      await fetchHoldings();
    } catch (error) {
      console.error('Error deleting holding:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row: Calculator + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator */}
        <div className="lg:col-span-1">
          <div className="h-[400px]">
            <InvestmentCalculator
              onCalculate={handleCalculate}
              onApplyInvestment={handleApplyInvestment}
              calculations={calculations}
              summary={calculationSummary}
              isLoading={isCalculating}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2">
          <div className="h-[400px]">
            <AllocationCharts holdings={holdings} />
          </div>
        </div>
      </div>

      {/* Holdings List */}
      <HoldingsList
        holdings={holdings}
        calculations={calculations}
        onAdd={() => {
          setEditingHolding(null);
          setIsModalOpen(true);
        }}
        onEdit={(holding) => {
          setEditingHolding(holding);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteHolding}
      />

      {/* Modal */}
      <HoldingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHolding(null);
        }}
        onSave={handleAddHolding}
        holding={editingHolding}
      />
    </div>
  );
}


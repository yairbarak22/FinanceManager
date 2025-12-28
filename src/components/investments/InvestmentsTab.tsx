'use client';

import { useState, useEffect, useCallback } from 'react';
import { Holding, InvestmentCalculation, UserProfile } from '@/lib/types';
import { apiFetch } from '@/lib/utils';
import InvestmentOnboarding from './InvestmentOnboarding';
import InvestmentDashboard from './InvestmentDashboard';

export default function InvestmentsTab() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
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

  // Fetch profile and holdings
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [profileRes, holdingsRes] = await Promise.all([
        apiFetch('/api/profile'),
        apiFetch('/api/holdings')
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      if (holdingsRes.ok) {
        const holdingsData = await holdingsRes.json();
        setHoldings(holdingsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate investment allocation
  const handleCalculate = async (amount: number) => {
    setIsCalculating(true);
    try {
      const res = await apiFetch('/api/holdings/calculate', {
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
      const res = await apiFetch('/api/holdings/apply', {
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

      // Refresh data and clear calculations
      await fetchData();
      setCalculations([]);
      setCalculationSummary(null);
    } catch (error) {
      console.error('Error applying investment:', error);
      alert('שגיאה בהכנסת השקעה');
    }
  };

  // Declare account - update profile with hasIndependentAccount
  const handleDeclareAccount = async () => {
    try {
      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          hasIndependentAccount: true
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // CRUD handlers
  const handleAddHolding = async (data: any) => {
    try {
      const url = data.id ? `/api/holdings/${data.id}` : '/api/holdings';
      const method = data.id ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'שגיאה בשמירה');
        return;
      }

      // Clear calculations when holdings change
      setCalculations([]);
      setCalculationSummary(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving holding:', error);
      alert('שגיאה בשמירה');
    }
  };

  const handleDeleteHolding = async (id: string) => {
    try {
      await apiFetch(`/api/holdings/${id}`, { method: 'DELETE' });
      // Clear calculations when holdings change
      setCalculations([]);
      setCalculationSummary(null);
      await fetchData();
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

  // Conditional rendering based on hasIndependentAccount
  if (!profile?.hasIndependentAccount) {
    return <InvestmentOnboarding onDeclare={handleDeclareAccount} />;
  }

  return (
    <InvestmentDashboard
      holdings={holdings}
      calculations={calculations}
      calculationSummary={calculationSummary}
      isCalculating={isCalculating}
      onCalculate={handleCalculate}
      onApplyInvestment={handleApplyInvestment}
      onAddHolding={handleAddHolding}
      onDeleteHolding={handleDeleteHolding}
      onRefresh={fetchData}
    />
  );
}


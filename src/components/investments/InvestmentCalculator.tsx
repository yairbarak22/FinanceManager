'use client';

import { useState, useEffect } from 'react';
import { Calculator, ArrowLeft, Sparkles, PlusCircle, Calendar, ArrowRight } from 'lucide-react';
import { InvestmentCalculation } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface ForecastData {
  monthsToIdeal: number;
  reachable: boolean;
  projectedPortfolioValue: number;
}

interface InvestmentCalculatorProps {
  onCalculate: (amount: number) => void;
  onApplyInvestment: (amount: number) => Promise<void>;
  calculations: InvestmentCalculation[];
  summary: {
    investmentAmount: number;
    currentPortfolioValue: number;
    newPortfolioValue: number;
    totalAllocated: number;
  } | null;
  isLoading: boolean;
}

export default function InvestmentCalculator({ 
  onCalculate, 
  onApplyInvestment,
  calculations, 
  summary,
  isLoading 
}: InvestmentCalculatorProps) {
  const [amount, setAmount] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleCalculate = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onCalculate(numAmount);
      fetchForecast(numAmount);
      setShowResults(true);
    }
  };

  const handleApply = async () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0 && summary) {
      setIsApplying(true);
      try {
        await onApplyInvestment(numAmount);
        fetchForecast(numAmount);
      } finally {
        setIsApplying(false);
      }
    }
  };

  const fetchForecast = async (investmentAmount: number) => {
    setIsForecastLoading(true);
    try {
      const res = await fetch('/api/holdings/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyInvestment: investmentAmount }),
      });
      if (res.ok) {
        const data = await res.json();
        setForecast({
          monthsToIdeal: data.monthsToIdeal,
          reachable: data.reachable,
          projectedPortfolioValue: data.projectedPortfolioValue,
        });
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
    }
    setIsForecastLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculate();
    }
  };

  const handleBack = () => {
    setShowResults(false);
  };

  // Reset results when amount changes
  useEffect(() => {
    setShowResults(false);
    setForecast(null);
  }, [amount]);

  // Results View
  if (showResults && summary && calculations.length > 0) {
    return (
      <div className="card p-6 h-full flex flex-col">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBack}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-gray-900">תוצאות החישוב</h3>
          </div>
          <span className="text-sm font-bold text-indigo-600">
            {formatCurrency(summary.investmentAmount)}
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
          {/* Forecast Section */}
          {forecast && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-800">תחזית</span>
              </div>
              {isForecastLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">מחשב...</span>
                </div>
              ) : forecast.reachable ? (
                forecast.monthsToIdeal === 0 ? (
                  <p className="text-sm text-emerald-700">🎉 בפילוח אידאלי!</p>
                ) : (
                  <p className="text-sm text-emerald-700">
                    פילוח אידאלי בעוד <span className="font-bold text-lg">{forecast.monthsToIdeal}</span> חודשים
                  </p>
                )
              ) : (
                <p className="text-xs text-amber-700">⚠️ יותר מ-10 שנים</p>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">שווי נוכחי</p>
                <p className="text-sm font-bold text-gray-700">{formatCurrency(summary.currentPortfolioValue)}</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">שווי חדש</p>
                <p className="text-sm font-bold text-indigo-600">{formatCurrency(summary.newPortfolioValue)}</p>
              </div>
            </div>
          </div>

          {/* Allocation Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500">פירוט ההשקעה:</h4>
            {calculations.map((calc) => (
              <div
                key={calc.holdingId}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate block">{calc.holdingName}</span>
                  <span className="text-xs text-gray-400">
                    {calc.currentAllocation.toFixed(1)}% → {calc.newAllocation.toFixed(1)}%
                  </span>
                </div>
                <span className={`text-sm font-bold mr-2 ${calc.amountToInvest > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {calc.amountToInvest > 0 ? `+${formatCurrency(calc.amountToInvest)}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button - Fixed at bottom */}
        <div className="pt-4 flex-shrink-0 border-t border-gray-100 mt-4">
          <button 
            onClick={handleApply}
            disabled={isApplying}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                הכנס השקעה ועדכן שווי
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Input View (Default)
  return (
    <div className="card p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">מחשבון השקעה</h3>
          <p className="text-sm text-gray-500">הזן סכום לחישוב פילוח</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₪</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="סכום להשקעה חודשית"
              className="input pr-10 text-lg py-4 text-center"
              min="0"
              step="100"
            />
          </div>
          
          <button 
            onClick={handleCalculate}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
            className="btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                חשב פילוח מומלץ
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-400 text-center mt-4">
        הזן את הסכום שברצונך להשקיע מדי חודש
      </p>
    </div>
  );
}

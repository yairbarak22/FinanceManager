'use client';

import { Landmark, TrendingUp, TrendingDown, Banknote } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface NetWorthSectionProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyLiabilityPayments: number;
  fixedIncome: number;
  fixedExpenses: number;
}

export default function NetWorthSection({
  netWorth,
  totalAssets,
  totalLiabilities,
  monthlyLiabilityPayments,
  fixedIncome,
  fixedExpenses,
}: NetWorthSectionProps) {
  // Calculate monthly cash flow: Income - Expenses - Liability Payments
  const monthlyCashFlow = fixedIncome - fixedExpenses - monthlyLiabilityPayments;
  const isPositiveCashFlow = monthlyCashFlow >= 0;

  return (
    <div className="card p-6 h-full" data-tour="net-worth-section">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Landmark className="w-5 h-5 text-violet-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">שווי נקי</h2>
      </div>

      {/* Main Net Worth */}
      <div className="mb-6">
        <p className="text-4xl font-bold text-gray-900">
          {formatCurrency(netWorth)}
        </p>
        <p className="text-sm text-gray-500 mt-1">Net Worth</p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600">נכסים</span>
          </div>
          <span className="font-bold text-green-600">{formatCurrency(totalAssets)}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-sm text-gray-600">התחייבויות</span>
          </div>
          <span className="font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
        </div>
        
        <div className={cn(
          "flex items-center justify-between p-3 rounded-xl border",
          isPositiveCashFlow 
            ? "bg-emerald-50 border-emerald-100" 
            : "bg-orange-50 border-orange-100"
        )}>
          <div className="flex items-center gap-2">
            <Banknote className={cn("w-4 h-4", isPositiveCashFlow ? "text-emerald-600" : "text-orange-600")} />
            <span className="text-sm text-gray-600">תזרים חודשי</span>
          </div>
          <span className={cn("font-bold", isPositiveCashFlow ? "text-emerald-600" : "text-orange-600")}>
            {isPositiveCashFlow ? '+' : ''}{formatCurrency(monthlyCashFlow)}
          </span>
        </div>
      </div>
    </div>
  );
}

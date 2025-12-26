'use client';

import { Landmark, TrendingUp, TrendingDown, Banknote } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import Card from './ui/Card';

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
  const isPositiveNetWorth = netWorth >= 0;

  return (
    <Card className="h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Landmark className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">שווי נקי</h2>
      </div>

      {/* Main Net Worth */}
      <div className="mb-6">
        <p className={cn(
          "text-4xl font-bold",
          isPositiveNetWorth ? "text-emerald-500" : "text-rose-500"
        )}>
          {formatCurrency(netWorth)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-3">
        {/* Assets */}
        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">נכסים</span>
          </div>
          <span className="font-bold text-emerald-600">{formatCurrency(totalAssets)}</span>
        </div>

        {/* Liabilities */}
        <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">התחייבויות</span>
          </div>
          <span className="font-bold text-rose-600">{formatCurrency(totalLiabilities)}</span>
        </div>

        {/* Monthly Cash Flow */}
        <div className={cn(
          "flex items-center justify-between p-3 rounded-xl border",
          isPositiveCashFlow
            ? "bg-emerald-50 border-emerald-100"
            : "bg-rose-50 border-rose-100"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isPositiveCashFlow ? "bg-emerald-100" : "bg-rose-100"
            )}>
              <Banknote className={cn("w-4 h-4", isPositiveCashFlow ? "text-emerald-600" : "text-rose-600")} />
            </div>
            <span className="text-sm font-medium text-slate-700">תזרים חודשי</span>
          </div>
          <span className={cn("font-bold", isPositiveCashFlow ? "text-emerald-600" : "text-rose-600")}>
            {isPositiveCashFlow ? '+' : ''}{formatCurrency(monthlyCashFlow)}
          </span>
        </div>
      </div>
    </Card>
  );
}

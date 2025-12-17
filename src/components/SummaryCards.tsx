'use client';

import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SummaryCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

export default function SummaryCards({ totalBalance, totalIncome, totalExpenses }: SummaryCardsProps) {
  const isPositiveBalance = totalBalance >= 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-tour="summary-cards">
      {/* Balance Card */}
      <div className={`rounded-2xl p-5 ${isPositiveBalance ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">יתרה כוללת</p>
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalBalance)}</p>
            <p className="text-white/60 text-xs mt-1">
              {isPositiveBalance ? 'חיובי' : 'שלילי'}
            </p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Wallet className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Income Card */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">סה"כ הכנסות</p>
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalIncome)}</p>
            <p className="text-white/60 text-xs mt-1">כולל קבועות</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Expenses Card */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">סה"כ הוצאות</p>
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalExpenses)}</p>
            <p className="text-white/60 text-xs mt-1">כולל קבועות + התחייבויות</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <TrendingDown className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import Card from './ui/Card';
import { SensitiveData } from './common/SensitiveData';

interface SummaryCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

export default function SummaryCards({ totalBalance, totalIncome, totalExpenses }: SummaryCardsProps) {
  const isPositiveBalance = totalBalance >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Balance Card */}
      <Card padding="sm" id="card-cash-flow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">תזרים</p>
            <SensitiveData as="p" className={cn(
              "text-3xl font-bold tracking-tight",
              isPositiveBalance ? "text-emerald-500" : "text-rose-500"
            )}>
              {formatCurrency(totalBalance)}
            </SensitiveData>
            <p className="text-slate-400 text-xs mt-1">
              {isPositiveBalance ? 'חיובי' : 'שלילי'}
            </p>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isPositiveBalance ? "bg-emerald-100" : "bg-rose-100"
          )}>
            <Wallet className={cn(
              "w-6 h-6",
              isPositiveBalance ? "text-emerald-600" : "text-rose-600"
            )} />
          </div>
        </div>
      </Card>

      {/* Income Card */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">סה"כ הכנסות</p>
            <SensitiveData as="p" className="text-3xl font-bold tracking-tight text-emerald-500">
              {formatCurrency(totalIncome)}
            </SensitiveData>
            <p className="text-slate-400 text-xs mt-1">כולל קבועות</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </Card>

      {/* Expenses Card */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">סה"כ הוצאות</p>
            <SensitiveData as="p" className="text-3xl font-bold tracking-tight text-rose-500">
              {formatCurrency(totalExpenses)}
            </SensitiveData>
            <p className="text-slate-400 text-xs mt-1">כולל קבועות + התחייבויות</p>
          </div>
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-rose-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { SensitiveData } from '@/components/common/SensitiveData';

interface MonthlyBalanceCardProps {
  monthLabel: string;
  netCashflow: number;
  totalIncome: number;
  totalExpenses: number;
  userName?: string;
}

export default function MonthlyBalanceCard({
  monthLabel,
  netCashflow,
  totalIncome,
  totalExpenses,
  userName,
}: MonthlyBalanceCardProps) {
  const isPositive = netCashflow >= 0;
  const greeting = userName ? `הסיכום של ${userName}` : 'הסיכום שלך';
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      {/* Subtle gradient glow */}
      <div className="absolute -top-24 -end-24 w-48 h-48 bg-[#69ADFF] opacity-[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -start-16 w-32 h-32 bg-[#0DBACC] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[0.8125rem] font-medium text-[#7E7F90] mb-1">
            {greeting} ל{monthLabel}
          </p>

          <div className="mt-3 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isPositive ? 'bg-[#E6F9FB]' : 'bg-[#FDE8F0]'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-[#0DBACC]" strokeWidth={1.75} />
              ) : (
                <TrendingDown className="w-5 h-5 text-[#F18AB5]" strokeWidth={1.75} />
              )}
            </div>
            <SensitiveData>
              <span
                className={`text-[2.5rem] font-bold leading-tight ${
                  isPositive ? 'text-[#0DBACC]' : 'text-[#F18AB5]'
                }`}
              >
                {isPositive ? '+' : ''}
                {formatCurrency(netCashflow)}
              </span>
            </SensitiveData>
          </div>
        </div>

        {/* Savings rate badge */}
        {totalIncome > 0 && (
          <div
            className={`px-3 py-1.5 rounded-xl text-[0.75rem] font-semibold ${
              savingsRate >= 0
                ? 'bg-[#E6F9FB] text-[#0DBACC]'
                : 'bg-[#FDE8F0] text-[#F18AB5]'
            }`}
          >
            {savingsRate > 0 ? '+' : ''}
            {savingsRate}% חיסכון
          </div>
        )}
      </div>

      {/* Income vs Expenses bar */}
      <div className="mt-6 mb-4">
        <div className="h-1.5 w-full bg-[#E8E8ED] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${expenseRatio}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #69ADFF 0%, #F18AB5 100%)',
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0DBACC]" />
          <p className="text-[0.75rem] font-normal text-[#BDBDCB]">הכנסות</p>
          <SensitiveData>
            <p className="text-[0.9375rem] font-semibold text-[#0DBACC]">
              {formatCurrency(totalIncome)}
            </p>
          </SensitiveData>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#F18AB5]" />
          <p className="text-[0.75rem] font-normal text-[#BDBDCB]">הוצאות</p>
          <SensitiveData>
            <p className="text-[0.9375rem] font-semibold text-[#F18AB5]">
              {formatCurrency(totalExpenses)}
            </p>
          </SensitiveData>
        </div>
      </div>
    </motion.div>
  );
}

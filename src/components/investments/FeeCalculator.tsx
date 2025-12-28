'use client';

import { useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function FeeCalculator() {
  const [monthlyAmount, setMonthlyAmount] = useState(1000);
  const [years, setYears] = useState(30);

  // חישוב עם עמלות
  const calculateWithFees = (monthly: number, years: number, feeRate: number) => {
    const months = years * 12;
    const monthlyReturn = 0.07 / 12; // 7% שנתי
    const effectiveReturn = monthlyReturn - (feeRate / 12);

    if (effectiveReturn === 0) return monthly * months;

    return monthly * ((Math.pow(1 + effectiveReturn, months) - 1) / effectiveReturn);
  };

  const kupatGemelValue = calculateWithFees(monthlyAmount, years, 0.007);
  const diyValue = calculateWithFees(monthlyAmount, years, 0);
  const loss = diyValue - kupatGemelValue;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">
        מחשבון העמלות - כמה את/ה מפסיד/ה?
      </h3>

      {/* קלטים */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="label">השקעה חודשית (₪)</label>
          <input
            type="number"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(Number(e.target.value))}
            min="0"
            max="100000"
            className="input"
          />
        </div>

        <div>
          <label className="label">תקופה (שנים)</label>
          <input
            type="range"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            min="1"
            max="40"
            className="w-full"
          />
          <div className="text-center text-sm text-slate-600 mt-1">{years} שנים</div>
        </div>
      </div>

      {/* תוצאות */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* קופת גמל */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <TrendingDown className="w-5 h-5" />
            <span className="font-semibold">קופת גמל (0.7% עמלה)</span>
          </div>
          <div className="text-2xl font-bold text-amber-900">
            {kupatGemelValue.toLocaleString('he-IL')}₪
          </div>
        </div>

        {/* DIY */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border-2 border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">השקעה עצמאית (0% עמלה)</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900">
            {diyValue.toLocaleString('he-IL')}₪
          </div>
        </div>
      </div>

      {/* הפסד */}
      <div className="mt-4 text-center bg-red-50 rounded-lg p-4 border border-red-200">
        <p className="text-sm text-red-700 mb-1">הפסד כולל מעמלות:</p>
        <p className="text-3xl font-bold text-red-600">
          -{loss.toLocaleString('he-IL')}₪
        </p>
      </div>
    </div>
  );
}

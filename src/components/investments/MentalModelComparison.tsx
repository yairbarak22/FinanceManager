'use client';

import { useState } from 'react';
import { Lock, Unlock, TrendingUp, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

/**
 * Mental Model Comparison Component
 *
 * Design Psychology:
 * - Gestalt Law of Proximity: Two distinct columns create visual grouping
 * - System 1 Thinking: Visual icons and colors enable instant recognition
 * - Cognitive Load Reduction: Clear contrast between "old" and "new" models
 * - Peak-End Rule: The growth number (+155,833₪) is the memorable "peak"
 */

export default function MentalModelComparison() {
  const [monthlyAmount, setMonthlyAmount] = useState(1000);
  const [years, setYears] = useState(30);

  // Calculate compound growth
  const calculateWithFees = (monthly: number, years: number, feeRate: number) => {
    const months = years * 12;
    const monthlyReturn = 0.07 / 12; // 7% annual return
    const effectiveReturn = monthlyReturn - (feeRate / 12);

    if (effectiveReturn === 0) return monthly * months;

    return monthly * ((Math.pow(1 + effectiveReturn, months) - 1) / effectiveReturn);
  };

  const managedFundValue = calculateWithFees(monthlyAmount, years, 0.007);
  const independentValue = calculateWithFees(monthlyAmount, years, 0);
  const potentialGrowth = independentValue - managedFundValue;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header - Clean Apple-style */}
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
          השוואת מודלים פיננסיים
        </h2>
        <p className="text-sm text-slate-500 mt-1">
הסבר ההבדל שנוצר בגלל עמלות בקופת הגמל        </p>
      </div>

      {/* Calculator Controls - Minimal Design */}
      <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              השקעה חודשית
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₪</span>
              <input
                type="number"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                min="100"
                max="100000"
                step="100"
                className="w-full pe-4 ps-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900
                         focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all
                         text-base font-medium"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              תקופה: {years} שנים
            </label>
            <input
              type="range"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              min="5"
              max="40"
              className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer mt-3
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:bg-indigo-600
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:shadow-md
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:transition-transform
                         [&::-webkit-slider-thumb]:hover:scale-110
                         [&::-moz-range-thumb]:w-5
                         [&::-moz-range-thumb]:h-5
                         [&::-moz-range-thumb]:bg-indigo-600
                         [&::-moz-range-thumb]:rounded-full
                         [&::-moz-range-thumb]:border-0
                         [&::-moz-range-thumb]:shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Comparison Cards - Gestalt Law of Proximity */}
      <div className="grid md:grid-cols-2 gap-0 md:divide-x md:divide-slate-100 divide-y md:divide-y-0 divide-slate-100">

        {/* OLD MODEL: Managed Funds */}
        <div className="p-6 bg-slate-50/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-600">קופת גמל / פנסיה</h3>
              <span className="text-xs text-slate-400">המודל הישן</span>
            </div>
          </div>

          {/* Pain Points */}
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-500">עמלות ניהול 0.7%-1.5% בשנה</span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-500">הפקדות מוגבלות</span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-500">הכסף לא בידיים שלך</span>
            </li>
            
            <li className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-500">אין שליטה על ההשקעות</span>
            </li>
          </ul>

          {/* Result - Muted */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">שווי צפוי</p>
            <p className="text-2xl font-bold text-slate-500 smartlook-mask">
              {managedFundValue.toLocaleString('he-IL', { maximumFractionDigits: 0 })}₪
            </p>
          </div>
        </div>

        {/* NEW MODEL: Independent Account */}
        <div className="p-6 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Unlock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">חשבון השקעות עצמאי</h3>
              <span className="text-xs text-emerald-600 font-medium">המודל החדש</span>
            </div>
          </div>

          {/* Gain Points */}
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-700">0% עמלות ניהול</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-700">הפקדות ללא הגבלה</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-700">נזילות מלאה בכל עת</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-700">שליטה מלאה על התיק</span>
            </li>
          </ul>

          {/* Result - Emphasized */}
          <div className="pt-4 border-t border-emerald-100">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">שווי צפוי</p>
            <p className="text-2xl font-bold text-slate-900 smartlook-mask">
              {independentValue.toLocaleString('he-IL', { maximumFractionDigits: 0 })}₪
            </p>
          </div>
        </div>
      </div>

      {/* The Peak - Growth Anchor (Peak-End Rule) */}
      <div className="px-6 py-5 bg-gradient-to-l from-emerald-50 to-white border-t border-emerald-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">הצמיחה הנוספת שלך</p>
              <p className="text-xs text-slate-400">ההפרש לאורך {years} שנים</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span className="text-3xl sm:text-4xl font-bold text-emerald-600 tracking-tight smartlook-mask">
              +{potentialGrowth.toLocaleString('he-IL', { maximumFractionDigits: 0 })}₪
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

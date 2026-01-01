'use client';

import { useState, useMemo, useRef, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, Sparkles } from 'lucide-react';
import Slider, { CurrencySlider, PercentageSlider, YearsSlider } from '@/components/ui/Slider';
import { formatCurrency } from '@/lib/utils';

interface CompoundInterestProps {
  id?: string;
}

const CompoundInterest = forwardRef<HTMLElement, CompoundInterestProps>(({ id }, ref) => {
  // Calculator inputs
  const [initialDeposit, setInitialDeposit] = useState(50000);
  const [monthlyDeposit, setMonthlyDeposit] = useState(2000);
  const [years, setYears] = useState(20);
  const [annualReturn, setAnnualReturn] = useState(7);

  // Calculate compound interest with monthly contributions
  const calculationData = useMemo(() => {
    const monthlyRate = annualReturn / 100 / 12;
    const totalMonths = years * 12;
    
    const dataPoints: { year: number; principal: number; total: number; interest: number }[] = [];
    
    for (let year = 0; year <= years; year++) {
      const months = year * 12;
      
      // Calculate total value: P(1+r)^n + PMT * (((1+r)^n - 1) / r)
      let total: number;
      let principal: number;
      
      if (monthlyRate === 0) {
        // No interest case
        total = initialDeposit + monthlyDeposit * months;
        principal = total;
      } else {
        const growthFactor = Math.pow(1 + monthlyRate, months);
        const futureValueInitial = initialDeposit * growthFactor;
        const futureValueDeposits = monthlyDeposit * ((growthFactor - 1) / monthlyRate);
        total = futureValueInitial + futureValueDeposits;
        principal = initialDeposit + monthlyDeposit * months;
      }
      
      const interest = total - principal;
      
      dataPoints.push({
        year,
        principal: Math.round(principal),
        total: Math.round(total),
        interest: Math.round(interest),
      });
    }
    
    return dataPoints;
  }, [initialDeposit, monthlyDeposit, years, annualReturn]);

  const finalData = calculationData[calculationData.length - 1];
  const interestPercentage = finalData.total > 0 
    ? Math.round((finalData.interest / finalData.total) * 100) 
    : 0;

  return (
    <section 
      ref={ref}
      id={id}
      className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white"
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">מחשבון ריבית דריבית</span>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-4">
            מחשבון הפלא
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto">
            גלה כמה הכסף שלך יכול לצמוח עם הזמן. הזז את המחוונים וראה את הקסם קורה.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Sliders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm"
          >
            <CurrencySlider
              label="הון התחלתי"
              value={initialDeposit}
              min={0}
              max={1000000}
              step={10000}
              onChange={setInitialDeposit}
            />
            
            <CurrencySlider
              label="הפקדה חודשית"
              value={monthlyDeposit}
              min={0}
              max={50000}
              step={500}
              onChange={setMonthlyDeposit}
            />
            
            <YearsSlider
              label="תקופת השקעה"
              value={years}
              min={1}
              max={50}
              onChange={setYears}
            />
            
            <PercentageSlider
              label="תשואה שנתית צפויה"
              value={annualReturn}
              min={0}
              max={15}
              step={0.5}
              onChange={setAnnualReturn}
            />

            {/* Quick tip */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>טיפ:</strong> תשואה ממוצעת היסטורית של S&P 500 היא כ-7% אחרי אינפלציה.
              </p>
            </div>
          </motion.div>

          {/* Chart & Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={calculationData}>
                    <defs>
                      <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="year" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        direction: 'rtl',
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'principal' ? 'הכסף שלך' : name === 'interest' ? 'רווחים' : 'סה"כ'
                      ]}
                      labelFormatter={(label) => `שנה ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="principal"
                      stackId="1"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      fill="url(#principalGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="interest"
                      stackId="1"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#interestGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="text-sm text-slate-600">הכסף שלך</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-slate-600">רווחים</span>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <motion.div
              key={`${finalData.total}-${finalData.principal}`}
              initial={{ opacity: 0.8, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">התוצאה שלך</span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">סך הכל אחרי {years} שנים</p>
                  <p className="text-3xl md:text-4xl font-bold text-white">
                    {formatCurrency(finalData.total)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">הכסף שלך</p>
                    <p className="text-lg font-semibold text-slate-200">
                      {formatCurrency(finalData.principal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">רווחים</p>
                    <p className="text-lg font-semibold text-emerald-400">
                      {formatCurrency(finalData.interest)}
                    </p>
                  </div>
                </div>

                {/* Insight */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <span className="text-emerald-400 font-bold">{interestPercentage}%</span> מהכסף הזה הוא רווחים שהכסף עשה בשבילך! 
                    {interestPercentage > 50 && " זה כוח הריבית דריבית."}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

CompoundInterest.displayName = 'CompoundInterest';

export default CompoundInterest;


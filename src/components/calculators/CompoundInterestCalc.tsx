'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, Sparkles } from 'lucide-react';
import { CurrencySlider, PercentageSlider, YearsSlider } from '@/components/ui/Slider';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';

interface CompoundInterestCalcProps {
  className?: string;
  showHeader?: boolean;
}

export default function CompoundInterestCalc({ className = '', showHeader = false }: CompoundInterestCalcProps) {
  // Calculator inputs
  const [initialDeposit, setInitialDeposit] = useState(50000);
  const [monthlyDeposit, setMonthlyDeposit] = useState(2000);
  const [years, setYears] = useState(20);
  const [annualReturn, setAnnualReturn] = useState(7);

  // Calculate compound interest with monthly contributions
  const calculationData = useMemo(() => {
    const monthlyRate = annualReturn / 100 / 12;
    
    const dataPoints: { year: number; principal: number; total: number; interest: number }[] = [];
    
    for (let year = 0; year <= years; year++) {
      const months = year * 12;
      
      let total: number;
      let principal: number;
      
      if (monthlyRate === 0) {
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
    <Card className={className} padding="md">
      {/* Header - optional */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#B4F1F1] rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-[#0DBACC]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#303150]">מחשבון ריבית דריבית</h2>
            <p className="text-sm text-[#7E7F90]">גלה כמה הכסף שלך יכול לצמוח עם הזמן</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-6 bg-[#F7F7F8] rounded-3xl p-5">
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
          <div className="flex items-start gap-2 p-3 bg-[#FFE5B4]/30 rounded-xl border border-[#FFB84D]/50">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#303150]">
              <strong>טיפ:</strong> תשואה ממוצעת היסטורית של S&P 500 היא כ-7% אחרי אינפלציה.
            </p>
          </div>
        </div>

        {/* Chart & Results */}
        <div className="space-y-4">
          {/* Chart */}
          <div className="bg-[#F7F7F8] rounded-3xl p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calculationData}>
                  <defs>
                    <linearGradient id="principalGradientCalc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7E7F90" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7E7F90" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="interestGradientCalc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0DBACC" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0DBACC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="year" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#7E7F90', fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#7E7F90', fontSize: 11 }}
                    tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E8E8ED',
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
                    stroke="#7E7F90"
                    strokeWidth={2}
                    fill="url(#principalGradientCalc)"
                  />
                  <Area
                    type="monotone"
                    dataKey="interest"
                    stackId="1"
                    stroke="#0DBACC"
                    strokeWidth={2}
                    fill="url(#interestGradientCalc)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-[#E8E8ED]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#7E7F90]" />
                <span className="text-xs text-[#7E7F90]">הכסף שלך</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0DBACC]" />
                <span className="text-xs text-[#7E7F90]">רווחים</span>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-[#303150] rounded-3xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#0DBACC]" />
              <span className="text-sm font-medium text-[#BDBDCB]">התוצאה שלך</span>
            </div>

            <div>
              <p className="text-xs text-[#BDBDCB] mb-1">סך הכל אחרי {years} שנים</p>
              <p className="text-2xl font-bold text-white mb-3">
                {formatCurrency(finalData.total)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">הכסף שלך</p>
                <p className="text-sm font-semibold text-[#F7F7F8]">
                  {formatCurrency(finalData.principal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">רווחים</p>
                <p className="text-sm font-semibold text-[#0DBACC]">
                  {formatCurrency(finalData.interest)}
                </p>
              </div>
            </div>

            {interestPercentage > 0 && (
              <p className="text-xs text-[#BDBDCB] mt-3 pt-3 border-t border-white/10">
                <span className="text-[#0DBACC] font-bold">{interestPercentage}%</span> מהכסף הזה הוא רווחים!
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}


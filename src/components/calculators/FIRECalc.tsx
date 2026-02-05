'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Flame, Target, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { CurrencySlider, PercentageSlider } from '@/components/ui/Slider';
import { formatCurrency } from '@/lib/utils';
import { calculateFIRE } from '@/lib/calculations';
import Card from '@/components/ui/Card';

interface FIRECalcProps {
  className?: string;
  showHeader?: boolean;
}

export default function FIRECalc({ className = '', showHeader = false }: FIRECalcProps) {
  // Calculator inputs
  const [monthlyExpenses, setMonthlyExpenses] = useState(12000);
  const [monthlyIncome, setMonthlyIncome] = useState(20000);
  const [currentSavings, setCurrentSavings] = useState(100000);
  const [expectedReturn, setExpectedReturn] = useState(7);

  // Calculate FIRE
  const fireData = useMemo(() => {
    return calculateFIRE(monthlyExpenses, monthlyIncome, currentSavings, expectedReturn);
  }, [monthlyExpenses, monthlyIncome, currentSavings, expectedReturn]);

  // Chart data - limit to reasonable number of years
  const chartData = useMemo(() => {
    const maxYearsToShow = Math.min(fireData.yearsToFIRE + 5, 50);
    return fireData.projectedPath
      .filter(row => row.year <= maxYearsToShow)
      .map((row) => ({
        year: row.year,
        savings: row.savings,
        fireTarget: row.fireNumber,
      }));
  }, [fireData]);

  // Determine status
  const isFIREAchievable = fireData.yearsToFIRE < 100;
  const savingsRate = fireData.currentSavingsRate;

  const getStatusInfo = () => {
    if (savingsRate <= 0) {
      return { label: 'הוצאות גבוהות מהכנסות', color: '#F18AB5', tip: 'צמצם הוצאות או הגדל הכנסות' };
    }
    if (savingsRate < 20) {
      return { label: 'חיסכון נמוך', color: '#FFB84D', tip: 'נסה להגיע ל-20% חיסכון לפחות' };
    }
    if (savingsRate < 50) {
      return { label: 'חיסכון טוב', color: '#0DBACC', tip: 'אתה בדרך הנכונה!' };
    }
    return { label: 'חיסכון מצוין!', color: '#69ADFF', tip: 'אתה מרוויץ לעצמאות כלכלית' };
  };

  const status = getStatusInfo();

  return (
    <Card className={className} padding="md">
      {/* Header - optional */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#FFE5B4] rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#303150]">מחשבון עצמאות כלכלית</h2>
            <p className="text-sm text-[#7E7F90]">מתי תוכל לפרוש?</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-6 bg-[#F7F7F8] rounded-3xl p-5">
          <CurrencySlider
            label="הוצאות חודשיות"
            value={monthlyExpenses}
            min={5000}
            max={50000}
            step={1000}
            onChange={setMonthlyExpenses}
          />
          
          <CurrencySlider
            label="הכנסה חודשית"
            value={monthlyIncome}
            min={5000}
            max={100000}
            step={1000}
            onChange={setMonthlyIncome}
          />
          
          <CurrencySlider
            label="הון קיים"
            value={currentSavings}
            min={0}
            max={5000000}
            step={50000}
            onChange={setCurrentSavings}
          />
          
          <PercentageSlider
            label="תשואה שנתית צפויה"
            value={expectedReturn}
            min={0}
            max={15}
            step={0.5}
            onChange={setExpectedReturn}
          />

          {/* Status indicator */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border`}
               style={{ 
                 backgroundColor: `${status.color}10`,
                 borderColor: `${status.color}30`
               }}>
            <TrendingUp className="w-5 h-5" style={{ color: status.color }} />
            <div>
              <p className="text-sm font-medium text-[#303150]">
                {status.label}
              </p>
              <p className="text-xs text-[#7E7F90]">{status.tip}</p>
            </div>
          </div>

          {/* Quick tip */}
          <div className="flex items-start gap-2 p-3 bg-[#FFE5B4]/30 rounded-xl border border-[#FFB84D]/30">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#303150]">
              <strong>טיפ:</strong> כלל 4% - משוך 4% בשנה מההון שלך לחיים ללא עבודה.
            </p>
          </div>
        </div>

        {/* Chart & Results */}
        <div className="space-y-4">
          {/* Chart */}
          <div className="bg-[#F7F7F8] rounded-3xl p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="savingsGradientFIRE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB84D" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FFB84D" stopOpacity={0} />
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
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `₪${(value / 1000000).toFixed(1)}M`;
                      return `₪${(value / 1000).toFixed(0)}K`;
                    }}
                    width={55}
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
                      name === 'savings' ? 'הון מצטבר' : 'יעד FIRE'
                    ]}
                    labelFormatter={(label) => `שנה ${label}`}
                  />
                  {/* FIRE target line */}
                  <ReferenceLine 
                    y={fireData.fireNumber} 
                    stroke="#F18AB5" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="#FFB84D"
                    strokeWidth={2}
                    fill="url(#savingsGradientFIRE)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-[#E8E8ED]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFB84D]" />
                <span className="text-xs text-[#7E7F90]">הון מצטבר</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-[#F18AB5]" style={{ borderStyle: 'dashed' }} />
                <span className="text-xs text-[#7E7F90]">יעד FIRE</span>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-[#303150] rounded-3xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-[#FFB84D]" />
              <span className="text-sm font-medium text-[#BDBDCB]">עצמאות כלכלית</span>
            </div>

            <div>
              <p className="text-xs text-[#BDBDCB] mb-1">זמן עד עצמאות כלכלית</p>
              <p className="text-2xl font-bold text-white mb-3">
                {isFIREAchievable ? (
                  <>
                    {fireData.yearsToFIRE} שנים
                    {fireData.monthsToFIRE > 0 && (
                      <span className="text-lg"> ו-{fireData.monthsToFIRE} חודשים</span>
                    )}
                  </>
                ) : (
                  'לא ניתן להשיג'
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">סכום FIRE נדרש</p>
                <p className="text-sm font-semibold text-[#F7F7F8]">
                  {formatCurrency(fireData.fireNumber)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">אחוז חיסכון</p>
                <p className="text-sm font-semibold" style={{ color: status.color }}>
                  {fireData.currentSavingsRate}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
              <Clock className="w-3.5 h-3.5 text-[#FFB84D]" />
              <p className="text-xs text-[#BDBDCB]">
                חיסכון חודשי: <span className="text-[#FFB84D] font-bold">{formatCurrency(monthlyIncome - monthlyExpenses)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}


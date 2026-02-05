'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { GraduationCap, Target, Sparkles, TrendingUp } from 'lucide-react';
import { CurrencySlider, PercentageSlider, YearsSlider } from '@/components/ui/Slider';
import { formatCurrency } from '@/lib/utils';
import { calculateEducationFund } from '@/lib/calculations';
import Card from '@/components/ui/Card';

interface EducationFundCalcProps {
  className?: string;
  showHeader?: boolean;
}

// Custom Tooltip component for clean design
interface TooltipPayload {
  dataKey: string;
  value: number;
  color: string;
  name: string;
}

const CustomTooltip = ({ 
  active, 
  payload, 
  label 
}: { 
  active?: boolean; 
  payload?: TooltipPayload[]; 
  label?: string | number;
}) => {
  if (!active || !payload || !payload.length) return null;
  
  const nameMap: Record<string, string> = {
    deposits: 'הפקדות',
    interest: 'רווחים',
    balance: 'סה"כ',
  };
  
  return (
    <div 
      className="bg-white px-4 py-3 rounded-2xl border-0"
      style={{ 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
      dir="rtl"
    >
      <p className="font-semibold mb-2 text-sm text-[#303150]">
        שנה {label}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm py-0.5">
          <div 
            className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
            style={{ backgroundColor: entry.color }} 
          />
          <span className="text-[#7E7F90]">{nameMap[entry.dataKey] || entry.name}:</span>
          <span className="font-medium text-[#303150]">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function EducationFundCalc({ className = '', showHeader = false }: EducationFundCalcProps) {
  // Calculator inputs
  const [targetAmount, setTargetAmount] = useState(150000);
  const [yearsUntilNeeded, setYearsUntilNeeded] = useState(12);
  const [expectedReturn, setExpectedReturn] = useState(5);
  const [initialDeposit, setInitialDeposit] = useState(0);

  // Calculate education fund
  const fundData = useMemo(() => {
    return calculateEducationFund(targetAmount, yearsUntilNeeded, initialDeposit, expectedReturn);
  }, [targetAmount, yearsUntilNeeded, initialDeposit, expectedReturn]);

  // Chart data
  const chartData = useMemo(() => {
    return fundData.projectedGrowth.map((row) => ({
      year: row.year,
      balance: row.balance,
      deposits: row.deposits,
      interest: Math.max(0, row.balance - row.deposits),
    }));
  }, [fundData]);

  // Calculate Y-axis domain with padding
  const yAxisDomain = useMemo(() => {
    const maxValue = Math.max(
      ...chartData.map(d => d.deposits + d.interest)
    );
    return [0, Math.ceil(maxValue * 1.1)];
  }, [chartData]);

  const interestPercentage = fundData.totalDeposits > 0
    ? Math.round((fundData.totalInterest / (fundData.totalDeposits + fundData.totalInterest)) * 100)
    : 0;

  return (
    <Card className={className} padding="md">
      {/* Header - optional */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#FFC0DB] rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[#F18AB5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#303150]">מחשבון קרן השכלה</h2>
            <p className="text-sm text-[#7E7F90]">תכנון לימודי הילדים</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-6 bg-[#F7F7F8] rounded-3xl p-5">
          <CurrencySlider
            label="עלות לימודים צפויה"
            value={targetAmount}
            min={50000}
            max={500000}
            step={10000}
            onChange={setTargetAmount}
          />
          
          <YearsSlider
            label="שנים עד הלימודים"
            value={yearsUntilNeeded}
            min={1}
            max={25}
            onChange={setYearsUntilNeeded}
          />
          
          <PercentageSlider
            label="תשואה שנתית צפויה"
            value={expectedReturn}
            min={0}
            max={10}
            step={0.5}
            onChange={setExpectedReturn}
          />
          
          <CurrencySlider
            label="הון התחלתי קיים"
            value={initialDeposit}
            min={0}
            max={200000}
            step={5000}
            onChange={setInitialDeposit}
          />

          {/* Quick tip */}
          <div className="flex items-start gap-2 p-3 bg-[#FFC0DB]/30 rounded-xl border border-[#F18AB5]/30">
            <Sparkles className="w-4 h-4 text-[#F18AB5] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#303150]">
              <strong>טיפ:</strong> קרן השתלמות לילדים מעניקה הטבות מס משמעותיות.
            </p>
          </div>
        </div>

        {/* Chart & Results */}
        <div className="space-y-4">
          {/* Chart */}
          <div className="bg-[#F7F7F8] rounded-3xl p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="depositsGradientEdu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F18AB5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F18AB5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="interestGradientEdu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9F7FE0" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#9F7FE0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="year" 
                    padding={{ left: 30, right: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#7E7F90', fontSize: 11 }}
                  />
                  <YAxis 
                    domain={yAxisDomain}
                    allowDataOverflow={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#7E7F90', fontSize: 10, dx: -3 }}
                    tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="deposits"
                    stackId="1"
                    stroke="#F18AB5"
                    strokeWidth={2}
                    fill="url(#depositsGradientEdu)"
                  />
                  <Area
                    type="monotone"
                    dataKey="interest"
                    stackId="1"
                    stroke="#9F7FE0"
                    strokeWidth={2}
                    fill="url(#interestGradientEdu)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-[#E8E8ED]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F18AB5]" />
                <span className="text-xs text-[#7E7F90]">הפקדות</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#9F7FE0]" />
                <span className="text-xs text-[#7E7F90]">רווחים</span>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-[#303150] rounded-3xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-[#F18AB5]" />
              <span className="text-sm font-medium text-[#BDBDCB]">תוכנית חיסכון</span>
            </div>

            <div>
              <p className="text-xs text-[#BDBDCB] mb-1">הפקדה חודשית נדרשת</p>
              <p className="text-2xl font-bold text-white mb-3">
                {formatCurrency(fundData.requiredMonthlyDeposit)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">סך הפקדות</p>
                <p className="text-sm font-semibold text-[#F7F7F8]">
                  {formatCurrency(fundData.totalDeposits)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">סך רווחים</p>
                <p className="text-sm font-semibold text-[#9F7FE0]">
                  {formatCurrency(fundData.totalInterest)}
                </p>
              </div>
            </div>

            {interestPercentage > 0 && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
                <TrendingUp className="w-3.5 h-3.5 text-[#9F7FE0]" />
                <p className="text-xs text-[#BDBDCB]">
                  <span className="text-[#9F7FE0] font-bold">{interestPercentage}%</span> מהקרן הם רווחים מריבית דריבית
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}


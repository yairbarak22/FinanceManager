'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, TrendingDown, Sparkles, ArrowDownRight } from 'lucide-react';
import { CurrencySlider, PercentageSlider, YearsSlider } from '@/components/ui/Slider';
import { formatCurrency } from '@/lib/utils';
import { calculateMortgage } from '@/lib/calculations';
import Card from '@/components/ui/Card';

interface MortgageCalcProps {
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
    principal: 'קרן',
    interest: 'ריבית',
    balance: 'יתרה',
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

export default function MortgageCalc({ className = '', showHeader = false }: MortgageCalcProps) {
  // Calculator inputs
  const [loanAmount, setLoanAmount] = useState(1200000);
  const [interestRate, setInterestRate] = useState(4.5);
  const [loanTerm, setLoanTerm] = useState(25);
  const [method, setMethod] = useState<'spitzer' | 'equal_principal'>('spitzer');

  // Calculate mortgage
  const mortgageData = useMemo(() => {
    return calculateMortgage(loanAmount, interestRate, loanTerm, method);
  }, [loanAmount, interestRate, loanTerm, method]);

  // Chart data - showing principal vs interest over time
  const chartData = useMemo(() => {
    return mortgageData.amortizationSchedule.map((row) => ({
      year: row.year,
      principal: row.principal,
      interest: row.interest,
      balance: row.balance,
    }));
  }, [mortgageData]);

  // Calculate Y-axis domain with padding
  const yAxisDomain = useMemo(() => {
    const maxValue = Math.max(
      ...chartData.map(d => d.principal + d.interest)
    );
    return [0, Math.ceil(maxValue * 1.1)];
  }, [chartData]);

  const interestPercentage = mortgageData.totalPayment > 0
    ? Math.round((mortgageData.totalInterest / mortgageData.totalPayment) * 100)
    : 0;

  return (
    <Card className={className} padding="md">
      {/* Header - optional */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#E3D6FF] rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#9F7FE0]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#303150]">מחשבון משכנתא</h2>
            <p className="text-sm text-[#7E7F90]">חשב את ההחזר החודשי שלך</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-6 bg-[#F7F7F8] rounded-3xl p-5">
          <CurrencySlider
            label="סכום המשכנתא"
            value={loanAmount}
            min={100000}
            max={5000000}
            step={50000}
            onChange={setLoanAmount}
          />
          
          <PercentageSlider
            label="ריבית שנתית"
            value={interestRate}
            min={1}
            max={10}
            step={0.1}
            onChange={setInterestRate}
          />
          
          <YearsSlider
            label="תקופת ההלוואה"
            value={loanTerm}
            min={5}
            max={30}
            onChange={setLoanTerm}
          />

          {/* Repayment method toggle */}
          <div>
            <label className="block text-sm font-medium text-[#7E7F90] mb-2">
              שיטת החזר
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setMethod('spitzer')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  method === 'spitzer'
                    ? 'bg-[#69ADFF] text-white shadow-md'
                    : 'bg-white text-[#7E7F90] border border-[#E8E8ED] hover:bg-[#F7F7F8]'
                }`}
              >
                שפיצר
              </button>
              <button
                onClick={() => setMethod('equal_principal')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  method === 'equal_principal'
                    ? 'bg-[#69ADFF] text-white shadow-md'
                    : 'bg-white text-[#7E7F90] border border-[#E8E8ED] hover:bg-[#F7F7F8]'
                }`}
              >
                קרן שווה
              </button>
            </div>
          </div>

          {/* Quick tip */}
          <div className="flex items-start gap-2 p-3 bg-[#E3D6FF]/30 rounded-xl border border-[#9F7FE0]/30">
            <Sparkles className="w-4 h-4 text-[#9F7FE0] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#303150]">
              <strong>טיפ:</strong> בשפיצר התשלום קבוע, בקרן שווה התשלומים יורדים עם הזמן.
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
                    <linearGradient id="principalGradientMortgage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9F7FE0" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#9F7FE0" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="interestGradientMortgage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F18AB5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F18AB5" stopOpacity={0} />
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
                    dataKey="principal"
                    stackId="1"
                    stroke="#9F7FE0"
                    strokeWidth={2}
                    fill="url(#principalGradientMortgage)"
                  />
                  <Area
                    type="monotone"
                    dataKey="interest"
                    stackId="1"
                    stroke="#F18AB5"
                    strokeWidth={2}
                    fill="url(#interestGradientMortgage)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-[#E8E8ED]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#9F7FE0]" />
                <span className="text-xs text-[#7E7F90]">קרן</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F18AB5]" />
                <span className="text-xs text-[#7E7F90]">ריבית</span>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-[#303150] rounded-3xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-[#9F7FE0]" />
              <span className="text-sm font-medium text-[#BDBDCB]">פרטי המשכנתא</span>
            </div>

            <div>
              <p className="text-xs text-[#BDBDCB] mb-1">החזר חודשי</p>
              <p className="text-2xl font-bold text-white mb-3">
                {formatCurrency(mortgageData.monthlyPayment)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">סך כל התשלומים</p>
                <p className="text-sm font-semibold text-[#F7F7F8]">
                  {formatCurrency(mortgageData.totalPayment)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">סך הריבית</p>
                <p className="text-sm font-semibold text-[#F18AB5]">
                  {formatCurrency(mortgageData.totalInterest)}
                </p>
              </div>
            </div>

            {interestPercentage > 0 && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
                <ArrowDownRight className="w-3.5 h-3.5 text-[#F18AB5]" />
                <p className="text-xs text-[#BDBDCB]">
                  <span className="text-[#F18AB5] font-bold">{interestPercentage}%</span> מהתשלומים הולכים לריבית
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}


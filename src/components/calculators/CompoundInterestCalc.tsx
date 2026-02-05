'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, Sparkles, Building2, Briefcase, Scale } from 'lucide-react';
import { CurrencySlider, PercentageSlider, YearsSlider } from '@/components/ui/Slider';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';

interface CompoundInterestCalcProps {
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
    pensionTotal: 'קופת גמל',
    tradingTotal: 'תיק מסחר',
    principal: 'קרן',
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

interface CalculationResult {
  year: number;
  principal: number;
  totalBeforeTax: number;
  interest: number;
  capitalGainsTax: number;
  totalAfterTax: number;
  cumulativeFees: number;
}

// Calculate compound interest with fees
function calculateWithFees(
  initialDeposit: number,
  monthlyDeposit: number,
  years: number,
  annualReturn: number,
  feeRate: number,
  capitalGainsTaxRate: number
): CalculationResult[] {
  // Net return after fees
  const netAnnualReturn = annualReturn - feeRate;
  const monthlyRate = netAnnualReturn / 100 / 12;
  const feeMonthlyRate = feeRate / 100 / 12;
  
  const dataPoints: CalculationResult[] = [];
  
  for (let year = 0; year <= years; year++) {
    const months = year * 12;
    
    let totalBeforeTax: number;
    let principal: number;
    let cumulativeFees = 0;
    
    if (monthlyRate <= 0) {
      totalBeforeTax = initialDeposit + monthlyDeposit * months;
      principal = totalBeforeTax;
    } else {
      const growthFactor = Math.pow(1 + monthlyRate, months);
      const futureValueInitial = initialDeposit * growthFactor;
      const futureValueDeposits = monthlyDeposit * ((growthFactor - 1) / monthlyRate);
      totalBeforeTax = futureValueInitial + futureValueDeposits;
      principal = initialDeposit + monthlyDeposit * months;
      
      // Calculate cumulative fees (approximate)
      if (feeRate > 0) {
        const grossGrowthFactor = Math.pow(1 + (annualReturn / 100 / 12), months);
        const grossTotal = initialDeposit * grossGrowthFactor + 
          monthlyDeposit * ((grossGrowthFactor - 1) / (annualReturn / 100 / 12));
        cumulativeFees = grossTotal - totalBeforeTax;
      }
    }
    
    const interest = totalBeforeTax - principal;
    const capitalGainsTax = interest > 0 ? interest * (capitalGainsTaxRate / 100) : 0;
    const totalAfterTax = totalBeforeTax - capitalGainsTax;
    
    dataPoints.push({
      year,
      principal: Math.round(principal),
      totalBeforeTax: Math.round(totalBeforeTax),
      interest: Math.round(interest),
      capitalGainsTax: Math.round(capitalGainsTax),
      totalAfterTax: Math.round(totalAfterTax),
      cumulativeFees: Math.round(cumulativeFees),
    });
  }
  
  return dataPoints;
}

export default function CompoundInterestCalc({ className = '', showHeader = false }: CompoundInterestCalcProps) {
  // Calculator inputs
  const [initialDeposit, setInitialDeposit] = useState(50000);
  const [monthlyDeposit, setMonthlyDeposit] = useState(2000);
  const [years, setYears] = useState(20);
  const [annualReturn, setAnnualReturn] = useState(7);
  
  // Fee rates
  const [pensionFundFeeRate, setPensionFundFeeRate] = useState(0.7);
  const [tradingAccountFeeRate, setTradingAccountFeeRate] = useState(0.01);
  
  // Capital gains tax rate (fixed at 25%)
  const capitalGainsTaxRate = 25;

  // Calculate for both options
  const pensionFundData = useMemo(() => 
    calculateWithFees(initialDeposit, monthlyDeposit, years, annualReturn, pensionFundFeeRate, capitalGainsTaxRate),
    [initialDeposit, monthlyDeposit, years, annualReturn, pensionFundFeeRate]
  );

  const tradingAccountData = useMemo(() => 
    calculateWithFees(initialDeposit, monthlyDeposit, years, annualReturn, tradingAccountFeeRate, capitalGainsTaxRate),
    [initialDeposit, monthlyDeposit, years, annualReturn, tradingAccountFeeRate]
  );

  // Combined data for chart
  const chartData = useMemo(() => {
    return pensionFundData.map((pension, index) => ({
      year: pension.year,
      pensionTotal: pension.totalAfterTax,
      tradingTotal: tradingAccountData[index].totalAfterTax,
      principal: pension.principal,
    }));
  }, [pensionFundData, tradingAccountData]);

  // Calculate Y-axis domain with padding
  const yAxisDomain = useMemo(() => {
    const maxValue = Math.max(
      ...chartData.map(d => Math.max(d.pensionTotal, d.tradingTotal, d.principal))
    );
    return [0, Math.ceil(maxValue * 1.1)];
  }, [chartData]);

  const finalPension = pensionFundData[pensionFundData.length - 1];
  const finalTrading = tradingAccountData[tradingAccountData.length - 1];
  
  const difference = finalTrading.totalAfterTax - finalPension.totalAfterTax;
  const betterOption = difference > 0 ? 'trading' : difference < 0 ? 'pension' : 'equal';

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
            <p className="text-sm text-[#7E7F90]">השווה בין קופת גמל להשקעה לתיק מסחר עצמאי</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-3 bg-[#F7F7F8] rounded-3xl p-4">
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

          {/* Fee sliders section */}
          <div className="pt-3 border-t border-[#E8E8ED]">
            <p className="text-xs font-medium text-[#7E7F90] mb-3">עמלות ניהול שנתיות</p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-[#69ADFF]" />
                <span className="text-xs text-[#303150]">קופת גמל להשקעה</span>
              </div>
              <PercentageSlider
                label="עמלות קופת גמל"
                value={pensionFundFeeRate}
                min={0}
                max={2}
                step={0.05}
                onChange={setPensionFundFeeRate}
              />
              
              <div className="flex items-center gap-2 mb-1 mt-3">
                <Briefcase className="w-4 h-4 text-[#0DBACC]" />
                <span className="text-xs text-[#303150]">תיק מסחר עצמאי</span>
              </div>
              <PercentageSlider
                label="עמלות תיק מסחר"
                value={tradingAccountFeeRate}
                min={0}
                max={1}
                step={0.01}
                onChange={setTradingAccountFeeRate}
              />
            </div>
          </div>

          {/* Quick tip */}
          <div className="flex items-start gap-2 p-3 bg-[#FFE5B4]/30 rounded-xl border border-[#FFB84D]/50">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#303150]">
              <strong>טיפ:</strong> מס רווחי הון בישראל עומד על 25% מהרווחים.
            </p>
          </div>
        </div>

        {/* Chart & Results */}
        <div className="space-y-4">
          {/* Chart */}
          <div className="bg-[#F7F7F8] rounded-3xl p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="pensionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#69ADFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#69ADFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tradingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0DBACC" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0DBACC" stopOpacity={0} />
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
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `₪${(value / 1000000).toFixed(1)}M`;
                      return `₪${(value / 1000).toFixed(0)}K`;
                    }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="principal"
                    stroke="#7E7F90"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="pensionTotal"
                    stroke="#69ADFF"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="tradingTotal"
                    stroke="#0DBACC"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-[#E8E8ED]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#7E7F90]" />
                <span className="text-xs text-[#7E7F90]">קרן</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#69ADFF]" />
                <span className="text-xs text-[#7E7F90]">קופת גמל</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0DBACC]" />
                <span className="text-xs text-[#7E7F90]">תיק מסחר</span>
              </div>
            </div>
          </div>

          {/* Comparison Results */}
          <div className="grid grid-cols-2 gap-3">
            {/* Pension Fund Results */}
            <div className="bg-gradient-to-br from-[#69ADFF]/10 to-[#69ADFF]/5 rounded-2xl p-4 border border-[#69ADFF]/20">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-[#69ADFF]" />
                <span className="text-sm font-medium text-[#303150]">קופת גמל</span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-[#7E7F90]">לפני מס</p>
                  <p className="text-sm font-semibold text-[#303150]">{formatCurrency(finalPension.totalBeforeTax)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#7E7F90]">מס רווחי הון (25%)</p>
                  <p className="text-sm font-semibold text-red-500">-{formatCurrency(finalPension.capitalGainsTax)}</p>
                </div>
                <div className="pt-2 border-t border-[#69ADFF]/20">
                  <p className="text-xs text-[#7E7F90]">סה״כ אחרי מס</p>
                  <p className="text-lg font-bold text-[#69ADFF]">{formatCurrency(finalPension.totalAfterTax)}</p>
                </div>
              </div>
            </div>

            {/* Trading Account Results */}
            <div className="bg-gradient-to-br from-[#0DBACC]/10 to-[#0DBACC]/5 rounded-2xl p-4 border border-[#0DBACC]/20">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-[#0DBACC]" />
                <span className="text-sm font-medium text-[#303150]">תיק מסחר</span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-[#7E7F90]">לפני מס</p>
                  <p className="text-sm font-semibold text-[#303150]">{formatCurrency(finalTrading.totalBeforeTax)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#7E7F90]">מס רווחי הון (25%)</p>
                  <p className="text-sm font-semibold text-red-500">-{formatCurrency(finalTrading.capitalGainsTax)}</p>
                </div>
                <div className="pt-2 border-t border-[#0DBACC]/20">
                  <p className="text-xs text-[#7E7F90]">סה״כ אחרי מס</p>
                  <p className="text-lg font-bold text-[#0DBACC]">{formatCurrency(finalTrading.totalAfterTax)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary & Recommendation */}
          <div className="bg-[#303150] rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-[#0DBACC]" />
              <span className="text-sm font-medium text-[#BDBDCB]">סיכום והשוואה</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-[#BDBDCB]">קרן (ההון שלך)</p>
                <p className="text-sm font-semibold text-[#F7F7F8]">{formatCurrency(finalPension.principal)}</p>
              </div>
              <div>
                <p className="text-xs text-[#BDBDCB]">הפרש בין האופציות</p>
                <p className={`text-sm font-semibold ${difference > 0 ? 'text-[#0DBACC]' : difference < 0 ? 'text-[#69ADFF]' : 'text-white'}`}>
                  {difference > 0 ? '+' : ''}{formatCurrency(Math.abs(difference))}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              {betterOption === 'equal' ? (
                <p className="text-xs text-[#BDBDCB]">
                  שתי האופציות שוות
                </p>
              ) : (
                <p className="text-xs text-[#BDBDCB]">
                  <span className={betterOption === 'trading' ? 'text-[#0DBACC]' : 'text-[#69ADFF]'} style={{ fontWeight: 'bold' }}>
                    {betterOption === 'trading' ? 'תיק מסחר עצמאי' : 'קופת גמל להשקעה'}
                  </span>
                  {' '}משתלם יותר ב-{formatCurrency(Math.abs(difference))} אחרי {years} שנים
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

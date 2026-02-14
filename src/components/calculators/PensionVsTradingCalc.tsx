'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Sparkles, Building2, Briefcase, Scale, Edit2, ArrowLeft, MessageSquare } from 'lucide-react';
import { CurrencySlider, PercentageSlider, YearsSlider } from '@/components/ui/Slider';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';

interface PensionVsTradingCalcProps {
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
    tradingTotal: 'מסחר עצמאי',
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

interface MonthlyCalculation {
  month: number;
  pensionBalance: number;
  tradingBalance: number;
}

// Calculate monthly balances for both scenarios
function calculateMonthlyBalances(
  initialInvestment: number,
  monthlyDeposit: number,
  years: number,
  annualReturn: number,
  pensionManagementFee: number,
  pensionDepositFee: number,
  tradingTER: number,
  tradingTransactionFee: number
): MonthlyCalculation[] {
  const totalMonths = years * 12;
  const monthlyReturn = annualReturn / 100 / 12;
  const monthlyPensionFee = pensionManagementFee / 100 / 12;
  const monthlyTradingTER = tradingTER / 100 / 12;
  
  const results: MonthlyCalculation[] = [];
  
  let pensionBalance = initialInvestment;
  let tradingBalance = initialInvestment;
  
  // Add initial state
  results.push({
    month: 0,
    pensionBalance: initialInvestment,
    tradingBalance: initialInvestment,
  });
  
  for (let month = 1; month <= totalMonths; month++) {
    // Pension fund calculation
    // Balance = (Balance_prev + Deposit) × (1 + Return/12) × (1 - MngFee/12)
    const pensionDepositAfterFee = monthlyDeposit * (1 - pensionDepositFee / 100);
    pensionBalance = (pensionBalance + pensionDepositAfterFee) * (1 + monthlyReturn) * (1 - monthlyPensionFee);
    
    // Trading account calculation
    // Balance = (Balance_prev + Deposit - TransactionFee) × (1 + (Return - TER)/12)
    const netMonthlyReturn = monthlyReturn - monthlyTradingTER;
    tradingBalance = (tradingBalance + monthlyDeposit - tradingTransactionFee) * (1 + netMonthlyReturn);
    
    results.push({
      month,
      pensionBalance: Math.round(pensionBalance),
      tradingBalance: Math.round(tradingBalance),
    });
  }
  
  return results;
}

export default function PensionVsTradingCalc({ className = '', showHeader = false }: PensionVsTradingCalcProps) {
  // Calculator inputs
  const [initialInvestment, setInitialInvestment] = useState(1000);
  const [monthlyDeposit, setMonthlyDeposit] = useState(500);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [investmentYears, setInvestmentYears] = useState(20);
  
  // Fee parameters
  const [pensionManagementFee, setPensionManagementFee] = useState(0.7);
  const [pensionDepositFee, setPensionDepositFee] = useState(0);
  const [tradingTER, setTradingTER] = useState(0.07);
  const [tradingTransactionFee, setTradingTransactionFee] = useState(10);
  const [tradingCustodyFee, setTradingCustodyFee] = useState(0);
  
  // UI state
  const [showFeeEditor, setShowFeeEditor] = useState(false);
  
  // Calculate monthly balances
  const monthlyData = useMemo(() => {
    return calculateMonthlyBalances(
      initialInvestment,
      monthlyDeposit,
      investmentYears,
      annualReturn,
      pensionManagementFee,
      pensionDepositFee,
      tradingTER,
      tradingTransactionFee
    );
  }, [initialInvestment, monthlyDeposit, investmentYears, annualReturn, pensionManagementFee, pensionDepositFee, tradingTER, tradingTransactionFee]);
  
  // Chart data - yearly points
  const chartData = useMemo(() => {
    const yearlyData = [];
    for (let year = 0; year <= investmentYears; year++) {
      const monthIndex = year * 12;
      if (monthIndex < monthlyData.length) {
        const pension = monthlyData[monthIndex].pensionBalance;
        const trading = monthlyData[monthIndex].tradingBalance;
        yearlyData.push({
          year,
          pensionTotal: pension,
          tradingTotal: trading,
          difference: trading - pension, // For area visualization
        });
      }
    }
    return yearlyData;
  }, [monthlyData, investmentYears]);
  
  // Calculate Y-axis domain with padding
  const yAxisDomain = useMemo(() => {
    const maxValue = Math.max(
      ...chartData.map(d => Math.max(d.pensionTotal, d.tradingTotal))
    );
    return [0, Math.ceil(maxValue * 1.1)];
  }, [chartData]);
  
  const finalPension = monthlyData[monthlyData.length - 1]?.pensionBalance || 0;
  const finalTrading = monthlyData[monthlyData.length - 1]?.tradingBalance || 0;
  const difference = finalTrading - finalPension;
  
  // Handle CTA buttons
  const handlePrimaryCTA = () => {
    // Open contact form or redirect
    window.location.href = '/contact?subject=פתיחת תיק מסחר עצמאי';
  };
  
  const handleSecondaryCTA = () => {
    // Open contact form
    window.location.href = '/contact?subject=ייעוץ על מעבר לקופת גמל';
  };
  
  return (
    <Card className={className} padding="md">
      {/* Header - optional */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#B4F1F1] rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#0DBACC]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#303150]">קופת גמל מול מסחר עצמאי</h2>
            <p className="text-sm text-[#7E7F90]">השווה בין קופת גמל להשקעה לתיק מסחר עצמאי</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-3 bg-[#F7F7F8] rounded-3xl p-4">
          <CurrencySlider
            label="סכום השקעה ראשוני"
            value={initialInvestment}
            min={0}
            max={1000000}
            step={1000}
            onChange={setInitialInvestment}
          />
          
          <CurrencySlider
            label="הפקדה חודשית"
            value={monthlyDeposit}
            min={500}
            max={50000}
            step={100}
            onChange={setMonthlyDeposit}
          />
          
          <PercentageSlider
            label="תשואה שנתית צפויה"
            value={annualReturn}
            min={0}
            max={15}
            step={0.5}
            onChange={setAnnualReturn}
          />
          
          <YearsSlider
            label="טווח השקעה"
            value={investmentYears}
            min={5}
            max={30}
            onChange={setInvestmentYears}
          />

          {/* Fee Editor Section */}
          <div className="pt-3 border-t border-[#E8E8ED]">
            <button
              onClick={() => setShowFeeEditor(!showFeeEditor)}
              className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-[#E8E8ED] hover:border-[#0DBACC] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#0DBACC]" />
                <span className="text-sm font-medium text-[#303150]">ערוך עמלות</span>
              </div>
              <span className="text-xs text-[#7E7F90]">{showFeeEditor ? 'הסתר' : 'הצג'}</span>
            </button>
            
            {showFeeEditor && (
              <div className="mt-3 space-y-4 bg-white rounded-xl p-4 border border-[#E8E8ED]">
                {/* Comparison Table */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-[#303150] mb-3">השוואת פרמטרים</h4>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-2 pb-2 border-b border-[#E8E8ED]">
                      <div className="font-medium text-[#7E7F90]">פרמטר</div>
                      <div className="font-medium text-[#7E7F90] text-center">קופת גמל</div>
                      <div className="font-medium text-[#7E7F90] text-center">מסחר עצמאי</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#303150]">דמי ניהול מצבירה</div>
                      <div className="text-center">
                        <input
                          type="number"
                          value={pensionManagementFee}
                          onChange={(e) => setPensionManagementFee(Number(e.target.value))}
                          step="0.1"
                          min="0"
                          max="5"
                          className="w-full px-2 py-1 text-center border border-[#E8E8ED] rounded-lg text-xs"
                        />
                        <span className="text-[#7E7F90] text-[10px]">%</span>
                      </div>
                      <div className="text-center text-[#7E7F90]">0%</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#303150]">דמי ניהול מהפקדה</div>
                      <div className="text-center">
                        <input
                          type="number"
                          value={pensionDepositFee}
                          onChange={(e) => setPensionDepositFee(Number(e.target.value))}
                          step="0.1"
                          min="0"
                          max="5"
                          className="w-full px-2 py-1 text-center border border-[#E8E8ED] rounded-lg text-xs"
                        />
                        <span className="text-[#7E7F90] text-[10px]">%</span>
                      </div>
                      <div className="text-center text-[#7E7F90]">0%</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#303150]">עלות קרן סל (TER)</div>
                      <div className="text-center text-[#7E7F90]">כלול בדמי הניהול</div>
                      <div className="text-center">
                        <input
                          type="number"
                          value={tradingTER}
                          onChange={(e) => setTradingTER(Number(e.target.value))}
                          step="0.01"
                          min="0"
                          max="1"
                          className="w-full px-2 py-1 text-center border border-[#E8E8ED] rounded-lg text-xs"
                        />
                        <span className="text-[#7E7F90] text-[10px]">%</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#303150]">עמלות קנייה/מכירה</div>
                      <div className="text-center text-[#7E7F90]">0 ₪</div>
                      <div className="text-center">
                        <input
                          type="number"
                          value={tradingTransactionFee}
                          onChange={(e) => setTradingTransactionFee(Number(e.target.value))}
                          step="1"
                          min="0"
                          max="50"
                          className="w-full px-2 py-1 text-center border border-[#E8E8ED] rounded-lg text-xs"
                        />
                        <span className="text-[#7E7F90] text-[10px]">₪</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-[#303150]">דמי טיפול/משמרת</div>
                      <div className="text-center text-[#7E7F90]">0 ₪</div>
                      <div className="text-center text-[#7E7F90]">0 ₪</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick tip */}
          <div className="flex items-start gap-2 p-3 bg-[#B4F1F1]/30 rounded-xl border border-[#0DBACC]/50">
            <Sparkles className="w-4 h-4 text-[#0DBACC] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#303150]">
              <strong>טיפ:</strong> עמלות קטנות יכולות להצטבר לסכומים גדולים לאורך זמן.
            </p>
          </div>
        </div>

        {/* Chart & Results */}
        <div className="space-y-4">
          {/* Main Result */}
          {Math.abs(difference) > 100 && (
            <div className={`bg-gradient-to-br rounded-3xl p-6 text-white text-center ${
              difference > 0 
                ? 'from-[#0DBACC] to-[#0DBACC]/80' 
                : 'from-[#7E7F90] to-[#7E7F90]/80'
            }`}>
              {difference > 0 ? (
                <>
                  <p className="text-sm mb-2 opacity-90">במסחר עצמאי יהיו לך בעוד {investmentYears} שנים</p>
                  <p className="text-3xl font-bold">{formatCurrency(Math.abs(difference))} יותר</p>
                  <p className="text-sm mt-2 opacity-90">מאשר בקופת גמל!</p>
                </>
              ) : (
                <>
                  <p className="text-sm mb-2 opacity-90">בקופת גמל יהיו לך בעוד {investmentYears} שנים</p>
                  <p className="text-3xl font-bold">{formatCurrency(Math.abs(difference))} יותר</p>
                  <p className="text-sm mt-2 opacity-90">מאשר במסחר עצמאי</p>
                </>
              )}
            </div>
          )}
          
          {/* Chart */}
          <div className="bg-[#F7F7F8] rounded-3xl p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="pensionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7E7F90" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7E7F90" stopOpacity={0} />
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
                  {/* Area showing the difference (money lost to fees) */}
                  {difference > 0 && (
                    <Area
                      type="monotone"
                      dataKey="pensionTotal"
                      stroke="none"
                      fill="#7E7F90"
                      fillOpacity={0.15}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="pensionTotal"
                    stroke="#7E7F90"
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
                  {/* Area between lines to highlight the difference */}
                  {difference > 0 && (
                    <Area
                      type="monotone"
                      dataKey="tradingTotal"
                      stroke="none"
                      fill="url(#tradingGradient)"
                      fillOpacity={0.25}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-[#E8E8ED]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#7E7F90]" />
                <span className="text-xs text-[#7E7F90]">קופת גמל</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0DBACC]" />
                <span className="text-xs text-[#7E7F90]">מסחר עצמאי</span>
              </div>
            </div>
          </div>

          {/* Comparison Results */}
          <div className="grid grid-cols-2 gap-3">
            {/* Pension Fund Results */}
            <div className="bg-gradient-to-br from-[#7E7F90]/10 to-[#7E7F90]/5 rounded-2xl p-4 border border-[#7E7F90]/20">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-[#7E7F90]" />
                <span className="text-sm font-medium text-[#303150]">קופת גמל</span>
              </div>
              <div>
                <p className="text-xs text-[#7E7F90] mb-1">סה״כ אחרי {investmentYears} שנים</p>
                <p className="text-xl font-bold text-[#7E7F90]">{formatCurrency(finalPension)}</p>
              </div>
            </div>

            {/* Trading Account Results */}
            <div className="bg-gradient-to-br from-[#0DBACC]/10 to-[#0DBACC]/5 rounded-2xl p-4 border border-[#0DBACC]/20">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-[#0DBACC]" />
                <span className="text-sm font-medium text-[#303150]">מסחר עצמאי</span>
              </div>
              <div>
                <p className="text-xs text-[#7E7F90] mb-1">סה״כ אחרי {investmentYears} שנים</p>
                <p className="text-xl font-bold text-[#0DBACC]">{formatCurrency(finalTrading)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-gradient-to-br from-[#B4F1F1]/30 to-[#0DBACC]/10 rounded-2xl p-5 border border-[#0DBACC]/20">
          <h3 className="text-base font-semibold text-[#303150] mb-2">זה לא מסובך כמו שחשבת</h3>
          <p className="text-sm text-[#7E7F90] leading-relaxed">
            לפתוח תיק לוקח 10 דקות דיגיטלית. לקנות קרן מחקה מדד לוקח דקה אחת בחודש. אין צורך 'לסחור' או להבין בגרפים.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-[#FFE5B4]/30 to-[#FFB84D]/10 rounded-2xl p-5 border border-[#FFB84D]/20">
          <h3 className="text-base font-semibold text-[#303150] mb-2">אפקט הריבית דריבית השלילי</h3>
          <p className="text-sm text-[#7E7F90] leading-relaxed">
            כשאתה משלם 0.7% דמי ניהול, אתה לא משלם רק על השנה הנוכחית. אתה מפסיד את התשואה שהכסף הזה היה עושה במשך 20 שנה. זה כמו כדור שלג שפועל נגדך.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-[#E3D6FF]/30 to-[#9F7FE0]/10 rounded-2xl p-5 border border-[#9F7FE0]/20">
          <h3 className="text-base font-semibold text-[#303150] mb-2">שליטה מלאה בכסף</h3>
          <p className="text-sm text-[#7E7F90] leading-relaxed">
            הכסף נזיל תמיד, אין קנסות משיכה, ואתה בוחר בדיוק במה להשקיע. אתה לא תלוי בהחלטות של מנהל קרן.
          </p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="mt-6 space-y-3">
        <button
          onClick={handlePrimaryCTA}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0DBACC] to-[#69ADFF] hover:from-[#0CA5B5] hover:to-[#5A9EE6] text-white px-6 py-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <span>אני רוצה לפתוח תיק מסחר עצמאי ולקבל הטבת MyNeto</span>
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleSecondaryCTA}
          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-[#0DBACC] text-[#0DBACC] hover:bg-[#0DBACC]/5 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200"
        >
          <MessageSquare className="w-4 h-4" />
          <span>צריך עזרה? דברו עם מומחה שלנו להסבר על המעבר</span>
        </button>
      </div>
    </Card>
  );
}


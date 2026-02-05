'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Home, Scale, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CurrencySlider, PercentageSlider, YearsSlider } from '@/components/ui/Slider';
import { formatCurrency } from '@/lib/utils';
import { calculateBuyVsRent } from '@/lib/calculations';
import Card from '@/components/ui/Card';

interface BuyVsRentCalcProps {
  className?: string;
  showHeader?: boolean;
}

export default function BuyVsRentCalc({ className = '', showHeader = false }: BuyVsRentCalcProps) {
  // Calculator inputs
  const [propertyPrice, setPropertyPrice] = useState(2000000);
  const [monthlyRent, setMonthlyRent] = useState(5500);
  const [downPaymentPercent, setDownPaymentPercent] = useState(25);
  const [mortgageRate, setMortgageRate] = useState(4.5);
  const [propertyAppreciation, setPropertyAppreciation] = useState(3);

  // Calculate comparison
  const comparisonData = useMemo(() => {
    return calculateBuyVsRent(
      propertyPrice,
      monthlyRent,
      downPaymentPercent,
      mortgageRate,
      25, // mortgage years
      propertyAppreciation,
      2.5, // rent increase
      1, // maintenance
      7, // alternative return
      30 // years to project
    );
  }, [propertyPrice, monthlyRent, downPaymentPercent, mortgageRate, propertyAppreciation]);

  // Chart data
  const chartData = useMemo(() => {
    return comparisonData.projectedCosts.map((row) => ({
      year: row.year,
      buying: row.buyingCost,
      renting: row.rentingCost,
      equity: row.buyingEquity,
    }));
  }, [comparisonData]);

  // Recommendation styling
  const getRecommendationStyle = () => {
    switch (comparisonData.recommendation) {
      case 'buy':
        return { color: '#0DBACC', label: 'מומלץ לקנות', icon: Home };
      case 'rent':
        return { color: '#F18AB5', label: 'מומלץ לשכור', icon: Home };
      default:
        return { color: '#7E7F90', label: 'תלוי בנסיבות', icon: Scale };
    }
  };

  const recommendation = getRecommendationStyle();
  const RecommendationIcon = recommendation.icon;

  return (
    <Card className={className} padding="md">
      {/* Header - optional */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#FFC0DB] rounded-xl flex items-center justify-center">
            <Home className="w-5 h-5 text-[#F18AB5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#303150]">קנייה מול שכירות</h2>
            <p className="text-sm text-[#7E7F90]">האם משתלם לקנות או לשכור?</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-6 bg-[#F7F7F8] rounded-3xl p-5">
          <CurrencySlider
            label="מחיר הדירה"
            value={propertyPrice}
            min={500000}
            max={10000000}
            step={100000}
            onChange={setPropertyPrice}
          />
          
          <CurrencySlider
            label="שכירות חודשית"
            value={monthlyRent}
            min={2000}
            max={20000}
            step={500}
            onChange={setMonthlyRent}
          />
          
          <PercentageSlider
            label="הון עצמי"
            value={downPaymentPercent}
            min={10}
            max={50}
            step={5}
            onChange={setDownPaymentPercent}
          />
          
          <PercentageSlider
            label="ריבית משכנתא"
            value={mortgageRate}
            min={2}
            max={8}
            step={0.25}
            onChange={setMortgageRate}
          />
          
          <PercentageSlider
            label="עליית מחירי נדל״ן (שנתי)"
            value={propertyAppreciation}
            min={0}
            max={8}
            step={0.5}
            onChange={setPropertyAppreciation}
          />

          {/* Quick tip */}
          <div className="flex items-start gap-2 p-3 bg-[#FFC0DB]/30 rounded-xl border border-[#F18AB5]/30">
            <Sparkles className="w-4 h-4 text-[#F18AB5] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#303150]">
              <strong>טיפ:</strong> השוואה זו כוללת עלות הזדמנות על ההון העצמי.
            </p>
          </div>
        </div>

        {/* Chart & Results */}
        <div className="space-y-4">
          {/* Chart */}
          <div className="bg-[#F7F7F8] rounded-3xl p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                      name === 'buying' ? 'עלות קנייה' : name === 'renting' ? 'עלות שכירות' : 'הון בנכס'
                    ]}
                    labelFormatter={(label) => `שנה ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="buying"
                    stroke="#0DBACC"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="renting"
                    stroke="#F18AB5"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke="#69ADFF"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-[#E8E8ED]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0DBACC]" />
                <span className="text-xs text-[#7E7F90]">עלות קנייה</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F18AB5]" />
                <span className="text-xs text-[#7E7F90]">עלות שכירות</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-[#69ADFF]" />
                <span className="text-xs text-[#7E7F90]">הון בנכס</span>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-[#303150] rounded-3xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-[#69ADFF]" />
              <span className="text-sm font-medium text-[#BDBDCB]">תוצאת ההשוואה</span>
            </div>

            {/* Recommendation */}
            <div className="flex items-center gap-2 mb-3">
              <RecommendationIcon className="w-5 h-5" style={{ color: recommendation.color }} />
              <p className="text-xl font-bold" style={{ color: recommendation.color }}>
                {recommendation.label}
              </p>
            </div>

            <div>
              <p className="text-xs text-[#BDBDCB] mb-1">נקודת איזון</p>
              <p className="text-lg font-semibold text-white mb-3">
                {comparisonData.breakEvenYears ? (
                  `${comparisonData.breakEvenYears} שנים`
                ) : (
                  'לא נמצאה ב-30 שנים'
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">הון עצמי נדרש</p>
                <p className="text-sm font-semibold text-[#F7F7F8]">
                  {formatCurrency(propertyPrice * (downPaymentPercent / 100))}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">החזר משכנתא חודשי</p>
                <p className="text-sm font-semibold text-[#0DBACC]">
                  {formatCurrency(Math.round(
                    (propertyPrice * (1 - downPaymentPercent / 100)) * 
                    (mortgageRate / 100 / 12 * Math.pow(1 + mortgageRate / 100 / 12, 300)) / 
                    (Math.pow(1 + mortgageRate / 100 / 12, 300) - 1)
                  ))}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#69ADFF]" />
              <p className="text-xs text-[#BDBDCB]">
                יחס מחיר/שכירות: <span className="text-[#69ADFF] font-bold">
                  {Math.round(propertyPrice / (monthlyRent * 12))}
                </span> שנים
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}


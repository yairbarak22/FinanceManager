'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Shield, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';
import { CurrencySlider } from '@/components/ui/Slider';
import Slider from '@/components/ui/Slider';
import { formatCurrency } from '@/lib/utils';
import { calculateEmergencyFund } from '@/lib/calculations';
import Card from '@/components/ui/Card';

interface EmergencyFundCalcProps {
  className?: string;
  showHeader?: boolean;
}

// Months slider component
function MonthsSlider({
  label,
  value,
  min = 1,
  max = 24,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Slider
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      suffix=" חודשים"
    />
  );
}

export default function EmergencyFundCalc({ className = '', showHeader = false }: EmergencyFundCalcProps) {
  // Calculator inputs
  const [monthlyExpenses, setMonthlyExpenses] = useState(15000);
  const [monthsOfSecurity, setMonthsOfSecurity] = useState(6);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Calculate emergency fund
  const fundData = useMemo(() => {
    return calculateEmergencyFund(monthlyExpenses, monthsOfSecurity);
  }, [monthlyExpenses, monthsOfSecurity]);

  // Chart colors matching design system
  const COLORS = ['#69ADFF', '#0DBACC', '#9F7FE0', '#F18AB5', '#FFB84D', '#BDBDCB'];

  // Add id to categories for hover state
  const categoriesWithId = useMemo(() => {
    return fundData.categories.map((cat, index) => ({
      ...cat,
      id: `cat-${index}`,
      color: COLORS[index % COLORS.length],
    }));
  }, [fundData.categories]);

  // Security level indicator
  const getSecurityLevel = () => {
    if (monthsOfSecurity <= 3) return { label: 'בסיסי', color: '#FFB84D', icon: AlertTriangle };
    if (monthsOfSecurity <= 6) return { label: 'טוב', color: '#0DBACC', icon: CheckCircle2 };
    return { label: 'מצוין', color: '#69ADFF', icon: Shield };
  };

  const securityLevel = getSecurityLevel();
  const SecurityIcon = securityLevel.icon;

  return (
    <Card className={className} padding="md">
      {/* Header - optional */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#B4F1F1] rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#0DBACC]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#303150]">מחשבון קרן חירום</h2>
            <p className="text-sm text-[#7E7F90]">כמה לשמור לימים גשומים?</p>
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
          
          <MonthsSlider
            label="חודשי ביטחון"
            value={monthsOfSecurity}
            min={1}
            max={24}
            onChange={setMonthsOfSecurity}
          />

          {/* Security level indicator */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border`}
               style={{ 
                 backgroundColor: `${securityLevel.color}10`,
                 borderColor: `${securityLevel.color}30`
               }}>
            <SecurityIcon className="w-5 h-5" style={{ color: securityLevel.color }} />
            <div>
              <p className="text-sm font-medium text-[#303150]">
                רמת ביטחון: <span style={{ color: securityLevel.color }}>{securityLevel.label}</span>
              </p>
              <p className="text-xs text-[#7E7F90]">
                {monthsOfSecurity <= 3 && 'מומלץ להגדיל ל-6 חודשים לפחות'}
                {monthsOfSecurity > 3 && monthsOfSecurity <= 6 && 'רמה מומלצת לרוב האנשים'}
                {monthsOfSecurity > 6 && 'ביטחון גבוה במיוחד'}
              </p>
            </div>
          </div>

          {/* Quick tip */}
          <div className="flex items-start gap-2 p-3 bg-[#B4F1F1]/30 rounded-xl border border-[#0DBACC]/30">
            <Sparkles className="w-4 h-4 text-[#0DBACC] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#303150]">
              <strong>טיפ:</strong> שמור את קרן החירום בחשבון עו"ש נפרד או פיקדון נזיל לנגישות מיידית.
            </p>
          </div>
        </div>

        {/* Chart & Results */}
        <div className="space-y-4">
          {/* Pie Chart - Expense breakdown */}
          <div className="bg-[#F7F7F8] rounded-3xl p-4">
            <p className="text-sm font-medium text-[#303150] mb-2 text-center">פילוח הוצאות משוער</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesWithId}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={55}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {categoriesWithId.map((entry) => {
                      const isHovered = hoveredItemId === entry.id;
                      return (
                        <Cell
                          key={entry.id}
                          fill={entry.color}
                          style={{
                            filter: isHovered 
                              ? `drop-shadow(0 0 8px ${entry.color}66)` 
                              : 'none',
                            transform: isHovered 
                              ? 'scale(1.07)' 
                              : 'scale(1)',
                            transformOrigin: 'center',
                            transition: 'all 250ms ease-out',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={() => setHoveredItemId(entry.id)}
                          onMouseLeave={() => setHoveredItemId(null)}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {categoriesWithId.map((category) => (
                <button
                  key={category.id}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200 ${
                    hoveredItemId === category.id ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                  }`}
                  onMouseEnter={() => setHoveredItemId(category.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-xs text-[#7E7F90]">{category.name}</span>
                  {hoveredItemId === category.id && (
                    <span className="text-xs font-medium text-[#303150]">
                      {formatCurrency(category.amount)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-[#303150] rounded-3xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#0DBACC]" />
              <span className="text-sm font-medium text-[#BDBDCB]">קרן חירום מומלצת</span>
            </div>

            <div>
              <p className="text-xs text-[#BDBDCB] mb-1">סכום מומלץ</p>
              <p className="text-2xl font-bold text-white mb-3">
                {formatCurrency(fundData.recommendedAmount)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">הוצאות חודשיות</p>
                <p className="text-sm font-semibold text-[#F7F7F8]">
                  {formatCurrency(monthlyExpenses)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">חודשי כיסוי</p>
                <p className="text-sm font-semibold text-[#0DBACC]">
                  {monthsOfSecurity} חודשים
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-[#BDBDCB]">
                הקרן תכסה את ההוצאות שלך ב-<span className="text-[#0DBACC] font-bold">{monthsOfSecurity}</span> חודשים ללא הכנסה
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}


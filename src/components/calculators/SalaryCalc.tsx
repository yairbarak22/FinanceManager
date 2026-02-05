'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Wallet, Sparkles, Percent } from 'lucide-react';
import { CurrencySlider } from '@/components/ui/Slider';
import Slider from '@/components/ui/Slider';
import { formatCurrency } from '@/lib/utils';
import { calculateSalaryBreakdown } from '@/lib/calculations';
import Card from '@/components/ui/Card';

interface SalaryCalcProps {
  className?: string;
  showHeader?: boolean;
}

// Credit points slider
function CreditPointsSlider({
  label,
  value,
  min = 0,
  max = 10,
  step = 0.25,
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
      suffix=" נק'"
    />
  );
}

export default function SalaryCalc({ className = '', showHeader = false }: SalaryCalcProps) {
  // Calculator inputs
  const [grossSalary, setGrossSalary] = useState(15000);
  const [creditPoints, setCreditPoints] = useState(2.25);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Calculate salary breakdown
  const salaryData = useMemo(() => {
    return calculateSalaryBreakdown(grossSalary, creditPoints);
  }, [grossSalary, creditPoints]);

  // Pie chart data
  const pieData = useMemo(() => {
    return [
      { id: 'net', name: 'שכר נטו', value: salaryData.netSalary, color: '#0DBACC' },
      { id: 'tax', name: 'מס הכנסה', value: salaryData.incomeTax, color: '#F18AB5' },
      { id: 'national', name: 'ביטוח לאומי', value: salaryData.nationalInsurance, color: '#69ADFF' },
      { id: 'health', name: 'ביטוח בריאות', value: salaryData.healthInsurance, color: '#9F7FE0' },
    ].filter(item => item.value > 0);
  }, [salaryData]);

  // Get tax status color
  const getTaxStatusColor = () => {
    if (salaryData.effectiveTaxRate < 15) return '#0DBACC';
    if (salaryData.effectiveTaxRate < 25) return '#69ADFF';
    if (salaryData.effectiveTaxRate < 35) return '#FFB84D';
    return '#F18AB5';
  };

  return (
    <Card className={className} padding="md">
      {/* Header - optional */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#C1DDFF] rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#69ADFF]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#303150]">מחשבון נטו/ברוטו</h2>
            <p className="text-sm text-[#7E7F90]">חשב את השכר נטו מהברוטו</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-6 bg-[#F7F7F8] rounded-3xl p-5">
          <CurrencySlider
            label="שכר ברוטו"
            value={grossSalary}
            min={5000}
            max={100000}
            step={500}
            onChange={setGrossSalary}
          />
          
          <CreditPointsSlider
            label="נקודות זיכוי"
            value={creditPoints}
            min={0}
            max={10}
            step={0.25}
            onChange={setCreditPoints}
          />

          {/* Common credit points */}
          <div>
            <p className="text-xs text-[#7E7F90] mb-2">נקודות זיכוי נפוצות:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'גבר רווק', value: 2.25 },
                { label: 'אישה רווקה', value: 2.75 },
                { label: 'הורה יחיד', value: 3.75 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setCreditPoints(preset.value)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                    creditPoints === preset.value
                      ? 'bg-[#69ADFF] text-white'
                      : 'bg-white text-[#7E7F90] border border-[#E8E8ED] hover:bg-[#F7F7F8]'
                  }`}
                >
                  {preset.label} ({preset.value})
                </button>
              ))}
            </div>
          </div>

          {/* Tax brackets info */}
          <div className="bg-white rounded-xl p-3 border border-[#E8E8ED]">
            <p className="text-xs font-medium text-[#303150] mb-2">מדרגות מס 2024:</p>
            <div className="space-y-1 text-xs text-[#7E7F90]">
              <div className="flex justify-between">
                <span>עד ₪7,010</span>
                <span>10%</span>
              </div>
              <div className="flex justify-between">
                <span>₪7,010 - ₪10,060</span>
                <span>14%</span>
              </div>
              <div className="flex justify-between">
                <span>₪10,060 - ₪16,150</span>
                <span>20%</span>
              </div>
              <div className="flex justify-between">
                <span>₪16,150 - ₪22,440</span>
                <span>31%</span>
              </div>
              <div className="flex justify-between">
                <span>מעל ₪22,440</span>
                <span>35%+</span>
              </div>
            </div>
          </div>

          {/* Quick tip */}
          <div className="flex items-start gap-2 p-3 bg-[#C1DDFF]/30 rounded-xl border border-[#69ADFF]/30">
            <Sparkles className="w-4 h-4 text-[#69ADFF] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#303150]">
              <strong>טיפ:</strong> כל נקודת זיכוי שווה ₪242 הפחתה במס בחודש.
            </p>
          </div>
        </div>

        {/* Chart & Results */}
        <div className="space-y-4">
          {/* Pie Chart */}
          <div className="bg-[#F7F7F8] rounded-3xl p-4">
            <p className="text-sm font-medium text-[#303150] mb-2 text-center">פילוח השכר</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={55}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {pieData.map((entry) => {
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
              {pieData.map((item) => (
                <button
                  key={item.id}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200 ${
                    hoveredItemId === item.id ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                  }`}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-[#7E7F90]">{item.name}</span>
                  {hoveredItemId === item.id && (
                    <span className="text-xs font-medium text-[#303150]">
                      {formatCurrency(item.value)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-[#303150] rounded-3xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-[#0DBACC]" />
              <span className="text-sm font-medium text-[#BDBDCB]">חישוב שכר</span>
            </div>

            <div>
              <p className="text-xs text-[#BDBDCB] mb-1">שכר נטו</p>
              <p className="text-2xl font-bold text-[#0DBACC] mb-3">
                {formatCurrency(salaryData.netSalary)}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#BDBDCB]">מס הכנסה</span>
                <span className="text-sm font-semibold text-[#F18AB5]">
                  -{formatCurrency(salaryData.incomeTax)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#BDBDCB]">ביטוח לאומי</span>
                <span className="text-sm font-semibold text-[#69ADFF]">
                  -{formatCurrency(salaryData.nationalInsurance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#BDBDCB]">ביטוח בריאות</span>
                <span className="text-sm font-semibold text-[#9F7FE0]">
                  -{formatCurrency(salaryData.healthInsurance)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">סה"כ ניכויים</p>
                <p className="text-sm font-semibold text-[#F7F7F8]">
                  {formatCurrency(salaryData.totalDeductions)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#BDBDCB] mb-0.5">מס אפקטיבי</p>
                <p className="text-sm font-semibold" style={{ color: getTaxStatusColor() }}>
                  {salaryData.effectiveTaxRate}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
              <Percent className="w-3.5 h-3.5 text-[#FFB84D]" />
              <p className="text-xs text-[#BDBDCB]">
                מס שולי: <span className="text-[#FFB84D] font-bold">{salaryData.marginalTaxRate}%</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}


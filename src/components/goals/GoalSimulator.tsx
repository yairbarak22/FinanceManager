'use client';

import { useState, useMemo } from 'react';
import { 
  Plane, 
  Car, 
  Home, 
  GraduationCap, 
  Umbrella, 
  PiggyBank,
  Shield,
  Plus,
  TrendingUp,
  Edit3,
  Check,
  TrendingDown,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { 
  calculateMonthlyContribution, 
  calculateProjectionWithInterest,
  calculateMonthlyContributionWithInterest,
  yearsToMonths,
} from '@/lib/goalCalculations';
import Card from '@/components/ui/Card';
import GoalCreationInfoModal from './GoalCreationInfoModal';

const GOAL_CATEGORIES = [
  { id: 'saving', label: 'חיסכון כללי', icon: PiggyBank },
  { id: 'home', label: 'דירה / בית', icon: Home },
  { id: 'car', label: 'רכב', icon: Car },
  { id: 'travel', label: 'נסיעות', icon: Plane },
  { id: 'education', label: 'לימודים', icon: GraduationCap },
  { id: 'vacation', label: 'חופשה', icon: Umbrella },
  { id: 'emergency', label: 'קרן חירום', icon: Shield },
  { id: 'custom', label: 'מותאם אישית', icon: Edit3 },
];

interface GoalSimulatorProps {
  onCreateGoal: (goal: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    category: string;
    icon: string;
    investInPortfolio?: boolean;
    expectedInterestRate?: number;
  }) => Promise<void> | void;
  isCreating?: boolean;
  onSuccess?: () => void;
}

export default function GoalSimulator({ onCreateGoal, isCreating, onSuccess }: GoalSimulatorProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(200000);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [years, setYears] = useState(5);
  const [category, setCategory] = useState('saving');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Portfolio investment state
  const [investInPortfolio, setInvestInPortfolio] = useState(false);
  const [expectedInterestRate, setExpectedInterestRate] = useState(8);
  
  // Info modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Editable target amount state
  const [isEditingTargetAmount, setIsEditingTargetAmount] = useState(false);
  const [editingTargetAmount, setEditingTargetAmount] = useState('');
  
  // Time unit state (years or months)
  const [timeUnit, setTimeUnit] = useState<'years' | 'months'>('years');
  const [months, setMonths] = useState(60); // 5 years default
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editingTime, setEditingTime] = useState('');
  
  // Calculate deadline from years or months
  const deadline = useMemo(() => {
    const date = new Date();
    if (timeUnit === 'months') {
      date.setMonth(date.getMonth() + months);
    } else {
      date.setFullYear(date.getFullYear() + years);
    }
    return date.toISOString();
  }, [years, months, timeUnit]);
  
  // Get effective months for calculations
  const effectiveMonths = useMemo(() => {
    return timeUnit === 'months' ? months : yearsToMonths(years);
  }, [timeUnit, months, years]);
  
  // Calculate monthly contribution (with or without interest)
  const monthlyContribution = useMemo(() => {
    if (investInPortfolio && expectedInterestRate > 0) {
      return calculateMonthlyContributionWithInterest(
        targetAmount,
        currentAmount,
        expectedInterestRate,
        effectiveMonths
      );
    }
    return calculateMonthlyContribution(targetAmount, currentAmount, deadline);
  }, [targetAmount, currentAmount, deadline, effectiveMonths, investInPortfolio, expectedInterestRate]);
  
  // Calculate monthly contribution without interest for comparison
  const monthlyContributionWithoutInterest = useMemo(() => {
    return calculateMonthlyContribution(targetAmount, currentAmount, deadline);
  }, [targetAmount, currentAmount, deadline]);
  
  // Calculate projection data for chart (includes both with and without interest)
  const projectionData = useMemo(() => {
    const data = calculateProjectionWithInterest(
      currentAmount,
      monthlyContribution,
      Math.min(effectiveMonths, 60),
      investInPortfolio ? expectedInterestRate : 0
    );
    // Sample to max 12 points for cleaner chart
    const step = Math.max(1, Math.floor(data.length / 12));
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [currentAmount, monthlyContribution, effectiveMonths, investInPortfolio, expectedInterestRate]);
  
  // Calculate savings from using interest
  const monthlySavings = useMemo(() => {
    if (!investInPortfolio) return 0;
    return Math.max(0, monthlyContributionWithoutInterest - monthlyContribution);
  }, [monthlyContributionWithoutInterest, monthlyContribution, investInPortfolio]);
  
  const handleSubmit = () => {
    if (!name.trim()) return;
    if (category === 'custom' && !customCategory.trim()) return;
    
    // Show info modal first
    setShowInfoModal(true);
  };
  
  const handleConfirmCreate = async () => {
    const finalCategory = category === 'custom' && customCategory.trim() 
      ? customCategory.trim() 
      : category;
    
    try {
      await onCreateGoal({
        name: name.trim(),
        targetAmount,
        currentAmount,
        deadline,
        category: finalCategory,
        icon: category === 'custom' ? 'custom' : category,
        investInPortfolio,
        expectedInterestRate: investInPortfolio ? expectedInterestRate : undefined,
      });
      
      // Close modal and reset form on success
      setShowInfoModal(false);
      setName('');
      setTargetAmount(200000);
      setCurrentAmount(0);
      setYears(5);
      setMonths(60);
      setTimeUnit('years');
      setCategory('saving');
      setCustomCategory('');
      setShowCustomInput(false);
      setInvestInPortfolio(false);
      setExpectedInterestRate(8);
      
      // Call success callback
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error creating goal:', error);
    }
  };

  const handleCategorySelect = (catId: string) => {
    setCategory(catId);
    if (catId === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomCategory('');
    }
  };
  
  // Handle target amount editing
  const handleTargetAmountClick = () => {
    setEditingTargetAmount(targetAmount.toString());
    setIsEditingTargetAmount(true);
  };
  
  const handleTargetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^\d]/g, '');
    setEditingTargetAmount(value);
  };
  
  const handleTargetAmountBlur = () => {
    const value = Number(editingTargetAmount);
    if (value >= 500 && value <= 2000000) {
      setTargetAmount(value);
    }
    setIsEditingTargetAmount(false);
  };
  
  const handleTargetAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTargetAmountBlur();
    } else if (e.key === 'Escape') {
      setIsEditingTargetAmount(false);
    }
  };
  
  // Handle time editing
  const handleTimeClick = () => {
    const currentValue = timeUnit === 'months' ? months : years;
    setEditingTime(currentValue.toString());
    setIsEditingTime(true);
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setEditingTime(value);
  };
  
  const handleTimeBlur = () => {
    const value = Number(editingTime);
    if (timeUnit === 'months') {
      if (value >= 1 && value <= 360) {
        setMonths(value);
        // Also update years to match
        setYears(Math.round(value / 12));
      }
    } else {
      if (value >= 1 && value <= 30) {
        setYears(value);
        setMonths(value * 12);
      }
    }
    setIsEditingTime(false);
  };
  
  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTimeBlur();
    } else if (e.key === 'Escape') {
      setIsEditingTime(false);
    }
  };
  
  // Handle time unit toggle
  const handleTimeUnitChange = (unit: 'years' | 'months') => {
    if (unit !== timeUnit) {
      setTimeUnit(unit);
      if (unit === 'months') {
        setMonths(years * 12);
      } else {
        setYears(Math.round(months / 12) || 1);
      }
    }
  };
  
  const selectedCategory = GOAL_CATEGORIES.find(c => c.id === category);
  const CategoryIcon = selectedCategory?.icon || PiggyBank;

  return (
    <Card className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)' }}
        >
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 
            className="text-xl font-bold"
            style={{ 
              color: '#303150',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          >
            סימולטור יעדים
          </h2>
          <p style={{ color: '#7E7F90', fontSize: '0.875rem' }}>
            תכנן את היעד הפיננסי שלך
          </p>
        </div>
      </div>
      
      {/* Top row - Name and Initial Amount */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Left - Goal name */}
        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: '#7E7F90' }}
          >
            שם היעד
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: קניית דירה לילד"
            className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#69ADFF]"
            style={{ 
              borderColor: '#E8E8ED',
              color: '#303150',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          />
        </div>
        
        {/* Right - Initial amount */}
        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: '#7E7F90' }}
          >
            סכום התחלתי
          </label>
          <div className="relative">
            <span 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: '#7E7F90' }}
            >
              ₪
            </span>
            <input
              type="number"
              min={0}
              max={targetAmount}
              step={1}
              value={currentAmount || ''}
              onChange={(e) => setCurrentAmount(Math.min(Number(e.target.value), targetAmount))}
              placeholder="0"
              className="w-full py-3 pl-8 pr-20 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#69ADFF] tabular-nums"
              style={{ 
                borderColor: '#E8E8ED',
                color: '#303150',
                textAlign: 'right',
                direction: 'ltr',
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Second row - Category on left; Amounts/Sliders on right */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Left side - Category */}
        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: '#7E7F90' }}
          >
            קטגוריה
          </label>
          <div className="grid grid-cols-4 gap-2">
            {GOAL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all"
                  style={{
                    backgroundColor: isSelected ? 'rgba(105, 173, 255, 0.15)' : '#F7F7F8',
                    border: isSelected ? '2px solid #69ADFF' : '2px solid transparent',
                  }}
                >
                  <Icon 
                    className="w-5 h-5"
                    style={{ color: isSelected ? '#69ADFF' : '#7E7F90' }}
                  />
                  <span 
                    className="text-xs text-center"
                    style={{ color: isSelected ? '#69ADFF' : '#7E7F90' }}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
          {showCustomInput && (
            <div className="mt-3">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="הזן קטגוריה מותאמת אישית"
                className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#69ADFF]"
                style={{ 
                  borderColor: '#E8E8ED',
                  color: '#303150',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
              />
            </div>
          )}
        </div>
        
        {/* Right side - Amounts/Sliders */}
        <div className="space-y-4">
          {/* Target amount slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label 
                className="text-sm font-medium"
                style={{ color: '#7E7F90' }}
              >
                סכום היעד
              </label>
              {isEditingTargetAmount ? (
                <div className="relative">
                  <span 
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-medium"
                    style={{ color: '#7E7F90' }}
                  >
                    ₪
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editingTargetAmount}
                    onChange={handleTargetAmountChange}
                    onBlur={handleTargetAmountBlur}
                    onKeyDown={handleTargetAmountKeyDown}
                    autoFocus
                    className="w-32 py-1 pl-6 pr-2 text-lg font-bold tabular-nums rounded-lg border-2 text-left focus:outline-none"
                    style={{ 
                      borderColor: '#69ADFF',
                      color: '#303150',
                      direction: 'ltr',
                    }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleTargetAmountClick}
                  className="text-lg font-bold tabular-nums px-2 py-1 rounded-lg transition-all hover:bg-[#F7F7F8] cursor-pointer"
                  style={{ color: '#303150' }}
                  title="לחץ לעריכה ידנית"
                >
                  {formatCurrency(targetAmount)}
                </button>
              )}
            </div>
            <input
              type="range"
              min={5000}
              max={2000000}
              step={5000}
              value={targetAmount}
              onChange={(e) => setTargetAmount(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to left, #69ADFF 0%, #69ADFF ${((targetAmount - 5000) / (2000000 - 5000)) * 100}%, #F7F7F8 ${((targetAmount - 5000) / (2000000 - 5000)) * 100}%, #F7F7F8 100%)`,
              }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: '#BDBDCB' }}>
              <span>₪5,000</span>
              <span>₪2,000,000</span>
            </div>
          </div>
          
          {/* Time slider with toggle */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <label 
                  className="text-sm font-medium"
                  style={{ color: '#7E7F90' }}
                >
                  טווח זמן
                </label>
                {/* Toggle between years and months */}
                <div 
                  className="flex rounded-lg p-0.5"
                  style={{ backgroundColor: '#F7F7F8' }}
                >
                  <button
                    type="button"
                    onClick={() => handleTimeUnitChange('years')}
                    className="px-2 py-0.5 text-xs rounded-md transition-all"
                    style={{
                      backgroundColor: timeUnit === 'years' ? 'white' : 'transparent',
                      color: timeUnit === 'years' ? '#303150' : '#7E7F90',
                      boxShadow: timeUnit === 'years' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    שנים
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTimeUnitChange('months')}
                    className="px-2 py-0.5 text-xs rounded-md transition-all"
                    style={{
                      backgroundColor: timeUnit === 'months' ? 'white' : 'transparent',
                      color: timeUnit === 'months' ? '#303150' : '#7E7F90',
                      boxShadow: timeUnit === 'months' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    חודשים
                  </button>
                </div>
              </div>
              {isEditingTime ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={editingTime}
                  onChange={handleTimeChange}
                  onBlur={handleTimeBlur}
                  onKeyDown={handleTimeKeyDown}
                  autoFocus
                  className="w-20 py-1 px-2 text-lg font-bold tabular-nums rounded-lg border-2 text-center focus:outline-none"
                  style={{ 
                    borderColor: '#69ADFF',
                    color: '#303150',
                    direction: 'ltr',
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={handleTimeClick}
                  className="text-lg font-bold tabular-nums px-2 py-1 rounded-lg transition-all hover:bg-[#F7F7F8] cursor-pointer"
                  style={{ color: '#303150' }}
                  title="לחץ לעריכה ידנית"
                >
                  {timeUnit === 'months' ? `${months} חודשים` : `${years} שנים`}
                </button>
              )}
            </div>
            {timeUnit === 'years' ? (
              <>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={years}
                  onChange={(e) => {
                    const newYears = Number(e.target.value);
                    setYears(newYears);
                    setMonths(newYears * 12);
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to left, #69ADFF 0%, #69ADFF ${((years - 1) / 29) * 100}%, #F7F7F8 ${((years - 1) / 29) * 100}%, #F7F7F8 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: '#BDBDCB' }}>
                  <span>שנה</span>
                  <span>30 שנים</span>
                </div>
              </>
            ) : (
              <>
                <input
                  type="range"
                  min={1}
                  max={360}
                  step={1}
                  value={months}
                  onChange={(e) => {
                    const newMonths = Number(e.target.value);
                    setMonths(newMonths);
                    setYears(Math.round(newMonths / 12) || 1);
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to left, #69ADFF 0%, #69ADFF ${((months - 1) / 359) * 100}%, #F7F7F8 ${((months - 1) / 359) * 100}%, #F7F7F8 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: '#BDBDCB' }}>
                  <span>חודש</span>
                  <span>360 חודשים</span>
                </div>
              </>
            )}
          </div>
          
          {/* Portfolio Investment Checkbox */}
          <div 
            className="rounded-xl p-4 transition-all"
            style={{ 
              backgroundColor: investInPortfolio ? 'rgba(13, 186, 204, 0.08)' : '#F7F7F8',
              border: investInPortfolio ? '2px solid #0DBACC' : '2px solid transparent',
            }}
          >
            <button
              type="button"
              onClick={() => setInvestInPortfolio(!investInPortfolio)}
              className="w-full flex items-center gap-3"
            >
              <div 
                className="w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0"
                style={{
                  backgroundColor: investInPortfolio ? '#0DBACC' : 'white',
                  border: investInPortfolio ? 'none' : '2px solid #BDBDCB',
                }}
              >
                {investInPortfolio && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 text-right">
                <p 
                  className="text-sm font-medium"
                  style={{ color: investInPortfolio ? '#0DBACC' : '#303150' }}
                >
                  הפקדה לתיק מסחר עצמאי
                </p>
                <p 
                  className="text-xs"
                  style={{ color: '#7E7F90' }}
                >
                  השקעה עם ריבית דריבית צפויה
                </p>
              </div>
              <TrendingUp 
                className="w-5 h-5 flex-shrink-0"
                style={{ color: investInPortfolio ? '#0DBACC' : '#BDBDCB' }}
              />
            </button>
            
            {/* Interest Rate Slider - shown when portfolio investment is enabled */}
            {investInPortfolio && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(13, 186, 204, 0.2)' }}>
                <div className="flex justify-between items-center mb-2">
                  <label 
                    className="text-sm font-medium"
                    style={{ color: '#0DBACC' }}
                  >
                    ריבית צפויה שנתית
                  </label>
                  <span 
                    className="text-lg font-bold tabular-nums"
                    style={{ color: '#0DBACC' }}
                  >
                    {expectedInterestRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={20}
                  step={0.5}
                  value={expectedInterestRate}
                  onChange={(e) => setExpectedInterestRate(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to left, #0DBACC 0%, #0DBACC ${((expectedInterestRate - 4) / 16) * 100}%, rgba(13, 186, 204, 0.2) ${((expectedInterestRate - 4) / 16) * 100}%, rgba(13, 186, 204, 0.2) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: '#7E7F90' }}>
                  <span>4%</span>
                  <span>20%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom section - Summary & Chart side by side, then Button */}
      <div className="space-y-4">
        {/* Summary and Chart in one row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Summary - Monthly contribution */}
          <div 
            className="rounded-2xl p-4"
            style={{ backgroundColor: investInPortfolio ? 'rgba(13, 186, 204, 0.08)' : '#F7F7F8' }}
          >
            <p 
              className="text-xs mb-1"
              style={{ color: '#7E7F90' }}
            >
              הפרשה חודשית נדרשת
            </p>
            <div 
              className="text-2xl font-bold tabular-nums mb-1"
              style={{ 
                color: investInPortfolio ? '#0DBACC' : '#303150',
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              }}
            >
              {formatCurrency(monthlyContribution)}
            </div>
            <p 
              className="text-xs"
              style={{ color: '#7E7F90' }}
            >
              למשך {effectiveMonths} חודשים ({Math.round(effectiveMonths / 12 * 10) / 10} שנים)
            </p>
            
            {/* Savings indicator when using portfolio */}
            {investInPortfolio && monthlySavings > 0 && (
              <div 
                className="mt-2 pt-2 border-t flex items-center gap-2"
                style={{ borderColor: 'rgba(13, 186, 204, 0.2)' }}
              >
                <TrendingDown className="w-4 h-4" style={{ color: '#0DBACC' }} />
                <p className="text-xs" style={{ color: '#0DBACC' }}>
                  חיסכון של {formatCurrency(monthlySavings)} בחודש עם ריבית {expectedInterestRate}%
                </p>
              </div>
            )}
          </div>
          
          {/* Chart */}
          <div 
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#F7F7F8' }}
          >
            <div className="flex items-center justify-between mb-2">
              <p 
                className="text-xs"
                style={{ color: '#7E7F90' }}
              >
                תחזית חיסכון
              </p>
              {investInPortfolio && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#69ADFF' }} />
                    <span className="text-xs" style={{ color: '#7E7F90' }}>ללא ריבית</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0DBACC' }} />
                    <span className="text-xs" style={{ color: '#7E7F90' }}>עם ריבית</span>
                  </div>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={projectionData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="goalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#69ADFF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#69ADFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0DBACC" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0DBACC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {/* Base value (without interest) */}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#69ADFF"
                  strokeWidth={2}
                  fill="url(#goalGradient)"
                />
                {/* Value with interest - shown on top when portfolio is enabled */}
                {investInPortfolio && (
                  <Area
                    type="monotone"
                    dataKey="valueWithInterest"
                    stroke="#0DBACC"
                    strokeWidth={2}
                    fill="url(#interestGradient)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Action button */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || (category === 'custom' && !customCategory.trim()) || isCreating}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: (name.trim() && (category !== 'custom' || customCategory.trim())) ? '#69ADFF' : '#BDBDCB',
            color: 'white',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          {isCreating ? 'יוצר יעד...' : 'הוסף יעד'}
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      {/* Info Modal */}
      <GoalCreationInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        onConfirm={handleConfirmCreate}
        goalName={name.trim()}
        monthlyContribution={monthlyContribution}
        isCreating={isCreating}
      />
    </Card>
  );
}


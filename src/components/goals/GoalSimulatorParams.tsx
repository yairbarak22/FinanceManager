'use client';

import { useRef } from 'react';
import { Check, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CurrencySlider, PercentageSlider } from '@/components/ui/Slider';
import Slider from '@/components/ui/Slider';

interface GoalSimulatorParamsProps {
  targetAmount: number;
  onTargetAmountChange: (value: number) => void;
  currentAmount: number;
  onCurrentAmountChange: (value: number) => void;
  years: number;
  months: number;
  timeUnit: 'years' | 'months';
  onYearsChange: (value: number) => void;
  onMonthsChange: (value: number) => void;
  onTimeUnitChange: (unit: 'years' | 'months') => void;
  investInPortfolio: boolean;
  onInvestChange: (value: boolean) => void;
  expectedInterestRate: number;
  onRateChange: (value: number) => void;
}

export default function GoalSimulatorParams({
  targetAmount,
  onTargetAmountChange,
  currentAmount,
  onCurrentAmountChange,
  years,
  months,
  timeUnit,
  onYearsChange,
  onMonthsChange,
  onTimeUnitChange,
  investInPortfolio,
  onInvestChange,
  expectedInterestRate,
  onRateChange,
}: GoalSimulatorParamsProps) {
  const currentAmountRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const interestRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, delay = 100) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, delay);
  };

  const handleCurrentAmountBlur = () => {
    scrollTo(timeRef);
  };

  const handleInvestToggle = (value: boolean) => {
    onInvestChange(value);
    if (value) {
      scrollTo(interestRef, 400);
    }
  };

  return (
    <div className="space-y-6">
      {/* A. Target Amount */}
      <div
        onPointerUp={() => scrollTo(currentAmountRef, 200)}
      >
        <CurrencySlider
          label="סכום היעד"
          value={targetAmount}
          min={5000}
          max={2000000}
          step={5000}
          onChange={onTargetAmountChange}
        />
      </div>

      {/* B. Initial Amount */}
      <div ref={currentAmountRef}>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: '#7E7F90' }}
        >
          סכום התחלתי
        </label>
        <div className="relative">
          <span
            className="absolute end-4 top-1/2 -translate-y-1/2 text-sm"
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
            onChange={(e) => onCurrentAmountChange(Math.min(Number(e.target.value), targetAmount))}
            onBlur={handleCurrentAmountBlur}
            placeholder="0"
            className="w-full py-3 pe-10 ps-4 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#69ADFF] tabular-nums hide-spinner"
            style={{
              borderColor: '#E8E8ED',
              color: '#303150',
              textAlign: 'right',
              direction: 'ltr',
            }}
          />
        </div>
      </div>

      {/* C. Time Slider */}
      <div
        ref={timeRef}
        onPointerUp={() => scrollTo(portfolioRef, 200)}
      >
        {/* Segmented toggle */}
        <div className="flex items-center gap-2 mb-2">
          <label
            className="text-sm font-medium"
            style={{ color: '#7E7F90' }}
          >
            טווח זמן
          </label>
          <div
            className="flex rounded-lg p-0.5"
            style={{ backgroundColor: '#F7F7F8' }}
          >
            <button
              type="button"
              onClick={() => onTimeUnitChange('years')}
              className="px-2.5 py-1 text-xs rounded-md transition-all"
              style={{
                backgroundColor: timeUnit === 'years' ? 'white' : 'transparent',
                color: timeUnit === 'years' ? '#303150' : '#7E7F90',
                boxShadow: timeUnit === 'years' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              שנים
            </button>
            <button
              type="button"
              onClick={() => onTimeUnitChange('months')}
              className="px-2.5 py-1 text-xs rounded-md transition-all"
              style={{
                backgroundColor: timeUnit === 'months' ? 'white' : 'transparent',
                color: timeUnit === 'months' ? '#303150' : '#7E7F90',
                boxShadow: timeUnit === 'months' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              חודשים
            </button>
          </div>
        </div>

        {timeUnit === 'years' ? (
          <Slider
            label=""
            value={years}
            min={1}
            max={30}
            step={1}
            onChange={(val) => {
              onYearsChange(val);
              onMonthsChange(val * 12);
            }}
            suffix=" שנים"
          />
        ) : (
          <Slider
            label=""
            value={months}
            min={1}
            max={360}
            step={1}
            onChange={(val) => {
              onMonthsChange(val);
              onYearsChange(Math.round(val / 12) || 1);
            }}
            suffix=" חודשים"
          />
        )}
      </div>

      {/* D. Portfolio Investment Toggle */}
      <div
        ref={portfolioRef}
        className="rounded-xl p-5 transition-all duration-300"
        style={{
          backgroundColor: investInPortfolio ? 'rgba(13, 186, 204, 0.06)' : '#F7F7F8',
          border: investInPortfolio
            ? '1.5px solid rgba(13, 186, 204, 0.25)'
            : '1.5px solid transparent',
        }}
      >
        <button
          type="button"
          onClick={() => handleInvestToggle(!investInPortfolio)}
          className="w-full flex items-center gap-3"
        >
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0"
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

        {/* Interest rate slider - slides in */}
        <AnimatePresence>
          {investInPortfolio && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div ref={interestRef} className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(13, 186, 204, 0.2)' }}>
                <PercentageSlider
                  label="ריבית צפויה שנתית"
                  value={expectedInterestRate}
                  min={4}
                  max={20}
                  step={0.5}
                  onChange={onRateChange}
                  color="#0DBACC"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  suffix?: string;
  prefix?: string;
}

export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  suffix = '',
  prefix = '',
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const displayValue = formatValue 
    ? formatValue(value) 
    : `${prefix}${value.toLocaleString('he-IL')}${suffix}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-lg font-bold text-slate-900 tabular-nums">{displayValue}</span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-indigo-500
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-all
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:hover:shadow-lg
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-indigo-500
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-indigo-500
            focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(to left, #6366f1 0%, #6366f1 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
          }}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>
      
      <div className="flex justify-between text-xs text-slate-400">
        <span>{formatValue ? formatValue(min) : `${prefix}${min.toLocaleString('he-IL')}${suffix}`}</span>
        <span>{formatValue ? formatValue(max) : `${prefix}${max.toLocaleString('he-IL')}${suffix}`}</span>
      </div>
    </div>
  );
}

// Currency-specific slider
export function CurrencySlider({
  label,
  value,
  min,
  max,
  step = 1000,
  onChange,
}: Omit<SliderProps, 'formatValue' | 'prefix' | 'suffix'>) {
  return (
    <Slider
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      formatValue={(v) => formatCurrency(v)}
    />
  );
}

// Percentage slider
export function PercentageSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 0.5,
  onChange,
}: Omit<SliderProps, 'formatValue' | 'prefix' | 'suffix'>) {
  return (
    <Slider
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      suffix="%"
    />
  );
}

// Years slider
export function YearsSlider({
  label,
  value,
  min = 1,
  max = 50,
  step = 1,
  onChange,
}: Omit<SliderProps, 'formatValue' | 'prefix' | 'suffix'>) {
  return (
    <Slider
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      suffix=" שנים"
    />
  );
}


'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { Pencil } from 'lucide-react';
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
  editable?: boolean;
  color?: string;
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
  editable = true,
  color = '#69ADFF',
}: SliderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const sliderId = useId();

  const percentage = ((value - min) / (max - min)) * 100;

  const displayValue = formatValue 
    ? formatValue(value) 
    : `${prefix}${value.toLocaleString('he-IL')}${suffix}`;

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEditClick = () => {
    if (!editable) return;
    setEditingValue(value.toString());
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (/^-?\d*\.?\d*$/.test(newValue) || newValue === '') {
      setEditingValue(newValue);
    }
  };

  const saveEditValue = () => {
    let newValue = parseFloat(editingValue) || 0;
    // Apply min/max constraints
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    onChange(newValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveEditValue();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#7E7F90]">{label}</label>
        {isEditing ? (
          <div className="relative">
            {suffix && (
              <span 
                className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-medium text-[#7E7F90]"
              >
                {suffix}
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={editingValue}
              onChange={handleInputChange}
              onBlur={saveEditValue}
              onKeyDown={handleKeyDown}
              className="w-32 py-1 pl-6 pr-2 text-lg font-bold tabular-nums rounded-lg border-2 text-left focus:outline-none"
              style={{
                borderColor: color,
                color: '#303150',
                direction: 'ltr',
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleEditClick}
            className={`group text-lg font-bold text-[#303150] tabular-nums px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              editable ? 'hover:bg-[#F7F7F8] cursor-pointer' : ''
            }`}
            title={editable ? 'לחץ לעריכה ידנית' : undefined}
            disabled={!editable}
          >
            {displayValue}
            {editable && (
              <Pencil className="w-3 h-3 text-[#BDBDCB] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            )}
          </button>
        )}
      </div>
      
      <div className="relative">
        <style dangerouslySetInnerHTML={{ __html: `
          [data-slider-id="${sliderId}"]::-webkit-slider-thumb { border-color: ${color} !important; }
          [data-slider-id="${sliderId}"]::-moz-range-thumb { border-color: ${color} !important; }
          [data-slider-id="${sliderId}"]:focus-visible { --tw-ring-color: ${color}; }
        `}} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          data-slider-id={sliderId}
          className="w-full h-2 bg-[#E8E8ED] rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
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
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(to left, ${color} 0%, ${color} ${percentage}%, #E8E8ED ${percentage}%, #E8E8ED 100%)`,
          }}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>
      
      <div className="flex justify-between text-xs text-[#BDBDCB]">
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
  color,
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
      color={color}
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
  color,
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
      color={color}
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
  color,
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
      color={color}
    />
  );
}


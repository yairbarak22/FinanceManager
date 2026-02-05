'use client';

import { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface EditableNumberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  formatValue?: (value: number) => string;
  parseValue?: (str: string) => number;
  className?: string;
  suffix?: string;
  prefix?: string;
  isCurrency?: boolean;
  isPercentage?: boolean;
}

/**
 * Parses a formatted number string back to a number
 * Handles currency formatting, commas, and special characters
 */
function parseNumberString(str: string): number {
  // Remove currency symbol, commas, spaces, and any non-numeric characters except minus and dot
  const cleaned = str
    .replace(/[₪$€,\s]/g, '')
    .replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

export default function EditableNumber({
  value,
  onChange,
  min,
  max,
  formatValue,
  parseValue,
  className = '',
  suffix,
  prefix,
  isCurrency = false,
  isPercentage = false,
}: EditableNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Format the display value
  const getDisplayValue = (): string => {
    if (formatValue) return formatValue(value);
    if (isCurrency) return formatCurrency(value);
    if (isPercentage) return `${value}%`;
    return value.toLocaleString('he-IL');
  };

  // Parse the edited value
  const getParsedValue = (str: string): number => {
    if (parseValue) return parseValue(str);
    return parseNumberString(str);
  };

  // Handle click to start editing
  const handleClick = () => {
    // For editing, show raw number without formatting
    setEditingValue(value.toString());
    setIsEditing(true);
  };

  // Handle input change - only allow numbers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow only numbers, minus, and decimal point
    if (/^-?\d*\.?\d*$/.test(newValue) || newValue === '') {
      setEditingValue(newValue);
    }
  };

  // Handle blur - save the value
  const handleBlur = () => {
    saveValue();
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveValue();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // Save the value and exit editing mode
  const saveValue = () => {
    let newValue = getParsedValue(editingValue);
    
    // Apply min/max constraints
    if (min !== undefined && newValue < min) newValue = min;
    if (max !== undefined && newValue > max) newValue = max;
    
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative inline-block">
        {prefix && (
          <span 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-medium"
            style={{ color: '#7E7F90' }}
          >
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editingValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-32 py-1 px-2 text-lg font-bold tabular-nums rounded-lg border-2 text-left focus:outline-none ${className}`}
          style={{ 
            borderColor: '#69ADFF',
            color: '#303150',
            direction: 'ltr',
            paddingLeft: suffix ? '1.5rem' : '0.5rem',
            paddingRight: prefix ? '1.5rem' : '0.5rem',
          }}
        />
        {suffix && (
          <span 
            className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-medium"
            style={{ color: '#7E7F90' }}
          >
            {suffix}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`text-lg font-bold tabular-nums px-2 py-1 rounded-lg transition-all hover:bg-[#F7F7F8] cursor-pointer ${className}`}
      style={{ color: '#303150' }}
      title="לחץ לעריכה ידנית"
    >
      {getDisplayValue()}
    </button>
  );
}


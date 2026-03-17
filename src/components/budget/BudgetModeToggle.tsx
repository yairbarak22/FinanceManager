'use client';

import React from 'react';

interface BudgetModeToggleProps {
  isPassover: boolean;
  onChange: (isPassover: boolean) => void;
}

export default function BudgetModeToggle({ isPassover, onChange }: BudgetModeToggleProps) {
  return (
    <div
      className="inline-flex rounded-xl p-1 gap-0.5"
      style={{
        background: '#F7F7F8',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <button
        onClick={() => onChange(false)}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
        style={{
          background: !isPassover ? '#FFFFFF' : 'transparent',
          color: !isPassover ? '#303150' : '#7E7F90',
          boxShadow: !isPassover ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        תקציב שוטף
      </button>
      <button
        onClick={() => onChange(true)}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
        style={{
          background: isPassover ? '#FFFFFF' : 'transparent',
          color: isPassover ? '#303150' : '#7E7F90',
          boxShadow: isPassover ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        היערכות לפסח 🍷
      </button>
    </div>
  );
}

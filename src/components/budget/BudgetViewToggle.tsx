'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { List, PieChart } from 'lucide-react';

export type BudgetViewMode = 'list' | 'visual';

interface BudgetViewToggleProps {
  mode: BudgetViewMode;
  onChange: (mode: BudgetViewMode) => void;
}

const MODES: { key: BudgetViewMode; label: string; Icon: typeof List }[] = [
  { key: 'list', label: 'רשימה', Icon: List },
  { key: 'visual', label: 'ויזואלי', Icon: PieChart },
];

export default function BudgetViewToggle({ mode, onChange }: BudgetViewToggleProps) {
  return (
    <div
      className="relative flex rounded-xl p-1 mx-auto w-fit"
      style={{ backgroundColor: '#F7F7F8' }}
      role="tablist"
      aria-label="בחר תצוגה"
    >
      {MODES.map(({ key, label, Icon }) => {
        const isActive = mode === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className="relative z-10 flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: isActive ? '#303150' : '#7E7F90',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="budget-view-indicator"
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {label}
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.75} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

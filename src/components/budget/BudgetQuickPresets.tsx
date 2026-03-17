'use client';

import React, { useState, useCallback } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { PESACH_QUICK_PRESETS, type QuickBudgetPreset } from '@/lib/budgetQuickPresets';
import { CategoryInfo } from '@/lib/categories';

interface BudgetQuickPresetsProps {
  existingBudgetCategoryIds: Set<string>;
  customCategories: CategoryInfo[];
  onAddPreset: (preset: QuickBudgetPreset) => Promise<void>;
}

export default function BudgetQuickPresets({
  existingBudgetCategoryIds,
  customCategories,
  onAddPreset,
}: BudgetQuickPresetsProps) {
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  const isPresetAlreadyAdded = useCallback(
    (preset: QuickBudgetPreset) => {
      const customMatch = customCategories.find(
        c => c.nameHe === preset.nameHe || c.name === preset.nameHe
      );
      if (customMatch && existingBudgetCategoryIds.has(customMatch.id)) return true;
      return false;
    },
    [customCategories, existingBudgetCategoryIds]
  );

  const availablePresets = PESACH_QUICK_PRESETS.filter(p => !isPresetAlreadyAdded(p));

  if (availablePresets.length === 0) return null;

  const handleClick = async (preset: QuickBudgetPreset) => {
    if (loadingPreset) return;
    setLoadingPreset(preset.nameHe);
    try {
      await onAddPreset(preset);
    } finally {
      setLoadingPreset(null);
    }
  };

  return (
    <div
      className="flex items-center gap-3 flex-wrap py-3 px-1"
      style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
    >
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-[#69ADFF]" strokeWidth={1.75} />
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#7E7F90' }}>
          תקציבים מהירים לפסח:
        </span>
      </div>

      {availablePresets.map((preset) => {
        const isLoading = loadingPreset === preset.nameHe;
        return (
          <button
            key={preset.nameHe}
            onClick={() => handleClick(preset)}
            disabled={!!loadingPreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: isLoading ? '#F7F7F8' : '#FFFFFF',
              border: '1px solid #E8E8ED',
              color: '#303150',
            }}
            onMouseEnter={e => {
              if (!loadingPreset) {
                e.currentTarget.style.borderColor = '#69ADFF';
                e.currentTarget.style.background = 'rgba(105,173,255,0.06)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E8E8ED';
              e.currentTarget.style.background = isLoading ? '#F7F7F8' : '#FFFFFF';
            }}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 text-[#69ADFF] animate-spin" strokeWidth={2} />
            ) : (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: preset.color }}
              />
            )}
            {preset.nameHe}
          </button>
        );
      })}
    </div>
  );
}

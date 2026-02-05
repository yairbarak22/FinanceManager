'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddAssetDialog } from './AddAssetDialog';

interface AddAssetButtonProps {
  onAddAsset: (data: {
    symbol: string;
    name: string;
    quantity: number;
    price: number;
    priceILS: number;
    provider: 'YAHOO' | 'EOD';
    currency: string;
    priceDisplayUnit: 'ILS' | 'ILS_AGOROT' | 'USD';
  }) => void;
  /** Whether button should take full width */
  fullWidth?: boolean;
  /** Exchange rate USD/ILS for value calculations */
  exchangeRate?: number;
}

export function AddAssetButton({ onAddAsset, fullWidth = false, exchangeRate }: AddAssetButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        data-add-asset-trigger
        onClick={() => setIsOpen(true)}
        className={`
          h-12 rounded-xl bg-[#69ADFF] text-white px-5
          flex items-center justify-center gap-2
          hover:bg-[#5A9EE6] transition-all duration-200
          active:scale-[0.98] shadow-sm hover:shadow-md
          ${fullWidth ? 'w-full' : ''}
        `}
        style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        <Plus className="w-4 h-4" strokeWidth={1.75} />
        <span className="font-medium text-[0.9375rem]">הוסף נכס</span>
      </button>

      <AddAssetDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAddAsset={onAddAsset}
        exchangeRate={exchangeRate}
      />
    </>
  );
}

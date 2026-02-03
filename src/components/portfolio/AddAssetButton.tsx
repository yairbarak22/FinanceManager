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
}

export function AddAssetButton({ onAddAsset }: AddAssetButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-[#69ADFF] text-white px-5 py-2.5 flex items-center gap-2 hover:bg-[#5A9EE6] transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
        style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        <Plus className="w-4 h-4" strokeWidth={1.75} />
        <span className="font-medium text-sm">הוסף נכס</span>
      </button>

      <AddAssetDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAddAsset={onAddAsset}
      />
    </>
  );
}

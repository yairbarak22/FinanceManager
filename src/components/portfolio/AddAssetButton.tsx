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
        className="rounded-xl bg-[#303150] text-white px-4 py-2 flex items-center gap-2 hover:bg-[#303150]/90 transition-all active:scale-95 shadow-lg"
      >
        <Plus className="w-4 h-4" />
        <span className="font-medium">הוסף נכס</span>
      </button>

      <AddAssetDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAddAsset={onAddAsset}
      />
    </>
  );
}

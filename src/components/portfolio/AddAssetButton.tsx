'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddAssetDialog } from './AddAssetDialog';

interface AddAssetButtonProps {
  onAddAsset: (data: { symbol: string; name: string; quantity: number; price: number }) => void;
}

export function AddAssetButton({ onAddAsset }: AddAssetButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-slate-900 text-white px-4 py-2 flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
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

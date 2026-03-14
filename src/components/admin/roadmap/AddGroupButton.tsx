'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

interface AddGroupButtonProps {
  onCreate: (title: string, color: string) => Promise<void>;
}

export default function AddGroupButton({ onCreate }: AddGroupButtonProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleClick = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      await onCreate('קבוצה חדשה', '#69ADFF');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isCreating}
      className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E8E8ED] rounded-xl hover:bg-[#F7F7F8] transition-colors text-sm font-medium text-[#303150] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    >
      הוסף קבוצה חדשה
      {isCreating ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
      ) : (
        <Plus className="w-4 h-4" strokeWidth={1.75} />
      )}
    </button>
  );
}

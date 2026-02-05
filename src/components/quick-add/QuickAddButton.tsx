'use client';

import { Plus } from 'lucide-react';
import { useModal } from '@/context/ModalContext';

export default function QuickAddButton() {
  const { openModal } = useModal();

  const handleClick = () => {
    openModal('quick-add');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
      style={{
        backgroundColor: '#69ADFF',
        color: '#FFFFFF',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
      aria-label="הוספה מהירה"
    >
      <Plus className="w-4 h-4" strokeWidth={2.5} />
      <span className="text-sm">הוספה מהירה</span>
    </button>
  );
}


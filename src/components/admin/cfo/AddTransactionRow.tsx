'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Plus } from 'lucide-react';

export interface AddTransactionRowHandle {
  activate: () => void;
}

interface AddTransactionRowProps {
  gridCols: string;
  onCreate?: (title: string) => Promise<void>;
}

const AddTransactionRow = forwardRef<AddTransactionRowHandle, AddTransactionRowProps>(
  function AddTransactionRow({ gridCols, onCreate }, ref) {
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      activate: () => setIsCreating(true),
    }));

    useEffect(() => {
      if (isCreating && inputRef.current) inputRef.current.focus();
    }, [isCreating]);

    const handleSubmit = async () => {
      const trimmed = title.trim();
      if (!trimmed || !onCreate) { setIsCreating(false); setTitle(''); return; }
      setIsSaving(true);
      try {
        await onCreate(trimmed);
      } finally {
        setIsSaving(false);
        setIsCreating(false);
        setTitle('');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
      else if (e.key === 'Escape') { setIsCreating(false); setTitle(''); }
    };

    const handleBlur = () => {
      if (!title.trim()) { setIsCreating(false); setTitle(''); }
      else handleSubmit();
    };

    if (isCreating) {
      return (
        <div className={`${gridCols} items-center border-b border-[#F7F7F8]`}>
          <div className="px-4 py-2.5 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder="תיאור התנועה..."
              disabled={isSaving}
              className="w-full h-8 text-sm text-[#303150] bg-white border border-[#69ADFF] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20 placeholder-[#BDBDCB] disabled:opacity-50"
            />
          </div>
          <div className="py-2.5" />
          <div className="py-2.5" />
          <div className="py-2.5" />
          <div className="py-2.5" />
          <div className="py-2.5" />
          <div className="py-2.5" />
          <div className="py-2.5" />
        </div>
      );
    }

    return (
      <div
        onClick={() => setIsCreating(true)}
        className={`${gridCols} items-center border-b border-[#F7F7F8] last:border-b-0 hover:bg-[#F7F7F8] transition-colors cursor-pointer group/add`}
      >
        <div className="px-4 py-2.5 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#BDBDCB] group-hover/add:text-[#7E7F90] transition-colors" strokeWidth={1.75} />
          <span className="text-sm text-[#BDBDCB] group-hover/add:text-[#7E7F90] transition-colors">
            הוסף תנועה חד-פעמית
          </span>
        </div>
        <div className="py-2.5" />
        <div className="py-2.5" />
        <div className="py-2.5" />
        <div className="py-2.5" />
        <div className="py-2.5" />
        <div className="py-2.5" />
        <div className="py-2.5" />
      </div>
    );
  }
);

export default AddTransactionRow;

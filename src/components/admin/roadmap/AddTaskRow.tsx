'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { GRID_COLS } from './TaskGroup';

interface AddTaskRowProps {
  groupId?: string;
  onCreate?: (groupId: string, title: string) => Promise<void>;
}

export default function AddTaskRow({ groupId, onCreate }: AddTaskRowProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed || !groupId || !onCreate) {
      setIsCreating(false);
      setTitle('');
      return;
    }
    setIsSaving(true);
    try {
      await onCreate(groupId, trimmed);
    } finally {
      setIsSaving(false);
      setIsCreating(false);
      setTitle('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setTitle('');
    }
  };

  const handleBlur = () => {
    if (!title.trim()) {
      setIsCreating(false);
      setTitle('');
    } else {
      handleSubmit();
    }
  };

  if (isCreating) {
    return (
      <div className={`${GRID_COLS} items-center border-b border-[#F7F7F8]`}>
        <div className="h-11 flex items-center justify-center" />
        <div className="h-11 flex items-center pe-4">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="שם המשימה..."
            disabled={isSaving}
            className="w-full h-8 text-sm text-[#303150] bg-white border border-[#69ADFF] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20 placeholder-[#BDBDCB] disabled:opacity-50"
          />
        </div>
        <div className="h-11" />
        <div className="h-11" />
        <div className="h-11" />
        <div className="h-11" />
        <div className="h-11" />
        <div className="h-11" />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsCreating(true)}
      className={`${GRID_COLS} items-center border-b border-[#F7F7F8] hover:bg-[#F7F7F8] transition-colors duration-150 cursor-pointer group`}
    >
      <div className="h-11 flex items-center justify-center" />
      <div className="h-11 flex items-center gap-2 pe-4">
        <Plus className="w-4 h-4 text-[#BDBDCB] group-hover:text-[#7E7F90] transition-colors" strokeWidth={1.75} />
        <span className="text-sm text-[#BDBDCB] group-hover:text-[#7E7F90] transition-colors">
          הוסף משימה
        </span>
      </div>
      <div className="h-11" />
      <div className="h-11" />
      <div className="h-11" />
      <div className="h-11" />
      <div className="h-11" />
      <div className="h-11" />
    </div>
  );
}

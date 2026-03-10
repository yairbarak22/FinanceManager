'use client';

import { useMemo, useState, useRef } from 'react';
import { useWorkspaceStore } from '@/lib/workspace/store';
import { apiFetch } from '@/lib/utils';
import type { WorkspaceCategory } from '@/lib/workspace/types';
import CategoryFolder from './CategoryFolder';
import { Sparkles, Plus, Check, Loader2 } from 'lucide-react';

interface FolderGridProps {
  onDeleteTx?: (txId: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

export default function FolderGrid({ onDeleteTx, onDeleteCategory }: FolderGridProps) {
  const { categories, approveAllAiSuggestions, addCategory } = useWorkspaceStore();
  const [filter, setFilter] = useState<'all' | 'withItems' | 'withBudget'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalPending = useMemo(
    () => categories.reduce((sum, c) => sum + c.pendingAiTransactions.length, 0),
    [categories]
  );

  const filtered = useMemo(() => {
    let result: typeof categories;
    switch (filter) {
      case 'withItems':
        result = categories.filter(
          (c) =>
            c.assignedTransactions.length > 0 ||
            c.pendingAiTransactions.length > 0 ||
            c.currentSpent > 0
        );
        break;
      case 'withBudget':
        result = categories.filter((c) => c.monthlyBudget > 0);
        break;
      default:
        result = categories;
    }
    return [...result].sort((a, b) => (a.isCustom === b.isCustom ? 0 : a.isCustom ? -1 : 1));
  }, [categories, filter]);

  const handleAddCategory = async () => {
    const trimmed = newName.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const res = await apiFetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, type: 'expense' }),
      });
      const data = await res.json();
      if (res.ok) {
        const newCat: WorkspaceCategory = {
          id: data.id,
          name: data.name,
          nameHe: data.name,
          icon: data.icon || 'Circle',
          colorTheme: data.color || '#7E7F90',
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-700',
          isCustom: true,
          monthlyBudget: 0,
          currentSpent: 0,
          assignedTransactions: [],
          pendingAiTransactions: [],
        };
        addCategory(newCat);
        setNewName('');
        setIsAdding(false);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        backgroundColor: '#FFFFFF',
        borderInlineStart: '1px solid #E8E8ED',
        boxShadow: 'inset 1px 0 4px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header bar */}
      <div className="px-5 pt-4 pb-3 shrink-0 flex items-center justify-between bg-white border-b" style={{ borderColor: '#E8E8ED' }}>
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-bold" style={{ color: '#303150' }}>קטגוריות</h2>
          <span className="text-[11px] font-medium" style={{ color: '#BDBDCB' }}>
            {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {totalPending > 0 && (
            <button
              onClick={approveAllAiSuggestions}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(233, 168, 0, 0.1)', color: '#E9A800' }}
            >
              אשר {totalPending} הצעות
              <Sparkles className="w-3 h-3" />
            </button>
          )}

          <div className="flex items-center rounded-lg p-0.5 gap-0.5" style={{ border: '1px solid #E8E8ED' }}>
            {([
              { key: 'all', label: 'הכל' },
              { key: 'withItems', label: 'פעילות' },
              { key: 'withBudget', label: 'תקציב' },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="text-[10px] px-2.5 py-1 rounded font-semibold transition-all"
                style={{
                  backgroundColor: filter === f.key ? '#F5F5F7' : 'transparent',
                  color: filter === f.key ? '#303150' : '#BDBDCB',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category groups list */}
      <div className="flex-1 overflow-y-scroll scrollbar-workspace">
        {/* Add custom category row */}
        <div style={{ backgroundColor: '#FFFFFF' }}>
          {isAdding ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddCategory(); }}
              className="flex items-center gap-3 px-5 py-3.5"
              style={{ borderBottom: '1px solid #E8E8ED' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#F0F0F3' }}
              >
                <Plus className="w-3.5 h-3.5" style={{ color: '#69ADFF' }} />
              </div>
              <input
                ref={inputRef}
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => { if (!newName.trim()) setIsAdding(false); }}
                onKeyDown={(e) => { if (e.key === 'Escape') { setIsAdding(false); setNewName(''); } }}
                placeholder="שם הקטגוריה..."
                className="flex-1 text-[13px] font-semibold bg-transparent outline-none placeholder:text-[#BDBDCB]"
                style={{ color: '#303150' }}
                disabled={saving}
              />
              <button
                type="submit"
                disabled={!newName.trim() || saving}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ backgroundColor: '#0DBACC', color: '#FFFFFF' }}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center gap-3 px-5 py-3.5 transition-all duration-150 group/add"
              style={{ borderBottom: '1px dashed #E8E8ED' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderBottomColor = '#69ADFF';
                e.currentTarget.style.backgroundColor = 'rgba(105, 173, 255, 0.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderBottomColor = '#E8E8ED';
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 group-hover/add:bg-[rgba(105,173,255,0.08)]"
                style={{ backgroundColor: '#F0F0F3' }}
              >
                <Plus className="w-3.5 h-3.5 transition-colors duration-150 group-hover/add:text-[#69ADFF]" style={{ color: '#BDBDCB' }} />
              </div>
              <span className="text-[13px] font-semibold transition-colors duration-150 group-hover/add:text-[#69ADFF]" style={{ color: '#BDBDCB' }}>
                הוסף קטגוריה
              </span>
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-[13px]" style={{ color: '#BDBDCB' }}>
            אין קטגוריות להצגה
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((cat) => (
              <CategoryFolder key={cat.id} category={cat} onDeleteTx={onDeleteTx} onDeleteCategory={onDeleteCategory} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

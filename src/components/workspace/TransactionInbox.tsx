'use client';

import { useState, useMemo } from 'react';
import { Search, CheckCheck, GripVertical, Trash2, Copy } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/workspace/store';
import TransactionCard from './TransactionCard';

interface TransactionInboxProps {
  onDeleteTx?: (txId: string) => void;
  onRemoveDuplicates?: () => void;
  duplicateCount?: number;
}

export default function TransactionInbox({ onDeleteTx, onRemoveDuplicates, duplicateCount = 0 }: TransactionInboxProps) {
  const { unassignedTransactions, selectedIds, selectAll, clearSelection, duplicateIds } = useWorkspaceStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return unassignedTransactions;
    const q = search.trim().toLowerCase();
    return unassignedTransactions.filter(
      (tx) =>
        tx.description.toLowerCase().includes(q) ||
        (tx.cleanName && tx.cleanName.toLowerCase().includes(q))
    );
  }, [unassignedTransactions, search]);

  const hasSelection = selectedIds.size > 0;

  return (
    <div
      className="flex flex-col h-full"
      style={{
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        backgroundColor: '#FFFFFF',
        borderInlineStart: '2px solid #E8E8ED',
        boxShadow: 'inset -1px 0 4px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: '#F7F7F8' }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-bold" style={{ color: '#303150' }}>עסקאות</h2>
            {unassignedTransactions.length > 0 && (
              <span
                className="text-[10px] min-w-[20px] text-center px-1.5 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: '#69ADFF', color: '#FFFFFF' }}
              >
                {unassignedTransactions.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasSelection ? (
              <button
                onClick={clearSelection}
                className="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-[#F7F7F8]"
                style={{ color: '#F18AB5' }}
              >
                נקה ({selectedIds.size})
              </button>
            ) : unassignedTransactions.length > 0 ? (
              <button
                onClick={selectAll}
                className="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-[#F7F7F8] flex items-center gap-1"
                style={{ color: '#7E7F90' }}
              >
                בחר הכל
                <CheckCheck className="w-3 h-3" />
              </button>
            ) : null}
          </div>
        </div>

        {duplicateCount > 0 && (
          <button
            onClick={onRemoveDuplicates}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold mb-2 transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: 'rgba(241, 138, 181, 0.08)',
              color: '#F18AB5',
              border: '1px solid rgba(241, 138, 181, 0.2)',
            }}
          >
            <Copy className="w-3.5 h-3.5" />
            מחק עסקאות כפולות ({duplicateCount})
            <Trash2 className="w-3 h-3" />
          </button>
        )}

        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-3.5 h-3.5" style={{ color: '#BDBDCB' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש עסקה..."
            className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20"
            style={{ backgroundColor: '#F7F7F8', color: '#303150', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Drag guidance banner */}
      {filtered.length > 0 && (
        <div
          className="px-4 py-2 flex items-center gap-2 shrink-0"
          style={{ backgroundColor: '#F7F7F8', borderBottom: '1px solid #E8E8ED' }}
        >
          <GripVertical className="w-3.5 h-3.5 shrink-0" style={{ color: '#69ADFF' }} />
          <span className="text-[11px] font-medium" style={{ color: '#7E7F90' }}>
            גרור עסקאות לקטגוריות לסיווג
          </span>
        </div>
      )}

      {/* Transaction list — dense divider-separated rows */}
      <div className="flex-1 overflow-y-scroll scrollbar-workspace">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
            {unassignedTransactions.length === 0 ? (
              <>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(13, 186, 204, 0.08)' }}>
                  <CheckCheck className="w-7 h-7" style={{ color: '#0DBACC' }} />
                </div>
                <p className="text-sm font-bold" style={{ color: '#303150' }}>הכל מסווג</p>
                <p className="text-xs" style={{ color: '#7E7F90' }}>כל העסקאות שלך סווגו לתיקיות</p>
              </>
            ) : (
              <>
                <Search className="w-6 h-6" style={{ color: '#BDBDCB' }} />
                <p className="text-xs" style={{ color: '#7E7F90' }}>אין תוצאות עבור &quot;{search}&quot;</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#F7F7F8' }}>
            {filtered.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} onDelete={onDeleteTx} isDuplicate={duplicateIds.has(tx.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom edge fade */}
      {filtered.length > 8 && (
        <div className="h-6 bg-gradient-to-t from-white to-transparent pointer-events-none shrink-0" />
      )}
    </div>
  );
}

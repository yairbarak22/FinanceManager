'use client';

import { useState, useMemo } from 'react';
import { Search, CheckCheck, GripVertical, Trash2, Copy, RefreshCw, ChevronDown, ChevronUp, Link2, Plus } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/workspace/store';
import TransactionCard from './TransactionCard';

interface TransactionInboxProps {
  onDeleteTx?: (txId: string) => void;
  onRemoveDuplicates?: () => void;
  duplicateCount?: number;
  onResolveRecurring?: (txId: string, action: 'link' | 'import') => void;
  onPromoteDuplicate?: (txId: string) => void;
  onBulkPromoteDuplicates?: (txIds: string[]) => void;
}

export default function TransactionInbox({ onDeleteTx, onRemoveDuplicates, duplicateCount = 0, onResolveRecurring, onPromoteDuplicate, onBulkPromoteDuplicates }: TransactionInboxProps) {
  const {
    unassignedTransactions, selectedIds, selectAll, clearSelection,
    duplicateIds, recurringCandidates, hiddenDuplicates, importCounts,
  } = useWorkspaceStore();
  const [search, setSearch] = useState('');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [selectedDupIds, setSelectedDupIds] = useState<Set<string>>(new Set());

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
      {/* Import summary bar */}
      {importCounts && importCounts.total > 0 && (
        <div
          className="px-4 py-2.5 text-[11px] font-medium shrink-0"
          style={{ backgroundColor: 'rgba(105, 173, 255, 0.06)', borderBottom: '1px solid rgba(105, 173, 255, 0.15)', color: '#303150' }}
        >
          <span>ייבאנו {importCounts.total} עסקאות.</span>
          {importCounts.new > 0 && <span> {importCounts.new} מחכות לסיווג</span>}
          {importCounts.recurringCandidates > 0 && <span>, זוהו {importCounts.recurringCandidates} התאמות לעסקאות קבועות</span>}
          {importCounts.exactDuplicates > 0 && <span>, סיננו {importCounts.exactDuplicates} כפילויות</span>}
          <span>.</span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: '#F7F7F8' }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-bold" style={{ color: '#303150' }}>עסקאות חדשות</h2>
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

      {/* Main scroll area with all sections */}
      <div className="flex-1 overflow-y-scroll scrollbar-workspace">
        {/* Recurring candidates section */}
        {recurringCandidates.length > 0 && (
          <div className="border-b" style={{ borderColor: '#E8E8ED' }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: 'rgba(13, 186, 204, 0.04)' }}>
              <RefreshCw className="w-3.5 h-3.5" style={{ color: '#0DBACC' }} />
              <span className="text-[12px] font-bold" style={{ color: '#303150' }}>התאמה לעסקאות קבועות</span>
              <span
                className="text-[10px] min-w-[20px] text-center px-1.5 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: '#0DBACC', color: '#FFFFFF' }}
              >
                {recurringCandidates.length}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: '#F7F7F8' }}>
              {recurringCandidates.map((tx) => (
                <div key={tx.id} className="px-4 py-3" style={{ backgroundColor: 'rgba(13, 186, 204, 0.02)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <RefreshCw className="w-3 h-3 shrink-0" style={{ color: '#0DBACC' }} />
                        <span className="text-[12px] font-semibold truncate" style={{ color: '#303150' }}>{tx.description}</span>
                      </div>
                      <div className="text-[11px] mb-2" style={{ color: '#7E7F90' }}>
                        זוהה כעסקה קבועה: <span className="font-semibold" style={{ color: '#0DBACC' }}>{tx.matchedRecurringName || 'לא ידוע'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]" style={{ color: '#BDBDCB' }}>
                        <span>{new Date(tx.date).toLocaleDateString('he-IL')}</span>
                        <span>&#x2022;</span>
                        <span className="font-bold" style={{ color: tx.type === 'income' ? '#0DBACC' : '#F18AB5' }}>
                          {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('he-IL')} &#x20AA;
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => onResolveRecurring?.(tx.id, 'link')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 hover:opacity-90"
                      style={{ backgroundColor: 'rgba(13, 186, 204, 0.1)', color: '#0DBACC', border: '1px solid rgba(13, 186, 204, 0.2)' }}
                    >
                      <Link2 className="w-3 h-3" />
                      זו העסקה הקבועה שלי
                    </button>
                    <button
                      onClick={() => onResolveRecurring?.(tx.id, 'import')}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 hover:bg-[#F7F7F8]"
                      style={{ color: '#7E7F90', border: '1px solid #E8E8ED' }}
                    >
                      <Plus className="w-3 h-3" />
                      ייבא כעסקה נפרדת
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New transactions */}
        {filtered.length === 0 && recurringCandidates.length === 0 ? (
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

        {/* Hidden duplicates accordion */}
        {hiddenDuplicates.length > 0 && (
          <div className="border-t" style={{ borderColor: '#E8E8ED' }}>
            <button
              onClick={() => {
                setShowDuplicates(!showDuplicates);
                if (showDuplicates) setSelectedDupIds(new Set());
              }}
              className="w-full px-4 py-2.5 flex items-center justify-between text-[11px] font-medium transition-colors hover:bg-[#FAFBFC]"
              style={{ color: '#7E7F90' }}
            >
              <div className="flex items-center gap-1.5">
                <Copy className="w-3 h-3" />
                <span>הוסתרו {hiddenDuplicates.length} עסקאות כפולות</span>
              </div>
              {showDuplicates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showDuplicates && (
              <div>
                <div className="divide-y" style={{ borderColor: '#F7F7F8' }}>
                  {hiddenDuplicates.map((tx) => {
                    const isChecked = selectedDupIds.has(tx.id);
                    return (
                      <div key={tx.id} className="px-4 py-2.5 flex items-center gap-3 group transition-colors hover:bg-[#FAFBFC]">
                        <label className="flex items-center shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedDupIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(tx.id)) next.delete(tx.id);
                                else next.add(tx.id);
                                return next;
                              });
                            }}
                            className="w-3.5 h-3.5 rounded accent-[#69ADFF] cursor-pointer"
                          />
                        </label>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium truncate" style={{ color: '#303150' }}>{tx.description}</span>
                            <span className="text-[10px] font-bold shrink-0 ms-2" style={{ color: '#7E7F90' }}>
                              {tx.amount.toLocaleString('he-IL')} &#x20AA;
                            </span>
                          </div>
                          <span className="text-[10px]" style={{ color: '#BDBDCB' }}>
                            {new Date(tx.date).toLocaleDateString('he-IL')} — כפילות
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            onPromoteDuplicate?.(tx.id);
                            setSelectedDupIds((prev) => {
                              const next = new Set(prev);
                              next.delete(tx.id);
                              return next;
                            });
                          }}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all duration-200"
                          style={{ backgroundColor: 'rgba(105, 173, 255, 0.08)', color: '#69ADFF', border: '1px solid rgba(105, 173, 255, 0.2)' }}
                        >
                          <Plus className="w-3 h-3" />
                          הוסף לסיווג
                        </button>
                      </div>
                    );
                  })}
                </div>
                {/* Bulk action bar */}
                {selectedDupIds.size > 0 && (
                  <div
                    className="sticky bottom-0 px-4 py-2 flex items-center justify-between"
                    style={{ backgroundColor: 'rgba(105, 173, 255, 0.06)', borderTop: '1px solid rgba(105, 173, 255, 0.15)' }}
                  >
                    <span className="text-[11px] font-medium" style={{ color: '#303150' }}>
                      {selectedDupIds.size} נבחרו
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDupIds(new Set())}
                        className="text-[10px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-[#F7F7F8]"
                        style={{ color: '#7E7F90' }}
                      >
                        נקה
                      </button>
                      <button
                        onClick={() => {
                          onBulkPromoteDuplicates?.([...selectedDupIds]);
                          setSelectedDupIds(new Set());
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 hover:opacity-90"
                        style={{ backgroundColor: '#69ADFF', color: '#FFFFFF' }}
                      >
                        <Plus className="w-3 h-3" />
                        הוסף נבחרות לסיווג
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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

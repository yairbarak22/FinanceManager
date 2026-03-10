'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Brain, Trash2, GripVertical, Copy } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/workspace/store';
import type { WorkspaceTransaction } from '@/lib/workspace/types';

interface TransactionCardProps {
  transaction: WorkspaceTransaction;
  isOverlay?: boolean;
  compact?: boolean;
  onDelete?: (txId: string) => void;
  isDuplicate?: boolean;
}

export default function TransactionCard({ transaction, isOverlay, compact, onDelete, isDuplicate }: TransactionCardProps) {
  const { selectedIds, toggleSelect } = useWorkspaceStore();
  const isSelected = selectedIds.has(transaction.id);
  const bulkCount = selectedIds.size;
  const isBulkOverlay = isOverlay && bulkCount > 1 && selectedIds.has(transaction.id);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: transaction.id,
    disabled: isOverlay,
  });

  const style = !isOverlay && transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0 : 1 }
    : undefined;

  const formattedAmount = new Intl.NumberFormat('he-IL', {
    style: 'currency', currency: transaction.currency || 'ILS', maximumFractionDigits: 0,
  }).format(transaction.amount);

  const formattedDate = new Date(transaction.date).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'short',
  });

  const accentColor = transaction.type === 'expense' ? '#F18AB5' : '#0DBACC';

  // --- Overlay (dragging visual) ---
  if (isOverlay) {
    return (
      <div
        className="px-4 py-2.5 rounded-xl select-none relative"
        style={{
          background: '#FFFFFF',
          border: '2px solid #69ADFF',
          minWidth: '14rem',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
          transform: 'scale(0.97) rotate(-1.5deg)',
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        }}
      >
        {isBulkOverlay && (
          <>
            <div className="absolute inset-0 rounded-xl" style={{ background: '#F7F7F8', transform: 'rotate(0.8deg) translate(2px, 2px)', zIndex: -1, border: '1px solid #E8E8ED' }} />
            <div className="absolute inset-0 rounded-xl" style={{ background: '#EEEFF2', transform: 'rotate(1.6deg) translate(4px, 4px)', zIndex: -2, border: '1px solid #E8E8ED' }} />
            <div
              className="absolute -top-2 -start-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ backgroundColor: '#69ADFF', color: '#FFFFFF', zIndex: 2 }}
            >
              {bulkCount}
            </div>
          </>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-bold truncate" style={{ color: '#303150' }}>{transaction.description}</span>
          <span className="text-[13px] font-bold shrink-0 tabular-nums" style={{ color: accentColor }}>{formattedAmount}</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: '#BDBDCB' }}>{formattedDate}</p>
      </div>
    );
  }

  // --- Compact mode (inside category folders) ---
  if (compact) {
    const displayName = transaction.cleanName || transaction.description;
    const hasMerchantDetail = transaction.cleanName && transaction.cleanName !== transaction.description;

    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="group flex items-start cursor-grab active:cursor-grabbing transition-all duration-100 hover:bg-white/60 px-8 py-2"
        style={{
          ...style,
          borderInlineStart: '2px solid transparent',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderInlineStartColor = `${accentColor}30`; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderInlineStartColor = 'transparent'; }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold truncate flex-1 min-w-0" style={{ color: '#303150' }}>
              {displayName}
            </span>
            {isDuplicate && (
              <span
                className="text-[8px] font-bold px-1 py-0.5 rounded shrink-0"
                style={{ backgroundColor: 'rgba(241, 138, 181, 0.1)', color: '#F18AB5' }}
              >
                כפול
              </span>
            )}
            <span className="text-[10px] shrink-0" style={{ color: '#BDBDCB' }}>{formattedDate}</span>
            <span className="text-[12px] font-bold shrink-0 tabular-nums" style={{ color: accentColor }}>
              {formattedAmount}
            </span>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-[#FDE8EF]"
              >
                <Trash2 className="w-3 h-3" style={{ color: '#F18AB5' }} />
              </button>
            )}
          </div>
          {hasMerchantDetail && (
            <p className="text-[9px] mt-0.5 truncate" style={{ color: '#BDBDCB' }}>
              {transaction.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- Full mode (inbox) ---
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="group flex items-center cursor-grab active:cursor-grabbing transition-colors duration-100 hover:bg-[#F7F7F8]"
      style={style}
    >
      <GripVertical className="w-3.5 h-3.5 shrink-0 ms-2 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: '#BDBDCB' }} />

      <div className="w-1 self-stretch shrink-0 rounded-e-full" style={{ backgroundColor: accentColor }} />

      <button
        onClick={(e) => { e.stopPropagation(); toggleSelect(transaction.id); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="shrink-0 w-4 h-4 rounded border-[1.5px] flex items-center justify-center ms-3 transition-all"
        style={{
          borderColor: isSelected ? '#69ADFF' : '#E8E8ED',
          backgroundColor: isSelected ? '#69ADFF' : 'transparent',
        }}
      >
        {isSelected && (
          <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div
        className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5"
        style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        <span className="text-[13px] font-semibold truncate flex-1 min-w-0" style={{ color: '#303150' }}>
          {transaction.cleanName || transaction.description}
        </span>

        {isDuplicate && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0"
            style={{ backgroundColor: 'rgba(241, 138, 181, 0.1)', color: '#F18AB5' }}
          >
            <Copy className="w-2.5 h-2.5" />
            כפול
          </span>
        )}

        {transaction.aiConfidence !== 'NONE' && transaction.aiSuggestedCategoryId && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0"
            style={{ backgroundColor: `${transaction.aiConfidence === 'HIGH' ? '#0DBACC' : '#E9A800'}12`, color: transaction.aiConfidence === 'HIGH' ? '#0DBACC' : '#E9A800' }}
          >
            <Brain className="w-2.5 h-2.5" />
            AI
          </span>
        )}

        <span className="text-[11px] shrink-0" style={{ color: '#BDBDCB' }}>{formattedDate}</span>

        <span className="text-[13px] font-bold shrink-0 tabular-nums" style={{ color: accentColor }}>
          {formattedAmount}
        </span>

        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-[#FDE8EF]"
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: '#F18AB5' }} />
          </button>
        )}
      </div>
    </div>
  );
}

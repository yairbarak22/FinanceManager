'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronDown, Sparkles, Trash2, GripVertical } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/workspace/store';
import type { WorkspaceCategory } from '@/lib/workspace/types';
import TransactionCard from './TransactionCard';

interface CategoryFolderProps {
  category: WorkspaceCategory;
  onDeleteTx?: (txId: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

export default function CategoryFolder({ category, onDeleteTx, onDeleteCategory }: CategoryFolderProps) {
  const { overDropId } = useWorkspaceStore();
  const { setNodeRef } = useDroppable({ id: category.id });
  const isDropTarget = overDropId === category.id;

  const totalItems = category.assignedTransactions.length + category.pendingAiTransactions.length;
  const pendingCount = category.pendingAiTransactions.length;
  const [isOpen, setIsOpen] = useState(false);

  const formattedSpent = new Intl.NumberFormat('he-IL', {
    style: 'currency', currency: 'ILS', maximumFractionDigits: 0,
  }).format(category.currentSpent);

  const color = category.colorTheme;
  const isElevated = isOpen && totalItems > 0;

  return (
    <div
      ref={setNodeRef}
      className="group/cat transition-all duration-150"
      style={{
        backgroundColor: isDropTarget ? `${color}06` : isElevated ? '#F8F8FA' : '#FFFFFF',
        borderBottom: isElevated ? 'none' : '1px solid #E8E8ED',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        ...(isElevated ? {
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          borderRadius: '0 0 8px 8px',
          position: 'relative' as const,
          zIndex: 1,
          marginBottom: 2,
        } : {}),
      }}
    >
      {/* Group header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full relative flex items-center gap-3 px-5 py-4 transition-colors duration-100 hover:bg-[#FAFBFC]"
        style={{
          borderInlineStart: isDropTarget ? `4px solid ${color}` : `3px solid ${color}`,
        }}
      >
        {/* Chevron */}
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform duration-200"
          style={{
            color: '#BDBDCB',
            transform: isOpen ? 'rotate(0deg)' : 'rotate(90deg)',
          }}
        />

        {/* Name — unified dark color, border provides category identity */}
        <span className="text-[15px] font-bold truncate" style={{ color: '#303150' }}>
          {category.nameHe}
        </span>

        {/* Item count */}
        {totalItems > 0 && (
          <span className="text-[12px] font-medium" style={{ color: '#BDBDCB' }}>
            {totalItems}
          </span>
        )}

        {/* Pending AI badge */}
        {pendingCount > 0 && (
          <span
            className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(233, 168, 0, 0.1)', color: '#E9A800' }}
          >
            <Sparkles className="w-2.5 h-2.5" />
            {pendingCount}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Amount */}
        <span className="text-[15px] font-bold tabular-nums shrink-0" style={{ color: '#303150' }}>
          {formattedSpent}
        </span>

        {/* Delete custom category — absolutely positioned to avoid layout shift */}
        {category.isCustom && onDeleteCategory && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onDeleteCategory(category.id); }}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onDeleteCategory(category.id); } }}
            className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/cat:opacity-100 transition-opacity p-1.5 rounded-lg"
            style={{
              insetInlineStart: 12,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid #FDE8EF',
              zIndex: 2,
            }}
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: '#F18AB5' }} />
          </span>
        )}
      </button>

      {/* Expandable transaction list */}
      {isOpen && (
        <div
          className="pb-1"
          style={{
            borderInlineStart: `3px solid ${color}`,
            borderEndStartRadius: isElevated ? 8 : 0,
          }}
        >
          {totalItems === 0 ? (
            <div className="px-8 py-4 flex items-center gap-2">
              <GripVertical className="w-4 h-4 shrink-0 animate-pulse" style={{ color: '#BDBDCB' }} />
              <p className="text-[12px] font-medium" style={{ color: '#7E7F90' }}>גרור עסקאות לכאן</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#F0F0F3' }}>
              {category.pendingAiTransactions.map((tx) => (
                <div key={tx.id} style={{ borderInlineStart: '2px solid #E9A800' }}>
                  <TransactionCard transaction={tx} compact onDelete={onDeleteTx} />
                </div>
              ))}
              {category.assignedTransactions.map((tx) => (
                <TransactionCard key={tx.id} transaction={tx} compact onDelete={onDeleteTx} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drop target highlight bar */}
      {isDropTarget && (
        <div className="h-[2px]" style={{ backgroundColor: color }} />
      )}
    </div>
  );
}

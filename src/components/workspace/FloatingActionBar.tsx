'use client';

import { Undo2, Trash2, FolderInput, X } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/workspace/store';

interface FloatingActionBarProps {
  onUndoLast: () => void;
  onBulkDelete?: () => void;
}

export default function FloatingActionBar({ onUndoLast, onBulkDelete }: FloatingActionBarProps) {
  const { selectedIds, clearSelection, undoHistory } = useWorkspaceStore();
  const hasSelection = selectedIds.size > 0;
  const hasHistory = undoHistory.length > 0;

  if (!hasSelection && !hasHistory) return null;

  return (
    <div
      className="fixed bottom-6 start-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl"
      style={{
        transform: 'translateX(50%)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #F7F7F8',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
        animation: 'slideUp 0.25s ease-out',
      }}
    >
      {hasSelection && (
        <>
          <span className="text-xs font-bold" style={{ color: '#303150' }}>
            {selectedIds.size} נבחרו
          </span>
          <div className="w-px h-4" style={{ backgroundColor: '#E8E8ED' }} />

          <button
            onClick={clearSelection}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all hover:bg-[#F7F7F8]"
            style={{ color: '#7E7F90' }}
          >
            <X className="w-3 h-3" />
            נקה
          </button>

          {onBulkDelete && (
            <button
              onClick={onBulkDelete}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all hover:bg-[#FDE8EF]"
              style={{ color: '#F18AB5' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              מחק
            </button>
          )}

          <button
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-[#EBF3FF]"
            style={{ color: '#69ADFF' }}
          >
            <FolderInput className="w-3.5 h-3.5" />
            העבר ל...
          </button>
        </>
      )}

      {hasHistory && (
        <>
          {hasSelection && <div className="w-px h-4" style={{ backgroundColor: '#E8E8ED' }} />}
          <button
            onClick={onUndoLast}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-[#F7F7F8]"
            style={{ color: '#7E7F90' }}
          >
            <Undo2 className="w-3.5 h-3.5" />
            בטל
          </button>
        </>
      )}

      <style jsx>{`@keyframes slideUp { from { opacity: 0; transform: translateX(50%) translateY(16px); } to { opacity: 1; transform: translateX(50%) translateY(0); } }`}</style>
    </div>
  );
}

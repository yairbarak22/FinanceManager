'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { apiFetch } from '@/lib/utils';
import { useWorkspaceStore } from '@/lib/workspace/store';
import type {
  WorkspaceTransaction,
  WorkspaceCategory,
  WorkspaceSessionResponse,
} from '@/lib/workspace/types';

import UploadWizard from './UploadWizard';
import ClassifyingStep from './ClassifyingStep';
import DoneStep from './DoneStep';
import WorkspaceHeader from './WorkspaceHeader';
import TransactionInbox from './TransactionInbox';
import TransactionCard from './TransactionCard';
import FolderGrid from './FolderGrid';
import FloatingActionBar from './FloatingActionBar';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

type WizardPhase = 'upload' | 'classifying' | 'categorize' | 'done' | 'error';

interface ImportStats {
  total: number;
  cached: number;
  aiClassified: number;
  needsReview: number;
  parseErrors: number;
}

export default function WorkspacePage() {
  const searchParams = useSearchParams();
  const existingMonth = searchParams.get('month');

  const [phase, setPhase] = useState<WizardPhase>(existingMonth ? 'categorize' : 'upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [loading, setLoading] = useState(!!existingMonth);
  const [derivedMonthKey, setDerivedMonthKey] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeletions = useRef<string[]>([]);
  const importedTxIdsRef = useRef<string[]>([]);
  const finalizedRef = useRef(false);

  const {
    initWorkspace,
    moveToCategory,
    bulkMoveToCategory,
    deleteTransaction,
    bulkDelete,
    removeCategory,
    setActiveDrag,
    setOverDrop,
    setSaveStatus,
    setDuplicateIds,
    removeDuplicates,
    undoLastAction,
    selectedIds,
    categorizedCount,
    totalTransactions,
    saveStatus,
    activeDragId,
    unassignedTransactions,
    categories,
    duplicateIds,
  } = useWorkspaceStore();

  const monthKey =
    derivedMonthKey ||
    existingMonth ||
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    if (!existingMonth) return;
    let cancelled = false;
    setLoading(true);

    apiFetch(`/api/workspace/session?monthKey=${existingMonth}`)
      .then(async (res) => {
        if (cancelled) return;
        const data: WorkspaceSessionResponse = await res.json();
        initWorkspace(data.transactions, data.categories);
        setLoading(false);
        setPhase('categorize');
      })
      .catch(() => {
        if (cancelled) return;
        setErrorMsg('שגיאה בטעינת נתוני הסיווג');
        setPhase('error');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [existingMonth, initWorkspace]);

  useEffect(() => {
    return () => {
      if (!finalizedRef.current && importedTxIdsRef.current.length > 0) {
        const ids = [...importedTxIdsRef.current];
        apiFetch('/api/workspace/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionIds: ids }),
        }).catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClassificationComplete = useCallback(
    async (file: File, importType: string, dateFormat: string) => {
      setPhase('classifying');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('dateFormat', dateFormat);
      formData.append('importType', importType);

      try {
        const res = await apiFetch('/api/transactions/import', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || 'שגיאה בעיבוד הקובץ');
          setPhase('error');
          return;
        }

        const classified = data.transactions || [];
        const needsReview = data.needsReview || [];
        const stats: ImportStats = data.stats || {
          total: 0, cached: 0, aiClassified: 0, needsReview: 0, parseErrors: 0,
        };
        setImportStats(stats);

        const allTxns = [...classified, ...needsReview];
        if (allTxns.length === 0) {
          setPhase('done');
          return;
        }

        // Derive months from the imported transactions' actual dates
        const months = getAvailableMonths(allTxns);
        setAvailableMonths(months);
        const importedMonthKey = getDominantKey(months);
        setDerivedMonthKey(importedMonthKey);

        const toSave = allTxns.map((t: { merchantName: string; amount: number; date: string; type: string; category: string | null }) => ({
          merchantName: t.merchantName,
          amount: t.amount,
          date: typeof t.date === 'string' ? t.date : new Date(t.date).toISOString(),
          type: t.type,
          category: t.category || 'uncategorized',
          isManualCategory: false,
        }));

        // Cleanup any leftover transactions from a previous abandoned import
        if (importedTxIdsRef.current.length > 0) {
          const oldIds = [...importedTxIdsRef.current];
          importedTxIdsRef.current = [];
          try {
            await apiFetch('/api/workspace/delete', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transactionIds: oldIds }),
            });
          } catch { /* proceed even if cleanup fails */ }
        }

        // Snapshot existing transaction IDs before saving new ones
        let preExistingIds = new Set<string>();
        try {
          const preRes = await apiFetch(`/api/workspace/session?monthKey=${importedMonthKey}`);
          if (preRes.ok) {
            const preData: WorkspaceSessionResponse = await preRes.json();
            preExistingIds = new Set(preData.transactions.map((t) => t.id));
          }
        } catch { /* proceed without snapshot */ }

        // Single save call -- always skip server-side duplicate check.
        // Duplicates are detected client-side after session load.
        const confirmRes = await apiFetch('/api/transactions/import/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: toSave, skipDuplicateCheck: true }),
        });

        const confirmData = await confirmRes.json();

        if (!confirmRes.ok) {
          setErrorMsg(confirmData.error || 'שגיאה בשמירת העסקאות');
          setPhase('error');
          return;
        }

        const sessionRes = await apiFetch(`/api/workspace/session?monthKey=${importedMonthKey}`);
        if (!sessionRes.ok) {
          setErrorMsg('שגיאה בטעינת נתוני הסיווג');
          setPhase('error');
          return;
        }

        const sessionData: WorkspaceSessionResponse = await sessionRes.json();

        // Always detect duplicates client-side by description+amount+date
        const dupIds = new Set<string>();
        const seenKeys = new Map<string, string>();
        for (const tx of sessionData.transactions) {
          const key = `${tx.description}|${tx.amount}|${new Date(tx.date).toDateString()}`;
          if (seenKeys.has(key)) {
            dupIds.add(tx.id);
          } else {
            seenKeys.set(key, tx.id);
          }
        }

        const importedTransactions: WorkspaceTransaction[] = sessionData.transactions.map((tx) => {
          const isDup = dupIds.has(tx.id);

          if (tx.status === 'CONFIRMED' && tx.categoryId) {
            return { ...tx, isDuplicate: isDup };
          }

          const hasRealCategory =
            tx.categoryId && tx.categoryId !== 'other' && tx.categoryId !== 'uncategorized';

          if (hasRealCategory) {
            return {
              ...tx,
              aiSuggestedCategoryId: tx.categoryId,
              aiConfidence: 'HIGH' as const,
              categoryId: null,
              status: 'AI_SUGGESTED' as const,
              isDuplicate: isDup,
            };
          }
          return {
            ...tx,
            aiSuggestedCategoryId: null,
            aiConfidence: 'NONE' as const,
            categoryId: null,
            status: 'UNCATEGORIZED' as const,
            isDuplicate: isDup,
          };
        });

        const cleanCategories: WorkspaceCategory[] = sessionData.categories.map((cat) => ({
          ...cat,
          assignedTransactions: [],
          pendingAiTransactions: [],
        }));

        // Track newly imported IDs for cleanup on unmount
        importedTxIdsRef.current = sessionData.transactions
          .map((t) => t.id)
          .filter((id) => !preExistingIds.has(id));
        finalizedRef.current = false;

        initWorkspace(importedTransactions, cleanCategories);
        if (dupIds.size > 0) {
          setDuplicateIds(dupIds);
        }
        setPhase('categorize');
      } catch (err) {
        console.error('[Workspace] Import flow error:', err);
        setErrorMsg('שגיאה בעיבוד הקובץ');
        setPhase('error');
      }
    },
    [initWorkspace]
  );

  // ---------- DnD ----------

  const flushDeletions = useCallback(async () => {
    if (pendingDeletions.current.length === 0) return;
    const batch = [...pendingDeletions.current];
    pendingDeletions.current = [];
    try {
      await apiFetch('/api/workspace/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: batch }),
      });
    } catch {
      console.error('[Workspace] Failed to delete transactions from DB');
    }
  }, []);

  const handleDeleteTx = useCallback(
    (txId: string) => {
      deleteTransaction(txId);
      pendingDeletions.current.push(txId);
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = setTimeout(flushDeletions, 1500);
    },
    [deleteTransaction, flushDeletions]
  );

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    bulkDelete(ids);
    pendingDeletions.current.push(...ids);
    if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    deleteTimeoutRef.current = setTimeout(flushDeletions, 1500);
  }, [selectedIds, bulkDelete, flushDeletions]);

  const handleDeleteCategory = useCallback((categoryId: string) => {
    setDeleteCategoryId(categoryId);
  }, []);

  const handleConfirmDeleteCategory = useCallback(async () => {
    if (!deleteCategoryId) return;
    try {
      const res = await apiFetch(`/api/categories/${deleteCategoryId}`, { method: 'DELETE' });
      if (res.ok) {
        removeCategory(deleteCategoryId);
      }
    } catch {
      console.error('[Workspace] Failed to delete category');
    }
  }, [deleteCategoryId, removeCategory]);

  const handleRemoveDuplicates = useCallback(async () => {
    const state = useWorkspaceStore.getState();
    const ids = Array.from(state.duplicateIds);
    if (ids.length === 0) return;

    removeDuplicates();

    try {
      await apiFetch('/api/workspace/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: ids }),
      });
    } catch {
      console.error('[Workspace] Failed to delete duplicates from DB');
    }
  }, [removeDuplicates]);

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 6 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const activeTx = activeDragId
    ? findTransaction(activeDragId, unassignedTransactions, categories)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveDrag(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    setOverDrop(event.over ? String(event.over.id) : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    setOverDrop(null);
    const { active, over } = event;
    if (!over) return;
    const categoryId = String(over.id);

    if (selectedIds.size > 1 && selectedIds.has(String(active.id))) {
      const ids = Array.from(selectedIds);
      bulkMoveToCategory(ids, categoryId);
    } else {
      moveToCategory(String(active.id), categoryId);
    }
  }

  const handleFinalize = useCallback(async () => {
    setIsFinalizing(true);
    finalizedRef.current = true;
    importedTxIdsRef.current = [];
    try {
      const allAssignments: { transactionId: string; categoryId: string }[] = [];
      const state = useWorkspaceStore.getState();
      for (const cat of state.categories) {
        for (const tx of cat.assignedTransactions) {
          allAssignments.push({ transactionId: tx.id, categoryId: cat.id });
        }
        for (const tx of cat.pendingAiTransactions) {
          allAssignments.push({ transactionId: tx.id, categoryId: cat.id });
        }
      }

      if (allAssignments.length > 0) {
        setSaveStatus('saving');
        await apiFetch('/api/workspace/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignments: allAssignments }),
        });
      }

      await apiFetch('/api/workspace/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthKey, assignments: allAssignments }),
      });

      setSaveStatus('saved');
      setPhase('done');
    } catch {
      setSaveStatus('error');
    } finally {
      setIsFinalizing(false);
    }
  }, [monthKey, setSaveStatus]);

  const monthLabel = new Date(
    parseInt(monthKey.split('-')[0]),
    parseInt(monthKey.split('-')[1]) - 1
  ).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  const handleMonthChange = useCallback(
    async (newMonthKey: string) => {
      if (newMonthKey === monthKey) return;
      setLoading(true);
      setDerivedMonthKey(newMonthKey);
      try {
        const sessionRes = await apiFetch(`/api/workspace/session?monthKey=${newMonthKey}`);
        if (!sessionRes.ok) {
          setErrorMsg('שגיאה בטעינת נתוני החודש');
          setPhase('error');
          return;
        }
        const sessionData: WorkspaceSessionResponse = await sessionRes.json();

        const importedTransactions: WorkspaceTransaction[] = sessionData.transactions.map((tx) => {
          if (tx.status === 'CONFIRMED' && tx.categoryId) {
            return { ...tx };
          }

          const hasRealCategory =
            tx.categoryId && tx.categoryId !== 'other' && tx.categoryId !== 'uncategorized';
          if (hasRealCategory) {
            return {
              ...tx,
              aiSuggestedCategoryId: tx.categoryId,
              aiConfidence: 'HIGH' as const,
              categoryId: null,
              status: 'AI_SUGGESTED' as const,
            };
          }
          return {
            ...tx,
            aiSuggestedCategoryId: null,
            aiConfidence: 'NONE' as const,
            categoryId: null,
            status: 'UNCATEGORIZED' as const,
          };
        });

        const cleanCategories: WorkspaceCategory[] = sessionData.categories.map((cat) => ({
          ...cat,
          assignedTransactions: [],
          pendingAiTransactions: [],
        }));

        initWorkspace(importedTransactions, cleanCategories);
      } catch {
        setErrorMsg('שגיאה בטעינת נתוני החודש');
        setPhase('error');
      } finally {
        setLoading(false);
      }
    },
    [monthKey, initWorkspace]
  );

  // ---------- Render ----------

  if (phase === 'upload') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
        <UploadWizard onComplete={handleClassificationComplete} />
      </div>
    );
  }

  if (phase === 'classifying') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
        <ClassifyingStep />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="max-w-2xl mx-auto pt-8 lg:pt-16 pb-12" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
          <div className="flex flex-col items-center text-center py-16 gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(241, 138, 181, 0.1)' }}>
              <span className="text-2xl font-bold" style={{ color: '#F18AB5' }}>!</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#303150' }}>שגיאה</h1>
              <p className="text-sm" style={{ color: '#7E7F90' }}>{errorMsg}</p>
            </div>
            <button
              onClick={() => { setPhase('upload'); setErrorMsg(null); }}
              className="px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ backgroundColor: '#69ADFF', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(105, 173, 255, 0.3)' }}
            >
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
        <DoneStep
          stats={{
            total: importStats?.total || totalTransactions,
            categorized: categorizedCount,
            aiClassified: importStats?.aiClassified || 0,
          }}
        />
      </div>
    );
  }

  // phase === 'categorize'
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#69ADFF] border-t-transparent animate-spin" />
          <span className="text-sm font-medium" style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito)' }}>טוען עסקאות...</span>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="-m-4 lg:-m-6 flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
        <WorkspaceHeader
          monthLabel={monthLabel}
          saveStatus={saveStatus}
          categorizedCount={categorizedCount}
          totalCount={totalTransactions}
          onFinalize={handleFinalize}
          isFinalizing={isFinalizing}
          availableMonths={availableMonths}
          activeMonthKey={monthKey}
          onMonthChange={handleMonthChange}
        />
        <div className="flex flex-1 min-h-0" style={{ backgroundColor: '#F5F5F7' }}>
          <div className="w-[35%] min-w-[300px] max-w-[420px] h-full">
            <TransactionInbox
              onDeleteTx={handleDeleteTx}
              onRemoveDuplicates={handleRemoveDuplicates}
              duplicateCount={duplicateIds.size}
            />
          </div>
          <div className="flex-1 min-w-0 h-full">
            <FolderGrid onDeleteTx={handleDeleteTx} onDeleteCategory={handleDeleteCategory} />
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTx && <TransactionCard transaction={activeTx} isOverlay />}
      </DragOverlay>

      <FloatingActionBar onUndoLast={undoLastAction} onBulkDelete={handleBulkDelete} />

      <ConfirmDialog
        isOpen={deleteCategoryId !== null}
        onClose={() => setDeleteCategoryId(null)}
        onConfirm={handleConfirmDeleteCategory}
        title="מחיקת קטגוריה"
        message="האם אתה בטוח שברצונך למחוק את הקטגוריה? כל העסקאות שסווגו תחתיה יחזרו לרשימת העסקאות."
      />
    </DndContext>
  );
}

function findTransaction(
  id: string,
  unassigned: WorkspaceTransaction[],
  cats: WorkspaceCategory[]
): WorkspaceTransaction | null {
  const inInbox = unassigned.find((tx) => tx.id === id);
  if (inInbox) return inInbox;
  for (const cat of cats) {
    const found =
      cat.assignedTransactions.find((tx) => tx.id === id) ||
      cat.pendingAiTransactions.find((tx) => tx.id === id);
    if (found) return found;
  }
  return null;
}

export interface AvailableMonth {
  key: string;
  label: string;
  count: number;
}

function getAvailableMonths(txns: { date: string | Date }[]): AvailableMonth[] {
  const counts = new Map<string, number>();
  for (const t of txns) {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  if (counts.size === 0) {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return [{
      key,
      label: now.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
      count: 0,
    }];
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      const [y, m] = key.split('-').map(Number);
      const label = new Date(y, m - 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
      return { key, label, count };
    });
}

function getDominantKey(months: AvailableMonth[]): string {
  if (months.length === 0) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  let best = months[0];
  for (const m of months) {
    if (m.count > best.count) best = m;
  }
  return best.key;
}

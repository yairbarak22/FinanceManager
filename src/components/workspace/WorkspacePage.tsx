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
  StageResponse,
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
    setImportSession,
    resolveRecurringCandidate,
    promoteDuplicateToInbox,
    bulkPromoteDuplicates,
    selectedIds,
    categorizedCount,
    totalTransactions,
    saveStatus,
    activeDragId,
    unassignedTransactions,
    categories,
    duplicateIds,
    importSessionId,
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
      const state = useWorkspaceStore.getState();
      if (!finalizedRef.current && state.importSessionId) {
        apiFetch('/api/workspace/import/abandon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: state.importSessionId }),
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
        // Step 1: Parse + classify
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

        const months = getAvailableMonths(allTxns);
        setAvailableMonths(months);
        const importedMonthKey = getDominantKey(months);
        setDerivedMonthKey(importedMonthKey);

        // Step 2: Stage — server-side dedup + recurring matching, draft rows only
        const stageRows = allTxns.map((t: { merchantName: string; amount: number; date: string; type: string; category: string | null }) => ({
          date: typeof t.date === 'string' ? t.date : new Date(t.date).toISOString(),
          amount: t.amount,
          type: t.type,
          description: t.merchantName,
          suggestedCategory: t.category || null,
        }));

        const stageRes = await apiFetch('/api/workspace/import/stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monthKey: importedMonthKey, rows: stageRows }),
        });

        if (!stageRes.ok) {
          const stageErr = await stageRes.json();
          setErrorMsg(stageErr.error || 'שגיאה בהכנת הייבוא');
          setPhase('error');
          return;
        }

        const stageData: StageResponse = await stageRes.json();

        setImportSession(stageData.sessionId, stageData.counts);
        finalizedRef.current = false;

        // Step 3: Load existing session data + merge with draft rows
        const sessionRes = await apiFetch(
          `/api/workspace/session?monthKey=${importedMonthKey}&importSessionId=${stageData.sessionId}`
        );
        if (!sessionRes.ok) {
          setErrorMsg('שגיאה בטעינת נתוני הסיווג');
          setPhase('error');
          return;
        }

        const sessionData: WorkspaceSessionResponse = await sessionRes.json();

        // Build workspace transactions from existing + draft rows
        const existingTxns: WorkspaceTransaction[] = sessionData.transactions.map((tx) => {
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

        // Convert draft rows to WorkspaceTransactions
        const draftTxns: WorkspaceTransaction[] = stageData.rows.map((row) => {
          const matchKind = row.matchKind as 'NEW' | 'EXACT_DUPLICATE' | 'RECURRING_CANDIDATE';
          const hasCat = row.suggestedCategory && row.suggestedCategory !== 'other' && row.suggestedCategory !== 'uncategorized';

          return {
            id: row.id,
            date: row.date,
            description: row.description,
            amount: row.amount,
            type: row.type as 'income' | 'expense',
            currency: 'ILS' as const,
            categoryId: null,
            aiSuggestedCategoryId: hasCat ? row.suggestedCategory : null,
            aiConfidence: hasCat ? 'HIGH' as const : 'NONE' as const,
            status: hasCat && matchKind === 'NEW' ? 'AI_SUGGESTED' as const : 'UNCATEGORIZED' as const,
            importRowId: row.id,
            matchKind,
            matchedRecurringId: row.matchedRecurringId,
            matchedRecurringName: row.matchedRecurringName,
            matchedRecurringCategory: row.matchedRecurringCategory,
          };
        });

        const allWorkspaceTxns = [...existingTxns, ...draftTxns];

        const cleanCategories: WorkspaceCategory[] = sessionData.categories.map((cat) => ({
          ...cat,
          assignedTransactions: [],
          pendingAiTransactions: [],
        }));

        initWorkspace(allWorkspaceTxns, cleanCategories);
        setPhase('categorize');
      } catch (err) {
        console.error('[Workspace] Import flow error:', err);
        setErrorMsg('שגיאה בעיבוד הקובץ');
        setPhase('error');
      }
    },
    [initWorkspace, setImportSession]
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

  const handleResolveRecurring = useCallback(
    (txId: string, action: 'link' | 'import') => {
      resolveRecurringCandidate(txId, action);
    },
    [resolveRecurringCandidate]
  );

  const handleFinalize = useCallback(async () => {
    setIsFinalizing(true);
    finalizedRef.current = true;
    try {
      const state = useWorkspaceStore.getState();
      const sessionId = state.importSessionId;

      // Categorize existing transactions (non-draft) that were moved to categories
      const existingAssignments: { transactionId: string; categoryId: string }[] = [];
      const draftResolutions: { rowId: string; resolution: 'IMPORT_AS_TX' | 'LINK_RECURRING' | 'SKIP_DUPLICATE'; category: string | null }[] = [];

      for (const cat of state.categories) {
        for (const tx of [...cat.assignedTransactions, ...cat.pendingAiTransactions]) {
          if (tx.importRowId) {
            draftResolutions.push({
              rowId: tx.importRowId,
              resolution: 'IMPORT_AS_TX',
              category: cat.id,
            });
          } else {
            existingAssignments.push({ transactionId: tx.id, categoryId: cat.id });
          }
        }
      }

      // Unassigned draft rows with no matchKind quirks → import as tx with suggested category
      for (const tx of state.unassignedTransactions) {
        if (tx.importRowId) {
          draftResolutions.push({
            rowId: tx.importRowId,
            resolution: 'IMPORT_AS_TX',
            category: tx.aiSuggestedCategoryId || 'uncategorized',
          });
        }
      }

      // Unresolved recurring candidates still in the list — default to link
      for (const tx of state.recurringCandidates) {
        if (tx.importRowId) {
          draftResolutions.push({
            rowId: tx.importRowId,
            resolution: 'LINK_RECURRING',
            category: null,
          });
        }
      }

      // Recurring candidates the user explicitly confirmed as linked
      for (const rowId of state.linkedRecurringRowIds) {
        draftResolutions.push({
          rowId,
          resolution: 'LINK_RECURRING',
          category: null,
        });
      }

      // Hidden duplicates — skip
      for (const tx of state.hiddenDuplicates) {
        if (tx.importRowId) {
          draftResolutions.push({
            rowId: tx.importRowId,
            resolution: 'SKIP_DUPLICATE',
            category: null,
          });
        }
      }

      setSaveStatus('saving');

      // 1. Categorize existing transactions
      if (existingAssignments.length > 0) {
        await apiFetch('/api/workspace/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignments: existingAssignments }),
        });
      }

      // 2. Finalize import session (create transactions + recurring coverages)
      if (sessionId && draftResolutions.length > 0) {
        const finalizeRes = await apiFetch('/api/workspace/import/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, resolutions: draftResolutions }),
        });
        if (!finalizeRes.ok) {
          const errData = await finalizeRes.json();
          console.error('[Workspace] Finalize error:', errData);
        }
      }

      // 3. Also call existing finalize for month-level operations
      await apiFetch('/api/workspace/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthKey, assignments: existingAssignments }),
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
              onResolveRecurring={handleResolveRecurring}
              onPromoteDuplicate={promoteDuplicateToInbox}
              onBulkPromoteDuplicates={bulkPromoteDuplicates}
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

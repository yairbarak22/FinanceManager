import { create } from 'zustand';
import type {
  WorkspaceTransaction,
  WorkspaceCategory,
  SaveStatus,
  UndoAction,
  ImportMatchKind,
} from './types';

export interface ImportStageCounts {
  total: number;
  new: number;
  exactDuplicates: number;
  recurringCandidates: number;
}

interface WorkspaceState {
  unassignedTransactions: WorkspaceTransaction[];
  categories: WorkspaceCategory[];

  selectedIds: Set<string>;
  activeDragId: string | null;
  overDropId: string | null;
  saveStatus: SaveStatus;
  undoHistory: UndoAction[];
  duplicateIds: Set<string>;

  totalTransactions: number;
  categorizedCount: number;

  /** Import session tracking */
  importSessionId: string | null;
  importCounts: ImportStageCounts | null;
  recurringCandidates: WorkspaceTransaction[];
  linkedRecurringRowIds: string[];
  hiddenDuplicates: WorkspaceTransaction[];

  initWorkspace: (txns: WorkspaceTransaction[], cats: WorkspaceCategory[]) => void;
  moveToCategory: (txId: string, catId: string) => void;
  bulkMoveToCategory: (txIds: string[], catId: string) => void;
  approveAllAiSuggestions: () => void;
  undoLastAction: () => void;
  toggleSelect: (txId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  addCategory: (cat: WorkspaceCategory) => void;
  removeCategory: (categoryId: string) => void;
  deleteTransaction: (txId: string) => void;
  bulkDelete: (txIds: string[]) => void;
  setActiveDrag: (id: string | null) => void;
  setOverDrop: (id: string | null) => void;
  setSaveStatus: (s: SaveStatus) => void;
  setDuplicateIds: (ids: Set<string>) => void;
  removeDuplicates: () => void;
  setImportSession: (sessionId: string, counts: ImportStageCounts) => void;
  resolveRecurringCandidate: (txId: string, action: 'link' | 'import') => void;
  promoteDuplicateToInbox: (txId: string) => void;
  bulkPromoteDuplicates: (txIds: string[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  unassignedTransactions: [],
  categories: [],
  selectedIds: new Set(),
  activeDragId: null,
  overDropId: null,
  saveStatus: 'idle',
  undoHistory: [],
  duplicateIds: new Set(),
  totalTransactions: 0,
  categorizedCount: 0,
  importSessionId: null,
  importCounts: null,
  recurringCandidates: [],
  linkedRecurringRowIds: [],
  hiddenDuplicates: [],

  initWorkspace: (txns, cats) => {
    const recurringCandidates = txns.filter(
      (t) => t.matchKind === 'RECURRING_CANDIDATE'
    );
    const hiddenDuplicates = txns.filter(
      (t) => t.matchKind === 'EXACT_DUPLICATE'
    );
    const unassigned = txns.filter(
      (t) => t.status === 'UNCATEGORIZED' && t.matchKind !== 'EXACT_DUPLICATE' && t.matchKind !== 'RECURRING_CANDIDATE'
    );

    const catsWithTx = cats.map((cat) => ({
      ...cat,
      assignedTransactions: txns.filter(
        (t) => t.status === 'CONFIRMED' && t.categoryId === cat.id
      ),
      pendingAiTransactions: txns.filter(
        (t) => t.status === 'AI_SUGGESTED' && t.aiSuggestedCategoryId === cat.id
      ),
    }));

    const categorized = txns.filter(
      (t) => t.status === 'CONFIRMED' || t.status === 'AI_SUGGESTED'
    ).length;

    set({
      unassignedTransactions: unassigned,
      categories: catsWithTx,
      totalTransactions: txns.length,
      categorizedCount: categorized,
      selectedIds: new Set(),
      undoHistory: [],
      duplicateIds: new Set(),
      saveStatus: 'idle',
      recurringCandidates,
      linkedRecurringRowIds: [],
      hiddenDuplicates,
    });
  },

  moveToCategory: (txId, catId) => {
    const { unassignedTransactions, categories } = get();

    let tx = unassignedTransactions.find((t) => t.id === txId);
    let fromCatId: string | null = null;

    if (!tx) {
      for (const cat of categories) {
        const fromAssigned = cat.assignedTransactions.find((t) => t.id === txId);
        const fromPending = cat.pendingAiTransactions.find((t) => t.id === txId);
        if (fromAssigned || fromPending) {
          tx = fromAssigned || fromPending;
          fromCatId = cat.id;
          break;
        }
      }
    }
    if (!tx) return;

    const movedTx: WorkspaceTransaction = {
      ...tx,
      categoryId: catId,
      status: 'CONFIRMED',
    };

    const newUnassigned = unassignedTransactions.filter((t) => t.id !== txId);
    const newCategories = categories.map((cat) => {
      let assigned = cat.assignedTransactions.filter((t) => t.id !== txId);
      const pending = cat.pendingAiTransactions.filter((t) => t.id !== txId);
      if (cat.id === catId) {
        assigned = [...assigned, movedTx];
      }
      return {
        ...cat,
        assignedTransactions: assigned,
        pendingAiTransactions: pending,
        currentSpent:
          cat.id === catId
            ? cat.currentSpent + Math.abs(movedTx.amount)
            : fromCatId === cat.id
              ? cat.currentSpent - Math.abs(movedTx.amount)
              : cat.currentSpent,
      };
    });

    const newHistory: UndoAction = {
      type: 'move',
      txIds: [txId],
      fromCategoryId: fromCatId,
      toCategoryId: catId,
    };

    set((s) => ({
      unassignedTransactions: newUnassigned,
      categories: newCategories,
      undoHistory: [...s.undoHistory, newHistory],
      categorizedCount: s.categorizedCount + (fromCatId ? 0 : 1),
      selectedIds: new Set([...s.selectedIds].filter((id) => id !== txId)),
    }));
  },

  bulkMoveToCategory: (txIds, catId) => {
    for (const id of txIds) {
      get().moveToCategory(id, catId);
    }
  },

  approveAllAiSuggestions: () => {
    const { categories } = get();
    const newCategories = categories.map((cat) => {
      if (cat.pendingAiTransactions.length === 0) return cat;
      const approved = cat.pendingAiTransactions.map((tx) => ({
        ...tx,
        status: 'CONFIRMED' as const,
        categoryId: cat.id,
      }));
      return {
        ...cat,
        assignedTransactions: [...cat.assignedTransactions, ...approved],
        pendingAiTransactions: [],
      };
    });

    const totalApproved = categories.reduce(
      (sum, c) => sum + c.pendingAiTransactions.length,
      0
    );

    set((s) => ({
      categories: newCategories,
      categorizedCount: s.categorizedCount + totalApproved,
    }));
  },

  undoLastAction: () => {
    const { undoHistory, categories, unassignedTransactions } = get();
    if (undoHistory.length === 0) return;

    const last = undoHistory[undoHistory.length - 1];

    // Handle undo of delete
    if (last.type === 'delete' && last.deletedTransactions) {
      const newUnassigned = [...unassignedTransactions];
      let newCategories = categories.map((c) => ({ ...c }));
      let restoredCategorized = 0;

      for (const tx of last.deletedTransactions) {
        if (last.fromCategoryId) {
          newCategories = newCategories.map((cat) =>
            cat.id === last.fromCategoryId
              ? {
                  ...cat,
                  assignedTransactions: [...cat.assignedTransactions, tx],
                  currentSpent: cat.currentSpent + Math.abs(tx.amount),
                }
              : cat
          );
          restoredCategorized++;
        } else {
          newUnassigned.push(tx);
        }
      }

      set((s) => ({
        unassignedTransactions: newUnassigned,
        categories: newCategories,
        undoHistory: undoHistory.slice(0, -1),
        totalTransactions: s.totalTransactions + last.deletedTransactions!.length,
        categorizedCount: s.categorizedCount + restoredCategorized,
      }));
      return;
    }

    // Handle undo of move
    const newUnassigned = [...unassignedTransactions];
    let newCategories = categories.map((c) => ({ ...c }));
    let countDelta = 0;

    for (const txId of last.txIds) {
      let tx: WorkspaceTransaction | undefined;

      const toCat = newCategories.find((c) => c.id === last.toCategoryId);
      if (toCat) {
        tx =
          toCat.assignedTransactions.find((t) => t.id === txId) ||
          toCat.pendingAiTransactions.find((t) => t.id === txId);
      }
      if (!tx) continue;

      newCategories = newCategories.map((cat) => ({
        ...cat,
        assignedTransactions: cat.assignedTransactions.filter((t) => t.id !== txId),
        pendingAiTransactions: cat.pendingAiTransactions.filter((t) => t.id !== txId),
        currentSpent:
          cat.id === last.toCategoryId
            ? cat.currentSpent - Math.abs(tx!.amount)
            : cat.id === last.fromCategoryId
              ? cat.currentSpent + Math.abs(tx!.amount)
              : cat.currentSpent,
      }));

      if (last.fromCategoryId) {
        const restored: WorkspaceTransaction = {
          ...tx,
          categoryId: last.fromCategoryId,
          status: 'CONFIRMED',
        };
        newCategories = newCategories.map((cat) =>
          cat.id === last.fromCategoryId
            ? { ...cat, assignedTransactions: [...cat.assignedTransactions, restored] }
            : cat
        );
      } else {
        const restored: WorkspaceTransaction = {
          ...tx,
          categoryId: null,
          status: 'UNCATEGORIZED',
        };
        newUnassigned.push(restored);
        countDelta--;
      }
    }

    set((s) => ({
      unassignedTransactions: newUnassigned,
      categories: newCategories,
      undoHistory: undoHistory.slice(0, -1),
      categorizedCount: s.categorizedCount + countDelta,
    }));
  },

  toggleSelect: (txId) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(txId)) next.delete(txId);
      else next.add(txId);
      return { selectedIds: next };
    }),

  selectAll: () =>
    set((s) => ({
      selectedIds: new Set(s.unassignedTransactions.map((t) => t.id)),
    })),

  clearSelection: () => set({ selectedIds: new Set() }),

  addCategory: (cat) => {
    set((s) => ({
      categories: [...s.categories, { ...cat, assignedTransactions: [], pendingAiTransactions: [] }],
    }));
  },

  removeCategory: (categoryId) => {
    const { categories, unassignedTransactions } = get();
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;

    const returnedTxns = [...cat.assignedTransactions, ...cat.pendingAiTransactions].map((tx) => ({
      ...tx,
      categoryId: null,
      status: 'UNCATEGORIZED' as const,
    }));

    set((s) => ({
      categories: s.categories.filter((c) => c.id !== categoryId),
      unassignedTransactions: [...unassignedTransactions, ...returnedTxns],
      categorizedCount: s.categorizedCount - (cat.assignedTransactions.length + cat.pendingAiTransactions.length),
    }));
  },

  deleteTransaction: (txId) => {
    const { unassignedTransactions, categories } = get();

    let tx: WorkspaceTransaction | undefined;
    let fromCatId: string | null = null;

    tx = unassignedTransactions.find((t) => t.id === txId);
    if (!tx) {
      for (const cat of categories) {
        const found =
          cat.assignedTransactions.find((t) => t.id === txId) ||
          cat.pendingAiTransactions.find((t) => t.id === txId);
        if (found) {
          tx = found;
          fromCatId = cat.id;
          break;
        }
      }
    }
    if (!tx) return;

    const wasCategorized = fromCatId !== null;

    set((s) => ({
      unassignedTransactions: s.unassignedTransactions.filter((t) => t.id !== txId),
      categories: s.categories.map((cat) => ({
        ...cat,
        assignedTransactions: cat.assignedTransactions.filter((t) => t.id !== txId),
        pendingAiTransactions: cat.pendingAiTransactions.filter((t) => t.id !== txId),
        currentSpent: cat.id === fromCatId ? cat.currentSpent - Math.abs(tx!.amount) : cat.currentSpent,
      })),
      totalTransactions: s.totalTransactions - 1,
      categorizedCount: wasCategorized ? s.categorizedCount - 1 : s.categorizedCount,
      selectedIds: new Set([...s.selectedIds].filter((id) => id !== txId)),
      undoHistory: [
        ...s.undoHistory,
        {
          type: 'delete' as const,
          txIds: [txId],
          fromCategoryId: fromCatId,
          toCategoryId: '',
          deletedTransactions: [tx!],
        },
      ],
    }));
  },

  bulkDelete: (txIds) => {
    for (const id of txIds) {
      get().deleteTransaction(id);
    }
  },

  setActiveDrag: (id) => set({ activeDragId: id }),
  setOverDrop: (id) => set({ overDropId: id }),
  setSaveStatus: (s) => set({ saveStatus: s }),

  setDuplicateIds: (ids) => set({ duplicateIds: ids }),

  removeDuplicates: () => {
    const { duplicateIds, unassignedTransactions, categories } = get();
    if (duplicateIds.size === 0) return;

    const idsToRemove = duplicateIds;
    const newUnassigned = unassignedTransactions.filter((t) => !idsToRemove.has(t.id));
    const removedFromUnassigned = unassignedTransactions.length - newUnassigned.length;

    let removedFromCats = 0;
    const newCategories = categories.map((cat) => {
      const newAssigned = cat.assignedTransactions.filter((t) => !idsToRemove.has(t.id));
      const newPending = cat.pendingAiTransactions.filter((t) => !idsToRemove.has(t.id));
      const catRemoved = (cat.assignedTransactions.length - newAssigned.length) + (cat.pendingAiTransactions.length - newPending.length);
      removedFromCats += catRemoved;
      const removedAmount = [...cat.assignedTransactions, ...cat.pendingAiTransactions]
        .filter((t) => idsToRemove.has(t.id))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        ...cat,
        assignedTransactions: newAssigned,
        pendingAiTransactions: newPending,
        currentSpent: cat.currentSpent - removedAmount,
      };
    });

    const totalRemoved = removedFromUnassigned + removedFromCats;

    set((s) => ({
      unassignedTransactions: newUnassigned,
      categories: newCategories,
      duplicateIds: new Set(),
      totalTransactions: s.totalTransactions - totalRemoved,
      categorizedCount: s.categorizedCount - removedFromCats,
      selectedIds: new Set([...s.selectedIds].filter((id) => !idsToRemove.has(id))),
    }));
  },

  setImportSession: (sessionId, counts) => set({ importSessionId: sessionId, importCounts: counts }),

  resolveRecurringCandidate: (txId, action) => {
    const { recurringCandidates, unassignedTransactions } = get();
    const tx = recurringCandidates.find((t) => t.id === txId);
    if (!tx) return;

    const remaining = recurringCandidates.filter((t) => t.id !== txId);

    if (action === 'import') {
      const asTx: WorkspaceTransaction = {
        ...tx,
        matchKind: 'NEW',
        status: 'UNCATEGORIZED',
        categoryId: null,
      };
      set({
        recurringCandidates: remaining,
        unassignedTransactions: [...unassignedTransactions, asTx],
      });
    } else {
      set((s) => ({
        recurringCandidates: remaining,
        ...(tx.importRowId
          ? { linkedRecurringRowIds: [...s.linkedRecurringRowIds, tx.importRowId] }
          : {}),
      }));
    }
  },

  promoteDuplicateToInbox: (txId) => {
    const { hiddenDuplicates, unassignedTransactions, importCounts } = get();
    const tx = hiddenDuplicates.find((t) => t.id === txId);
    if (!tx) return;

    const promoted: WorkspaceTransaction = {
      ...tx,
      matchKind: 'NEW',
      status: 'UNCATEGORIZED',
      categoryId: null,
    };

    set({
      hiddenDuplicates: hiddenDuplicates.filter((t) => t.id !== txId),
      unassignedTransactions: [...unassignedTransactions, promoted],
      importCounts: importCounts ? {
        ...importCounts,
        exactDuplicates: Math.max(0, importCounts.exactDuplicates - 1),
        new: importCounts.new + 1,
      } : null,
    });
  },

  bulkPromoteDuplicates: (txIds) => {
    const { hiddenDuplicates, unassignedTransactions, importCounts } = get();
    const idsSet = new Set(txIds);
    const toPromote = hiddenDuplicates.filter((t) => idsSet.has(t.id));
    if (toPromote.length === 0) return;

    const promoted = toPromote.map((tx): WorkspaceTransaction => ({
      ...tx,
      matchKind: 'NEW',
      status: 'UNCATEGORIZED',
      categoryId: null,
    }));

    set({
      hiddenDuplicates: hiddenDuplicates.filter((t) => !idsSet.has(t.id)),
      unassignedTransactions: [...unassignedTransactions, ...promoted],
      importCounts: importCounts ? {
        ...importCounts,
        exactDuplicates: Math.max(0, importCounts.exactDuplicates - promoted.length),
        new: importCounts.new + promoted.length,
      } : null,
    });
  },
}));

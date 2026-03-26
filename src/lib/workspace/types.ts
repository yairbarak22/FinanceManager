export type AiConfidence = 'HIGH' | 'LOW' | 'NONE';
export type TxStatus = 'UNCATEGORIZED' | 'AI_SUGGESTED' | 'CONFIRMED';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type ImportMatchKind = 'NEW' | 'EXACT_DUPLICATE' | 'RECURRING_CANDIDATE';

export interface WorkspaceTransaction {
  id: string;
  date: string;
  description: string;
  cleanName?: string;
  amount: number;
  type: 'income' | 'expense';
  currency: 'ILS' | 'USD';
  categoryId: string | null;
  aiSuggestedCategoryId?: string | null;
  aiConfidence: AiConfidence;
  status: TxStatus;
  isDuplicate?: boolean;
  /** Set on draft rows from an import session */
  importRowId?: string;
  matchKind?: ImportMatchKind;
  matchedRecurringId?: string | null;
  matchedRecurringName?: string | null;
  matchedRecurringCategory?: string | null;
}

export interface WorkspaceCategory {
  id: string;
  name: string;
  nameHe: string;
  icon: string;
  colorTheme: string;
  bgColor: string;
  textColor: string;
  isCustom: boolean;
  monthlyBudget: number;
  currentSpent: number;
  assignedTransactions: WorkspaceTransaction[];
  pendingAiTransactions: WorkspaceTransaction[];
}

export interface ImportDraftRow {
  id: string;
  date: string;
  amount: number;
  type: string;
  description: string;
  suggestedCategory: string | null;
  matchKind: string;
  matchedTransactionId: string | null;
  matchedRecurringId: string | null;
  matchedRecurringName?: string | null;
  matchedRecurringCategory?: string | null;
  userResolution: string;
  finalCategory: string | null;
}

export interface StageResponse {
  sessionId: string;
  monthKey: string;
  rows: ImportDraftRow[];
  counts: {
    total: number;
    new: number;
    exactDuplicates: number;
    recurringCandidates: number;
  };
}

export interface WorkspaceSessionResponse {
  transactions: WorkspaceTransaction[];
  categories: WorkspaceCategory[];
  monthKey: string;
  importDraftRows?: ImportDraftRow[];
}

export interface UndoAction {
  type: 'move' | 'delete';
  txIds: string[];
  fromCategoryId: string | null;
  toCategoryId: string;
  deletedTransactions?: WorkspaceTransaction[];
}

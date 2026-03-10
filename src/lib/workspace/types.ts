export type AiConfidence = 'HIGH' | 'LOW' | 'NONE';
export type TxStatus = 'UNCATEGORIZED' | 'AI_SUGGESTED' | 'CONFIRMED';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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

export interface WorkspaceSessionResponse {
  transactions: WorkspaceTransaction[];
  categories: WorkspaceCategory[];
  monthKey: string;
}

export interface UndoAction {
  type: 'move' | 'delete';
  txIds: string[];
  fromCategoryId: string | null;
  toCategoryId: string;
  deletedTransactions?: WorkspaceTransaction[];
}

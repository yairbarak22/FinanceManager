// API functions for recurring transactions
export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  lastExecuted?: string;
  nextExecution?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringFilters {
  type?: 'income' | 'expense';
  isActive?: boolean;
}

export interface CreateRecurringInput {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateRecurringInput extends Partial<CreateRecurringInput> {
  id: string;
  isActive?: boolean;
}

// Fetch all recurring transactions
export async function fetchRecurringTransactions(filters?: RecurringFilters): Promise<RecurringTransaction[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  
  const url = `/api/recurring${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch recurring transactions');
  }
  
  return response.json();
}

// Create a new recurring transaction
export async function createRecurringTransaction(input: CreateRecurringInput): Promise<RecurringTransaction> {
  const response = await fetch('/api/recurring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create recurring transaction');
  }
  
  return response.json();
}

// Update an existing recurring transaction
export async function updateRecurringTransaction({ id, ...data }: UpdateRecurringInput): Promise<RecurringTransaction> {
  const response = await fetch(`/api/recurring/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update recurring transaction');
  }
  
  return response.json();
}

// Delete a recurring transaction
export async function deleteRecurringTransaction(id: string): Promise<void> {
  const response = await fetch(`/api/recurring/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete recurring transaction');
  }
}


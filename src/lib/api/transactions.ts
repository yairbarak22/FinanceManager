// API functions for transactions
import { apiFetch } from '@/lib/utils';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category: string;
  date: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  month?: string;
  type?: 'income' | 'expense';
  category?: string;
}

export interface CreateTransactionInput {
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category: string;
  date: string;
  paymentMethod?: string;
  notes?: string;
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {
  id: string;
}

// Fetch transactions with optional filters
export async function fetchTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (filters?.month) params.append('month', filters.month);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.category) params.append('category', filters.category);
  
  const url = `/api/transactions${params.toString() ? `?${params}` : ''}`;
  const response = await apiFetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  
  return response.json();
}

// Create a new transaction
export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const response = await apiFetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create transaction');
  }
  
  return response.json();
}

// Update an existing transaction
export async function updateTransaction({ id, ...data }: UpdateTransactionInput): Promise<Transaction> {
  const response = await apiFetch(`/api/transactions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update transaction');
  }
  
  return response.json();
}

// Delete a transaction
export async function deleteTransaction(id: string): Promise<void> {
  const response = await apiFetch(`/api/transactions/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete transaction');
  }
}


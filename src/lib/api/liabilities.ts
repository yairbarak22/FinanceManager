// API functions for liabilities
import { apiFetch } from '@/lib/utils';

export interface Liability {
  id: string;
  name: string;
  category: string;
  originalAmount: number;
  currentBalance: number;
  interestRate?: number;
  monthlyPayment?: number;
  dueDate?: string;
  notes?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiabilityFilters {
  category?: string;
}

export interface CreateLiabilityInput {
  name: string;
  category: string;
  originalAmount: number;
  currentBalance: number;
  interestRate?: number;
  monthlyPayment?: number;
  dueDate?: string;
  notes?: string;
  currency?: string;
}

export interface UpdateLiabilityInput extends Partial<CreateLiabilityInput> {
  id: string;
}

// Fetch all liabilities
export async function fetchLiabilities(filters?: LiabilityFilters): Promise<Liability[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  
  const url = `/api/liabilities${params.toString() ? `?${params}` : ''}`;
  const response = await apiFetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch liabilities');
  }
  
  return response.json();
}

// Create a new liability
export async function createLiability(input: CreateLiabilityInput): Promise<Liability> {
  const response = await apiFetch('/api/liabilities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create liability');
  }
  
  return response.json();
}

// Update an existing liability
export async function updateLiability({ id, ...data }: UpdateLiabilityInput): Promise<Liability> {
  const response = await apiFetch(`/api/liabilities/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update liability');
  }
  
  return response.json();
}

// Delete a liability
export async function deleteLiability(id: string): Promise<void> {
  const response = await apiFetch(`/api/liabilities/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete liability');
  }
}


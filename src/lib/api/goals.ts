// API functions for financial goals
import { apiFetch } from '@/lib/utils';

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  icon?: string;
  recurringTransactionId?: string;
  recurringTransaction?: {
    id: string;
    name: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline: string;
  category?: string;
  icon?: string;
  recurringTransactionId?: string;
}

export interface UpdateGoalInput extends Partial<CreateGoalInput> {
  id: string;
}

// Fetch all financial goals
export async function fetchGoals(): Promise<FinancialGoal[]> {
  const response = await apiFetch('/api/goals');
  
  if (!response.ok) {
    throw new Error('Failed to fetch goals');
  }
  
  return response.json();
}

// Fetch a single goal by ID
export async function fetchGoal(id: string): Promise<FinancialGoal> {
  const response = await apiFetch(`/api/goals/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch goal');
  }
  
  return response.json();
}

// Create a new financial goal
export async function createGoal(input: CreateGoalInput): Promise<FinancialGoal> {
  const response = await apiFetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create goal');
  }
  
  return response.json();
}

// Update a financial goal
export async function updateGoal({ id, ...data }: UpdateGoalInput): Promise<FinancialGoal> {
  const response = await apiFetch(`/api/goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update goal');
  }
  
  return response.json();
}

// Partially update a goal (e.g., just update currentAmount)
export async function patchGoal(id: string, data: Partial<CreateGoalInput>): Promise<FinancialGoal> {
  const response = await apiFetch(`/api/goals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update goal');
  }
  
  return response.json();
}

// Delete a financial goal
export async function deleteGoal(id: string): Promise<void> {
  const response = await apiFetch(`/api/goals/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete goal');
  }
}

// Link a goal to a recurring transaction
export async function linkGoalToRecurring(
  goalId: string, 
  recurringTransactionId: string
): Promise<FinancialGoal> {
  return patchGoal(goalId, { recurringTransactionId });
}

// Unlink a goal from its recurring transaction
export async function unlinkGoalFromRecurring(goalId: string): Promise<FinancialGoal> {
  const response = await apiFetch(`/api/goals/${goalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recurringTransactionId: null }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unlink goal');
  }
  
  return response.json();
}


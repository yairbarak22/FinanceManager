'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  RecurringTransaction,
  RecurringFilters,
  CreateRecurringInput,
  UpdateRecurringInput,
} from '@/lib/api/recurring';

// Query keys
export const recurringKeys = {
  all: ['recurring'] as const,
  lists: () => [...recurringKeys.all, 'list'] as const,
  list: (filters?: RecurringFilters) => [...recurringKeys.lists(), filters] as const,
  details: () => [...recurringKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurringKeys.details(), id] as const,
};

// Hook to fetch recurring transactions
export function useRecurringTransactions(filters?: RecurringFilters) {
  return useQuery({
    queryKey: recurringKeys.list(filters),
    queryFn: () => fetchRecurringTransactions(filters),
    staleTime: 30000,
  });
}

// Hook to create a recurring transaction
export function useCreateRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecurringInput) => createRecurringTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.lists() });
    },
  });
}

// Hook to update a recurring transaction
export function useUpdateRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRecurringInput) => updateRecurringTransaction(input),
    onMutate: async (updatedRecurring) => {
      await queryClient.cancelQueries({ queryKey: recurringKeys.lists() });
      const previousRecurring = queryClient.getQueryData<RecurringTransaction[]>(recurringKeys.lists());

      if (previousRecurring) {
        queryClient.setQueryData<RecurringTransaction[]>(
          recurringKeys.lists(),
          previousRecurring.map((r) =>
            r.id === updatedRecurring.id ? { ...r, ...updatedRecurring } : r
          )
        );
      }

      return { previousRecurring };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRecurring) {
        queryClient.setQueryData(recurringKeys.lists(), context.previousRecurring);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.lists() });
    },
  });
}

// Hook to delete a recurring transaction
export function useDeleteRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRecurringTransaction(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: recurringKeys.lists() });
      const previousRecurring = queryClient.getQueryData<RecurringTransaction[]>(recurringKeys.lists());

      if (previousRecurring) {
        queryClient.setQueryData<RecurringTransaction[]>(
          recurringKeys.lists(),
          previousRecurring.filter((r) => r.id !== deletedId)
        );
      }

      return { previousRecurring };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRecurring) {
        queryClient.setQueryData(recurringKeys.lists(), context.previousRecurring);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.lists() });
    },
  });
}


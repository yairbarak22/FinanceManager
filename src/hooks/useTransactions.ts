'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  Transaction,
  TransactionFilters,
  CreateTransactionInput,
  UpdateTransactionInput,
} from '@/lib/api/transactions';
import { goalKeys } from './useGoals';

// Query keys
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters?: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

// Hook to fetch transactions
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
    staleTime: 30000, // 30 seconds
  });
}

// Hook to create a transaction
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: () => {
      // Invalidate all transaction lists
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      // Also invalidate goals (transaction may update goal's currentAmount)
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
    },
  });
}

// Hook to update a transaction
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTransactionInput) => updateTransaction(input),
    onMutate: async (updatedTransaction) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: transactionKeys.lists() });

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData<Transaction[]>(transactionKeys.lists());

      // Optimistically update
      if (previousTransactions) {
        queryClient.setQueryData<Transaction[]>(
          transactionKeys.lists(),
          previousTransactions.map((t) =>
            t.id === updatedTransaction.id ? { ...t, ...updatedTransaction } : t
          )
        );
      }

      return { previousTransactions };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(transactionKeys.lists(), context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      // Also invalidate goals (transaction may update goal's currentAmount)
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
    },
  });
}

// Hook to delete a transaction
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.lists() });
      const previousTransactions = queryClient.getQueryData<Transaction[]>(transactionKeys.lists());

      if (previousTransactions) {
        queryClient.setQueryData<Transaction[]>(
          transactionKeys.lists(),
          previousTransactions.filter((t) => t.id !== deletedId)
        );
      }

      return { previousTransactions };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(transactionKeys.lists(), context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      // Also invalidate goals (deleted transaction may affect goal's currentAmount)
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
    },
  });
}


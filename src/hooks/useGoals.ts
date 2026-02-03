'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  patchGoal,
  FinancialGoal,
  CreateGoalInput,
  UpdateGoalInput,
} from '@/lib/api/goals';

// Query keys
export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: () => [...goalKeys.lists()] as const,
  details: () => [...goalKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalKeys.details(), id] as const,
};

// Hook to fetch all financial goals
export function useGoals() {
  return useQuery({
    queryKey: goalKeys.list(),
    queryFn: fetchGoals,
    staleTime: 30000, // 30 seconds
  });
}

// Hook to create a new financial goal
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGoalInput) => createGoal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
    },
  });
}

// Hook to update a financial goal
export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGoalInput) => updateGoal(input),
    onMutate: async (updatedGoal) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.lists() });
      const previousGoals = queryClient.getQueryData<FinancialGoal[]>(goalKeys.lists());

      if (previousGoals) {
        queryClient.setQueryData<FinancialGoal[]>(
          goalKeys.lists(),
          previousGoals.map((g) =>
            g.id === updatedGoal.id ? { ...g, ...updatedGoal } : g
          )
        );
      }

      return { previousGoals };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalKeys.lists(), context.previousGoals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
    },
  });
}

// Hook to partially update a goal (e.g., just currentAmount)
export function usePatchGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateGoalInput> }) => 
      patchGoal(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.lists() });
      const previousGoals = queryClient.getQueryData<FinancialGoal[]>(goalKeys.lists());

      if (previousGoals) {
        queryClient.setQueryData<FinancialGoal[]>(
          goalKeys.lists(),
          previousGoals.map((g) =>
            g.id === id ? { ...g, ...data } : g
          )
        );
      }

      return { previousGoals };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalKeys.lists(), context.previousGoals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
    },
  });
}

// Hook to delete a financial goal
export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.lists() });
      const previousGoals = queryClient.getQueryData<FinancialGoal[]>(goalKeys.lists());

      if (previousGoals) {
        queryClient.setQueryData<FinancialGoal[]>(
          goalKeys.lists(),
          previousGoals.filter((g) => g.id !== deletedId)
        );
      }

      return { previousGoals };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalKeys.lists(), context.previousGoals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
    },
  });
}


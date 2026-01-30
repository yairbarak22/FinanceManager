'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLiabilities,
  createLiability,
  updateLiability,
  deleteLiability,
  Liability,
  LiabilityFilters,
  CreateLiabilityInput,
  UpdateLiabilityInput,
} from '@/lib/api/liabilities';

// Query keys
export const liabilityKeys = {
  all: ['liabilities'] as const,
  lists: () => [...liabilityKeys.all, 'list'] as const,
  list: (filters?: LiabilityFilters) => [...liabilityKeys.lists(), filters] as const,
  details: () => [...liabilityKeys.all, 'detail'] as const,
  detail: (id: string) => [...liabilityKeys.details(), id] as const,
};

// Hook to fetch liabilities
export function useLiabilities(filters?: LiabilityFilters) {
  return useQuery({
    queryKey: liabilityKeys.list(filters),
    queryFn: () => fetchLiabilities(filters),
    staleTime: 30000,
  });
}

// Hook to create a liability
export function useCreateLiability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLiabilityInput) => createLiability(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liabilityKeys.lists() });
    },
  });
}

// Hook to update a liability
export function useUpdateLiability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLiabilityInput) => updateLiability(input),
    onMutate: async (updatedLiability) => {
      await queryClient.cancelQueries({ queryKey: liabilityKeys.lists() });
      const previousLiabilities = queryClient.getQueryData<Liability[]>(liabilityKeys.lists());

      if (previousLiabilities) {
        queryClient.setQueryData<Liability[]>(
          liabilityKeys.lists(),
          previousLiabilities.map((l) =>
            l.id === updatedLiability.id ? { ...l, ...updatedLiability } : l
          )
        );
      }

      return { previousLiabilities };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLiabilities) {
        queryClient.setQueryData(liabilityKeys.lists(), context.previousLiabilities);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: liabilityKeys.lists() });
    },
  });
}

// Hook to delete a liability
export function useDeleteLiability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLiability(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: liabilityKeys.lists() });
      const previousLiabilities = queryClient.getQueryData<Liability[]>(liabilityKeys.lists());

      if (previousLiabilities) {
        queryClient.setQueryData<Liability[]>(
          liabilityKeys.lists(),
          previousLiabilities.filter((l) => l.id !== deletedId)
        );
      }

      return { previousLiabilities };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLiabilities) {
        queryClient.setQueryData(liabilityKeys.lists(), context.previousLiabilities);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: liabilityKeys.lists() });
    },
  });
}


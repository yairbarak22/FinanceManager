'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  fetchAssetHistory,
  Asset,
  AssetFilters,
  CreateAssetInput,
  UpdateAssetInput,
} from '@/lib/api/assets';

// Query keys
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters?: AssetFilters) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  history: (assetId?: string) => [...assetKeys.all, 'history', assetId] as const,
};

// Hook to fetch assets
export function useAssets(filters?: AssetFilters) {
  return useQuery({
    queryKey: assetKeys.list(filters),
    queryFn: () => fetchAssets(filters),
    staleTime: 30000,
  });
}

// Hook to fetch asset history
export function useAssetHistory(assetId?: string) {
  return useQuery({
    queryKey: assetKeys.history(assetId),
    queryFn: () => fetchAssetHistory(assetId),
    staleTime: 60000, // 1 minute
  });
}

// Hook to create an asset
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssetInput) => createAsset(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.history() });
    },
  });
}

// Hook to update an asset
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAssetInput) => updateAsset(input),
    onMutate: async (updatedAsset) => {
      await queryClient.cancelQueries({ queryKey: assetKeys.lists() });
      const previousAssets = queryClient.getQueryData<Asset[]>(assetKeys.lists());

      if (previousAssets) {
        queryClient.setQueryData<Asset[]>(
          assetKeys.lists(),
          previousAssets.map((a) =>
            a.id === updatedAsset.id ? { ...a, ...updatedAsset } : a
          )
        );
      }

      return { previousAssets };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(assetKeys.lists(), context.previousAssets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.history() });
    },
  });
}

// Hook to delete an asset
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: assetKeys.lists() });
      const previousAssets = queryClient.getQueryData<Asset[]>(assetKeys.lists());

      if (previousAssets) {
        queryClient.setQueryData<Asset[]>(
          assetKeys.lists(),
          previousAssets.filter((a) => a.id !== deletedId)
        );
      }

      return { previousAssets };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(assetKeys.lists(), context.previousAssets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.history() });
    },
  });
}


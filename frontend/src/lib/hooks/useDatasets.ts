'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import {
  DatasetCreate
} from '@/types/api'

// Query keys
const QUERY_KEYS = {
  datasets: ['datasets'] as const,
  dataset: (id: string) => ['dataset', id] as const,
  datasetColumns: (id: string) => ['dataset', id, 'columns'] as const,
  datasetVersions: (id: string) => ['dataset', id, 'versions'] as const,
  datasetProfile: (id: string) => ['dataset', id, 'profile'] as const,
}

// Hooks for datasets
export function useDatasets(page: number = 1, size: number = 20) {
  return useQuery({
    queryKey: [...QUERY_KEYS.datasets, page, size],
    queryFn: () => apiClient.getDatasets(),
  })
}

export function useDataset(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.dataset(id),
    queryFn: () => apiClient.getDataset(id),
    enabled: !!id,
  })
}

export function useDatasetColumns(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.datasetColumns(id),
    queryFn: () => apiClient.getDatasetColumns(id),
    enabled: !!id,
  })
}

export function useDatasetVersions(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.datasetVersions(id),
    queryFn: () => apiClient.getDatasetVersions(id),
    enabled: !!id,
  })
}

export function useDatasetProfile(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.datasetProfile(id),
    queryFn: () => apiClient.getDataProfile(id),
    enabled: !!id,
  })
}

// Mutation hooks
export function useCreateDataset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dataset: DatasetCreate) => apiClient.createDataset(dataset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.datasets })
    },
  })
}

export function useUpdateDataset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DatasetCreate> }) =>
      apiClient.updateDataset(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.datasets })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dataset(id) })
    },
  })
}

export function useDeleteDataset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDataset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.datasets })
    },
  })
}

export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      datasetName,
      description,
    }: {
      file: File
      datasetName: string
      description?: string
    }) => apiClient.uploadFile(file, datasetName, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.datasets })
    },
  })
}
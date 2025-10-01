"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { Execution, ExecutionCreate, PaginatedResponse } from "@/types/api";

// Query keys
const QUERY_KEYS = {
  executions: ["executions"] as const,
  execution: (id: string) => ["execution", id] as const,
  executionSummary: (id: string) => ["execution", id, "summary"] as const,
  executionIssues: (id: string) => ["execution", id, "issues"] as const,
};

// Hooks for executions
export function useExecutions(page: number = 1, size: number = 20) {
  return useQuery<PaginatedResponse<Execution>>({
    queryKey: [...QUERY_KEYS.executions, page, size],
    queryFn: () => apiClient.getExecutions(page, size),
  });
}

export function useExecution(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.execution(id),
    queryFn: () => apiClient.getExecution(id),
    enabled: !!id,
  });
}

export function useExecutionSummary(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.executionSummary(id),
    queryFn: () => apiClient.getExecutionSummary(id),
    enabled: !!id,
  });
}

export function useExecutionIssues(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.executionIssues(id),
    queryFn: () => apiClient.getIssues(id),
    enabled: !!id,
  });
}

// Mutation hooks
export function useCreateExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (execution: ExecutionCreate) =>
      apiClient.createExecution(execution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.executions });
    },
  });
}

export function useCancelExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Use apiClient instead of direct fetch to ensure correct URL
      return apiClient.delete(`/executions/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.executions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.execution(id) });
    },
  });
}

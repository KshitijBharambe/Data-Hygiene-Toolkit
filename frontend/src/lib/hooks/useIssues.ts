import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { useAuthenticatedApi } from "./useAuthenticatedApi";

export interface Issue {
  id: string;
  execution_id: string;
  rule_id: string;
  rule_snapshot?: string; // JSON snapshot of rule at execution time
  rule_name?: string;
  row_index: number;
  column_name: string;
  current_value?: string;
  suggested_value?: string;
  message?: string;
  category?: string;
  severity: string;
  created_at: string;
  resolved: boolean;
  fix_count: number;
  dataset_name?: string;
}

export interface DetailedIssue {
  id: string;
  execution_id: string;
  rule?: {
    id: string;
    name: string;
    description: string;
    kind: string;
    criticality: string;
  };
  dataset?: {
    id: string;
    name: string;
  };
  row_index: number;
  column_name: string;
  current_value?: string;
  suggested_value?: string;
  message?: string;
  category?: string;
  severity: string;
  created_at: string;
  resolved: boolean;
  fixes?: Array<{
    id: string;
    new_value?: string;
    comment?: string;
    fixed_at: string;
    fixer?: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export interface IssuesSummary {
  summary: {
    total_issues: number;
    recent_issues: number;
    resolved_issues: number;
    unresolved_issues: number;
    resolution_rate: number;
  };
  severity_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trends: {
    analysis_period_days: number;
    issues_by_day: Record<string, number>;
  };
  top_problematic_rules: Array<{
    rule_name: string;
    rule_kind: string;
    issue_count: number;
  }>;
}

export function useIssues(filters?: {
  severity?: string;
  resolved?: boolean;
  rule_id?: string;
  dataset_id?: string;
  execution_id?: string;
  limit?: number;
  offset?: number;
}) {
  const { isAuthenticated, hasToken } = useAuthenticatedApi();

  return useQuery<Issue[]>({
    queryKey: ["issues", filters],
    queryFn: async () => {
      try {
        // Use direct API call to /issues endpoint with proper parameters
        const params: Record<string, unknown> = {};

        if (filters?.severity) params.severity = filters.severity;
        if (filters?.resolved !== undefined) params.resolved = filters.resolved;
        if (filters?.rule_id) params.rule_id = filters.rule_id;
        if (filters?.dataset_id) params.dataset_id = filters.dataset_id;
        if (filters?.execution_id) params.execution_id = filters.execution_id;
        params.limit = filters?.limit || 50;
        params.offset = filters?.offset || 0;

        const response = await apiClient.get<Issue[]>("/issues/", { params });
        return response.data || [];
      } catch (error: unknown) {
        throw error;
      }
    },
    enabled: isAuthenticated && hasToken,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
  });
}

export function useIssuesSummary(days: number = 30) {
  const { isAuthenticated, hasToken } = useAuthenticatedApi();

  return useQuery<IssuesSummary>({
    queryKey: ["issues-summary", days],
    queryFn: async () => {
      try {
        const response = await apiClient.get<IssuesSummary>(
          `/issues/statistics/summary?days=${days}`
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    enabled: isAuthenticated && hasToken,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
  });
}

export function useIssue(issueId: string) {
  const { isAuthenticated, hasToken } = useAuthenticatedApi();

  return useQuery<DetailedIssue>({
    queryKey: ["issue", issueId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<DetailedIssue>(`/issues/${issueId}/`);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    enabled: isAuthenticated && hasToken && !!issueId,
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
  });
}

export async function createFix(
  issueId: string,
  fixData: {
    new_value?: string;
    comment?: string;
  }
) {
  const response = await apiClient.post(`/issues/${issueId}/fix/`, fixData);
  return response.data;
}

export async function resolveIssue(issueId: string) {
  const response = await apiClient.patch(`/issues/${issueId}/resolve/`);
  return response.data;
}

export async function unresolveIssue(issueId: string) {
  const response = await apiClient.patch(`/issues/${issueId}/unresolve/`);
  return response.data;
}

// Mutation hooks for better state management
export function useCreateFixMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, fixData }: {
      issueId: string;
      fixData: { new_value?: string; comment?: string }
    }) => createFix(issueId, fixData),
    onSuccess: () => {
      // Invalidate and refetch issues queries
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issues-summary"] });
      queryClient.invalidateQueries({ queryKey: ["issue"] });
    },
  });
}

export function useResolveIssueMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issueId: string) => resolveIssue(issueId),
    onSuccess: () => {
      // Invalidate and refetch issues queries
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issues-summary"] });
      queryClient.invalidateQueries({ queryKey: ["issue"] });
    },
  });
}

export function useUnresolveIssueMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issueId: string) => unresolveIssue(issueId),
    onSuccess: () => {
      // Invalidate and refetch issues queries
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issues-summary"] });
      queryClient.invalidateQueries({ queryKey: ["issue"] });
    },
  });
}

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { Rule, RuleCreate, RuleUpdate, PaginatedResponse, RuleTestRequest } from '@/types/api'
import { useAuthenticatedApi } from './useAuthenticatedApi'

export function useRules(page: number = 1, size: number = 20) {
  const { isAuthenticated, hasToken } = useAuthenticatedApi()

  return useQuery<PaginatedResponse<Rule>>({
    queryKey: ['rules', page, size],
    queryFn: () => apiClient.getRules(),
    enabled: isAuthenticated && hasToken,
    staleTime: 30000, // Consider data stale after 30 seconds
  })
}

export function useRule(id: string) {
  const { isAuthenticated, hasToken } = useAuthenticatedApi()

  return useQuery<Rule>({
    queryKey: ['rule', id],
    queryFn: () => apiClient.getRule(id),
    enabled: isAuthenticated && hasToken && !!id,
    staleTime: 60000, // Individual rules don't change as often
  })
}

export function useCreateRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ruleData: RuleCreate) => apiClient.createRule(ruleData),
    onSuccess: () => {
      // Invalidate rules list to refresh the cache
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
  })
}

export function useUpdateRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RuleUpdate }) =>
      apiClient.updateRule(id, data),
    onSuccess: (updatedRule) => {
      // Update the specific rule in cache
      queryClient.setQueryData(['rule', updatedRule.id], updatedRule)
      // Also invalidate the rules list
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
  })
}

export function useDeleteRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteRule(id),
    onSuccess: () => {
      // Invalidate rules list to refresh the cache
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
  })
}

export function useTestRule() {
  return useMutation({
    mutationFn: ({ ruleId, testData }: { ruleId: string; testData: RuleTestRequest }) =>
      apiClient.testRule(ruleId, testData),
  })
}

export function useRuleKinds() {
  const { isAuthenticated, hasToken } = useAuthenticatedApi()

  return useQuery({
    queryKey: ['rule-kinds'],
    queryFn: () => apiClient.getRuleKinds(),
    enabled: isAuthenticated && hasToken,
    staleTime: 300000, // Rule kinds don't change often - 5 minutes
  })
}

export function useActivateRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.activateRule(id),
    onSuccess: (_, id) => {
      // Update the specific rule in cache
      queryClient.invalidateQueries({ queryKey: ['rule', id] })
      // Also invalidate the rules list
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
  })
}

export function useDeactivateRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.deactivateRule(id),
    onSuccess: (_, id) => {
      // Update the specific rule in cache
      queryClient.invalidateQueries({ queryKey: ['rule', id] })
      // Also invalidate the rules list
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
  })
}
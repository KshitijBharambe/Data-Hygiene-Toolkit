'use client'

import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { DashboardOverview } from '@/types/api'
import { useAuthenticatedApi } from './useAuthenticatedApi'

export function useDashboardOverview() {
  const { isAuthenticated, hasToken } = useAuthenticatedApi()

  return useQuery<DashboardOverview>({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      try {
        const result = await apiClient.getDashboardOverview()
        return result
      } catch (error) {
        throw error
      }
    },
    enabled: isAuthenticated && hasToken,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: (failureCount, error) => {
      return failureCount < 3
    }
  })
}
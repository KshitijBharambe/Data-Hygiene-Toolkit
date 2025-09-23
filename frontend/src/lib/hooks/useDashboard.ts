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
      console.log('Fetching dashboard data...', {
        isAuthenticated,
        hasToken,
        currentToken: apiClient.getToken() ? 'present' : 'missing'
      })

      try {
        const result = await apiClient.getDashboardOverview()
        console.log('Dashboard data success:', result)
        return result
      } catch (error) {
        console.error('Dashboard data error:', error)
        throw error
      }
    },
    enabled: isAuthenticated && hasToken,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
    retry: (failureCount, error) => {
      console.log('Query retry attempt:', { failureCount, error })
      return failureCount < 3
    }
  })
}
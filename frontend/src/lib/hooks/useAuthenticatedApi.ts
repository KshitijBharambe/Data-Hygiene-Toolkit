'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'

/**
 * Hook to ensure API client is authenticated with current session token
 */
export function useAuthenticatedApi() {
  const { data: session, status } = useSession()
  const [tokenSynced, setTokenSynced] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      // Set token in API client whenever session updates
      console.log('🔑 Setting token from session:', {
        hasToken: !!session.accessToken,
        tokenLength: (session.accessToken as string)?.length
      })
      apiClient.setToken(session.accessToken as string)
      setTokenSynced(true)
    } else if (status === 'unauthenticated') {
      // Clear token if user is not authenticated
      console.log('🔓 Clearing token - user unauthenticated')
      apiClient.clearToken()
      setTokenSynced(false)
    } else {
      // Status is 'loading'
      console.log('⏳ Auth status:', status)
      setTokenSynced(false)
    }
  }, [session?.accessToken, status])

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    hasToken: !!session?.accessToken && tokenSynced
  }
}
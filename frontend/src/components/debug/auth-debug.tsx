'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import apiClient from '@/lib/api'
import { getApiUrl } from '@/lib/config'

export function AuthDebug() {
  const { data: session, status } = useSession()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm text-orange-800">🔧 Auth Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div><strong>Status:</strong> {status}</div>
        <div><strong>Has Session:</strong> {session ? 'Yes' : 'No'}</div>
        <div><strong>User Name:</strong> {session?.user?.name || 'N/A'}</div>
        <div><strong>User Email:</strong> {session?.user?.email || 'N/A'}</div>
        <div><strong>User Role:</strong> {session?.user?.role || 'N/A'}</div>
        <div><strong>Has Access Token:</strong> {session?.accessToken ? 'Yes' : 'No'}</div>
        <div><strong>Token in API Client:</strong> {apiClient.getToken() ? 'Present' : 'Missing'}</div>
        <div><strong>API Base URL:</strong> {getApiUrl()}</div>
      </CardContent>
    </Card>
  )
}
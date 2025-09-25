'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An unexpected error occurred during authentication.',
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const errorParam = searchParams.get('error')
    setError(errorParam || 'Default')
  }, [searchParams])

  const handleReturnToLogin = () => {
    router.push('/auth/login')
  }

  const handleReturnHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold">Authentication Error</h1>
          <p className="text-muted-foreground mt-2">Something went wrong</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unable to Sign In</CardTitle>
            <CardDescription>
              We encountered an issue while trying to sign you in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorMessages[error] || errorMessages.Default}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button onClick={handleReturnToLogin} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
              <Button
                variant="outline"
                onClick={handleReturnHome}
                className="w-full"
              >
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Need help? Contact your system administrator
        </p>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold">Authentication Error</h1>
            <p className="text-muted-foreground mt-2">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
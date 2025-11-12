'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import apiClient from '@/lib/api'

export default function RegisterPage() {
  // Organization fields
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  // Admin user fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Auto-generate slug from org name
  const handleOrgNameChange = (value: string) => {
    setOrgName(value)
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setOrgSlug(slug)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      await apiClient.registerOrganization({
        name: orgName,
        slug: orgSlug,
        contact_email: contactEmail,
        admin_name: name,
        admin_email: email,
        admin_password: password
      })

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } }
        if (axiosError.response?.data?.detail) {
          setError(axiosError.response.data.detail)
        } else {
          setError('Failed to create account. Please try again.')
        }
      } else {
        setError('Failed to create account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Back to Landing Page */}
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Logo and header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-xl">DH</span>
          </div>
          <h1 className="text-3xl font-bold">Data Hygiene Tool</h1>
          <p className="text-muted-foreground mt-2">Create an admin account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Organization</CardTitle>
            <CardDescription>
              Register your organization and create an admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-900 border-green-200">
                  <AlertDescription>
                    Organization created successfully! Redirecting to login...
                  </AlertDescription>
                </Alert>
              )}

              {/* Organization Details Section */}
              <div className="space-y-4 pb-4 border-b">
                <h3 className="font-semibold text-sm">Organization Details</h3>

                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    type="text"
                    placeholder="e.g., Acme Corporation"
                    value={orgName}
                    onChange={(e) => handleOrgNameChange(e.target.value)}
                    required
                    disabled={isLoading || success}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgSlug">Organization Slug</Label>
                  <Input
                    id="orgSlug"
                    type="text"
                    placeholder="e.g., acme-corporation"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    required
                    disabled={isLoading || success}
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs and must be unique
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Organization Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contact@acme.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              {/* Admin Account Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Admin Account</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Admin Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading || success}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || success}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || success}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading || success}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading || success}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || success}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Organization & Admin Account
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/auth/login')}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/auth/login')}
            className="text-primary hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

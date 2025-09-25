'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { QualityOverview } from '@/components/dashboard/quality-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Loader2 } from 'lucide-react'
// import { QuickActions } from '@/components/dashboard/quick-actions'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {session?.user?.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Here&apos;s an overview of your data quality pipeline
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Main Content */}
        <div className="space-y-6">
          <QualityOverview />
          <RecentActivity />
        </div>
      </div>
    </MainLayout>
  )
}
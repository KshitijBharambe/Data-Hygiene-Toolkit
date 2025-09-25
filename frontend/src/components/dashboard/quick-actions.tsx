'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Upload,
  Play,
  Plus,
  FileText,
  Download,
  Database,
} from 'lucide-react'
import Link from 'next/link'

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  variant?: 'default' | 'secondary' | 'outline'
}

const actions: QuickAction[] = [
  {
    title: 'Upload Dataset',
    description: 'Add new data',
    icon: Upload,
    href: '/data/upload',
    variant: 'default'
  },
  {
    title: 'Run Quality Check',
    description: 'Execute validation',
    icon: Play,
    href: '/execution/run',
    variant: 'default'
  },
  {
    title: 'Create Rule',
    description: 'Build validation rule',
    icon: Plus,
    href: '/rules/create',
    variant: 'outline'
  },
  {
    title: 'View Reports',
    description: 'Quality insights',
    icon: FileText,
    href: '/reports/quality',
    variant: 'outline'
  },
  {
    title: 'Export Data',
    description: 'Download results',
    icon: Download,
    href: '/reports/export',
    variant: 'outline'
  },
  {
    title: 'Browse Datasets',
    description: 'Manage data',
    icon: Database,
    href: '/data/datasets',
    variant: 'outline'
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts for data management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.title}
                variant={action.variant || 'outline'}
                asChild
                className="h-auto min-h-16 p-3 justify-start"
              >
                <Link href={action.href}>
                  <div className="flex items-start space-x-2 w-full px-2">
                    <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="font-medium text-sm leading-tight break-words hyphens-auto flex-1 text-left">
                      {action.title}
                    </div>
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
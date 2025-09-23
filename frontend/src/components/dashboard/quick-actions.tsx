'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Upload,
  Play,
  Plus,
  FileText,
  Download,
  Settings,
  Database,
  Shield
} from 'lucide-react'
import Link from 'next/link'

interface QuickAction {
  title: string
  description: string
  icon: any
  href: string
  variant?: 'default' | 'secondary' | 'outline'
}

const actions: QuickAction[] = [
  {
    title: 'Upload Dataset',
    description: 'Add new data for quality analysis',
    icon: Upload,
    href: '/data/upload',
    variant: 'default'
  },
  {
    title: 'Run Quality Check',
    description: 'Execute validation rules on datasets',
    icon: Play,
    href: '/execution/run',
    variant: 'default'
  },
  {
    title: 'Create Rule',
    description: 'Build new validation rule',
    icon: Plus,
    href: '/rules/create',
    variant: 'outline'
  },
  {
    title: 'View Reports',
    description: 'Access quality insights and analytics',
    icon: FileText,
    href: '/reports/quality',
    variant: 'outline'
  },
  {
    title: 'Export Data',
    description: 'Download cleaned datasets',
    icon: Download,
    href: '/reports/export',
    variant: 'outline'
  },
  {
    title: 'Browse Datasets',
    description: 'Explore and manage data sources',
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
                className="h-auto p-4 justify-start"
              >
                <Link href={action.href}>
                  <div className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm opacity-75 font-normal">
                        {action.description}
                      </div>
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
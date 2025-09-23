'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Upload,
  Play,
  AlertTriangle,
  CheckCircle,
  Download,
  Settings,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'upload' | 'execution' | 'issue' | 'resolution' | 'export' | 'rule_created'
  title: string
  description: string
  timestamp: Date
  status?: 'success' | 'warning' | 'error' | 'info'
  user: string
}

const activities: ActivityItem[] = [
  {
    id: '1',
    type: 'upload',
    title: 'New dataset uploaded',
    description: 'customer_data_q4_2024.csv (15,234 rows)',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    status: 'success',
    user: 'John Doe'
  },
  {
    id: '2',
    type: 'execution',
    title: 'Data quality check completed',
    description: 'Found 23 issues in product_catalog dataset',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    status: 'warning',
    user: 'Sarah Wilson'
  },
  {
    id: '3',
    type: 'resolution',
    title: 'Issues resolved',
    description: '8 missing data issues fixed in customer_data',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'success',
    user: 'Mike Johnson'
  },
  {
    id: '4',
    type: 'rule_created',
    title: 'New validation rule created',
    description: 'Email format validation for customer contacts',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    status: 'info',
    user: 'Emily Chen'
  },
  {
    id: '5',
    type: 'export',
    title: 'Data export completed',
    description: 'Clean dataset exported to data lake',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    status: 'success',
    user: 'David Brown'
  }
]

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'upload':
      return <Upload className="h-4 w-4" />
    case 'execution':
      return <Play className="h-4 w-4" />
    case 'issue':
      return <AlertTriangle className="h-4 w-4" />
    case 'resolution':
      return <CheckCircle className="h-4 w-4" />
    case 'export':
      return <Download className="h-4 w-4" />
    case 'rule_created':
      return <Settings className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

function getStatusVariant(status?: ActivityItem['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'success':
      return 'default'
    case 'warning':
      return 'secondary'
    case 'error':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest events and changes in your data pipeline
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {activity.title}
                  </p>
                  {activity.status && (
                    <Badge variant={getStatusVariant(activity.status)} className="ml-2">
                      {activity.status}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mt-1">
                  {activity.description}
                </p>

                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{activity.user}</span>
                  <span>{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
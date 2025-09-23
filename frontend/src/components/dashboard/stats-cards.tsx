'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Database,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface StatCard {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down' | 'neutral'
    period: string
  }
  icon: any
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

const stats: StatCard[] = [
  {
    title: 'Total Datasets',
    value: 24,
    change: { value: 12, trend: 'up', period: 'vs last month' },
    icon: Database,
    variant: 'default'
  },
  {
    title: 'Active Issues',
    value: 127,
    change: { value: 8, trend: 'down', period: 'vs last week' },
    icon: AlertTriangle,
    variant: 'warning'
  },
  {
    title: 'Resolved Issues',
    value: 1843,
    change: { value: 23, trend: 'up', period: 'vs last week' },
    icon: CheckCircle,
    variant: 'success'
  },
  {
    title: 'Executions Today',
    value: 15,
    change: { value: 0, trend: 'neutral', period: 'vs yesterday' },
    icon: Activity,
    variant: 'default'
  }
]

function getTrendIcon(trend: 'up' | 'down' | 'neutral') {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3 w-3" />
    case 'down':
      return <TrendingDown className="h-3 w-3" />
    default:
      return <Minus className="h-3 w-3" />
  }
}

function getTrendColor(trend: 'up' | 'down' | 'neutral', context: 'positive' | 'negative' = 'positive') {
  if (trend === 'neutral') return 'text-muted-foreground'

  if (context === 'positive') {
    return trend === 'up' ? 'text-green-600' : 'text-red-600'
  } else {
    return trend === 'up' ? 'text-red-600' : 'text-green-600'
  }
}

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const isNegativeContext = stat.title.includes('Issues') && stat.title.includes('Active')

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <div className="flex items-center space-x-1 text-xs">
                  <span className={getTrendColor(stat.change.trend, isNegativeContext ? 'negative' : 'positive')}>
                    {getTrendIcon(stat.change.trend)}
                  </span>
                  <span className={getTrendColor(stat.change.trend, isNegativeContext ? 'negative' : 'positive')}>
                    {stat.change.value}%
                  </span>
                  <span className="text-muted-foreground">
                    {stat.change.period}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
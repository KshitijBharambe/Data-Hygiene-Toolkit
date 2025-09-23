'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'

// Dynamically import Recharts to avoid SSR issues
const PieChart = dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart })), { ssr: false })
const Pie = dynamic(() => import('recharts').then(mod => ({ default: mod.Pie })), { ssr: false })
const Cell = dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false })

const qualityMetrics = [
  {
    name: 'Completeness',
    score: 92,
    status: 'good',
    issues: 15
  },
  {
    name: 'Accuracy',
    score: 87,
    status: 'warning',
    issues: 23
  },
  {
    name: 'Consistency',
    score: 94,
    status: 'good',
    issues: 8
  },
  {
    name: 'Validity',
    score: 78,
    status: 'warning',
    issues: 45
  },
  {
    name: 'Uniqueness',
    score: 96,
    status: 'good',
    issues: 6
  }
]

const issueDistribution = [
  { name: 'Missing Data', value: 35, color: '#ef4444' },
  { name: 'Format Issues', value: 28, color: '#f97316' },
  { name: 'Duplicates', value: 15, color: '#eab308' },
  { name: 'Invalid Values', value: 22, color: '#3b82f6' }
]

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6']

function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-600'
  if (score >= 75) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 90) return 'default'
  if (score >= 75) return 'secondary'
  return 'destructive'
}

export function QualityOverview() {
  const overallScore = Math.round(
    qualityMetrics.reduce((acc, metric) => acc + metric.score, 0) / qualityMetrics.length
  )

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Metrics</CardTitle>
          <CardDescription>
            Current quality scores across all datasets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Score</span>
            <Badge variant={getScoreVariant(overallScore)} className="text-lg px-3 py-1">
              {overallScore}%
            </Badge>
          </div>

          <div className="space-y-4">
            {qualityMetrics.map((metric) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{metric.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className={getScoreColor(metric.score)}>
                      {metric.score}%
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {metric.issues} issues
                    </Badge>
                  </div>
                </div>
                <Progress value={metric.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Issue Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Issue Distribution</CardTitle>
          <CardDescription>
            Breakdown of data quality issues by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={issueDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {issueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {issueDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-sm">{item.name}</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
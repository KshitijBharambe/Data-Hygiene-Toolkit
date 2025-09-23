'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'
import { useDashboardOverview } from '@/lib/hooks/useDashboard'

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
  const { data: dashboardData, isLoading } = useDashboardOverview()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data Quality Metrics</CardTitle>
            <CardDescription>
              Current quality scores across all datasets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-2 w-full bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Issue Distribution</CardTitle>
            <CardDescription>
              Breakdown of data quality issues by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data Quality Metrics</CardTitle>
            <CardDescription>
              Current quality scores across all datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No quality data available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Issue Distribution</CardTitle>
            <CardDescription>
              Breakdown of data quality issues by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No issue data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const overallScore = dashboardData.overview.avg_quality_score
  const { excellent, good, fair, poor } = dashboardData.statistics.quality_score_distribution

  // Create quality metrics based on real data
  const qualityMetrics = [
    {
      name: 'Overall Quality',
      score: Math.round(overallScore),
      status: overallScore >= 90 ? 'good' : overallScore >= 75 ? 'warning' : 'poor',
      issues: dashboardData.overview.total_issues - dashboardData.overview.total_fixes
    }
  ]

  // Create issue distribution from quality score distribution
  const totalDatasets = excellent + good + fair + poor
  const issueDistribution = totalDatasets > 0 ? [
    { name: 'Excellent Quality', value: Math.round((excellent / totalDatasets) * 100), color: '#22c55e' },
    { name: 'Good Quality', value: Math.round((good / totalDatasets) * 100), color: '#3b82f6' },
    { name: 'Fair Quality', value: Math.round((fair / totalDatasets) * 100), color: '#eab308' },
    { name: 'Poor Quality', value: Math.round((poor / totalDatasets) * 100), color: '#ef4444' }
  ].filter(item => item.value > 0) : []

  const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444']

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
              {Math.round(overallScore)}%
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
                      {metric.issues} open issues
                    </Badge>
                  </div>
                </div>
                <Progress value={metric.score} className="h-2" />
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="text-sm font-medium mb-3">Dataset Quality Distribution</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Excellent (90%+)</span>
                <span className="font-medium">{excellent}</span>
              </div>
              <div className="flex justify-between">
                <span>Good (75-89%)</span>
                <span className="font-medium">{good}</span>
              </div>
              <div className="flex justify-between">
                <span>Fair (50-74%)</span>
                <span className="font-medium">{fair}</span>
              </div>
              <div className="flex justify-between">
                <span>Poor (&lt;50%)</span>
                <span className="font-medium">{poor}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Distribution</CardTitle>
          <CardDescription>
            Distribution of datasets by quality score
          </CardDescription>
        </CardHeader>
        <CardContent>
          {issueDistribution.length > 0 ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-muted-foreground">No datasets available for quality analysis</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
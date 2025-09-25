'use client'

import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar
} from 'lucide-react'

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and view data quality reports and analytics
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quality Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.3%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Issues Found
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              -12% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Issues Resolved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              78.3% resolution rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Executions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              +8 this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quality Reports
            </CardTitle>
            <CardDescription>
              Comprehensive data quality analysis and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Generate detailed reports showing data quality scores, issue patterns, and improvement recommendations.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Quality Scores</Badge>
                <Badge variant="secondary">Issue Analysis</Badge>
                <Badge variant="secondary">Trends</Badge>
                <Badge variant="secondary">Recommendations</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/reports/quality">
                  View Reports
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/reports/quality/new">
                  Generate New
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Export cleaned datasets and analysis results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Export your processed datasets in various formats with optional metadata and issue reports.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">CSV</Badge>
                <Badge variant="secondary">Excel</Badge>
                <Badge variant="secondary">JSON</Badge>
                <Badge variant="secondary">Metadata</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/reports/export">
                  Export Data
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/reports/export/history">
                  Export History
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Reports
          </CardTitle>
          <CardDescription>
            Your latest generated reports and exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample reports */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Customer Data Quality Report</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Generated 2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Quality: 89%</Badge>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Download className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Sales Data Export (CSV)</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Exported yesterday
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">2.1 MB</Badge>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Product Inventory Analysis</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Generated 3 days ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Quality: 92%</Badge>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  )
}
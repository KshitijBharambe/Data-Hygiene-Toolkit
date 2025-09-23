'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Calendar,
  Database,
  User,
  ArrowUpDown
} from 'lucide-react'
import { useIssues } from '@/lib/hooks/useIssues'

export default function IssuesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const { issues, isLoading, refetch } = useIssues()

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default' // orange-ish
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <XCircle className="h-3 w-3" />
      case 'high':
        return <AlertTriangle className="h-3 w-3" />
      case 'medium':
        return <Clock className="h-3 w-3" />
      case 'low':
        return <CheckCircle className="h-3 w-3" />
      default:
        return <AlertTriangle className="h-3 w-3" />
    }
  }

  const issuesSummary = {
    total: issues?.length || 0,
    resolved: issues?.filter(i => i.resolved).length || 0,
    unresolved: issues?.filter(i => !i.resolved).length || 0,
    critical: issues?.filter(i => i.severity === 'critical').length || 0,
    high: issues?.filter(i => i.severity === 'high').length || 0,
    medium: issues?.filter(i => i.severity === 'medium').length || 0,
    low: issues?.filter(i => i.severity === 'low').length || 0
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Issues</h1>
        <p className="text-muted-foreground">
          Track and resolve data quality issues across your datasets
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Issues
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issuesSummary.total}</div>
            <p className="text-xs text-muted-foreground">
              {issuesSummary.unresolved} unresolved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Issues
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{issuesSummary.critical}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resolution Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((issuesSummary.resolved / issuesSummary.total) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {issuesSummary.resolved} of {issuesSummary.total} resolved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Resolution Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3h</div>
            <p className="text-xs text-muted-foreground">
              Average time to resolve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="severity">Severity</SelectItem>
                  <SelectItem value="dataset">Dataset</SelectItem>
                  <SelectItem value="rule">Rule</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Issues</CardTitle>
          <CardDescription>
            Detailed list of all data quality issues found in your datasets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Loading issues...
                </div>
              </div>
            ) : issues?.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No issues found</h3>
                <p className="text-muted-foreground">
                  No data quality issues have been detected in your datasets.
                </p>
              </div>
            ) : (
              issues?.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getSeverityColor(issue.severity)}
                      className="flex items-center gap-1"
                    >
                      {getSeverityIcon(issue.severity)}
                      {issue.severity}
                    </Badge>
                    {issue.resolved ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">
                        <Clock className="mr-1 h-3 w-3" />
                        Open
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{issue.rule_name}</h4>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {issue.dataset_name}
                      </span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        Row {issue.row_index}, Column: {issue.column_name}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.message}</p>
                    {issue.current_value && (
                      <div className="mt-2 text-xs">
                        <span className="text-muted-foreground">Current: </span>
                        <code className="bg-muted px-1 py-0.5 rounded">
                          {issue.current_value || 'null'}
                        </code>
                        {issue.suggested_value && (
                          <>
                            <span className="text-muted-foreground"> → Suggested: </span>
                            <code className="bg-green-50 text-green-700 px-1 py-0.5 rounded">
                              {issue.suggested_value}
                            </code>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(issue.created_at).toLocaleDateString()}
                    </div>
                    {issue.fix_count > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <MessageSquare className="h-3 w-3" />
                        {issue.fix_count} fix{issue.fix_count !== 1 ? 'es' : ''}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!issue.resolved && (
                    <Button size="sm">
                      Fix Issue
                    </Button>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issue Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Issues by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="w-3 h-3 p-0 rounded-full" />
                  <span className="text-sm">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{issuesSummary.critical}</span>
                  <div className="w-16 h-2 bg-muted rounded-full">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${(issuesSummary.critical / issuesSummary.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="w-3 h-3 p-0 rounded-full bg-orange-500" />
                  <span className="text-sm">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{issuesSummary.high}</span>
                  <div className="w-16 h-2 bg-muted rounded-full">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{
                        width: `${(issuesSummary.high / issuesSummary.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="w-3 h-3 p-0 rounded-full bg-yellow-500" />
                  <span className="text-sm">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{issuesSummary.medium}</span>
                  <div className="w-16 h-2 bg-muted rounded-full">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{
                        width: `${(issuesSummary.medium / issuesSummary.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-3 h-3 p-0 rounded-full" />
                  <span className="text-sm">Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{issuesSummary.low}</span>
                  <div className="w-16 h-2 bg-muted rounded-full">
                    <div
                      className="h-full bg-gray-400 rounded-full"
                      style={{
                        width: `${(issuesSummary.low / issuesSummary.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Problematic Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Customer Data</span>
                </div>
                <Badge variant="outline">2 issues</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Sales Data</span>
                </div>
                <Badge variant="outline">2 issues</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Product Inventory</span>
                </div>
                <Badge variant="outline">0 issues</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </MainLayout>
  )
}
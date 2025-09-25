'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Database
} from 'lucide-react'
import { useDatasets } from '@/lib/hooks/useDatasets'

export default function QualityReportsPage() {
  const [selectedDataset, setSelectedDataset] = useState<string>('')
  const [timeRange, setTimeRange] = useState<string>('30')
  const { data: datasetsData } = useDatasets()
  const datasets = datasetsData?.items || []

  return (
    <MainLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quality Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive data quality analysis and reporting
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            Configure your quality report parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dataset</label>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Datasets</SelectItem>
                  {datasets?.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="issues">Issue Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quality Score Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Quality Score
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.3%</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  +2.1% from last period
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Issues
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <AlertTriangle className="mr-1 h-3 w-3 text-orange-500" />
                  23 critical
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Resolution Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78.3%</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                  122 resolved
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Data Completeness
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.7%</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Database className="mr-1 h-3 w-3 text-blue-500" />
                  5.3% missing
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quality by Dataset */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Scores by Dataset</CardTitle>
              <CardDescription>
                Data quality metrics for each dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Customer Data</p>
                      <p className="text-sm text-muted-foreground">15,423 records</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">92.1%</p>
                      <p className="text-xs text-muted-foreground">Quality Score</p>
                    </div>
                    <Badge variant="outline">3 issues</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Sales Transactions</p>
                      <p className="text-sm text-muted-foreground">48,912 records</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">85.7%</p>
                      <p className="text-xs text-muted-foreground">Quality Score</p>
                    </div>
                    <Badge variant="destructive">12 issues</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Product Inventory</p>
                      <p className="text-sm text-muted-foreground">2,847 records</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">96.4%</p>
                      <p className="text-xs text-muted-foreground">Quality Score</p>
                    </div>
                    <Badge variant="outline">1 issue</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Trends</CardTitle>
              <CardDescription>
                Data quality metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                  <p>Quality trends chart would be displayed here</p>
                  <p className="text-sm">Shows quality scores, issue counts, and resolution rates over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Issue Analysis</CardTitle>
              <CardDescription>
                Breakdown of data quality issues by type and severity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Issues by Severity</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="w-2 h-2 p-0 rounded-full" />
                        <span className="text-sm">Critical</span>
                      </div>
                      <span className="text-sm font-medium">23</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="w-2 h-2 p-0 rounded-full bg-orange-500" />
                        <span className="text-sm">High</span>
                      </div>
                      <span className="text-sm font-medium">45</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="w-2 h-2 p-0 rounded-full bg-yellow-500" />
                        <span className="text-sm">Medium</span>
                      </div>
                      <span className="text-sm font-medium">67</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-2 h-2 p-0 rounded-full" />
                        <span className="text-sm">Low</span>
                      </div>
                      <span className="text-sm font-medium">21</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Issues by Type</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Missing Data</span>
                      <span className="text-sm font-medium">89</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Format Issues</span>
                      <span className="text-sm font-medium">34</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Value Range</span>
                      <span className="text-sm font-medium">21</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Duplicates</span>
                      <span className="text-sm font-medium">12</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                AI-powered suggestions to improve data quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">High Priority</Badge>
                    <h4 className="font-medium">Address Missing Customer Email Fields</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    89% of customer records are missing email addresses. Consider implementing email validation rules and data collection improvements.
                  </p>
                  <Button variant="outline" size="sm">
                    Create Rule
                  </Button>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500">Medium Priority</Badge>
                    <h4 className="font-medium">Standardize Date Formats</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Multiple date formats detected across datasets. Implement standardization rules to ensure consistency.
                  </p>
                  <Button variant="outline" size="sm">
                    Create Rule
                  </Button>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Low Priority</Badge>
                    <h4 className="font-medium">Optimize Phone Number Format</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Phone numbers use inconsistent formatting. Consider implementing a standard format rule.
                  </p>
                  <Button variant="outline" size="sm">
                    Create Rule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Report */}
      <Card>
        <CardHeader>
          <CardTitle>Export Report</CardTitle>
          <CardDescription>
            Download your quality report in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export as PDF
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export as Excel
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export as CSV
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  )
}
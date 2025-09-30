'use client'

import { useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { useSearch } from '@/lib/hooks/useSearch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Database, AlertCircle, Play, CheckCircle2, FileText } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const { data, isLoading, error } = useSearch(query)

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Search className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Start Searching</h2>
        <p className="text-muted-foreground">
          Enter a search query to find datasets, rules, executions, and issues
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    console.error('Search error:', error)
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2 text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p className="font-semibold">Error loading search results</p>
            </div>
            <p className="text-sm text-red-700">
              {error instanceof Error ? error.message : 'Please try again or contact support.'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalResults = data?.total_results || 0
  const hasResults = totalResults > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Search Results</h1>
        <p className="text-muted-foreground mt-2">
          Found {totalResults} result{totalResults !== 1 ? 's' : ''} for &quot;{query}&quot;
        </p>
      </div>

      {!hasResults ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search query or using different keywords
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pages & Actions */}
          {data?.pages && data.pages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Pages & Actions ({data.pages.length})
                </CardTitle>
                <CardDescription>
                  Navigate to common pages and actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.pages.map((result) => (
                  <Link
                    key={result.id}
                    href={String(result.metadata.url || '#')}
                    className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{result.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Datasets */}
          {data?.datasets && data.datasets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Datasets ({data.datasets.length})
                </CardTitle>
                <CardDescription>
                  Uploaded data sources and files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.datasets.map((result) => (
                  <Link
                    key={result.id}
                    href={result.metadata.is_static && result.metadata.url ? String(result.metadata.url) : `/data/datasets?id=${result.id}`}
                    className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{result.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.description}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {String(result.metadata.source_type || '')}
                          </Badge>
                          <Badge variant="secondary">
                            {String(result.metadata.status || '')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Rules */}
          {data?.rules && data.rules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rules ({data.rules.length})
                </CardTitle>
                <CardDescription>
                  Data quality validation rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.rules.map((result) => (
                  <Link
                    key={result.id}
                    href={`/rules/${result.id}`}
                    className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{result.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.description}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {String(result.metadata.kind || '')}
                          </Badge>
                          <Badge
                            variant={
                              result.metadata.criticality === 'critical' || result.metadata.criticality === 'high'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {String(result.metadata.criticality || '')}
                          </Badge>
                          {Boolean(result.metadata.is_active) && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Executions */}
          {data?.executions && data.executions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Executions ({data.executions.length})
                </CardTitle>
                <CardDescription>
                  Rule execution history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.executions.map((result) => (
                  <Link
                    key={result.id}
                    href={`/executions/${result.id}`}
                    className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{result.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.description}
                        </p>
                        <Badge
                          variant={
                            result.metadata.status === 'succeeded'
                              ? 'default'
                              : result.metadata.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {String(result.metadata.status || '')}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Issues */}
          {data?.issues && data.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Issues ({data.issues.length})
                </CardTitle>
                <CardDescription>
                  Data quality issues and violations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.issues.map((result) => (
                  <Link
                    key={result.id}
                    href={`/issues?id=${result.id}`}
                    className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{result.title}</h3>
                          {Boolean(result.metadata.resolved) && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.description}
                        </p>
                        <Badge
                          variant={
                            result.metadata.severity === 'critical' || result.metadata.severity === 'high'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {String(result.metadata.severity || '')}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <SearchResultsContent />
      </Suspense>
    </MainLayout>
  )
}
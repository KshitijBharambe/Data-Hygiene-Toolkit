'use client'

import { use } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRuleVersions } from '@/lib/hooks/useRules'
import {
  ArrowLeft,
  History,
  CheckCircle2,
  Circle,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { Criticality, Rule } from '@/types/api'
import { format } from 'date-fns'

// Extended Rule type with versioning fields
interface RuleVersion extends Rule {
  version: number;
  is_latest: boolean;
  parent_rule_id?: string;
  rule_family_id?: string;
  change_log?: string | null;
}

const criticalityColors: Record<Criticality, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

function ChangeLogDisplay({ changeLog }: { changeLog: string | null | undefined }) {
  if (!changeLog) return null

  try {
    const log = JSON.parse(changeLog)

    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Changed by: {log.changed_by_name || 'Unknown'}</span>
          <span>•</span>
          <span>{format(new Date(log.changed_at), 'MMM d, yyyy HH:mm')}</span>
        </div>

        {log.reason && (
          <div className="text-muted-foreground italic">
            &quot;{log.reason}&quot;
          </div>
        )}

        {log.changes && Object.keys(log.changes).length > 0 && (
          <div className="mt-2">
            <div className="font-medium mb-1">Changes:</div>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {Object.entries(log.changes as Record<string, { old?: unknown; new?: unknown }>).map(([field, change]) => (
                <li key={field}>
                  <span className="font-medium">{field}</span>:
                  {change.old !== undefined && change.new !== undefined ? (
                    <>
                      <span className="line-through ml-1">{JSON.stringify(change.old)}</span>
                      <span className="mx-1">→</span>
                      <span className="text-green-600">{JSON.stringify(change.new)}</span>
                    </>
                  ) : (
                    <span className="ml-1">Modified</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  } catch {
    return (
      <div className="text-sm text-muted-foreground">
        {changeLog}
      </div>
    )
  }
}

export default function RuleVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: versions, isLoading, error } = useRuleVersions(id) as { data: RuleVersion[] | undefined; isLoading: boolean; error: Error | null }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading versions...</div>
        </div>
      </MainLayout>
    )
  }

  if (error || !versions || versions.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">
            {error
              ? `Error loading versions: ${(error as Error).message}`
              : 'No versions found'}
          </div>
        </div>
      </MainLayout>
    )
  }

  const latestVersion = versions.find(v => v.is_latest)
  const ruleName = latestVersion?.name || versions[0]?.name

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/rules">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <History className="h-8 w-8" />
                Version History
              </h1>
              <p className="text-muted-foreground mt-2">
                All versions of &quot;{ruleName}&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Versions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Versions ({versions.length})</CardTitle>
            <CardDescription>
              Complete version history showing all changes to this rule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow
                    key={version.id}
                    className={version.is_latest ? 'bg-muted/50' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {version.is_latest ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Badge variant="outline" className="font-mono">
                          v{version.version}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {version.is_latest ? (
                        <Badge className="bg-green-100 text-green-800">
                          Latest
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Historical
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={criticalityColors[version.criticality]}>
                        {version.criticality}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={version.is_active ? 'default' : 'secondary'}>
                        {version.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{format(new Date(version.created_at), 'MMM d, yyyy')}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(version.created_at), 'HH:mm:ss')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChangeLogDisplay changeLog={version.change_log} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/rules/${version.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Versions</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{versions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Version</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                v{latestVersion?.version || 1}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rule Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestVersion?.is_active ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-gray-600">Inactive</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

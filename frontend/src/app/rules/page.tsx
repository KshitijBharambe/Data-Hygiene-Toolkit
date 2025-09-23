'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRules, useActivateRule, useDeactivateRule, useDeleteRule } from '@/lib/hooks/useRules'
import {
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Edit,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { Rule, RuleKind, Criticality } from '@/types/api'
import { format } from 'date-fns'

const criticalityColors: Record<Criticality, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const ruleKindLabels: Record<RuleKind, string> = {
  missing_data: 'Missing Data',
  standardization: 'Standardization',
  value_list: 'Value List',
  length_range: 'Length Range',
  cross_field: 'Cross Field',
  char_restriction: 'Character Restriction',
  regex: 'Regex Pattern',
  custom: 'Custom Rule'
}

function RuleActionsDropdown({ rule }: { rule: Rule }) {
  const activateRule = useActivateRule()
  const deactivateRule = useDeactivateRule()
  const deleteRule = useDeleteRule()

  const handleActivate = () => {
    activateRule.mutate(rule.id)
  }

  const handleDeactivate = () => {
    deactivateRule.mutate(rule.id)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
      deleteRule.mutate(rule.id)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/rules/${rule.id}`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </DropdownMenuItem>
        {rule.is_active ? (
          <DropdownMenuItem onClick={handleDeactivate}>
            <Pause className="h-4 w-4 mr-2" />
            Deactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleActivate}>
            <Play className="h-4 w-4 mr-2" />
            Activate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function RulesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: rulesData, isLoading, error } = useRules()

  const filteredRules = rulesData?.items?.filter(rule =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading rules...</div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading rules: {(error as Error).message}</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Quality Rules
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage data quality validation rules for your datasets
            </p>
          </div>
          <Button asChild>
            <Link href="/rules/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rulesData?.items?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {rulesData?.items?.filter(rule => rule.is_active).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Rules</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {rulesData?.items?.filter(rule => rule.criticality === 'critical').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rule Types</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(rulesData?.items?.map(rule => rule.kind)).size || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle>Rules ({filteredRules.length})</CardTitle>
            <CardDescription>
              Manage your data quality validation rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRules.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No rules found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No rules match your search criteria.' : 'Get started by creating your first quality rule.'}
                </p>
                <Button asChild>
                  <Link href="/rules/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Criticality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          {rule.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {rule.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ruleKindLabels[rule.kind] || rule.kind}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={criticalityColors[rule.criticality]}>
                          {rule.criticality}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(rule.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <RuleActionsDropdown rule={rule} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
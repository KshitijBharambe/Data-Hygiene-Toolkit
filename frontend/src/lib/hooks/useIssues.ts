import { useState, useEffect } from 'react'
import api from '@/lib/api'

export interface Issue {
  id: string
  execution_id: string
  rule_id: string
  rule_name?: string
  row_index: number
  column_name: string
  current_value?: string
  suggested_value?: string
  message?: string
  category?: string
  severity: string
  created_at: string
  resolved: boolean
  fix_count: number
  dataset_name?: string
}

export interface IssuesSummary {
  summary: {
    total_issues: number
    recent_issues: number
    resolved_issues: number
    unresolved_issues: number
    resolution_rate: number
  }
  severity_distribution: {
    critical: number
    high: number
    medium: number
    low: number
  }
  trends: {
    analysis_period_days: number
    issues_by_day: Record<string, number>
  }
  top_problematic_rules: Array<{
    rule_name: string
    rule_kind: string
    issue_count: number
  }>
}

export function useIssues(filters?: {
  severity?: string
  resolved?: boolean
  rule_id?: string
  dataset_id?: string
  execution_id?: string
  limit?: number
  offset?: number
}) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIssues = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()

      if (filters?.severity) params.append('severity', filters.severity)
      if (filters?.resolved !== undefined) params.append('resolved', filters.resolved.toString())
      if (filters?.rule_id) params.append('rule_id', filters.rule_id)
      if (filters?.dataset_id) params.append('dataset_id', filters.dataset_id)
      if (filters?.execution_id) params.append('execution_id', filters.execution_id)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await api.getIssues(undefined, 1, 100)
      setIssues(response.items)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch issues:', err)
      setError('Failed to fetch issues')
      setIssues([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchIssues()
  }, [filters])

  return {
    issues,
    isLoading,
    error,
    refetch: fetchIssues
  }
}

export function useIssuesSummary(days: number = 30) {
  const [summary, setSummary] = useState<IssuesSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/issues/statistics/summary?days=${days}`)
      setSummary(response.data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch issues summary:', err)
      setError('Failed to fetch issues summary')
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [days])

  return {
    summary,
    isLoading,
    error,
    refetch: fetchSummary
  }
}

export function useIssue(issueId: string) {
  const [issue, setIssue] = useState<Issue | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIssue = async () => {
    try {
      setIsLoading(true)
      const issue = await api.getIssue(issueId)
      setIssue(issue)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch issue:', err)
      setError('Failed to fetch issue')
      setIssue(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (issueId) {
      fetchIssue()
    }
  }, [issueId])

  return {
    issue,
    isLoading,
    error,
    refetch: fetchIssue
  }
}

export async function createFix(issueId: string, fixData: {
  new_value?: string
  comment?: string
}) {
  try {
    const response = await api.post(`/issues/${issueId}/fix`, fixData)
    return response.data
  } catch (err) {
    console.error('Failed to create fix:', err)
    throw err
  }
}

export async function resolveIssue(issueId: string) {
  try {
    const response = await api.patch(`/issues/${issueId}/resolve`)
    return response.data
  } catch (err) {
    console.error('Failed to resolve issue:', err)
    throw err
  }
}

export async function unresolveIssue(issueId: string) {
  try {
    const response = await api.patch(`/issues/${issueId}/unresolve`)
    return response.data
  } catch (err) {
    console.error('Failed to unresolve issue:', err)
    throw err
  }
}
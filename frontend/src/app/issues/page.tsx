"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
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
} from "lucide-react";
import { useRealTimeUpdates } from "@/lib/hooks/useRealTimeUpdates";
import { useDatasets } from "@/lib/hooks/useDatasets";
import { useState } from "react";
import {
  createFix,
  DetailedIssue,
  Issue,
  IssuesSummary,
  resolveIssue,
  unresolveIssue,
  useIssue,
  useIssues,
  useIssuesSummary,
} from "@/lib/hooks/useIssues";
import React from "react";
import { FixDialog } from "@/components/issues/fix-dialog";

export default function IssuesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [datasetFilter, setDatasetFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showIssueDetails, setShowIssueDetails] = useState(false);
  const [showFixDialog, setShowFixDialog] = useState(false);
  const [issueToFix, setIssueToFix] = useState<Issue | null>(null);
  const [isUnresolving, setIsUnresolving] = useState<string | null>(null);

  // Fetch detailed issue data when an issue is selected
  const {
    data: detailedIssue,
    isLoading: detailedIssueLoading,
    error: detailedIssueError,
  } = useIssue(selectedIssueId || "") as {
    data: DetailedIssue | undefined;
    isLoading: boolean;
    error: Error | null;
  };
  const [isFixing, setIsFixing] = useState<string | null>(null);

  // Create filters object for the useIssues hook
  const filters = {
    severity: severityFilter !== "all" ? severityFilter : undefined,
    resolved: statusFilter === "all" ? undefined : statusFilter === "resolved",
    limit: 50,
  };

  const { data: issues, isLoading, refetch } = useIssues(filters);
  const { data: issuesSummary, isLoading: summaryLoading } = useIssuesSummary();
  const { invalidateIssuesData } = useRealTimeUpdates();

  // Fetch all datasets for the filter dropdown
  const { data: datasetsResponse, isLoading: datasetsLoading } = useDatasets(
    1,
    1000
  ); // Fetch a large number to get all datasets

  // Get all available datasets for filter dropdown
  const availableDatasets = React.useMemo(() => {
    if (!datasetsResponse?.items || datasetsResponse.items.length === 0)
      return [];

    const datasets = datasetsResponse.items
      .map((dataset) => dataset.name)
      .filter((name) => name && name.trim() !== "")
      .sort();

    return datasets;
  }, [datasetsResponse]);

  const handleViewIssue = (issue: Issue) => {
    setSelectedIssueId(issue.id);
    setShowIssueDetails(true);
  };

  const handleOpenFixDialog = (issue: Issue) => {
    setIssueToFix(issue);
    setShowFixDialog(true);
  };

  const handleApplyFix = async (fixData: {
    new_value?: string;
    comment?: string;
  }) => {
    if (!issueToFix || isFixing) return;

    setIsFixing(issueToFix.id);
    try {
      if (fixData.new_value) {
        await createFix(issueToFix.id, fixData);
        toast.success("Fix applied successfully");
      } else {
        await resolveIssue(issueToFix.id);
        toast.success("Issue marked as resolved");
      }

      // Invalidate and refetch all related queries for real-time updates
      await Promise.all([invalidateIssuesData(), refetch()]);

      // Close issue details modal if it's open
      if (selectedIssueId === issueToFix.id) {
        setShowIssueDetails(false);
      }
    } catch (error: unknown) {
      console.error("Fix error:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : error && typeof error === "object" && "message" in error
          ? (error as { message?: string }).message
          : "Failed to fix issue";
      toast.error(errorMessage);
      throw error; // Re-throw to let FixDialog handle it
    } finally {
      setIsFixing(null);
    }
  };

  const handleUnresolveIssue = async (issue: Issue) => {
    if (isUnresolving) return;

    setIsUnresolving(issue.id);
    try {
      await unresolveIssue(issue.id);
      toast.success("Issue marked as unresolved");

      // Invalidate and refetch all related queries for real-time updates
      await Promise.all([invalidateIssuesData(), refetch()]);

      // Close issue details modal if it's open
      if (selectedIssueId === issue.id) {
        setShowIssueDetails(false);
      }
    } catch (error: unknown) {
      console.error("Unresolve error:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : error && typeof error === "object" && "message" in error
          ? (error as { message?: string }).message
          : "Failed to unresolve issue";
      toast.error(errorMessage);
    } finally {
      setIsUnresolving(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "default"; // orange-ish
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return <XCircle className="h-3 w-3" />;
      case "high":
        return <AlertTriangle className="h-3 w-3" />;
      case "medium":
        return <Clock className="h-3 w-3" />;
      case "low":
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  // Use API summary data, fallback to calculated values
  const summaryData = {
    total: (issuesSummary as IssuesSummary)?.summary?.total_issues || (issues as Issue[])?.length || 0,
    resolved:
      (issuesSummary as IssuesSummary)?.summary?.resolved_issues ||
      (issues as Issue[])?.filter((i) => i.resolved).length ||
      0,
    unresolved:
      (issuesSummary as IssuesSummary)?.summary?.unresolved_issues ||
      (issues as Issue[])?.filter((i) => !i.resolved).length ||
      0,
    critical:
      (issuesSummary as IssuesSummary)?.severity_distribution?.critical ||
      (issues as Issue[])?.filter((i) => i.severity === "critical").length ||
      0,
    high:
      (issuesSummary as IssuesSummary)?.severity_distribution?.high ||
      (issues as Issue[])?.filter((i) => i.severity === "high").length ||
      0,
    medium:
      (issuesSummary as IssuesSummary)?.severity_distribution?.medium ||
      (issues as Issue[])?.filter((i) => i.severity === "medium").length ||
      0,
    low:
      (issuesSummary as IssuesSummary)?.severity_distribution?.low ||
      (issues as Issue[])?.filter((i) => i.severity === "low").length ||
      0,
    resolutionRate: (issuesSummary as IssuesSummary)?.summary?.resolution_rate || 0,
    recentIssues: (issuesSummary as IssuesSummary)?.summary?.recent_issues || 0,
  };

  // Filter and sort issues locally for display (since backend filtering is limited)
  let filteredIssues = (issues as Issue[]) || [];

  // Apply search filter
  if (searchTerm) {
    filteredIssues = filteredIssues.filter(
      (issue) =>
        issue.rule_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.dataset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.column_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Apply dataset filter
  if (datasetFilter !== "all") {
    filteredIssues = filteredIssues.filter(
      (issue) => issue.dataset_name === datasetFilter
    );
  }

  // Apply local sorting
  filteredIssues = [...filteredIssues].sort((a, b) => {
    switch (sortBy) {
      case "severity":
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (
          (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
          (severityOrder[a.severity as keyof typeof severityOrder] || 0)
        );
      case "dataset":
        return (a.dataset_name || "").localeCompare(b.dataset_name || "");
      case "rule":
        return (a.rule_name || "").localeCompare(b.rule_name || "");
      case "created_at":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  });

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
              <div className="text-2xl font-bold">{summaryData.total}</div>
              <p className="text-xs text-muted-foreground">
                {summaryData.unresolved} unresolved
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
              <div className="text-2xl font-bold text-red-600">
                {summaryData.critical}
              </div>
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
                {Math.round(summaryData.resolutionRate)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryData.resolved} of {summaryData.total} resolved
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Issues
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryData.recentIssues}
              </div>
              <p className="text-xs text-muted-foreground">
                Issues in last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Quality Issues with Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Data Quality Issues
            </CardTitle>
            <CardDescription>
              Filter and manage data quality issues across your datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-5 mb-6 pb-6 border-b">
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
                <label className="text-sm font-medium">Dataset</label>
                <Select
                  value={datasetFilter}
                  onValueChange={setDatasetFilter}
                  disabled={datasetsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        datasetsLoading ? "Loading datasets..." : "All Datasets"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Datasets</SelectItem>
                    {datasetsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading datasets...
                      </SelectItem>
                    ) : (
                      availableDatasets.map((dataset) => (
                        <SelectItem key={dataset} value={dataset}>
                          {dataset}
                        </SelectItem>
                      ))
                    )}
                    {!datasetsLoading && availableDatasets.length === 0 && (
                      <SelectItem value="no-data" disabled>
                        No datasets found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Severity</label>
                <Select
                  value={severityFilter}
                  onValueChange={setSeverityFilter}
                >
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

            {/* Issues List */}
            <div className="space-y-4">
              {isLoading || summaryLoading ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    Loading issues...
                  </div>
                </div>
              ) : filteredIssues?.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No issues found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm ||
                    severityFilter !== "all" ||
                    statusFilter !== "all" ||
                    datasetFilter !== "all"
                      ? "No issues match your current filters. Try adjusting your search criteria."
                      : "No data quality issues have been detected in your datasets."}
                  </p>
                </div>
              ) : (
                filteredIssues?.map((issue) => (
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
                          <span className="text-sm text-muted-foreground">
                            •
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            {issue.dataset_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            •
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Row {issue.row_index}, Column: {issue.column_name}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {issue.message}
                        </p>
                        {issue.current_value && (
                          <div className="mt-2 text-xs">
                            <span className="text-muted-foreground">
                              Current:{" "}
                            </span>
                            <code className="bg-muted px-1 py-0.5 rounded">
                              {issue.current_value || "null"}
                            </code>
                            {issue.suggested_value && (
                              <>
                                <span className="text-muted-foreground">
                                  {" "}
                                  → Suggested:{" "}
                                </span>
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
                            {issue.fix_count} fix
                            {issue.fix_count !== 1 ? "es" : ""}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewIssue(issue)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!issue.resolved ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenFixDialog(issue)}
                          disabled={isFixing === issue.id}
                        >
                          {isFixing === issue.id ? "Fixing..." : "Fix Issue"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnresolveIssue(issue)}
                          disabled={isUnresolving === issue.id}
                        >
                          {isUnresolving === issue.id
                            ? "Unresolving..."
                            : "Unresolve"}
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
                    <Badge
                      variant="destructive"
                      className="w-3 h-3 p-0 rounded-full"
                    />
                    <span className="text-sm">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {summaryData.critical}
                    </span>
                    <div className="w-16 h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{
                          width: `${
                            summaryData.total > 0
                              ? (summaryData.critical / summaryData.total) * 100
                              : 0
                          }%`,
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
                    <span className="text-sm font-medium">
                      {summaryData.high}
                    </span>
                    <div className="w-16 h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{
                          width: `${
                            summaryData.total > 0
                              ? (summaryData.high / summaryData.total) * 100
                              : 0
                          }%`,
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
                    <span className="text-sm font-medium">
                      {summaryData.medium}
                    </span>
                    <div className="w-16 h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{
                          width: `${
                            summaryData.total > 0
                              ? (summaryData.medium / summaryData.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="w-3 h-3 p-0 rounded-full"
                    />
                    <span className="text-sm">Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {summaryData.low}
                    </span>
                    <div className="w-16 h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-gray-400 rounded-full"
                        style={{
                          width: `${
                            summaryData.total > 0
                              ? (summaryData.low / summaryData.total) * 100
                              : 0
                          }%`,
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
                {(() => {
                  // Calculate dataset issue counts from current issues
                  const datasetCounts = ((issues as Issue[]) || []).reduce((acc, issue) => {
                    const dataset =
                      issue.dataset_name && issue.dataset_name.trim()
                        ? issue.dataset_name
                        : null;
                    if (dataset) {
                      acc[dataset] = (acc[dataset] || 0) + 1;
                    }
                    return acc;
                  }, {} as Record<string, number>);

                  const topDatasets = Object.entries(datasetCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5);

                  if (topDatasets.length === 0) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          No dataset issues to display
                        </p>
                      </div>
                    );
                  }

                  return topDatasets.map(([dataset, count]) => (
                    <div
                      key={dataset}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span
                          className="text-sm truncate max-w-[200px]"
                          title={dataset}
                        >
                          {dataset}
                        </span>
                      </div>
                      <Badge
                        variant={count > 0 ? "destructive" : "outline"}
                        className={
                          count > 5
                            ? "bg-red-600"
                            : count > 2
                            ? "bg-orange-500"
                            : ""
                        }
                      >
                        {count} issue{count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issue Details Dialog */}
        <Dialog open={showIssueDetails} onOpenChange={setShowIssueDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge
                  variant={getSeverityColor((detailedIssue as DetailedIssue)?.severity || "")}
                  className="flex items-center gap-1"
                >
                  {getSeverityIcon((detailedIssue as DetailedIssue)?.severity || "")}
                  {(detailedIssue as DetailedIssue)?.severity}
                </Badge>
                Issue Details
              </DialogTitle>
              <DialogDescription>
                Detailed information about the data quality issue
              </DialogDescription>
            </DialogHeader>

            {detailedIssueLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Loading issue details...
                </div>
              </div>
            ) : detailedIssueError ? (
              <div className="text-center py-8">
                <div className="text-red-600">
                  Failed to load issue details. Please try again.
                </div>
              </div>
            ) : detailedIssue ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Rule
                    </label>
                    {detailedIssue.rule ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {detailedIssue.rule.name}
                        </p>
                        {detailedIssue.rule.description && (
                          <p className="text-xs text-muted-foreground">
                            {detailedIssue.rule.description}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {detailedIssue.rule.kind.replace("_", " ")}
                          </Badge>
                          <Badge
                            variant={
                              detailedIssue.rule.criticality === "critical"
                                ? "destructive"
                                : detailedIssue.rule.criticality === "high"
                                ? "default"
                                : detailedIssue.rule.criticality === "medium"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {detailedIssue.rule.criticality}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No rule information available
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Dataset
                    </label>
                    {detailedIssue.dataset ? (
                      <p className="text-sm flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {detailedIssue.dataset.name}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No dataset information available
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Column
                    </label>
                    <p className="text-sm">{detailedIssue.column_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Row Index
                    </label>
                    <p className="text-sm">{detailedIssue.row_index}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <Badge
                      variant={
                        detailedIssue.resolved ? "outline" : "destructive"
                      }
                      className="w-fit"
                    >
                      {detailedIssue.resolved ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Resolved
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          Open
                        </>
                      )}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created
                    </label>
                    <p className="text-sm">
                      {new Date(detailedIssue.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {detailedIssue.message && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Message
                    </label>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {detailedIssue.message}
                    </p>
                  </div>
                )}

                {detailedIssue.current_value && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Current Value
                    </label>
                    <code className="block text-sm bg-muted p-3 rounded-md">
                      {detailedIssue.current_value || "null"}
                    </code>
                  </div>
                )}

                {detailedIssue.suggested_value && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Suggested Value
                    </label>
                    <code className="block text-sm bg-green-50 text-green-700 p-3 rounded-md">
                      {detailedIssue.suggested_value}
                    </code>
                  </div>
                )}

                {detailedIssue.fixes && detailedIssue.fixes.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Applied Fixes
                    </label>
                    <div className="space-y-2 mt-2">
                      {detailedIssue.fixes.map((fix) => (
                        <div
                          key={fix.id}
                          className="bg-muted p-3 rounded-md text-sm"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">Fix applied</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(fix.fixed_at).toLocaleString()}
                            </span>
                          </div>
                          {fix.new_value && (
                            <div className="mb-1">
                              <span className="text-muted-foreground">
                                New value:{" "}
                              </span>
                              <code className="bg-green-50 text-green-700 px-1 py-0.5 rounded">
                                {fix.new_value}
                              </code>
                            </div>
                          )}
                          {fix.comment && (
                            <div className="mb-1">
                              <span className="text-muted-foreground">
                                Comment:{" "}
                              </span>
                              <span>{fix.comment}</span>
                            </div>
                          )}
                          {fix.fixer && (
                            <div>
                              <span className="text-muted-foreground">
                                Fixed by:{" "}
                              </span>
                              <span>{fix.fixer.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  {!detailedIssue.resolved ? (
                    <Button
                      onClick={() => {
                        // Find the issue from the list to pass to handleOpenFixDialog
                        const issue = filteredIssues?.find(
                          (i) => i.id === detailedIssue.id
                        );
                        if (issue) {
                          handleOpenFixDialog(issue);
                          setShowIssueDetails(false);
                        }
                      }}
                      disabled={isFixing === detailedIssue.id}
                      className="flex-1"
                    >
                      {isFixing === detailedIssue.id
                        ? "Applying Fix..."
                        : detailedIssue.suggested_value
                        ? "Apply Suggested Fix"
                        : "Mark as Resolved"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Find the issue from the list to pass to handleUnresolveIssue
                        const issue = filteredIssues?.find(
                          (i) => i.id === detailedIssue.id
                        );
                        if (issue) handleUnresolveIssue(issue);
                      }}
                      disabled={isUnresolving === detailedIssue.id}
                      className="flex-1"
                    >
                      {isUnresolving === detailedIssue.id
                        ? "Unresolving..."
                        : "Unresolve Issue"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowIssueDetails(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Fix Dialog */}
        <FixDialog
          issue={issueToFix}
          open={showFixDialog}
          onOpenChange={setShowFixDialog}
          onSubmit={handleApplyFix}
          isSubmitting={isFixing === issueToFix?.id}
        />
      </div>
    </MainLayout>
  );
}

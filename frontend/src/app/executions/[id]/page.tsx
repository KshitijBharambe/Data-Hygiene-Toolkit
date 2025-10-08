"use client";

import { useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useExecution,
  useExecutionSummary,
  useExecutionIssues,
  useCancelExecution,
} from "@/lib/hooks/useExecutions";
import { Issue } from "@/lib/hooks/useIssues";
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Square,
  BarChart3,
  FileText,
  Bug,
  Eye,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { ExecutionStatus, Criticality } from "@/types/api";
import { format, formatDistanceToNow } from "date-fns";

const statusColors: Record<ExecutionStatus, string> = {
  queued: "bg-gray-100 text-gray-800",
  running: "bg-blue-100 text-blue-800",
  succeeded: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  partially_succeeded: "bg-yellow-100 text-yellow-800",
};

const statusIcons: Record<ExecutionStatus, React.ReactNode> = {
  queued: <Clock className="h-4 w-4" />,
  running: <Activity className="h-4 w-4 animate-spin" />,
  succeeded: <CheckCircle className="h-4 w-4" />,
  failed: <XCircle className="h-4 w-4" />,
  partially_succeeded: <AlertTriangle className="h-4 w-4" />,
};

const severityColors: Record<Criticality, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

// Component to display detailed rule information in a dialog
function RuleSnapshotDialog({ ruleSnapshot }: { ruleSnapshot: string | null | undefined }) {
  if (!ruleSnapshot) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rule Details</DialogTitle>
            <DialogDescription>No rule snapshot available</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Rule information not found. This may be an older execution before snapshots were implemented.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  let ruleData: any;
  try {
    ruleData = JSON.parse(ruleSnapshot);
  } catch (e) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rule Details</DialogTitle>
            <DialogDescription>Error parsing rule data</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-red-600">
            Failed to parse rule snapshot
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            {ruleData.name || 'Unknown Rule'}
          </DialogTitle>
          <DialogDescription>
            Rule snapshot at execution time
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="font-mono">
              v{ruleData.version || 1}
            </Badge>
            <Badge className={severityColors[ruleData.criticality as Criticality]}>
              {ruleData.criticality || 'N/A'}
            </Badge>
            <Badge variant={ruleData.is_active ? 'default' : 'secondary'}>
              {ruleData.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {ruleData.kind && (
              <Badge variant="outline">
                {ruleData.kind}
              </Badge>
            )}
          </div>

          {/* Description */}
          {ruleData.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{ruleData.description}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground">Created By</p>
              <p className="text-sm font-mono break-all">{ruleData.created_by || 'Unknown'}</p>
            </div>

            <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground">Created At</p>
              <p className="text-sm">
                {ruleData.created_at
                  ? format(new Date(ruleData.created_at), 'MMM d, yyyy HH:mm:ss')
                  : 'Unknown'}
              </p>
            </div>

            <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground">Rule ID</p>
              <p className="text-xs font-mono break-all">{ruleData.id || 'N/A'}</p>
            </div>

            <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground">Family ID</p>
              <p className="text-xs font-mono break-all">{ruleData.rule_family_id || 'N/A'}</p>
            </div>
          </div>

          {/* Target Columns */}
          {ruleData.target_columns && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Target Columns</h3>
              <div className="bg-muted p-3 rounded-lg">
                <code className="text-sm break-words">
                  {typeof ruleData.target_columns === 'string'
                    ? ruleData.target_columns
                    : JSON.stringify(ruleData.target_columns)}
                </code>
              </div>
            </div>
          )}

          {/* Parameters */}
          {ruleData.params && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Parameters</h3>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs leading-relaxed">
                  {typeof ruleData.params === 'string'
                    ? ruleData.params
                    : JSON.stringify(ruleData.params, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Warning if rule might be deleted */}
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm text-yellow-800 font-semibold">Historical Snapshot</p>
                <p className="text-sm text-yellow-700">
                  This is the rule configuration at the time of execution. The current version may differ, or the rule may have been deleted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ExecutionDetailPage() {
  const params = useParams();
  const executionId = params.id as string;

  const {
    data: execution,
    isLoading: executionLoading,
    error: executionError,
  } = useExecution(executionId);
  const { data: summary, isLoading: summaryLoading } =
    useExecutionSummary(executionId);
  const { data: issuesData, isLoading: issuesLoading } =
    useExecutionIssues(executionId);
  const cancelExecution = useCancelExecution();

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel this execution?")) {
      cancelExecution.mutate(executionId);
    }
  };

  const canCancel =
    execution?.status === "running" || execution?.status === "queued";

  if (executionLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">
            Loading execution details...
          </div>
        </div>
      </MainLayout>
    );
  }

  if (executionError || !execution) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">
            Error loading execution:{" "}
            {executionError?.message || "Execution not found"}
          </div>
        </div>
      </MainLayout>
    );
  }

  const duration = (() => {
    // Try to get duration from summary first
    if (summary?.duration_seconds) {
      return Math.round(summary.duration_seconds);
    }
    // Fallback to calculating from timestamps
    if (execution.finished_at && execution.started_at) {
      return Math.round(
        (new Date(execution.finished_at).getTime() -
          new Date(execution.started_at).getTime()) /
          1000
      );
    }
    return null;
  })();

  const issues = issuesData?.items || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/executions">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Activity className="h-8 w-8" />
                Execution Details
              </h1>
              <p className="text-muted-foreground mt-2 font-mono">
                ID: {execution.id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {canCancel && (
              <Button variant="destructive" onClick={handleCancel}>
                <Square className="h-4 w-4 mr-2" />
                Cancel Execution
              </Button>
            )}
          </div>
        </div>

        {/* Compact Overview */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {statusIcons[execution.status]}
                  <span>Status</span>
                </div>
                <Badge className={statusColors[execution.status]}>
                  {execution.status}
                </Badge>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duration</span>
                </div>
                <div className="text-2xl font-bold">
                  {duration
                    ? `${duration}s`
                    : execution.status === "running"
                    ? "Running..."
                    : "N/A"}
                </div>
              </div>

              {/* Rules Executed */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  <span>Rules Executed</span>
                </div>
                <div className="text-2xl font-bold">
                  {execution.total_rules || 0}
                </div>
              </div>

              {/* Issues Found */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bug className="h-4 w-4" />
                  <span>Issues Found</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {execution.total_issues ?? issues.length}
                </div>
              </div>
            </div>

            {/* Compact Timeline */}
            <div className="mt-6 pt-6 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Started: {format(new Date(execution.started_at), "MMM d, HH:mm:ss")}</span>
                </div>
                {execution.finished_at && (
                  <span className="text-muted-foreground">
                    Finished: {format(new Date(execution.finished_at), "MMM d, HH:mm:ss")}
                  </span>
                )}
              </div>
              {execution.status === "running" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Processing...</span>
                    <span>
                      {formatDistanceToNow(new Date(execution.started_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <Progress value={undefined} className="animate-pulse h-1.5" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Summary and Rules Performance */}
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="rules">Rules Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            {summaryLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">
                    Loading summary...
                  </div>
                </CardContent>
              </Card>
            ) : summary ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Execution Summary</CardTitle>
                  <CardDescription>Complete overview of data processing results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Data Processing Stats */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">Data Processed</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm">Total Rows</span>
                          <span className="text-lg font-bold">
                            {summary.total_rows?.toLocaleString() || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm">Rows Affected</span>
                          <span className="text-lg font-bold text-orange-600">
                            {summary.rows_affected?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm">Columns Affected</span>
                          <span className="text-lg font-bold">
                            {summary.columns_affected || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Issues by Severity */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">Issues by Severity</h3>
                      {summary.issues_by_severity &&
                      Object.keys(summary.issues_by_severity).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(summary.issues_by_severity).map(
                            ([severity, count]) => (
                              <div
                                key={severity}
                                className="flex justify-between items-center"
                              >
                                <Badge
                                  className={
                                    severityColors[severity as Criticality]
                                  }
                                >
                                  {severity}
                                </Badge>
                                <span className="text-lg font-bold">{String(count)}</span>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">No issues found</span>
                        </div>
                      )}
                    </div>

                    {/* Additional Metrics */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">Performance</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm">Execution Time</span>
                          <span className="text-lg font-bold">
                            {duration ? `${duration}s` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm">Rules Run</span>
                          <span className="text-lg font-bold">
                            {execution.total_rules || 0}
                          </span>
                        </div>
                        {summary.total_rows && duration && (
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm">Rows/sec</span>
                            <span className="text-lg font-bold text-blue-600">
                              {Math.round(summary.total_rows / duration).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">
                    No summary available
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rule Performance</CardTitle>
                <CardDescription>
                  Performance details for each rule in this execution (showing rule state at execution time)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary?.rule_performance &&
                summary.rule_performance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Criticality</TableHead>
                        <TableHead>Errors</TableHead>
                        <TableHead>Rows Flagged</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.rule_performance.map(
                        (rulePerf: {
                          rule_id: string;
                          rule_snapshot?: string;
                          error_count: number;
                          rows_flagged: number;
                          cols_flagged: number;
                          note?: string;
                        }) => {
                          // Parse rule snapshot if available
                          let ruleData: any = null;
                          try {
                            if (rulePerf.rule_snapshot) {
                              ruleData = JSON.parse(rulePerf.rule_snapshot);
                            }
                          } catch (e) {
                            console.error('Failed to parse rule snapshot:', e);
                          }

                          return (
                            <TableRow key={rulePerf.rule_id || Math.random()}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {ruleData?.name || 'Unknown Rule'}
                                  </div>
                                  {!rulePerf.rule_id && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      Deleted
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {ruleData?.version ? (
                                  <Badge variant="outline" className="font-mono">
                                    v{ruleData.version}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">N/A</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {ruleData?.kind ? (
                                  <Badge variant="outline" className="text-xs">
                                    {ruleData.kind}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">N/A</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {ruleData?.criticality ? (
                                  <Badge className={severityColors[ruleData.criticality as Criticality]}>
                                    {ruleData.criticality}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">N/A</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    rulePerf.error_count > 0
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {rulePerf.error_count}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{rulePerf.rows_flagged}</span>
                              </TableCell>
                              <TableCell>
                                {ruleData?.is_active ? (
                                  <Badge variant="default" className="text-xs">Active</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <RuleSnapshotDialog ruleSnapshot={rulePerf.rule_snapshot} />
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No Rule Performance Data
                    </h3>
                    <p className="text-muted-foreground">
                      Rule performance details are not available for this
                      execution.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Issues Section - Always Visible */}
        <Card>
          <CardHeader>
            <CardTitle>Issues Found ({issuesLoading ? '...' : issues.length})</CardTitle>
            <CardDescription>
              Data quality issues discovered during execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            {issuesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">
                  Loading issues...
                </div>
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Issues Found
                </h3>
                <p className="text-muted-foreground">
                  All data quality rules passed successfully!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Column</TableHead>
                      <TableHead>Rule</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((issue: Issue) => {
                      // Parse rule snapshot if available
                      let ruleData: any = null;
                      try {
                        if (issue.rule_snapshot) {
                          ruleData = JSON.parse(issue.rule_snapshot);
                        }
                      } catch (e) {
                        console.error('Failed to parse issue rule snapshot:', e);
                      }

                      // Get rule name from snapshot or fallback to rule_name field
                      const ruleName = ruleData?.name || (issue as any).rule_name || 'Unknown';
                      const ruleVersion = ruleData?.version;

                      return (
                        <TableRow key={issue.id}>
                          <TableCell className="font-mono">
                            {issue.row_index + 1}
                          </TableCell>
                          <TableCell className="font-mono">
                            {issue.column_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium">{ruleName}</span>
                              {ruleVersion && (
                                <Badge variant="outline" className="font-mono text-xs w-fit">
                                  v{ruleVersion}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-32 truncate">
                            {issue.current_value || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                severityColors[issue.severity as Criticality]
                              }
                            >
                              {issue.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-48 truncate">
                            {issue.message || "No message"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

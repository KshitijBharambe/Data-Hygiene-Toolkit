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

        {/* Status Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              {statusIcons[execution.status]}
            </CardHeader>
            <CardContent>
              <Badge className={statusColors[execution.status]}>
                {execution.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {duration
                  ? `${duration}s`
                  : execution.status === "running"
                  ? "Running..."
                  : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rules Executed
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {execution.total_rules || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Issues Found
              </CardTitle>
              <Bug className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {execution.total_issues ?? issues.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress and Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>
                Started:{" "}
                {format(new Date(execution.started_at), "MMM d, yyyy HH:mm:ss")}
              </span>
              {execution.finished_at && (
                <span>
                  Finished:{" "}
                  {format(
                    new Date(execution.finished_at),
                    "MMM d, yyyy HH:mm:ss"
                  )}
                </span>
              )}
            </div>
            {execution.status === "running" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>
                    {formatDistanceToNow(new Date(execution.started_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <Progress value={undefined} className="animate-pulse" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for detailed information */}
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="issues">Issues ({issues.length})</TabsTrigger>
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
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Processing Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Rows:</span>
                      <span className="font-bold">
                        {summary.total_rows?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rows Affected:</span>
                      <span className="font-bold">
                        {summary.rows_affected?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Columns Affected:</span>
                      <span className="font-bold">
                        {summary.columns_affected || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Issues by Severity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summary.issues_by_severity &&
                    Object.keys(summary.issues_by_severity).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(summary.issues_by_severity).map(
                          ([severity, count]) => (
                            <div
                              key={severity}
                              className="flex justify-between items-center"
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={
                                    severityColors[severity as Criticality]
                                  }
                                >
                                  {severity}
                                </Badge>
                              </div>
                              <span className="font-bold">{String(count)}</span>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No issues found</p>
                    )}
                  </CardContent>
                </Card>
              </div>
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

          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Issues Found</CardTitle>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Column</TableHead>
                        <TableHead>Current Value</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issues.map((issue: Issue) => (
                        <TableRow key={issue.id}>
                          <TableCell className="font-mono">
                            {issue.row_index + 1}
                          </TableCell>
                          <TableCell className="font-mono">
                            {issue.column_name}
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
                          <TableCell>
                            <Badge variant="outline">
                              {issue.category || "General"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rule Performance</CardTitle>
                <CardDescription>
                  Performance details for each rule in this execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary?.rule_performance &&
                summary.rule_performance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule ID</TableHead>
                        <TableHead>Errors</TableHead>
                        <TableHead>Rows Flagged</TableHead>
                        <TableHead>Columns Flagged</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.rule_performance.map(
                        (rulePerf: {
                          rule_id: string;
                          error_count: number;
                          rows_flagged: number;
                          cols_flagged: number;
                          note?: string;
                        }) => (
                          <TableRow key={rulePerf.rule_id}>
                            <TableCell className="font-mono text-sm">
                              {rulePerf.rule_id.slice(0, 8)}...
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
                            <TableCell>{rulePerf.rows_flagged}</TableCell>
                            <TableCell>{rulePerf.cols_flagged}</TableCell>
                            <TableCell className="max-w-48 truncate">
                              {rulePerf.note || "N/A"}
                            </TableCell>
                          </TableRow>
                        )
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
      </div>
    </MainLayout>
  );
}

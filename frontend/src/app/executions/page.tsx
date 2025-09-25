"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExecutions, useCancelExecution } from "@/lib/hooks/useExecutions";
import {
  Play,
  Search,
  MoreHorizontal,
  Eye,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { Execution, ExecutionStatus } from "@/types/api";
import { format, formatDistanceToNow } from "date-fns";

const statusColors: Record<ExecutionStatus, string> = {
  queued: "bg-gray-100 text-gray-800",
  running: "bg-blue-100 text-blue-800",
  succeeded: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  partially_succeeded: "bg-yellow-100 text-yellow-800",
};

const statusIcons: Record<ExecutionStatus, React.ReactNode> = {
  queued: <Clock className="h-3 w-3" />,
  running: <Activity className="h-3 w-3 animate-spin" />,
  succeeded: <CheckCircle className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
  partially_succeeded: <AlertTriangle className="h-3 w-3" />,
};

function ExecutionActionsDropdown({ execution }: { execution: Execution }) {
  const cancelExecution = useCancelExecution();

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel this execution?")) {
      cancelExecution.mutate(execution.id);
    }
  };

  const canCancel =
    execution.status === "running" || execution.status === "queued";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/executions/${execution.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        {canCancel && (
          <DropdownMenuItem onClick={handleCancel} className="text-red-600">
            <Square className="h-4 w-4 mr-2" />
            Cancel
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ExecutionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | "all">(
    "all"
  );
  const { data: executionsData, isLoading, error } = useExecutions();

  // Memoize the statistics calculations
  // Memoize the statistics calculations
  const stats = useMemo(() => {
    // Explicitly type the 'items' constant
    const items: Execution[] = executionsData?.items || [];
    return {
      total: items.length,
      running: items.filter((e) => e.status === "running").length,
      succeeded: items.filter((e) => e.status === "succeeded").length,
      failed: items.filter((e) => e.status === "failed").length,
    };
  }, [executionsData]);

  // Memoize the filtering logic
  // Memoize the filtering logic
  const filteredExecutions = useMemo<Execution[]>(() => {
    if (!executionsData?.items) {
      return [];
    }
    // No type needed on 'execution' now, it's inferred correctly!
    return executionsData.items.filter(
      (execution: { id: string; status: string }) => {
        const matchesSearch = execution.id
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || execution.status === statusFilter;
        return matchesSearch && matchesStatus;
      }
    );
  }, [executionsData, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading executions...</div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">
            Error loading executions: {(error as Error).message}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8" />
              Rule Executions
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage rule execution runs on your datasets
            </p>
          </div>
          <Button asChild>
            <Link href="/executions/create">
              <Play className="h-4 w-4 mr-2" />
              Run Rules
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Executions
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <Activity className="h-4 w-4 text-blue-600 animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.running}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Succeeded</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.succeeded}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.failed}
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
                  placeholder="Search executions by ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as ExecutionStatus | "all")
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="partially_succeeded">
                    Partially Succeeded
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Executions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Executions ({filteredExecutions.length})</CardTitle>
            <CardDescription>
              Recent rule execution runs on your datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredExecutions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No executions found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "No executions match your criteria."
                    : "Get started by running rules on your datasets."}
                </p>
                <Button asChild>
                  <Link href="/executions/create">
                    <Play className="h-4 w-4 mr-2" />
                    Run Rules
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Execution ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rules</TableHead>
                    <TableHead>Rows Processed</TableHead>
                    <TableHead>Issues Found</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExecutions.map((execution) => {
                    const duration =
                      execution.finished_at && execution.started_at
                        ? Math.round(
                            (new Date(execution.finished_at).getTime() -
                              new Date(execution.started_at).getTime()) /
                              1000
                          )
                        : null;

                    return (
                      <TableRow key={execution.id}>
                        <TableCell>
                          <Link
                            href={`/executions/${execution.id}`}
                            className="font-mono text-sm hover:underline"
                          >
                            {execution.id.slice(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[execution.status]}>
                            <div className="flex items-center gap-1">
                              {statusIcons[execution.status]}
                              {execution.status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>{execution.total_rules || 0}</TableCell>
                        <TableCell>
                          {execution.total_rows
                            ? execution.total_rows.toLocaleString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{execution.total_issues ?? 0}</span>
                            {(execution.total_issues ?? 0) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                Issues
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {format(
                                new Date(execution.started_at),
                                "MMM d, yyyy"
                              )}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {formatDistanceToNow(
                                new Date(execution.started_at),
                                { addSuffix: true }
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {duration
                            ? `${duration}s`
                            : execution.status === "running"
                            ? "Running..."
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <ExecutionActionsDropdown execution={execution} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

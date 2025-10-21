"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileText,
  Database,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { useDatasets } from "@/lib/hooks/useDatasets";
import {
  useExportDataset,
  useExportHistory,
  useDownloadExport,
  useDeleteExport,
} from "@/lib/hooks/useReports";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils/date";

export default function ExportDataPage() {
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeIssues, setIncludeIssues] = useState(false);
  const { data: datasetsData } = useDatasets();
  const datasets = datasetsData?.items || [];

  // Hooks for export functionality
  const exportDataset = useExportDataset();
  const downloadExport = useDownloadExport();
  const deleteExport = useDeleteExport();
  const { data: exportHistory, isLoading: isLoadingHistory } =
    useExportHistory(selectedDataset);

  const handleExport = async () => {
    if (!selectedDataset) {
      toast.error("Please select a dataset");
      return;
    }

    try {
      const result = await exportDataset.mutateAsync({
        datasetId: selectedDataset,
        format: exportFormat,
        includeMetadata,
        includeIssues,
      });

      toast.success("Export created successfully");

      // Automatically download the export
      const blob = await downloadExport.mutateAsync(result.export_id);
      const url = window.URL.createObjectURL(blob.blob);
      const a = document.createElement("a");
      a.href = url;
      const extensionMap: Record<string, string> = {
        excel: "xlsx",
        csv: "csv",
        json: "json",
      };
      const extension = extensionMap[result.export_format] || result.export_format;
      a.download = `${result.dataset_name}_v${result.version_number}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to export dataset");
    }
  };

  const handleDownload = async (exportId: string, fileName: string) => {
    try {
      const blob = await downloadExport.mutateAsync(exportId);
      const url = window.URL.createObjectURL(blob.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to download export");
    }
  };

  const handleDelete = async (exportId: string) => {
    if (!confirm("Are you sure you want to delete this export?")) {
      return;
    }

    try {
      await deleteExport.mutateAsync(exportId);
      toast.success("Export deleted successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to delete export");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Export Data</h1>
          <p className="text-muted-foreground">
            Export your processed datasets and analysis results
          </p>
        </div>

        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Export Configuration</CardTitle>
            <CardDescription>
              Configure your data export settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataset">Dataset</Label>
                <Select
                  value={selectedDataset}
                  onValueChange={setSelectedDataset}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dataset to export" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets?.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id}>
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          {dataset.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      CSV (Comma-separated values)
                    </SelectItem>
                    <SelectItem value="excel">Excel (XLSX)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Export Options</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metadata"
                    checked={includeMetadata}
                    onCheckedChange={(checked) =>
                      setIncludeMetadata(checked === true)
                    }
                  />
                  <Label htmlFor="metadata" className="text-sm">
                    Include dataset metadata
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="issues"
                    checked={includeIssues}
                    onCheckedChange={(checked) =>
                      setIncludeIssues(checked === true)
                    }
                  />
                  <Label htmlFor="issues" className="text-sm">
                    Include data quality issues report
                  </Label>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleExport}
                disabled={
                  !selectedDataset ||
                  exportDataset.isPending ||
                  downloadExport.isPending
                }
                className="w-full md:w-auto"
              >
                {exportDataset.isPending || downloadExport.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export History */}
        {selectedDataset && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Exports</CardTitle>
              <CardDescription>
                Export history for the selected dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : exportHistory?.exports && exportHistory.exports.length > 0 ? (
                <div className="space-y-4">
                  {(exportHistory.exports as Record<string, unknown>[]).map(
                    (exportItem: Record<string, unknown>) => (
                      <div
                        key={exportItem.export_id as string}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText
                            className={`h-5 w-5 ${
                              exportItem.file_exists
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          />
                          <div>
                            <p className="font-medium">
                              {exportHistory.dataset_name} v
                              {String(exportItem.dataset_version || "")}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatRelativeTime(
                                  exportItem.created_at as string
                                )}
                              </span>
                              <span className="uppercase">
                                {String(exportItem.format || "")}
                              </span>
                              <span>
                                by {String(exportItem.created_by || "")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(exportItem.file_exists as boolean) ? (
                            <>
                              <Badge
                                variant="outline"
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Ready
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDownload(
                                    exportItem.export_id as string,
                                    `${exportHistory.dataset_name}_v${exportItem.dataset_version}.${exportItem.format}`
                                  )
                                }
                                disabled={downloadExport.isPending}
                              >
                                {downloadExport.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDelete(exportItem.export_id as string)
                                }
                                disabled={deleteExport.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              File Missing
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  No exports found for this dataset
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Export Formats Info */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Export Formats</CardTitle>
            <CardDescription>
              Choose the best format for your use case
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium">CSV</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Universal format compatible with Excel, databases, and most
                  data tools
                </p>
                <Badge variant="outline">Most Compatible</Badge>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium">Excel</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Rich formatting with multiple sheets for data and metadata
                </p>
                <Badge variant="outline">Business Friendly</Badge>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium">JSON</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Structured format ideal for APIs and web applications
                </p>
                <Badge variant="outline">API Ready</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

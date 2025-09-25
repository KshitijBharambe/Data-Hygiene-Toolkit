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
  Clock,
  AlertCircle,
} from "lucide-react";
import { useDatasets } from "@/lib/hooks/useDatasets";

export default function ExportDataPage() {
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeIssues, setIncludeIssues] = useState(false);
  const { data: datasetsData } = useDatasets();
  const datasets = datasetsData?.items || [];

  const handleExport = () => {
    // Export logic would be implemented here
    console.log("Exporting:", {
      dataset: selectedDataset,
      format: exportFormat,
      metadata: includeMetadata,
      issues: includeIssues,
    });
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
                    <SelectItem value="parquet">Parquet</SelectItem>
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
                disabled={!selectedDataset}
                className="w-full md:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Exports</CardTitle>
            <CardDescription>
              Your recent data exports and downloads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Customer Data Export</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />2 hours ago
                      </span>
                      <span>CSV format</span>
                      <span>2.1 MB</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Ready
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Sales Data Export with Issues</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Yesterday
                      </span>
                      <span>Excel format</span>
                      <span>5.7 MB</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Ready
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Product Inventory Export</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />3 days ago
                      </span>
                      <span>JSON format</span>
                      <span>1.2 MB</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-orange-600">
                    <Clock className="mr-1 h-3 w-3" />
                    Processing
                  </Badge>
                  <Button variant="ghost" size="sm" disabled>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Large Dataset Export</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />1 week ago
                      </span>
                      <span>CSV format</span>
                      <span>Failed</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Failed
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Formats Info */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Export Formats</CardTitle>
            <CardDescription>
              Choose the best format for your use case
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium">Parquet</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Columnar format optimized for analytics and large datasets
                </p>
                <Badge variant="outline">High Performance</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

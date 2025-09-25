"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  File,
} from "lucide-react";
import apiClient from "@/lib/api";

export default function UploadDataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  // Ensure token is set when session is available
  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken as string);
    }
  }, [session]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      // Auto-generate dataset name from filename if not set
      if (!datasetName) {
        const name = selectedFile.name.replace(/\.[^/.]+$/, "");
        setDatasetName(name);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError("");
      if (!datasetName) {
        const name = droppedFile.name.replace(/\.[^/.]+$/, "");
        setDatasetName(name);
      }
    }
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    const allowedExtensions = [".csv", ".xlsx", ".xls", ".txt"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      return "Please select a CSV, Excel, or text file";
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      return "File size must be less than 50MB";
    }

    return null;
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!datasetName.trim()) {
      setError("Please enter a dataset name");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    try {
      // Force set token from session if available
      if (session?.accessToken) {
        apiClient.setToken(session.accessToken as string);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await apiClient.uploadFile(
        file,
        datasetName.trim(),
        description.trim() || undefined
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      setSuccess(
        `File uploaded successfully! Dataset "${datasetName}" has been created.`
      );

      // Reset form
      setFile(null);
      setDatasetName("");
      setDescription("");

      // Redirect to datasets page after a short delay
      setTimeout(() => {
        router.push("/data/datasets");
      }, 2000);
    } catch (error: unknown) {
      setUploadProgress(0);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { detail?: string } };
        };
        if (axiosError.response?.data?.detail) {
          setError(axiosError.response.data.detail);
        } else {
          setError("Failed to upload file. Please try again.");
        }
      } else {
        setError("Failed to upload file. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Upload Data</h1>
          <p className="text-muted-foreground mt-2">
            Upload CSV, Excel, or text files to create new datasets
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload
              </CardTitle>
              <CardDescription>
                Select a file from your computer to upload
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Drop Zone */}
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 text-muted-foreground">
                    <FileSpreadsheet className="w-full h-full" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      {file
                        ? file.name
                        : "Drop your file here, or click to browse"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports CSV, Excel (.xlsx, .xls), and text files up to
                      50MB
                    </p>
                    {file && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Size: {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>
                </div>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileChange}
                />
              </div>

              {/* Dataset Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dataset-name">Dataset Name *</Label>
                  <Input
                    id="dataset-name"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="Enter a name for your dataset"
                    disabled={isUploading}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description of the dataset"
                    rows={3}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading || !datasetName.trim()}
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Upload Dataset"}
              </Button>
            </CardContent>
          </Card>

          {/* Upload Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Upload Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Supported File Types</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• CSV files (.csv)</li>
                  <li>• Excel files (.xlsx, .xls)</li>
                  <li>• Text files (.txt)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">File Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Maximum file size: 50MB</li>
                  <li>• First row should contain column headers</li>
                  <li>• Data should be clean and well-formatted</li>
                  <li>• Avoid merged cells in Excel files</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Data Quality Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use consistent date formats</li>
                  <li>• Avoid special characters in column names</li>
                  <li>• Keep data types consistent within columns</li>
                  <li>• Remove empty rows and columns</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">What Happens Next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• File is validated and processed</li>
                  <li>• Data profile is automatically generated</li>
                  <li>• Dataset becomes available for quality checks</li>
                  <li>• You can view and manage it in the Datasets section</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

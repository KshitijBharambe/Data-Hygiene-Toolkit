"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDatasets } from "@/lib/hooks/useDatasets";
import { useRules } from "@/lib/hooks/useRules";
import { useCreateExecution } from "@/lib/hooks/useExecutions";
import { Play, ArrowLeft, Database, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Criticality, RuleKind, Dataset } from "@/types/api";

const criticalityColors: Record<Criticality, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const ruleKindLabels: Record<RuleKind, string> = {
  missing_data: "Missing Data",
  standardization: "Standardization",
  value_list: "Value List",
  length_range: "Length Range",
  cross_field: "Cross Field",
  char_restriction: "Character Restriction",
  regex: "Regex Pattern",
  custom: "Custom Rule",
};

export default function CreateExecutionPage() {
  const router = useRouter();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

  const { data: datasetsData, isLoading: datasetsLoading } = useDatasets();
  const { data: rulesData, isLoading: rulesLoading } = useRules();
  const createExecution = useCreateExecution();

  const datasets = datasetsData?.items || [];
  const activeRules = rulesData?.items?.filter((rule) => rule.is_active) || [];

  const selectedDataset = datasets.find(
    (d: Dataset) => d.id === selectedDatasetId
  );

  const handleRuleToggle = (ruleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRuleIds((prev) => [...prev, ruleId]);
    } else {
      setSelectedRuleIds((prev) => prev.filter((id) => id !== ruleId));
    }
  };

  const handleSelectAllRules = (checked: boolean) => {
    if (checked) {
      setSelectedRuleIds(activeRules.map((rule) => rule.id));
    } else {
      setSelectedRuleIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDatasetId) {
      alert("Please select a dataset");
      return;
    }

    if (selectedRuleIds.length === 0) {
      alert("Please select at least one rule to execute");
      return;
    }

    try {
      // For now, we'll use the dataset_id as dataset_version_id since the backend may not have proper versioning
      const execution = await createExecution.mutateAsync({
        dataset_version_id: selectedDatasetId, // This should ideally be a dataset version ID
        rule_ids: selectedRuleIds,
      });

      router.push(`/executions/${execution.id}`);
    } catch (error: unknown) {
      console.error("Failed to create execution:", error);

      // Extract error message from response
      let errorMessage = "Failed to start execution. Please try again.";

      if (error && typeof error === 'object') {
        const axiosError = error as { response?: { status?: number; data?: { detail?: string } }; message?: string }
        if (axiosError.response?.status === 404) {
          errorMessage = "Dataset file not found. The dataset may need to be re-uploaded. Please delete this dataset and upload it again.";
        } else if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }

      alert(errorMessage);
    }
  };

  const canSubmit =
    selectedDatasetId &&
    selectedRuleIds.length > 0 &&
    !createExecution.isPending;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/executions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Play className="h-8 w-8" />
              Run Quality Rules
            </h1>
            <p className="text-muted-foreground mt-2">
              Execute data quality rules on your datasets
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dataset Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Select Dataset
              </CardTitle>
              <CardDescription>
                Choose the dataset you want to run quality rules against
              </CardDescription>
            </CardHeader>
            <CardContent>
              {datasetsLoading ? (
                <div className="text-muted-foreground">Loading datasets...</div>
              ) : datasets.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No Datasets Available
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You need to upload a dataset before running quality rules.
                  </p>
                  <Button asChild>
                    <Link href="/data">Upload Dataset</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select
                    value={selectedDatasetId}
                    onValueChange={setSelectedDatasetId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a dataset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((dataset: Dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{dataset.name}</span>
                            <div className="flex items-center gap-2 ml-4">
                              <Badge variant="outline">
                                {dataset.source_type}
                              </Badge>
                              <Badge variant="secondary">
                                {dataset.status}
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedDataset && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <h4 className="font-medium">
                            {selectedDataset.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Source: {selectedDataset.source_type}</span>
                            <span>Status: {selectedDataset.status}</span>
                            {selectedDataset.row_count && (
                              <span>
                                Rows:{" "}
                                {selectedDataset.row_count.toLocaleString()}
                              </span>
                            )}
                            {selectedDataset.column_count && (
                              <span>
                                Columns: {selectedDataset.column_count}
                              </span>
                            )}
                          </div>
                          {selectedDataset.notes && (
                            <p className="text-sm text-muted-foreground">
                              {selectedDataset.notes}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rule Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Select Rules
              </CardTitle>
              <CardDescription>
                Choose which quality rules to execute on the selected dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="text-muted-foreground">Loading rules...</div>
              ) : activeRules.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Rules</h3>
                  <p className="text-muted-foreground mb-4">
                    You need to create and activate quality rules before running
                    executions.
                  </p>
                  <Button asChild>
                    <Link href="/rules/create">Create Rule</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedRuleIds.length === activeRules.length}
                        onCheckedChange={handleSelectAllRules}
                      />
                      <Label htmlFor="select-all" className="font-medium">
                        Select All ({activeRules.length} rules)
                      </Label>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedRuleIds.length} of {activeRules.length} rules
                      selected
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {activeRules.map((rule) => (
                      <Card
                        key={rule.id}
                        className="border-2 transition-colors hover:border-muted-foreground/20"
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <Checkbox
                                id={rule.id}
                                checked={selectedRuleIds.includes(rule.id)}
                                onCheckedChange={(checked) =>
                                  handleRuleToggle(rule.id, !!checked)
                                }
                                className="mt-1"
                              />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={rule.id}
                                    className="font-medium cursor-pointer"
                                  >
                                    {rule.name}
                                  </Label>
                                  <Badge
                                    className={
                                      criticalityColors[rule.criticality]
                                    }
                                  >
                                    {rule.criticality}
                                  </Badge>
                                </div>
                                {rule.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {rule.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {ruleKindLabels[rule.kind]}
                                  </Badge>
                                  {rule.is_active && (
                                    <Badge
                                      variant="default"
                                      className="bg-green-100 text-green-800"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary and Submit */}
          {selectedDatasetId && selectedRuleIds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Execution Summary</CardTitle>
                <CardDescription>
                  Review your selection before starting the execution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Dataset</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedDataset?.name}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Rules Selected</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedRuleIds.length} rule
                      {selectedRuleIds.length !== 1 ? "s" : ""} will be executed
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex-1"
                  >
                    {createExecution.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Starting Execution...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Execution
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/executions">Cancel</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </MainLayout>
  );
}

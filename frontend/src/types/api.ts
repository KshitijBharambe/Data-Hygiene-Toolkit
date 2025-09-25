// User types
export type UserRole = "admin" | "analyst" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Dataset types
export type SourceType = "csv" | "excel" | "sap" | "ms_dynamics" | "other";
export type DatasetStatus =
  | "uploaded"
  | "profiled"
  | "validated"
  | "cleaned"
  | "exported";

export interface Dataset {
  id: string;
  name: string;
  source_type: SourceType;
  original_filename?: string;
  checksum?: string;
  uploaded_by: string;
  uploaded_at: string;
  status: DatasetStatus;
  row_count?: number;
  column_count?: number;
  notes?: string;
}

export interface DatasetCreate {
  name: string;
  source_type: SourceType;
  original_filename?: string;
  notes?: string;
}

export interface DatasetVersion {
  id: string;
  dataset_id: string;
  version_no: number;
  created_by: string;
  created_at: string;
  rows?: number;
  columns?: number;
  change_note?: string;
}

export interface DatasetColumn {
  id: string;
  dataset_id: string;
  name: string;
  ordinal_position: number;
  inferred_type?: string;
  is_nullable: boolean;
}

// Rule types
export type RuleKind =
  | "missing_data"
  | "standardization"
  | "value_list"
  | "length_range"
  | "cross_field"
  | "char_restriction"
  | "regex"
  | "custom";
export type Criticality = "low" | "medium" | "high" | "critical";

export interface Rule {
  id: string;
  name: string;
  description?: string;
  kind: RuleKind;
  criticality: Criticality;
  is_active: boolean;
  target_table?: string;
  target_columns?: string;
  params?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RuleCreate {
  name: string;
  description?: string;
  kind: RuleKind;
  criticality: Criticality;
  target_columns: string[];
  params?: Record<string, unknown>;
}

export interface RuleUpdate {
  name?: string;
  description?: string;
  kind?: RuleKind;
  criticality?: Criticality;
  is_active?: boolean;
  target_table?: string;
  target_columns?: string[];
  params?: Record<string, unknown>;
}

// Execution types
export type ExecutionStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "partially_succeeded";

export interface Execution {
  id: string;
  dataset_version_id: string;
  started_by: string;
  started_at: string;
  finished_at?: string;
  status: ExecutionStatus;
  total_rows?: number;
  total_rules?: number;
  rows_affected?: number;
  columns_affected?: number;
  total_issues?: number;
  summary?: string;
}

export interface ExecutionCreate {
  dataset_version_id: string;
  rule_ids: string[];
}

// Issue types
export interface Issue {
  id: string;
  execution_id: string;
  rule_id: string;
  rule_name?: string;
  row_index: number;
  column_name: string;
  current_value?: string;
  suggested_value?: string;
  message?: string;
  category?: string;
  severity: Criticality;
  created_at: string;
  resolved: boolean;
  fix_count: number;
  dataset_name?: string;
}

export interface IssueCreate {
  execution_id: string;
  rule_id: string;
  row_index: number;
  column_name: string;
  current_value?: string;
  suggested_value?: string;
  message?: string;
  category?: string;
  severity: Criticality;
}

// Fix types
export interface Fix {
  id: string;
  issue_id: string;
  fixed_by: string;
  fixed_at: string;
  new_value?: string;
  comment?: string;
}

export interface FixCreate {
  issue_id: string;
  new_value?: string;
  comment?: string;
}

// Export types
export type ExportFormat = "csv" | "excel" | "json" | "api" | "datalake";

export interface Export {
  id: string;
  dataset_version_id: string;
  execution_id?: string;
  format: ExportFormat;
  location?: string;
  created_by: string;
  created_at: string;
}

export interface ExportCreate {
  dataset_version_id: string;
  execution_id?: string;
  format: ExportFormat;
  location?: string;
}

// File upload types
export interface FileUploadResponse {
  message: string;
  filename: string;
  size: number;
  dataset_id: string;
}

export interface DataProfileResponse {
  total_rows: number;
  total_columns: number;
  columns: DatasetColumn[];
  data_types_summary: Record<string, unknown>;
  missing_values_summary: Record<string, unknown>;
}

// Report types
export interface DataQualitySummary {
  total_issues: number;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  resolved_issues: number;
  categories_breakdown: Record<string, number>;
}

export interface ExecutionSummary {
  execution_id: string;
  status: string;
  total_rules: number;
  total_rows: number;
  rows_affected: number;
  columns_affected: number;
  total_issues: number;
  issues_by_severity: Record<string, number>;
  issues_by_category: Record<string, number>;
  issues_by_rule: Record<string, number>;
  rule_performance: Array<{
    rule_id: string;
    error_count: number;
    rows_flagged: number;
    cols_flagged: number;
    note?: string;
  }>;
  started_at: string;
  finished_at?: string;
  duration_seconds?: number;
}

// Rule testing types
export interface RuleTestRequest {
  sample_data: Record<string, unknown>[];
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Dashboard types
export interface DashboardOverview {
  overview: {
    total_datasets: number;
    total_executions: number;
    total_issues: number;
    total_fixes: number;
    avg_quality_score: number;
    issues_fixed_rate: number;
  };
  recent_activity: {
    recent_datasets: Array<{
      id: string;
      name: string;
      status: DatasetStatus;
      uploaded_at: string;
    }>;
    recent_executions: Array<{
      id: string;
      dataset_version_id: string;
      status: ExecutionStatus;
      issues_found: number;
      created_at: string;
    }>;
  };
  statistics: {
    dataset_status_distribution: Record<string, number>;
    quality_score_distribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  };
}

# ============================================================================
# Cloud Storage Module - Variables
# ============================================================================

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "bucket_name" {
  description = "Bucket name (must be globally unique)"
  type        = string
}

variable "location" {
  description = "Bucket location"
  type        = string
}

variable "storage_class" {
  description = "Storage class"
  type        = string
}

variable "versioning_enabled" {
  description = "Enable object versioning"
  type        = bool
}

variable "lifecycle_age" {
  description = "Days before objects are deleted"
  type        = number
}

variable "cors_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
}

variable "labels" {
  description = "Resource labels"
  type        = map(string)
}

variable "cloud_run_service_account" {
  description = "Cloud Run service account email"
  type        = string
}

variable "public_read" {
  description = "Allow public read access"
  type        = bool
  default     = false
}

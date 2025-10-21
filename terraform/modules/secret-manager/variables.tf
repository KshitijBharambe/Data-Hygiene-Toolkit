# ============================================================================
# Secret Manager Module - Variables
# ============================================================================

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "secrets" {
  description = "Map of secrets to create"
  type = map(object({
    value       = string
    description = string
  }))
  sensitive = true
}

variable "labels" {
  description = "Resource labels"
  type        = map(string)
  default     = {}
}

variable "cloud_run_service_account" {
  description = "Cloud Run service account email"
  type        = string
}

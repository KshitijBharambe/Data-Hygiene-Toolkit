# ============================================================================
# Cloud Run Module - Variables
# ============================================================================

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment (prod, staging, dev)"
  type        = string
}

variable "container_image" {
  description = "Container image URL"
  type        = string
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
}

variable "cpu" {
  description = "CPU allocation"
  type        = string
}

variable "memory" {
  description = "Memory allocation"
  type        = string
}

variable "timeout" {
  description = "Request timeout in seconds"
  type        = number
}

variable "concurrency" {
  description = "Maximum concurrent requests per instance"
  type        = number
}

variable "vpc_connector_id" {
  description = "VPC connector ID"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables"
  type        = map(string)
  default     = {}
}

variable "secrets" {
  description = "Secret Manager secrets to inject as environment variables"
  type = map(object({
    secret_name = string
    version     = string
  }))
  default = {}
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated requests"
  type        = bool
  default     = true
}

variable "custom_domain" {
  description = "Custom domain name (optional)"
  type        = string
  default     = ""
}

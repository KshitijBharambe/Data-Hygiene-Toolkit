# ============================================================================
# Cloud SQL Module - Variables
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

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_user" {
  description = "Database username"
  type        = string
}

variable "db_tier" {
  description = "Cloud SQL instance tier"
  type        = string
}

variable "db_disk_size" {
  description = "Database disk size in GB"
  type        = number
}

variable "db_disk_type" {
  description = "Database disk type"
  type        = string
}

variable "db_backup_enabled" {
  description = "Enable automated backups"
  type        = bool
}

variable "db_backup_start_time" {
  description = "Backup start time"
  type        = string
}

variable "db_high_availability" {
  description = "Enable high availability"
  type        = bool
}

variable "vpc_id" {
  description = "VPC network ID for private IP"
  type        = string
}

variable "private_vpc_connection" {
  description = "Private VPC connection (dependency)"
  type        = any
}

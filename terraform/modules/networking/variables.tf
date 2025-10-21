# ============================================================================
# Networking Module - Variables
# ============================================================================

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "vpc_name" {
  description = "VPC network name"
  type        = string
}

variable "subnet_cidr" {
  description = "Subnet CIDR range"
  type        = string
}

variable "vpc_connector_cidr" {
  description = "VPC connector CIDR range"
  type        = string
}

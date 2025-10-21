# ============================================================================
# Cloud SQL Module - Outputs
# ============================================================================

output "connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.main.connection_name
}

output "instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.main.name
}

output "private_ip" {
  description = "Private IP address"
  value       = google_sql_database_instance.main.private_ip_address
  sensitive   = true
}

output "database_name" {
  description = "Database name"
  value       = google_sql_database.database.name
}

output "database_user" {
  description = "Database username"
  value       = google_sql_user.user.name
}

output "database_password_secret" {
  description = "Secret Manager secret name for database password"
  value       = google_secret_manager_secret.db_password.secret_id
}

output "connection_string" {
  description = "Database connection string (without password)"
  value       = "postgresql://${google_sql_user.user.name}:<PASSWORD>@/${google_sql_database.database.name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
  sensitive   = true
}

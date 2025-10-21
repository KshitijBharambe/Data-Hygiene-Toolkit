# ============================================================================
# Cloud Storage Module - Outputs
# ============================================================================

output "bucket_name" {
  description = "Bucket name"
  value       = google_storage_bucket.main.name
}

output "bucket_url" {
  description = "Bucket URL"
  value       = google_storage_bucket.main.url
}

output "bucket_self_link" {
  description = "Bucket self link"
  value       = google_storage_bucket.main.self_link
}

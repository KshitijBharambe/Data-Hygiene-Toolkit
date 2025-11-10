# ============================================================================
# Cloud Storage Module - GCS Bucket
# For storing uploaded files, datasets, and exports
# ============================================================================

# Cloud Storage Bucket
resource "google_storage_bucket" "main" {
  name          = var.bucket_name
  location      = var.location
  storage_class = var.storage_class
  project       = var.project_id

  # Enable uniform bucket-level access (recommended)
  uniform_bucket_level_access = true

  # Enable versioning for data protection
  versioning {
    enabled = var.versioning_enabled
  }

  # Lifecycle rule to delete old objects
  dynamic "lifecycle_rule" {
    for_each = var.lifecycle_age > 0 ? [1] : []
    content {
      condition {
        age = var.lifecycle_age
      }
      action {
        type = "Delete"
      }
    }
  }

  # CORS configuration for web uploads
  cors {
    origin          = var.cors_origins
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  # Labels
  labels = var.labels
}

# IAM binding - Allow Cloud Run service account to access bucket
resource "google_storage_bucket_iam_member" "cloud_run_access" {
  bucket = google_storage_bucket.main.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.cloud_run_service_account}"
}

# IAM binding - Allow allUsers to read public objects (optional)
resource "google_storage_bucket_iam_member" "public_read" {
  count  = var.public_read ? 1 : 0
  bucket = google_storage_bucket.main.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

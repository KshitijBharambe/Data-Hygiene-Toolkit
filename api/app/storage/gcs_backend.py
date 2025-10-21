"""
Google Cloud Storage backend implementation.

Uses GCS for production object storage.
"""

import logging
from typing import List, Optional
from datetime import timedelta

from google.cloud import storage
from google.cloud.exceptions import NotFound, GoogleCloudError
from google.auth.exceptions import DefaultCredentialsError

from .base import StorageBackend, StorageError

logger = logging.getLogger(__name__)


class GCSStorage(StorageBackend):
    """Google Cloud Storage backend."""

    def __init__(self, project_id: Optional[str] = None):
        """
        Initialize GCS storage backend.

        Args:
            project_id: GCP project ID (optional, can be inferred from environment)
        """
        try:
            if project_id:
                self.client = storage.Client(project=project_id)
            else:
                # Will use default credentials (service account, ADC, etc.)
                self.client = storage.Client()

            self.project_id = self.client.project
            logger.info(f"Initialized GCS storage backend for project {self.project_id}")

        except DefaultCredentialsError as e:
            logger.error(f"Failed to initialize GCS client: {e}")
            raise StorageError(
                f"GCS authentication failed. Ensure credentials are configured: {e}"
            )

    def upload_file(
        self,
        bucket: str,
        key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None,
    ) -> str:
        """Upload a file to GCS."""
        try:
            bucket_obj = self.client.bucket(bucket)
            blob = bucket_obj.blob(key)

            # Set content type
            blob.content_type = content_type

            # Set metadata if provided
            if metadata:
                blob.metadata = metadata

            # Upload the file
            blob.upload_from_string(data, content_type=content_type)

            # Return the public URL (gs:// format)
            url = f"gs://{bucket}/{key}"
            logger.info(f"Uploaded file to {url}")
            return url

        except GoogleCloudError as e:
            logger.error(f"Failed to upload file {key} to bucket {bucket}: {e}")
            raise StorageError(f"Upload failed: {e}")

    def download_file(self, bucket: str, key: str) -> bytes:
        """Download a file from GCS."""
        try:
            bucket_obj = self.client.bucket(bucket)
            blob = bucket_obj.blob(key)

            data = blob.download_as_bytes()
            logger.info(f"Downloaded file {key} from bucket {bucket}")
            return data

        except NotFound:
            raise FileNotFoundError(f"File {key} not found in bucket {bucket}")
        except GoogleCloudError as e:
            logger.error(f"Failed to download file {key} from bucket {bucket}: {e}")
            raise StorageError(f"Download failed: {e}")

    def delete_file(self, bucket: str, key: str) -> bool:
        """Delete a file from GCS."""
        try:
            bucket_obj = self.client.bucket(bucket)
            blob = bucket_obj.blob(key)

            # Check if file exists
            if not blob.exists():
                logger.warning(f"File {key} does not exist in bucket {bucket}")
                return False

            blob.delete()
            logger.info(f"Deleted file {key} from bucket {bucket}")
            return True

        except GoogleCloudError as e:
            logger.error(f"Failed to delete file {key} from bucket {bucket}: {e}")
            raise StorageError(f"Delete failed: {e}")

    def list_files(
        self, bucket: str, prefix: str = "", max_results: int = 1000
    ) -> List[str]:
        """List files in GCS bucket."""
        try:
            bucket_obj = self.client.bucket(bucket)
            blobs = bucket_obj.list_blobs(prefix=prefix, max_results=max_results)

            files = [blob.name for blob in blobs]
            logger.info(
                f"Listed {len(files)} files in bucket {bucket} with prefix '{prefix}'"
            )
            return files

        except GoogleCloudError as e:
            logger.error(
                f"Failed to list files in bucket {bucket} with prefix '{prefix}': {e}"
            )
            raise StorageError(f"List failed: {e}")

    def get_signed_url(
        self, bucket: str, key: str, expiration: int = 3600, method: str = "GET"
    ) -> str:
        """Generate a signed URL for GCS object."""
        try:
            bucket_obj = self.client.bucket(bucket)
            blob = bucket_obj.blob(key)

            # Generate signed URL
            url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(seconds=expiration),
                method=method.upper(),
            )

            logger.info(f"Generated signed URL for {key} in bucket {bucket}")
            return url

        except GoogleCloudError as e:
            logger.error(f"Failed to generate signed URL for {key}: {e}")
            raise StorageError(f"Signed URL generation failed: {e}")

    def file_exists(self, bucket: str, key: str) -> bool:
        """Check if file exists in GCS."""
        try:
            bucket_obj = self.client.bucket(bucket)
            blob = bucket_obj.blob(key)
            return blob.exists()

        except GoogleCloudError as e:
            logger.error(f"Failed to check if file {key} exists in bucket {bucket}: {e}")
            raise StorageError(f"Existence check failed: {e}")

    def get_file_metadata(self, bucket: str, key: str) -> dict:
        """Get file metadata from GCS."""
        try:
            bucket_obj = self.client.bucket(bucket)
            blob = bucket_obj.blob(key)

            # Reload blob to get latest metadata
            if not blob.exists():
                raise FileNotFoundError(f"File {key} not found in bucket {bucket}")

            blob.reload()

            metadata = {
                "size": blob.size,
                "content_type": blob.content_type,
                "last_modified": blob.updated,
                "etag": blob.etag,
                "metadata": blob.metadata or {},
                "md5_hash": blob.md5_hash,
                "crc32c": blob.crc32c,
            }

            logger.info(f"Retrieved metadata for {key} from bucket {bucket}")
            return metadata

        except NotFound:
            raise FileNotFoundError(f"File {key} not found in bucket {bucket}")
        except GoogleCloudError as e:
            logger.error(f"Failed to get metadata for {key} from bucket {bucket}: {e}")
            raise StorageError(f"Metadata retrieval failed: {e}")

    def copy_file(
        self, source_bucket: str, source_key: str, dest_bucket: str, dest_key: str
    ) -> bool:
        """Copy file within or between GCS buckets."""
        try:
            source_bucket_obj = self.client.bucket(source_bucket)
            source_blob = source_bucket_obj.blob(source_key)

            # Check if source file exists
            if not source_blob.exists():
                raise FileNotFoundError(
                    f"Source file {source_key} not found in bucket {source_bucket}"
                )

            dest_bucket_obj = self.client.bucket(dest_bucket)

            # Copy the blob
            source_bucket_obj.copy_blob(
                source_blob, dest_bucket_obj, new_name=dest_key
            )

            logger.info(
                f"Copied file from {source_bucket}/{source_key} to {dest_bucket}/{dest_key}"
            )
            return True

        except FileNotFoundError:
            raise
        except GoogleCloudError as e:
            logger.error(f"Failed to copy file: {e}")
            raise StorageError(f"Copy failed: {e}")

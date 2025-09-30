/**
 * Centralized API configuration
 * Update this URL when the API endpoint changes
 */

export function getApiUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return 'https://data-hygiene-toolkit.fly.dev';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

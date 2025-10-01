/**
 * Centralized API configuration
 * Update this URL when the API endpoint changes
 */

export function getApiUrl(): string {
  // In production, always use HTTPS
  // Works in both server and client environments
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    return 'https://data-hygiene-toolkit.fly.dev';
  }

  // Development: use env var or localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

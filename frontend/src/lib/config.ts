/**
 * Centralized API configuration
 * Update this URL when the API endpoint changes
 */

export function getApiUrl(): string {
  // Always use HTTPS for deployed environments
  // Only use localhost in true local development
  if (typeof window !== 'undefined') {
    // Client-side: check browser URL
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    // Force HTTPS for production
    return 'https://data-hygiene-toolkit.fly.dev';
  }

  // Server-side: use env or default to HTTPS
  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  // Always return HTTPS URL for production
  return 'https://data-hygiene-toolkit.fly.dev';
}

/**
 * Centralized API configuration
 * Update this URL when the API endpoint changes
 */

export function getApiUrl(): string {
  // Server-side (Next.js API routes/server components)
  if (typeof window === 'undefined') {
    // In Docker/prod-sim, use internal Docker network name
    // In development, use localhost
    if (process.env.INTERNAL_API_URL) {
      return process.env.INTERNAL_API_URL;
    }

    if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
      return 'http://localhost:8000';
    }

    // Production/Vercel: use public URL
    return 'https://data-hygiene-toolkit.fly.dev';
  }

  // Client-side (browser)
  // Priority 1: Use build-time environment variable if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Priority 2: Runtime detection based on browser location
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }

  // Priority 3: Production deployment
  return 'https://data-hygiene-toolkit.fly.dev';
}

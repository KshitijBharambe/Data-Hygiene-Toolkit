/**
 * Centralized API configuration
 * Update this URL when the API endpoint changes
 */

export function getApiUrl(): string {
  const nodeEnv = process.env.NODE_ENV;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  console.log('🔍 API Config Debug:', { nodeEnv, apiUrl });

  // In production, always use HTTPS - ignore env vars
  if (nodeEnv === 'production') {
    console.log('✅ Using production HTTPS URL');
    return 'https://data-hygiene-toolkit.fly.dev';
  }

  // Development: use env var or localhost
  const devUrl = apiUrl || 'http://localhost:8000';
  console.log('🛠️ Using development URL:', devUrl);
  return devUrl;
}

/**
 * Centralized API configuration
 * Update this URL when the API endpoint changes
 */

export function getApiUrl(): string {
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;

  console.log('🌍 getApiUrl called:', { nodeEnv, vercelEnv });

  // In production, always use HTTPS
  // Works in both server and client environments
  if (nodeEnv === 'production' || vercelEnv === 'production') {
    console.log('✅ Returning HTTPS URL for production');
    return 'https://data-hygiene-toolkit.fly.dev';
  }

  // Development: use env var or localhost
  const devUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  console.log('🛠️ Returning dev URL:', devUrl);
  return devUrl;
}

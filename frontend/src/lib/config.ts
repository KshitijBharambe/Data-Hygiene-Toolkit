/**
 * Centralized API configuration
 * Update these URLs when the API endpoint changes
 */

export const API_CONFIG = {
  PRODUCTION_URL: process.env.NEXT_PUBLIC_API_URL_PROD || 'https://data-hygiene-toolkit.fly.dev',
  DEVELOPMENT_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
} as const

export function getApiUrl(): string {
  return process.env.NODE_ENV === 'production'
    ? API_CONFIG.PRODUCTION_URL
    : API_CONFIG.DEVELOPMENT_URL
}

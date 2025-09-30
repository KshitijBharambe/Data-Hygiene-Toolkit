/**
 * Centralized API configuration
 * Update this URL when the API endpoint changes
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getApiUrl(): string {
  return API_URL;
}

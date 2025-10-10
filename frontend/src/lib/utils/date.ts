/**
 * Date and time formatting utilities
 *
 * This module provides consistent date/time formatting across the application.
 * All dates from the API are expected to be in ISO 8601 format (UTC).
 */

import { format as dateFnsFormat, formatDistanceToNow, parseISO } from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';

/**
 * Validate if a date value is valid
 */
export function isValidDate(date: unknown): boolean {
  if (!date) return false;

  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }

  if (typeof date === 'string') {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }

  return false;
}

/**
 * Parse an ISO date string to a Date object
 *
 * All timestamps from the API are in UTC with timezone info (e.g., "2025-10-07T23:04:39.085294+00:00")
 * parseISO from date-fns handles these correctly.
 *
 * @throws {Error} If the date string is invalid
 */
export function parseDate(dateString: string | Date): Date {
  if (!dateString) {
    throw new Error('Date value is null or undefined');
  }

  if (dateString instanceof Date) {
    if (isNaN(dateString.getTime())) {
      throw new Error('Invalid Date object');
    }
    return dateString;
  }

  // Parse ISO string - date-fns handles timezone-aware strings correctly
  const parsed = parseISO(dateString);

  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  return parsed;
}

/**
 * Format a date to local date string (e.g., "Jan 15, 2024")
 * Returns fallback text if date is invalid
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'MMM d, yyyy',
  fallback: string = 'N/A'
): string {
  try {
    if (!isValidDate(date)) {
      return fallback;
    }
    const dateObj = parseDate(date as string | Date);
    return dateFnsFormat(dateObj, formatStr);
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return fallback;
  }
}

/**
 * Format a date to local datetime string (e.g., "Jan 15, 2024 3:30 PM")
 * Returns fallback text if date is invalid
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  formatStr: string = 'MMM d, yyyy h:mm a',
  fallback: string = 'N/A'
): string {
  try {
    if (!isValidDate(date)) {
      return fallback;
    }
    const dateObj = parseDate(date as string | Date);
    return dateFnsFormat(dateObj, formatStr);
  } catch (error) {
    console.warn('Error formatting datetime:', date, error);
    return fallback;
  }
}

/**
 * Format a date to long datetime string (e.g., "January 15, 2024 at 3:30:45 PM")
 * Returns fallback text if date is invalid
 */
export function formatDateTimeLong(
  date: string | Date | null | undefined,
  fallback: string = 'N/A'
): string {
  try {
    if (!isValidDate(date)) {
      return fallback;
    }
    const dateObj = parseDate(date as string | Date);
    return dateFnsFormat(dateObj, 'MMMM d, yyyy \'at\' h:mm:ss a');
  } catch (error) {
    console.warn('Error formatting long datetime:', date, error);
    return fallback;
  }
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 * Returns fallback text if date is invalid
 */
export function formatRelativeTime(
  date: string | Date | null | undefined,
  fallback: string = 'N/A'
): string {
  try {
    if (!isValidDate(date)) {
      return fallback;
    }
    const dateObj = parseDate(date as string | Date);
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.warn('Error formatting relative time:', date, error);
    return fallback;
  }
}

/**
 * Format a date to a specific timezone
 * Returns fallback text if date is invalid
 */
export function formatDateInTimezone(
  date: string | Date | null | undefined,
  timezone: string,
  formatStr: string = 'MMM d, yyyy h:mm a zzz',
  fallback: string = 'N/A'
): string {
  try {
    if (!isValidDate(date)) {
      return fallback;
    }
    const dateObj = parseDate(date as string | Date);
    const zonedDate = toZonedTime(dateObj, timezone);
    return formatTz(zonedDate, formatStr, { timeZone: timezone });
  } catch (error) {
    console.warn('Error formatting date in timezone:', date, error);
    return fallback;
  }
}

/**
 * Get the user's local timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Check if a date is today
 * Returns false if date is invalid
 */
export function isToday(date: string | Date | null | undefined): boolean {
  try {
    if (!isValidDate(date)) {
      return false;
    }
    const dateObj = parseDate(date as string | Date);
    const today = new Date();

    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Check if a date is within the last N days
 * Returns false if date is invalid
 */
export function isWithinDays(date: string | Date | null | undefined, days: number): boolean {
  try {
    if (!isValidDate(date)) {
      return false;
    }
    const dateObj = parseDate(date as string | Date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= days;
  } catch {
    return false;
  }
}

/**
 * Format a date for display in tables or lists
 * Shows relative time if recent, otherwise shows formatted date
 * Returns fallback text if date is invalid
 */
export function formatSmartDate(
  date: string | Date | null | undefined,
  fallback: string = 'N/A'
): string {
  try {
    if (!isValidDate(date)) {
      return fallback;
    }
    const dateObj = parseDate(date as string | Date);

    // If within last 24 hours, show relative time
    if (isWithinDays(dateObj, 1)) {
      return formatRelativeTime(dateObj);
    }

    // If within last 7 days, show day and time
    if (isWithinDays(dateObj, 7)) {
      return dateFnsFormat(dateObj, 'EEE h:mm a');
    }

    // Otherwise show date
    return dateFnsFormat(dateObj, 'MMM d, yyyy');
  } catch (error) {
    console.warn('Error formatting smart date:', date, error);
    return fallback;
  }
}

/**
 * Convert a local date to ISO string in UTC
 */
export function toUTCString(date: Date): string {
  return date.toISOString();
}

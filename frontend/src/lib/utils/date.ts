/**
 * Date and time formatting utilities
 *
 * This module provides consistent date/time formatting across the application.
 * All dates from the API are expected to be in ISO 8601 format (UTC).
 */

import { format as dateFnsFormat, formatDistanceToNow, parseISO } from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';

/**
 * Parse an ISO date string to a Date object
 *
 * All timestamps from the API are in UTC with timezone info (e.g., "2025-10-07T23:04:39.085294+00:00")
 * parseISO from date-fns handles these correctly.
 */
export function parseDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return dateString;
  }

  // Parse ISO string - date-fns handles timezone-aware strings correctly
  return parseISO(dateString);
}

/**
 * Format a date to local date string (e.g., "Jan 15, 2024")
 */
export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const dateObj = parseDate(date);
  return dateFnsFormat(dateObj, formatStr);
}

/**
 * Format a date to local datetime string (e.g., "Jan 15, 2024 3:30 PM")
 */
export function formatDateTime(date: string | Date, formatStr: string = 'MMM d, yyyy h:mm a'): string {
  const dateObj = parseDate(date);
  return dateFnsFormat(dateObj, formatStr);
}

/**
 * Format a date to long datetime string (e.g., "January 15, 2024 at 3:30:45 PM")
 */
export function formatDateTimeLong(date: string | Date): string {
  const dateObj = parseDate(date);
  return dateFnsFormat(dateObj, 'MMMM d, yyyy \'at\' h:mm:ss a');
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = parseDate(date);
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format a date to a specific timezone
 */
export function formatDateInTimezone(
  date: string | Date,
  timezone: string,
  formatStr: string = 'MMM d, yyyy h:mm a zzz'
): string {
  const dateObj = parseDate(date);
  const zonedDate = toZonedTime(dateObj, timezone);
  return formatTz(zonedDate, formatStr, { timeZone: timezone });
}

/**
 * Get the user's local timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = parseDate(date);
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is within the last N days
 */
export function isWithinDays(date: string | Date, days: number): boolean {
  const dateObj = parseDate(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - dateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= days;
}

/**
 * Format a date for display in tables or lists
 * Shows relative time if recent, otherwise shows formatted date
 */
export function formatSmartDate(date: string | Date): string {
  const dateObj = parseDate(date);

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
}

/**
 * Convert a local date to ISO string in UTC
 */
export function toUTCString(date: Date): string {
  return date.toISOString();
}

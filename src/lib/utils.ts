import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';

// Utility functions for the finance manager

export type CurrencyCode = 'ILS' | 'USD';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyAmount(amount: number, currency: CurrencyCode): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return formatCurrency(amount);
}

export function getAmountInILS(
  amount: number,
  currency: CurrencyCode | string,
  exchangeRate: number
): number {
  return currency === 'USD' ? amount * exchangeRate : amount;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('he-IL').format(num);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'short',
  }).format(d);
}

export function formatFullDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatMonthYear(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatShortMonth(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('he-IL', {
    month: 'short',
    year: '2-digit',
  }).format(d);
}

export function getMonthKey(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function calculateSavingsRate(income: number, expenses: number): number {
  if (income === 0) return 0;
  return ((income - expenses) / income) * 100;
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Get all months between two dates
export function getMonthsBetween(startDate: Date, endDate: Date): Date[] {
  const months: Date[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  
  while (current <= endDate) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
}

// Parse month key back to date
export function parseMonthKey(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

/**
 * Calculate the actual date boundaries for a financial month.
 *
 * When startDay === 1 the result matches a normal calendar month.
 * When startDay > 1 (e.g. 10), "2026-03" represents the period
 * from the 10th of the previous calendar month to the 9th of the
 * current calendar month.
 *
 * Handles year rollover and short-month clamping automatically.
 */
export function getFinancialMonthBounds(
  monthKey: string,
  startDay: number
): { startDate: Date; endDate: Date } {
  const [year, monthNum] = monthKey.split('-').map(Number);

  if (startDay <= 1) {
    const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  // Previous calendar month (handles year rollover via JS Date)
  const prevMonth = monthNum - 2; // 0-indexed: monthNum-1 is current, monthNum-2 is prev
  const prevYear = year;

  // Clamp startDay to the number of days in the previous calendar month
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
  const clampedStartDay = Math.min(startDay, daysInPrevMonth);

  const startDate = new Date(prevYear, prevMonth, clampedStartDay, 0, 0, 0, 0);

  // End day = startDay - 1 of the current calendar month, clamped
  const endDayTarget = startDay - 1;
  const daysInCurrentMonth = new Date(year, monthNum, 0).getDate();
  const clampedEndDay = Math.min(endDayTarget, daysInCurrentMonth);

  const endDate = new Date(year, monthNum - 1, clampedEndDay, 23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Format the financial month date range for display in human-readable Hebrew.
 * Returns null when startDay is 1 (standard calendar month).
 * Otherwise returns e.g. "10 בפברואר - 9 במרץ".
 */
export function formatFinancialMonthRange(monthKey: string, startDay: number): string | null {
  if (startDay <= 1) return null;

  const { startDate, endDate } = getFinancialMonthBounds(monthKey, startDay);
  const startStr = format(startDate, 'd בMMMM', { locale: he });
  const endStr = format(endDate, 'd בMMMM', { locale: he });

  return `${startStr} - ${endStr}`;
}

/**
 * Check whether a date falls within a given financial month.
 */
export function isInFinancialMonth(
  txDate: string | Date,
  monthKey: string,
  startDay: number
): boolean {
  const { startDate, endDate } = getFinancialMonthBounds(monthKey, startDay);
  const d = new Date(txDate);
  return d >= startDate && d <= endDate;
}

/**
 * Return the financial-month key (YYYY-MM) that a date belongs to.
 * When startDay is 1 this is identical to getMonthKey.
 * When startDay > 1, dates on or after startDay belong to the *next*
 * calendar month's financial period.
 */
export function getFinancialMonthKey(
  date: string | Date,
  startDay: number
): string {
  if (startDay <= 1) return getMonthKey(date);

  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth(); // 0-indexed
  const year = d.getFullYear();

  if (day >= startDay) {
    const nextMonth = month + 1;
    if (nextMonth > 11) {
      return `${year + 1}-01`;
    }
    return `${year}-${String(nextMonth + 1).padStart(2, '0')}`;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Check if a recurring transaction is active in a given month.
 * - If isActive is false, always returns false.
 * - If activeMonths is null/empty, the transaction is active in all months.
 * - Otherwise, checks if monthKey is included in activeMonths.
 */
export function isRecurringActiveInMonth(
  recurring: { isActive: boolean; activeMonths?: string[] | null },
  monthKey: string
): boolean {
  if (!recurring.isActive) return false;
  if (!recurring.activeMonths || recurring.activeMonths.length === 0) return true;
  return recurring.activeMonths.includes(monthKey);
}

/**
 * Validate activeMonths format: must be array of "YYYY-MM" strings or null.
 */
export function validateActiveMonths(activeMonths: unknown): string | null {
  if (activeMonths === null || activeMonths === undefined) return null;
  if (!Array.isArray(activeMonths)) return 'activeMonths must be an array or null';
  const monthPattern = /^\d{4}-\d{2}$/;
  for (const m of activeMonths) {
    if (typeof m !== 'string' || !monthPattern.test(m)) {
      return `Invalid month format: "${m}". Expected "YYYY-MM"`;
    }
  }
  return null;
}

// ============================================================================
// CSRF-Protected Fetch Wrapper (Double Submit Cookie Pattern)
// ============================================================================

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './csrf';

/** Read CSRF token from the non-httpOnly cookie (client-side only). */
function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null; // SSR guard
  const entry = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CSRF_COOKIE_NAME}=`));
  return entry ? decodeURIComponent(entry.split('=')[1]) : null;
}

/**
 * Fetch wrapper that automatically adds the X-CSRF-Token header
 * (read from the csrf-token cookie) for non-safe HTTP methods.
 *
 * Use this instead of raw fetch() for all API calls.
 *
 * @example
 * const data = await apiFetch('/api/transactions', {
 *   method: 'POST',
 *   body: JSON.stringify({ amount: 100 })
 * });
 */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Add CSRF protection header for non-safe methods
  const method = options?.method?.toUpperCase() || 'GET';
  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);

  // Check if body is FormData (file upload)
  const isFormData = options?.body instanceof FormData;

  // For FormData, we must NOT set Content-Type (browser sets it with boundary)
  // For other requests, we can safely create a Headers object
  if (isFormData) {
    // For FormData: only add CSRF header, let browser handle Content-Type
    const headers = new Headers(options?.headers);
    if (!isSafeMethod) {
      const csrfToken = readCsrfCookie();
      if (csrfToken) headers.set(CSRF_HEADER_NAME, csrfToken);
    }
    return fetch(url, {
      ...options,
      headers,
    });
  } else {
    // For non-FormData requests: normal header handling
    const headers = new Headers(options?.headers);

    if (!isSafeMethod) {
      const csrfToken = readCsrfCookie();
      if (csrfToken) headers.set(CSRF_HEADER_NAME, csrfToken);
    }

    // Ensure Content-Type is set for JSON payloads
    if (options?.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }
}

/**
 * Convenience wrapper for JSON API calls with CSRF protection
 * Automatically parses JSON response and throws on errors
 *
 * @example
 * const transaction = await apiRequest('/api/transactions/123');
 * const newTransaction = await apiRequest('/api/transactions', {
 *   method: 'POST',
 *   body: { amount: 100, type: 'expense' }
 * });
 */
export async function apiRequest<T = unknown>(
  url: string,
  options?: Omit<RequestInit, 'body'> & { body?: unknown }
): Promise<T> {
  const opts: RequestInit = {
    ...options,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  };

  const response = await apiFetch(url, opts);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

export function trackCtaClickServer(source: string) {
  apiFetch('/api/track/cta-click', {
    method: 'POST',
    body: JSON.stringify({ source }),
  }).catch(() => {});
}

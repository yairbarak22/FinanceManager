// Utility functions for the finance manager

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

// ============================================================================
// CSRF-Protected Fetch Wrapper
// ============================================================================

/**
 * Fetch wrapper that automatically adds CSRF protection header
 * Use this instead of raw fetch() for all API calls
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
  const headers = new Headers(options?.headers);

  // Add CSRF protection header for non-safe methods
  const method = options?.method?.toUpperCase() || 'GET';
  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (!isSafeMethod) {
    headers.set('X-CSRF-Protection', '1');
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


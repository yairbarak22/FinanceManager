/**
 * Excel Cell Sanitization
 * מנקה ומאמת ערכים מתאי Excel למניעת injection attacks
 *
 * Security Layer #3: Output Sanitization
 */

/**
 * Sanitize a cell value to prevent injection attacks
 *
 * Security measures:
 * 1. Remove HTML tags (XSS prevention)
 * 2. Remove formula injection prefixes (=, +, -, @)
 * 3. Limit string length (DoS prevention)
 * 4. Normalize whitespace
 */
export function sanitizeCellValue(val: unknown): string | number | null {
  // Handle null/undefined
  if (val === null || val === undefined || val === '') {
    return null;
  }

  // If it's a number, validate and return
  if (typeof val === 'number') {
    // Check for NaN, Infinity, or suspicious values
    if (!isFinite(val)) {
      return null;
    }
    return val;
  }

  // Convert to string and sanitize
  let str = String(val).trim();

  // 1. Remove HTML tags (XSS prevention)
  str = str.replace(/<[^>]*>/g, '');

  // 2. Remove formula injection prefixes (CSV/Formula Injection prevention)
  // Excel formulas start with: = + - @
  // Also check for: \t \r (tab/carriage return injection)
  if (str.length > 0) {
    const firstChar = str[0];
    if (['=', '+', '-', '@', '\t', '\r'].includes(firstChar)) {
      str = str.slice(1); // Remove first character
    }
  }

  // 3. Limit string length (DoS prevention)
  const MAX_CELL_LENGTH = 500;
  if (str.length > MAX_CELL_LENGTH) {
    console.warn('[Sanitizer] Truncating cell value, length:', str.length);
    str = str.slice(0, MAX_CELL_LENGTH);
  }

  // 4. Normalize whitespace (remove excessive spaces, newlines)
  str = str.replace(/\s+/g, ' ').trim();

  // Return empty string as null
  return str === '' ? null : str;
}

/**
 * Sanitize an entire row of Excel data
 */
export function sanitizeRow(row: unknown[]): (string | number | null)[] {
  return row.map(sanitizeCellValue);
}

/**
 * Sanitize all rows in Excel data
 */
export function sanitizeExcelData(data: unknown[][]): (string | number | null)[][] {
  return data.map(sanitizeRow);
}

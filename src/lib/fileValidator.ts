/**
 * File Validation Utilities
 * מאמת את תקינות וחוקיות קבצי Excel לפני עיבוד
 *
 * Security Layer #1: Magic Bytes & File Structure Validation
 */

/**
 * Validate Excel file signature (Magic Bytes)
 * XLSX files are ZIP archives starting with PK\x03\x04 (50 4B 03 04)
 */
export function validateExcelSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  const magicBytes = buffer.slice(0, 4).toString('hex');

  // XLSX/ZIP signature: 50 4B 03 04
  return magicBytes === '504b0304';
}

/**
 * Validate file size is within acceptable limits
 */
export function validateFileSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * Validate MIME type matches Excel formats
 */
export function validateExcelMimeType(mimeType: string): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls (legacy)
  ];

  return validTypes.includes(mimeType);
}

/**
 * Comprehensive Excel file validation
 * Returns error message if invalid, null if valid
 */
export function validateExcelFile(
  buffer: Buffer,
  size: number,
  mimeType: string
): string | null {
  // 1. Size validation
  if (!validateFileSize(size)) {
    return 'גודל הקובץ חורג מהמותר (מקסימום 10MB)';
  }

  // 2. MIME type validation
  if (!validateExcelMimeType(mimeType)) {
    return 'סוג הקובץ אינו נתמך. נא להעלות קובץ Excel בלבד';
  }

  // 3. Magic bytes validation (critical security check)
  if (!validateExcelSignature(buffer)) {
    return 'הקובץ אינו תקין. ודא שזהו קובץ Excel אמיתי';
  }

  return null; // Valid
}

/**
 * File Validation Utilities
 * Provides validation and sanitization for both Excel imports and general document uploads
 *
 * Two main validation paths:
 * 1. Excel-specific validation (for transaction imports)
 * 2. General document validation (for asset/liability document uploads)
 */

import sharp from 'sharp';
import JSZip from 'jszip';

// ====================
// EXCEL-SPECIFIC VALIDATION (Security Layer #1 for imports)
// ====================

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

// ====================
// GENERAL DOCUMENT VALIDATION (for document uploads)
// ====================

// Magic bytes signatures for different file types
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  // PDF: %PDF-
  'application/pdf': [
    { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }
  ],
  // JPEG: FF D8 FF
  'image/jpeg': [
    { offset: 0, bytes: [0xff, 0xd8, 0xff] }
  ],
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  'image/png': [
    { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }
  ],
  // MS Word (DOC): D0 CF 11 E0 (OLE compound document)
  'application/msword': [
    { offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0] }
  ],
  // MS Excel (XLS): D0 CF 11 E0 (OLE compound document)
  'application/vnd.ms-excel': [
    { offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0] }
  ],
  // DOCX: PK (ZIP archive, starts with PK)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }
  ],
  // XLSX: PK (ZIP archive, starts with PK)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }
  ],
};

// Dangerous patterns in Office documents
const OFFICE_DANGEROUS_PATTERNS = [
  'vbaProject.bin',  // VBA macros
  'activeX',         // ActiveX controls
  'embeddings',      // Embedded OLE objects
  'oleObject',       // OLE objects
];

// Dangerous patterns in PDFs
const PDF_DANGEROUS_PATTERNS = [
  '/JavaScript',     // JavaScript actions
  '/JS',             // JavaScript shorthand
  '/Launch',         // Launch external applications
  '/OpenAction',     // Auto-execute on open
  '/AA',             // Additional actions
  '/EmbeddedFile',   // Embedded files (potential malware)
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedBuffer?: Buffer;
}

/**
 * Validate magic bytes of a file
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) {
    // If we don't have a signature for this type, skip magic byte check
    return true;
  }

  return signatures.some(sig => {
    if (buffer.length < sig.offset + sig.bytes.length) {
      return false;
    }
    return sig.bytes.every((byte, i) => buffer[sig.offset + i] === byte);
  });
}

/**
 * Re-encode image to strip any malicious metadata/content
 */
async function sanitizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  const image = sharp(buffer);

  // Strip all metadata
  image.rotate(); // Auto-rotate based on EXIF, then...

  if (mimeType === 'image/jpeg') {
    return image
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
  } else if (mimeType === 'image/png') {
    return image
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  return buffer;
}

/**
 * Check Office documents (OOXML - docx, xlsx) for macros/dangerous content
 */
async function validateOfficeDocument(buffer: Buffer): Promise<ValidationResult> {
  try {
    const zip = await JSZip.loadAsync(buffer);

    // Check all files in the ZIP for dangerous patterns
    for (const filename of Object.keys(zip.files)) {
      const lowerFilename = filename.toLowerCase();
      for (const pattern of OFFICE_DANGEROUS_PATTERNS) {
        if (lowerFilename.includes(pattern.toLowerCase())) {
          return {
            isValid: false,
            error: `קובץ Office מכיל תוכן פוטנציאלית מסוכן (${pattern}). אנא שמור כ-PDF והעלה שוב.`,
          };
        }
      }
    }

    return { isValid: true, sanitizedBuffer: buffer };
  } catch (error) {
    return {
      isValid: false,
      error: 'שגיאה בבדיקת קובץ Office',
    };
  }
}

/**
 * Check legacy Office documents (DOC, XLS) for OLE macros
 * These are OLE compound documents - we can't easily parse them,
 * so we do a basic check for VBA macro signatures
 */
async function validateLegacyOfficeDocument(buffer: Buffer): Promise<ValidationResult> {
  // Check for VBA macro signature in the binary content
  const content = buffer.toString('binary');

  const vbaPatterns = [
    'VBA',               // VBA project
    'Macros',            // Macros folder
    '_VBA_PROJECT_CUR',  // VBA project
    'ThisDocument',      // Common VBA entry point
    'Auto_Open',         // Auto-execute macro
    'AutoOpen',          // Auto-execute macro
    'AutoExec',          // Auto-execute macro
    'Document_Open',     // Auto-execute in Word
    'Workbook_Open',     // Auto-execute in Excel
  ];

  for (const pattern of vbaPatterns) {
    if (content.includes(pattern)) {
      return {
        isValid: false,
        error: 'קובץ Office מכיל מאקרו. אנא שמור כ-PDF או DOCX/XLSX ללא מאקרו והעלה שוב.',
      };
    }
  }

  return { isValid: true, sanitizedBuffer: buffer };
}

/**
 * Check PDF for JavaScript and other dangerous content
 */
async function validatePDF(buffer: Buffer): Promise<ValidationResult> {
  // Convert to string for pattern matching (ASCII parts of PDF)
  const content = buffer.toString('binary');

  for (const pattern of PDF_DANGEROUS_PATTERNS) {
    if (content.includes(pattern)) {
      // Check if it's actually actionable (not just in a comment)
      // Simple heuristic: if the pattern appears, flag it
      if (pattern === '/OpenAction' || pattern === '/JavaScript' || pattern === '/JS') {
        return {
          isValid: false,
          error: 'קובץ PDF מכיל JavaScript או פעולות אוטומטיות. אנא הדפס ל-PDF מחדש ללא תוכן פעיל.',
        };
      }
    }
  }

  return { isValid: true, sanitizedBuffer: buffer };
}

/**
 * Main validation function - validates and sanitizes uploaded files
 * Used for general document uploads (PDFs, Office docs, images)
 */
export async function validateAndSanitizeFile(
  buffer: Buffer,
  mimeType: string
): Promise<ValidationResult> {
  // Layer 2: Magic bytes validation
  if (!validateMagicBytes(buffer, mimeType)) {
    return {
      isValid: false,
      error: 'תוכן הקובץ לא תואם לסוג הקובץ המוצהר. אנא העלה קובץ תקין.',
    };
  }

  // Layer 3: Type-specific validation and sanitization
  try {
    switch (mimeType) {
      // Images - re-encode to strip malicious content
      case 'image/jpeg':
      case 'image/png': {
        const sanitized = await sanitizeImage(buffer, mimeType);
        return { isValid: true, sanitizedBuffer: sanitized };
      }

      // Modern Office documents (OOXML)
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        return await validateOfficeDocument(buffer);
      }

      // Legacy Office documents (OLE)
      case 'application/msword':
      case 'application/vnd.ms-excel': {
        return await validateLegacyOfficeDocument(buffer);
      }

      // PDF
      case 'application/pdf': {
        return await validatePDF(buffer);
      }

      // Unknown type - pass through (shouldn't happen with ALLOWED_TYPES check)
      default:
        return { isValid: true, sanitizedBuffer: buffer };
    }
  } catch (error) {
    console.error('File validation error:', error);
    return {
      isValid: false,
      error: 'שגיאה בבדיקת הקובץ. אנא נסה שוב.',
    };
  }
}

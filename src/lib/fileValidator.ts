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

// pdf-parse is loaded lazily because it pulls in pdfjs-dist which requires
// canvas/DOM APIs that are unavailable during Next.js server-side build.
// When unavailable, we fall back to pattern matching (which is sufficient for
// blocking /JavaScript, /Launch, /JS, and counting embedded files/xref entries).
type PdfParseResult = { numpages: number; info?: Record<string, unknown> };
type PdfParseFn = (buffer: Buffer, options?: { max?: number }) => Promise<PdfParseResult>;

let _pdfParse: PdfParseFn | null = null;
let _pdfParseLoadAttempted = false;

function getPdfParse(): PdfParseFn | null {
  if (_pdfParseLoadAttempted) return _pdfParse;
  _pdfParseLoadAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _pdfParse = require('pdf-parse') as PdfParseFn;
  } catch {
    console.warn('[FileValidator] pdf-parse not available, using pattern matching only');
    _pdfParse = null;
  }
  return _pdfParse;
}

// ====================
// EXCEL-SPECIFIC VALIDATION (Security Layer #1 for imports)
// ====================

/**
 * Validate Excel file signature (Magic Bytes)
 * Supports multiple formats:
 * - XLSX: PK\x03\x04 (50 4B 03 04) - ZIP archive
 * - XLS:  D0 CF 11 E0 - OLE compound document
 * - HTML-based Excel: Files starting with < or whitespace+< (Israeli banks export these)
 * - XML-based Excel: <?xml or similar
 */
export function validateExcelSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  const magicBytes = buffer.slice(0, 4).toString('hex');

  // XLSX/ZIP signature: 50 4B 03 04 (PK\x03\x04)
  if (magicBytes === '504b0304') return true;
  
  // XLS (legacy OLE) signature: D0 CF 11 E0
  if (magicBytes === 'd0cf11e0') return true;

  // HTML-based "Excel" files (common from Israeli banks)
  // These start with <html, <table, or have whitespace before < 
  // Find first non-whitespace character in first 100 bytes
  const firstBytes = buffer.slice(0, 100).toString('utf8');
  const trimmed = firstBytes.trim();
  
  // Check if it starts with HTML/XML markers
  if (trimmed.startsWith('<') || 
      trimmed.startsWith('<?xml') || 
      trimmed.toLowerCase().startsWith('<html') ||
      trimmed.toLowerCase().startsWith('<!doctype') ||
      trimmed.toLowerCase().startsWith('<table')) {
    console.log('[FileValidator] Detected HTML/XML based Excel file');
    return true;
  }

  return false;
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
    console.log('[FileValidator] EXCEL_FILE_TOO_LARGE: size=%d', size);
    return 'גודל הקובץ חורג מהמותר (מקסימום 10MB)';
  }
  console.log('[FileValidator] Size validation PASSED');

  // 2. MIME type validation
  if (!validateExcelMimeType(mimeType)) {
    console.log('[FileValidator] EXCEL_INVALID_MIME: mimeType=%s', mimeType);
    return 'סוג הקובץ אינו נתמך. נא להעלות קובץ Excel בלבד';
  }
  console.log('[FileValidator] MIME validation PASSED');

  // 3. Magic bytes validation (critical security check)
  if (!validateExcelSignature(buffer)) {
    const magicBytes = buffer.slice(0, 4).toString('hex');
    console.log('[FileValidator] EXCEL_INVALID_MAGIC_BYTES: bytes=%s', magicBytes);
    return 'הקובץ אינו תקין. ודא שזהו קובץ Excel אמיתי';
  }
  console.log('[FileValidator] Magic bytes validation PASSED');

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

// Dangerous patterns in Office documents (OOXML ZIP filenames)
// NOTE: 'embeddings' and 'oleObject' were removed because they appear in legitimate
// documents with embedded charts, Excel tables, or PDF attachments - common in financial docs.
const OFFICE_DANGEROUS_PATTERNS = [
  'vbaProject.bin',  // VBA macros (actual code execution)
  'activeX',         // ActiveX controls (code execution)
];

// PDF patterns that MUST be blocked (actual code execution vectors)
const PDF_BLOCK_PATTERNS = [
  '/JavaScript',     // JavaScript actions
  '/JS',             // JavaScript shorthand
  '/Launch',         // Launch external applications
];

// PDF patterns that are suspicious but common in legitimate PDFs (log only, don't block)
const PDF_WARN_PATTERNS = [
  '/OpenAction',     // Auto-execute on open (extremely common - sets initial view/zoom)
  '/AA',             // Additional actions (page-level actions, often benign)
  '/EmbeddedFile',   // Embedded files (can be legitimate attachments)
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

// Image dimension limits
// 15000x15000 supports up to 600 DPI scans of A3 paper (largest common document format)
// 200 million pixel limit prevents decompression bombs from small files that expand to huge images
const MAX_IMAGE_DIMENSION = 15000;  // Max width or height in pixels
const MAX_IMAGE_PIXELS = 200_000_000;  // Max total pixels (width * height)

/**
 * Re-encode image to strip any malicious metadata/content
 * Also validates image dimensions to prevent decompression bombs
 */
async function sanitizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  const image = sharp(buffer);

  // Check image dimensions before processing (prevents decompression bombs)
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new Error(
      `IMAGE_TOO_LARGE: תמונה גדולה מדי (${width}x${height}). מקסימום: ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION} פיקסלים.`
    );
  }

  if (width * height > MAX_IMAGE_PIXELS) {
    throw new Error(
      `IMAGE_TOO_MANY_PIXELS: תמונה מכילה יותר מדי פיקסלים (${(width * height / 1_000_000).toFixed(1)}MP). מקסימום: ${MAX_IMAGE_PIXELS / 1_000_000}MP.`
    );
  }

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

// Maximum size for individual files within OOXML ZIP (prevents XML entity expansion attacks)
const MAX_OOXML_ENTRY_SIZE = 50 * 1024 * 1024; // 50MB per entry

/**
 * Check Office documents (OOXML - docx, xlsx) for macros/dangerous content
 * Also validates individual ZIP entry sizes to prevent XML entity expansion attacks
 */
async function validateOfficeDocument(buffer: Buffer): Promise<ValidationResult> {
  try {
    const zip = await JSZip.loadAsync(buffer);

    // Check all files in the ZIP for dangerous patterns and size limits
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      // Skip directories
      if (zipEntry.dir) continue;

      const lowerFilename = filename.toLowerCase();

      // Check for dangerous patterns (macros, ActiveX)
      for (const pattern of OFFICE_DANGEROUS_PATTERNS) {
        if (lowerFilename.includes(pattern.toLowerCase())) {
          console.warn('[FileValidator] OOXML_DANGEROUS_CONTENT: pattern=%s, file=%s', pattern, filename);
          return {
            isValid: false,
            error: `קובץ Office מכיל תוכן פוטנציאלית מסוכן (${pattern}). אנא שמור כ-PDF והעלה שוב.`,
          };
        }
      }

      // Check XML file sizes to prevent entity expansion (XML bombs)
      if (lowerFilename.endsWith('.xml') || lowerFilename.endsWith('.rels')) {
        const content = await zipEntry.async('uint8array');
        if (content.length > MAX_OOXML_ENTRY_SIZE) {
          console.warn('[FileValidator] OOXML_XML_TOO_LARGE: file=%s, size=%d', filename, content.length);
          return {
            isValid: false,
            error: 'קובץ Office מכיל תוכן XML גדול מדי. אנא בדוק את הקובץ.',
          };
        }
      }
    }

    return { isValid: true, sanitizedBuffer: buffer };
  } catch (error) {
    console.error('[FileValidator] OOXML_PARSE_ERROR:', error);
    return {
      isValid: false,
      error: 'שגיאה בבדיקת קובץ Office. ודא שהקובץ תקין.',
    };
  }
}

/**
 * Check legacy Office documents (DOC, XLS) for OLE macros
 * These are OLE compound documents - we can't easily parse them,
 * so we do a basic check for VBA macro signatures.
 * 
 * NOTE: Short strings like "VBA" (3 chars) can appear in any binary stream by chance,
 * causing false positives. We use longer, more specific patterns that only appear
 * in actual VBA macro projects within OLE compound documents.
 */
async function validateLegacyOfficeDocument(buffer: Buffer): Promise<ValidationResult> {
  // Check for VBA macro signature in the binary content
  const content = buffer.toString('binary');

  const vbaPatterns = [
    '_VBA_PROJECT',      // VBA project stream (specific OLE stream name)
    '_VBA_PROJECT_CUR',  // VBA project current version
    'VBA/Macros',        // VBA macros folder path within OLE
    'ThisDocument',      // Common VBA entry point (Word)
    'Auto_Open',         // Auto-execute macro
    'AutoOpen',          // Auto-execute macro
    'AutoExec',          // Auto-execute macro
    'Document_Open',     // Auto-execute in Word
    'Workbook_Open',     // Auto-execute in Excel
  ];

  for (const pattern of vbaPatterns) {
    if (content.includes(pattern)) {
      console.warn(`[FileValidator] Legacy Office blocked: contains "${pattern}"`);
      return {
        isValid: false,
        error: 'קובץ Office מכיל מאקרו. אנא שמור כ-PDF או DOCX/XLSX ללא מאקרו והעלה שוב.',
      };
    }
  }

  return { isValid: true, sanitizedBuffer: buffer };
}

// ============================================================================
// PDF ADVANCED VALIDATION
// ============================================================================

// Maximum pages for a legitimate financial document
const MAX_PDF_PAGES = 2000;

// Maximum PDF file size for parsing (prevents memory exhaustion)
const MAX_PDF_PARSE_SIZE = 50 * 1024 * 1024; // 50MB

// Maximum number of embedded files allowed
const MAX_PDF_EMBEDDED_FILES = 10;

// Maximum cross-reference stream count (prevents crafted PDFs with excessive objects)
const MAX_PDF_XREF_ENTRIES = 500_000;

/**
 * Validate PDF structure using pdf-parse.
 * Checks for:
 * - Valid PDF structure (parseable)
 * - PDF bombs (excessive pages or objects)
 * - Embedded files count
 *
 * Returns { isValid, error?, warnings? }
 * If parsing fails, falls back to allowing the file with a warning (backward compat).
 */
async function validatePDFStructure(buffer: Buffer): Promise<{
  isValid: boolean;
  error?: string;
  warnings?: string[];
}> {
  const warnings: string[] = [];

  // Skip structural validation for very large files (they'll still get pattern-checked)
  if (buffer.length > MAX_PDF_PARSE_SIZE) {
    warnings.push('PDF_LARGE_FILE: file too large for structural analysis');
    return { isValid: true, warnings };
  }

  // Embedded file count check — lightweight string scan, doesn't need pdf-parse
  const embeddedFileCount = countPDFEmbeddedFiles(buffer);
  if (embeddedFileCount > MAX_PDF_EMBEDDED_FILES) {
    console.warn('[FileValidator] PDF_TOO_MANY_EMBEDDED: count=%d', embeddedFileCount);
    return {
      isValid: false,
      error: `קובץ PDF מכיל יותר מדי קבצים מוטבעים (${embeddedFileCount}). מקסימום: ${MAX_PDF_EMBEDDED_FILES}.`,
    };
  }

  if (embeddedFileCount > 0) {
    warnings.push(`PDF contains ${embeddedFileCount} embedded file(s)`);
  }

  // Try pdf-parse for deep structural validation (page count, etc.)
  const parseFn = getPdfParse();
  if (parseFn) {
    try {
      const data = await parseFn(buffer, {
        // Don't render pages - just parse structure
        max: 0,
      });

      // Check page count (prevent PDF bombs with thousands of pages)
      if (data.numpages > MAX_PDF_PAGES) {
        console.warn('[FileValidator] PDF_TOO_MANY_PAGES: pages=%d', data.numpages);
        return {
          isValid: false,
          error: `קובץ PDF מכיל יותר מדי עמודים (${data.numpages}). מקסימום: ${MAX_PDF_PAGES} עמודים.`,
        };
      }

      return { isValid: true, warnings };
    } catch (parseError) {
      // Parsing failed - this could be a malformed PDF or one with features pdf-parse doesn't handle.
      // For backward compatibility, we allow it but log a warning.
      // The pattern-matching validation below will still catch dangerous content.
      const msg = parseError instanceof Error ? parseError.message : String(parseError);
      console.warn('[FileValidator] PDF_PARSE_FALLBACK: parser failed, using pattern matching only:', msg);
      warnings.push(`PDF_PARSE_FALLBACK: ${msg}`);
      return { isValid: true, warnings };
    }
  }

  // pdf-parse not available — rely on embedded file count (already done above)
  // and pattern matching (done in validatePDF after this call)
  warnings.push('PDF_PARSE_UNAVAILABLE: using pattern matching only');
  return { isValid: true, warnings };
}

/**
 * Count embedded files in a PDF by scanning for /EmbeddedFile entries.
 * This is a lightweight heuristic that doesn't require full parsing.
 */
function countPDFEmbeddedFiles(buffer: Buffer): number {
  const content = buffer.toString('binary');
  let count = 0;
  let searchFrom = 0;
  while (true) {
    const idx = content.indexOf('/EmbeddedFile', searchFrom);
    if (idx === -1) break;
    count++;
    searchFrom = idx + '/EmbeddedFile'.length;
  }
  return count;
}

/**
 * Count cross-reference entries to detect PDF bombs with excessive object streams.
 */
function countPDFXrefEntries(buffer: Buffer): number {
  const content = buffer.toString('binary');
  // Count "obj" declarations (e.g. "1 0 obj")
  const matches = content.match(/\d+\s+\d+\s+obj/g);
  return matches ? matches.length : 0;
}

/**
 * Check PDF for JavaScript and other dangerous content
 * 
 * IMPORTANT: /OpenAction is NOT blocked because it's present in almost every legitimate PDF
 * (used for setting initial view/zoom). Only actual code execution vectors are blocked:
 * /JavaScript, /JS, and /Launch.
 *
 * Enhanced with:
 * - PDF structure validation (pdf-parse)
 * - PDF bomb detection (page count, xref entries)
 * - Embedded file count limits
 */
async function validatePDF(buffer: Buffer): Promise<ValidationResult> {
  // Layer 1: Structural validation (pdf-parse)
  const structureResult = await validatePDFStructure(buffer);
  if (!structureResult.isValid) {
    return {
      isValid: false,
      error: structureResult.error,
    };
  }

  // Log any warnings from structural validation
  if (structureResult.warnings?.length) {
    for (const w of structureResult.warnings) {
      console.log(`[FileValidator] PDF structural warning: ${w}`);
    }
  }

  // Layer 2: Check for excessive cross-reference objects (PDF bomb indicator)
  const xrefCount = countPDFXrefEntries(buffer);
  if (xrefCount > MAX_PDF_XREF_ENTRIES) {
    console.warn('[FileValidator] PDF_XREF_BOMB: xref entries=%d', xrefCount);
    return {
      isValid: false,
      error: 'קובץ PDF מכיל יותר מדי אובייקטים. ייתכן שהקובץ פגום או זדוני.',
    };
  }

  // Layer 3: Pattern matching for dangerous content
  const content = buffer.toString('binary');

  // Check for patterns that MUST be blocked (code execution vectors)
  for (const pattern of PDF_BLOCK_PATTERNS) {
    if (content.includes(pattern)) {
      console.warn(`[FileValidator] PDF blocked: contains ${pattern}`);
      return {
        isValid: false,
        error: 'קובץ PDF מכיל JavaScript או פעולות מסוכנות. אנא הדפס ל-PDF מחדש ללא תוכן פעיל.',
      };
    }
  }

  // Log warnings for suspicious but commonly legitimate patterns (don't block)
  for (const pattern of PDF_WARN_PATTERNS) {
    if (content.includes(pattern)) {
      console.log(`[FileValidator] PDF warning (allowed): contains ${pattern}`);
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
    console.warn('[FileValidator] DOC_INVALID_MAGIC_BYTES: mimeType=%s, bytes=%s', mimeType, buffer.slice(0, 4).toString('hex'));
    return {
      isValid: false,
      error: 'תוכן הקובץ לא תואם לסוג הקובץ המוצהר. אנא העלה קובץ תקין.',
    };
  }

  // Layer 3: Type-specific validation and sanitization
  try {
    switch (mimeType) {
      // Images - validate dimensions and re-encode to strip malicious content
      case 'image/jpeg':
      case 'image/png': {
        try {
          const sanitized = await sanitizeImage(buffer, mimeType);
          return { isValid: true, sanitizedBuffer: sanitized };
        } catch (imgError) {
          const message = imgError instanceof Error ? imgError.message : 'שגיאה בעיבוד התמונה';
          // Extract user-friendly message (after the error code prefix)
          const userMessage = message.includes(': ') ? message.split(': ').slice(1).join(': ') : message;
          console.error('[FileValidator] Image validation failed:', message);
          return { isValid: false, error: userMessage };
        }
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
    console.error('[FileValidator] VALIDATION_UNEXPECTED_ERROR: mimeType=%s', mimeType, error);
    return {
      isValid: false,
      error: 'שגיאה בבדיקת הקובץ. אנא נסה שוב.',
    };
  }
}

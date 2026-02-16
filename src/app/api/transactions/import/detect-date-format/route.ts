/**
 * Date Format Detection API
 * Parses the first rows of an uploaded Excel/CSV file to detect the date format.
 * Returns the detected format, confidence level, and sample dates for user confirmation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import * as XLSX from 'xlsx';
import { validateExcelFile } from '@/lib/fileValidator';
import { sanitizeExcelData } from '@/lib/excelSanitizer';

// Header keywords for finding the header row
const HEADER_KEYWORDS = [
  'תאריך', 'date', 'סכום', 'amount', 'שם', 'עסק', 'בית עסק',
  'פרטים', 'merchant', 'description', 'חיוב', 'זיכוי', 'תיאור',
  'פעולה', 'אסמכתא', 'יתרה', 'כרטיס', 'מספר', 'קטגוריה'
];

// Date-related header keywords
const DATE_HEADER_KEYWORDS = ['תאריך', 'date'];

type DetectedFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'AUTO';

interface DetectionResult {
  detectedFormat: DetectedFormat;
  confidence: 'high' | 'medium' | 'low';
  sampleDates: string[];         // Raw date strings from the file
  sampleParsed: string[];        // How detected format interprets them
  isHtmlFile: boolean;
  isExcelSerial: boolean;
}

/**
 * Find the first header row using keyword matching
 */
function findFirstHeaderRow(rows: unknown[][]): number {
  const MIN_MATCHES = 3;
  const MAX_HEADER_LENGTH = 200;
  const MIN_NON_EMPTY_CELLS = 2;

  // First pass: strict matching
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');
    if (rowText.length > MAX_HEADER_LENGTH) continue;

    const nonEmptyCells = row.filter(cell =>
      cell !== null && cell !== undefined && String(cell).trim().length > 0
    ).length;
    if (nonEmptyCells < MIN_NON_EMPTY_CELLS) continue;

    const matches = HEADER_KEYWORDS.filter(kw => rowText.includes(kw.toLowerCase())).length;
    if (matches >= MIN_MATCHES) {
      const nextRow = rows[i + 1];
      const hasNextRowData = nextRow && nextRow.some(cell =>
        cell !== null && cell !== undefined && String(cell).trim().length > 0
      );
      if (hasNextRowData) return i;
    }
  }

  // Fallback: find the row with the most matches
  let bestRowIndex = 0;
  let maxMatches = 0;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');
    const nonEmptyCells = row.filter(cell =>
      cell !== null && cell !== undefined && String(cell).trim().length > 0
    ).length;
    if (nonEmptyCells < MIN_NON_EMPTY_CELLS) continue;

    const matches = HEADER_KEYWORDS.filter(kw => rowText.includes(kw.toLowerCase())).length;
    if (matches > maxMatches) {
      const nextRow = rows[i + 1];
      const hasNextRowData = nextRow && nextRow.some(cell =>
        cell !== null && cell !== undefined && String(cell).trim().length > 0
      );
      if (hasNextRowData) {
        maxMatches = matches;
        bestRowIndex = i;
      }
    }
  }

  return maxMatches > 0 ? bestRowIndex : 0;
}

/**
 * Find the date column index
 */
function findDateColumnIndex(headerRow: unknown[]): number {
  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '').toLowerCase();
    if (DATE_HEADER_KEYWORDS.some(kw => header.includes(kw))) {
      return i;
    }
  }
  return 0; // Default to first column
}

/**
 * Format a date for display in Hebrew
 */
function formatDateHebrew(day: number, month: number, year: number): string {
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  if (month < 0 || month > 11 || day < 1 || day > 31) return 'תאריך לא תקין';
  return `${day} ב${months[month]} ${year}`;
}

/**
 * Detect date format from sample date strings
 */
function detectDateFormat(samples: string[], isHtmlFile: boolean): DetectionResult {
  const result: DetectionResult = {
    detectedFormat: 'AUTO',
    confidence: 'low',
    sampleDates: samples,
    sampleParsed: [],
    isHtmlFile,
    isExcelSerial: false,
  };

  if (samples.length === 0) return result;

  // Check if all samples are Excel serial numbers
  const allSerials = samples.every(s => /^\d{4,5}$/.test(s) && parseInt(s) > 30000 && parseInt(s) < 100000);
  if (allSerials) {
    result.isExcelSerial = true;
    result.detectedFormat = 'AUTO';
    result.confidence = 'high';
    result.sampleParsed = samples.map(s => {
      const num = parseInt(s);
      const date = new Date((num - 25569) * 86400 * 1000);
      return formatDateHebrew(date.getDate(), date.getMonth(), date.getFullYear());
    });
    return result;
  }

  // Analyze date patterns
  let ddmmCount = 0;
  let mmddCount = 0;
  let isoCount = 0;
  let ambiguousCount = 0;

  for (const sample of samples) {
    const str = sample.trim();

    // YYYY-MM-DD pattern
    if (/^\d{4}[\/\-.]/.test(str)) {
      isoCount++;
      continue;
    }

    // DD/MM/YYYY or MM/DD/YYYY pattern
    const match = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (match) {
      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);

      if (first > 12) {
        ddmmCount++; // First > 12 must be day
      } else if (second > 12) {
        mmddCount++; // Second > 12 must be day
      } else {
        ambiguousCount++; // Both <= 12, ambiguous
      }
    }
  }

  const total = samples.length;

  // Determine format
  if (isoCount > total / 2) {
    result.detectedFormat = 'YYYY-MM-DD';
    result.confidence = isoCount === total ? 'high' : 'medium';
  } else if (ddmmCount > 0 && mmddCount === 0) {
    result.detectedFormat = 'DD/MM/YYYY';
    result.confidence = ambiguousCount === 0 ? 'high' : 'medium';
  } else if (mmddCount > 0 && ddmmCount === 0) {
    result.detectedFormat = 'MM/DD/YYYY';
    result.confidence = ambiguousCount === 0 ? 'high' : 'medium';
  } else if (isHtmlFile) {
    // HTML files from Israeli banks are always DD/MM
    result.detectedFormat = 'DD/MM/YYYY';
    result.confidence = 'high';
  } else if (ddmmCount > mmddCount) {
    result.detectedFormat = 'DD/MM/YYYY';
    result.confidence = 'medium';
  } else if (mmddCount > ddmmCount) {
    result.detectedFormat = 'MM/DD/YYYY';
    result.confidence = 'medium';
  } else {
    // All ambiguous - check for dots (Israeli) or 2-digit year with slashes (American)
    const hasDots = samples.some(s => s.includes('.'));
    const has2DigitYearSlash = samples.some(s => {
      const m = s.match(/^\d{1,2}\/\d{1,2}\/(\d{2})$/);
      return m !== null;
    });

    if (hasDots) {
      result.detectedFormat = 'DD/MM/YYYY';
      result.confidence = 'medium';
    } else if (has2DigitYearSlash) {
      result.detectedFormat = 'MM/DD/YYYY';
      result.confidence = 'low';
    } else {
      // Default to Israeli format
      result.detectedFormat = 'DD/MM/YYYY';
      result.confidence = 'low';
    }
  }

  // Generate parsed samples for display
  result.sampleParsed = samples.map(s => {
    const str = s.trim();

    // ISO format
    const isoMatch = str.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (isoMatch) {
      return formatDateHebrew(parseInt(isoMatch[3]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[1]));
    }

    // DD/MM or MM/DD format
    const match = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (match) {
      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      let year = parseInt(match[3], 10);
      if (year < 100) year += year > 50 ? 1900 : 2000;

      if (result.detectedFormat === 'DD/MM/YYYY') {
        return formatDateHebrew(first, second - 1, year);
      } else if (result.detectedFormat === 'MM/DD/YYYY') {
        return formatDateHebrew(second, first - 1, year);
      }
    }

    return s; // Return raw if can't parse
  });

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 });
    }

    // File size validation (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'הקובץ גדול מדי' }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file
    const validationError = validateExcelFile(buffer, file.size, file.type);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Detect if HTML-based
    const firstBytes = buffer.slice(0, 100).toString('utf8').trim();
    const isHtmlBased = firstBytes.startsWith('<') ||
      firstBytes.toLowerCase().startsWith('<!doctype') ||
      firstBytes.toLowerCase().includes('<html') ||
      firstBytes.toLowerCase().includes('<table');

    let rawData: unknown[][];

    if (isHtmlBased) {
      const htmlContent = buffer.toString('utf8');
      const rows: string[][] = [];
      const rowMatches = htmlContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      for (const rowMatch of rowMatches) {
        const rowHtml = rowMatch[1];
        const cells: string[] = [];
        const cellMatches = rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
        for (const cellMatch of cellMatches) {
          const cellContent = cellMatch[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&quot;/gi, '"')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&#\d+;/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          cells.push(cellContent);
        }
        if (cells.length > 0) rows.push(cells);
      }
      rawData = sanitizeExcelData(rows);
    } else {
      let workbook: XLSX.WorkBook;
      try {
        workbook = XLSX.read(buffer, {
          type: 'buffer',
          cellFormula: false,
          cellHTML: false,
          cellNF: false,
          cellStyles: false,
          sheetStubs: false,
          bookVBA: false,
          WTF: false,
        });
      } catch {
        return NextResponse.json({ error: 'שגיאה בקריאת הקובץ' }, { status: 400 });
      }

      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return NextResponse.json({ error: 'הקובץ לא מכיל גליונות' }, { status: 400 });
      }

      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        return NextResponse.json({ error: 'שגיאה בקריאת הגליון' }, { status: 400 });
      }

      const unsafeData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        defval: '',
        blankrows: true,
      });
      rawData = sanitizeExcelData(unsafeData);
    }

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'הקובץ ריק' }, { status: 400 });
    }

    // Find header row and date column
    const headerRowIndex = findFirstHeaderRow(rawData);
    const headerRow = rawData[headerRowIndex] || [];
    const dateColIndex = findDateColumnIndex(headerRow);

    // Extract sample dates from first 15 data rows
    const sampleDates: string[] = [];
    const startRow = headerRowIndex + 1;
    const endRow = Math.min(startRow + 15, rawData.length);

    for (let i = startRow; i < endRow; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const dateValue = row[dateColIndex];
      if (dateValue !== null && dateValue !== undefined && String(dateValue).trim()) {
        const dateStr = String(dateValue).trim();
        if (dateStr.length > 0 && dateStr.length < 30) {
          sampleDates.push(dateStr);
        }
      }
    }

    // Detect format
    const detection = detectDateFormat(sampleDates, isHtmlBased);

    console.log(`[Date Detection] userId=${userId}, file=${file.name}, detected=${detection.detectedFormat}, confidence=${detection.confidence}, samples=${sampleDates.length}`);

    return NextResponse.json(detection);
  } catch (err) {
    console.error('[Date Detection] Error:', err);
    return NextResponse.json(
      { error: 'שגיאה בזיהוי פורמט התאריך' },
      { status: 500 }
    );
  }
}


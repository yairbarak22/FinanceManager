/**
 * Smart Transaction Import API
 * מייבא עסקאות מExcel עם זיהוי דינמי של עמודות וסיווג AI חכם
 * תומך בכל פורמט בנקאי: ישראכרט, מקס, פועלים, לאומי, דיסקונט וכו'
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import * as XLSX from 'xlsx';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { validateExcelFile } from '@/lib/fileValidator';
import { sanitizeExcelData } from '@/lib/excelSanitizer';

// ============================================
// TYPES
// ============================================

// Available expense categories (from categories.ts)
const EXPENSE_CATEGORIES = [
  'housing', 'food', 'transport', 'entertainment', 'bills', 'health',
  'shopping', 'education', 'subscriptions', 'pets', 'gifts', 'savings',
  'personal_care', 'communication', 'other'
];

// Available income categories
const INCOME_CATEGORIES = [
  'salary', 'bonus', 'investment', 'rental', 'freelance', 'pension',
  'child_allowance', 'other'
];

// Parsed transaction from Excel
interface ParsedTransaction {
  rowNum: number;
  merchantName: string;
  amount: number;
  date: Date;
  type: 'income' | 'expense';
  category: string | null;
}

// Column mapping from AI
interface ColumnMapping {
  dateIndex: number;
  amountIndex: number;
  merchantIndex: number;
}

// API Response structure
interface ImportResponse {
  phase: 'classified';
  transactions: ParsedTransaction[];
  needsReview: ParsedTransaction[];
  stats: {
    total: number;
    cached: number;
    aiClassified: number;
    needsReview: number;
    parseErrors: number;
    headerRow: number;
    columnMapping: ColumnMapping | null;
  };
  errors: string[];
}

// ============================================
// PHASE 1: HEADER DETECTION (Heuristic)
// ============================================

// Keywords to identify header rows
const HEADER_KEYWORDS = [
  'תאריך', 'date', 'סכום', 'amount', 'שם', 'עסק', 'בית עסק',
  'פרטים', 'merchant', 'description', 'חיוב', 'זיכוי', 'תיאור',
  'פעולה', 'אסמכתא', 'יתרה', 'כרטיס', 'מספר', 'קטגוריה'
];

/**
 * Find ALL header rows in the file (for multi-table files like Bank Leumi)
 * Returns array of row indices that appear to be headers
 * 
 * Improved logic:
 * - Skip rows that are too long (likely explanation text)
 * - Require at least 2 non-empty cells
 * - Verify next row has data (real headers have data below them)
 */
function findAllHeaderRows(rows: unknown[][]): number[] {
  const MIN_MATCHES = 3; // Minimum keywords to consider a header row
  const MAX_HEADER_LENGTH = 200; // Skip rows longer than this (likely explanation text)
  const MIN_NON_EMPTY_CELLS = 2; // Minimum non-empty cells for a valid header
  const headerRows: number[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    // Convert row to lowercase text for matching
    const rowText = row
      .map(cell => String(cell || '').toLowerCase())
      .join(' ');
    
    // Skip rows that are too long (likely explanation text, not headers)
    if (rowText.length > MAX_HEADER_LENGTH) {
      continue;
    }
    
    // Check that there are at least MIN_NON_EMPTY_CELLS non-empty cells
    const nonEmptyCells = row.filter(cell => 
      cell !== null && 
      cell !== undefined && 
      String(cell).trim().length > 0
    ).length;
    
    if (nonEmptyCells < MIN_NON_EMPTY_CELLS) {
      continue;
    }
    
    // Count keyword matches
    const matches = HEADER_KEYWORDS.filter(kw => 
      rowText.includes(kw.toLowerCase())
    ).length;
    
    if (matches >= MIN_MATCHES) {
      // Verify next row has data (real headers have data below them)
      const nextRow = rows[i + 1];
      const hasNextRowData = nextRow && nextRow.some(cell => 
        cell !== null && 
        cell !== undefined && 
        String(cell).trim().length > 0
      );
      
      if (hasNextRowData) {
        headerRows.push(i);
      }
    }
  }
  
  // If no headers found with MIN_MATCHES, find the row with most matches
  if (headerRows.length === 0) {
    let bestRowIndex = 0;
    let maxMatches = 0;
    
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');
      
      // Skip rows that are too long
      if (rowText.length > MAX_HEADER_LENGTH) {
        continue;
      }
      
      // Check non-empty cells
      const nonEmptyCells = row.filter(cell => 
        cell !== null && 
        cell !== undefined && 
        String(cell).trim().length > 0
      ).length;
      
      if (nonEmptyCells < MIN_NON_EMPTY_CELLS) {
        continue;
      }
      
      const matches = HEADER_KEYWORDS.filter(kw => rowText.includes(kw.toLowerCase())).length;
      
      if (matches > maxMatches) {
        // Verify next row has data
        const nextRow = rows[i + 1];
        const hasNextRowData = nextRow && nextRow.some(cell => 
          cell !== null && 
          cell !== undefined && 
          String(cell).trim().length > 0
        );
        
        if (hasNextRowData) {
          maxMatches = matches;
          bestRowIndex = i;
        }
      }
    }
    
    if (maxMatches > 0) {
      headerRows.push(bestRowIndex);
    }
  }
  
  return headerRows;
}

/**
 * Legacy function for backward compatibility
 */
function findHeaderRow(rows: unknown[][]): number {
  const headers = findAllHeaderRows(rows);
  return headers.length > 0 ? headers[0] : 0;
}

// ============================================
// PHASE 2: AI COLUMN MAPPING
// ============================================

const COLUMN_MAPPING_PROMPT = `אתה ממפה עמודות בקובץ אקסל של עסקאות פיננסיות ישראליות.

קיבלת שורת כותרות ושורת דוגמה מקובץ Excel.

משימתך: זהה את האינדקס (0-based) של כל עמודה הבאה:

1. dateIndex - עמודה עם תאריך העסקה
   חפש: "תאריך", "תאריך עסקה", "תאריך רכישה", "date", "תאריך חיוב"
   
2. amountIndex - עמודה עם הסכום שנגבה בפועל
   **חשוב מאוד:** אם יש גם "סכום חיוב" וגם "סכום עסקה" - בחר את "סכום חיוב"!
   "סכום חיוב" = הסכום שנגבה בפועל בחודש הנוכחי (נכון לתשלומים)
   "סכום עסקה" = הסכום הכולל של העסקה (לא נכון לתשלומים)
   סדר עדיפות: "סכום חיוב" > "חיוב" > "סכום" > "סכום עסקה"
   
3. merchantIndex - עמודה עם שם העסק/תיאור
   חפש: "שם בית עסק", "שם העסק", "תיאור", "פרטים", "שם", "עסק", "merchant", "description", "פירוט"

כללים:
- **חשוב מאוד:** החזר JSON בלבד, ללא הסברים או טקסט נוסף לפני או אחרי
- אם לא מצאת עמודה, החזר -1
- התבסס גם על תוכן שורת הדוגמה (תאריכים נראים כמו 01/12/2024 או 01.01.26, סכומים כמו 150.00)
- אם שורת הכותרות ארוכה מדי (מעל 500 תווים) או שורת הדוגמה ריקה - החזר {"dateIndex": -1, "amountIndex": -1, "merchantIndex": -1}
- לא לכתוב הסברים, רק JSON!

החזר בפורמט:
{"dateIndex": X, "amountIndex": Y, "merchantIndex": Z}`;

/**
 * Use AI to identify column indices from header + sample row
 * 
 * Improved logic:
 * - Early validation: skip AI if sample row is empty or header is too long
 * - Better JSON extraction from text responses
 * - Recovery mechanism if JSON parsing fails
 */
async function mapColumnsWithAI(
  headerRow: unknown[],
  sampleRow: unknown[]
): Promise<ColumnMapping | null> {
  try {
    // Early validation: check if sample row has data
    const hasSampleData = sampleRow.some(cell => 
      cell !== null && 
      cell !== undefined && 
      String(cell).trim().length > 0
    );
    
    if (!hasSampleData) {
      console.log('[AI Column Mapping] Sample row is empty, skipping AI');
      return null;
    }
    
    // Early validation: check if header is not too long
    const headerText = headerRow.map(h => String(h || '')).join(' ');
    if (headerText.length > 500) {
      console.log('[AI Column Mapping] Header too long (>500 chars), skipping AI');
      return null;
    }
    
    const headerStr = headerRow.map((h, i) => `[${i}] ${String(h || '')}`).join(', ');
    const sampleStr = sampleRow.map((s, i) => `[${i}] ${String(s || '')}`).join(', ');

    console.log('[AI Column Mapping] Starting column detection');
    console.log('[AI Column Mapping] Header:', headerStr);
    console.log('[AI Column Mapping] Sample:', sampleStr);

    const response = await generateText({
      model: groq('openai/gpt-oss-120b'),
      system: COLUMN_MAPPING_PROMPT,
      messages: [{
        role: 'user',
        content: `שורת כותרות: ${headerStr}\n\nשורת דוגמה: ${sampleStr}`,
      }],
    });

    console.log('[AI Column Mapping] Received response:', response.text);

    // Parse JSON response
    let jsonStr = response.text.trim();

    // Check if response starts with JSON
    if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
      console.warn('[AI Column Mapping] Response does not start with { or [, attempting to extract JSON');
      // Try to find JSON in the text
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else {
        console.error('[AI Column Mapping] No JSON found in response');
        return null;
      }
    }

    // Handle markdown code blocks
    if (jsonStr.includes('```')) {
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
    }

    // Try to parse JSON with recovery
    let mapping: ColumnMapping;
    try {
      mapping = JSON.parse(jsonStr) as ColumnMapping;
    } catch (parseError) {
      // Recovery: try to find JSON in the original response
      console.warn('[AI Column Mapping] JSON parse failed, attempting recovery');
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          mapping = JSON.parse(jsonMatch[0]) as ColumnMapping;
          console.log('[AI Column Mapping] Recovered mapping from text');
        } catch (recoveryError) {
          console.error('[AI Column Mapping] Recovery also failed');
          throw parseError;
        }
      } else {
        throw parseError;
      }
    }

    // Validate the mapping
    if (
      typeof mapping.dateIndex !== 'number' ||
      typeof mapping.amountIndex !== 'number' ||
      typeof mapping.merchantIndex !== 'number'
    ) {
      console.error('[AI Column Mapping] Invalid mapping response:', mapping);
      return null;
    }

    console.log('[AI Column Mapping] Successfully mapped columns:', mapping);
    return mapping;
  } catch (error) {
    console.error('[AI Column Mapping] ERROR:', error);
    console.error('[AI Column Mapping] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Fallback: Try to find columns using simple heuristics
 * Priority for amount: "סכום חיוב" > "חיוב" > "סכום" (to handle installment transactions)
 * 
 * Improved logic:
 * - Validates mapping before returning
 * - Ensures all indices are different
 * - Better logging for debugging
 */
function findColumnsFallback(headerRow: unknown[]): ColumnMapping {
  let dateIndex = -1;
  let amountIndex = -1;
  let merchantIndex = -1;
  
  // First pass: look for high-priority matches
  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '').toLowerCase();
    
    // Date detection
    if (dateIndex === -1 && (
      header.includes('תאריך') || header.includes('date')
    )) {
      dateIndex = i;
    }
    
    // Amount detection - prioritize "סכום חיוב" (actual charge) over "סכום עסקה" (total)
    if (header.includes('סכום חיוב') || header === 'חיוב') {
      amountIndex = i; // Override any previous match
    } else if (amountIndex === -1 && (
      header.includes('סכום') || header.includes('חיוב') || 
      header.includes('זיכוי') || header.includes('amount')
    )) {
      amountIndex = i;
    }
    
    // Merchant detection
    if (merchantIndex === -1 && (
      header.includes('עסק') || header.includes('שם') ||
      header.includes('תיאור') || header.includes('פרטים') ||
      header.includes('merchant') || header.includes('description')
    )) {
      merchantIndex = i;
    }
  }
  
  // Validate that we found valid, unique columns
  const allFound = dateIndex !== -1 && amountIndex !== -1 && merchantIndex !== -1;
  const allDifferent = dateIndex !== amountIndex && dateIndex !== merchantIndex && amountIndex !== merchantIndex;
  
  if (allFound && allDifferent) {
    console.log('[Fallback] Found valid mapping:', { dateIndex, amountIndex, merchantIndex });
    return { dateIndex, amountIndex, merchantIndex };
  }
  
  // If no columns found at all, use sensible defaults
  if (dateIndex === -1 && amountIndex === -1 && merchantIndex === -1) {
    console.warn('[Fallback] No columns found, using defaults (0, 1, 2)');
    return { dateIndex: 0, amountIndex: 1, merchantIndex: 2 };
  }
  
  // Fill in missing columns with unique indices
  const usedIndices = new Set<number>();
  if (dateIndex !== -1) usedIndices.add(dateIndex);
  if (amountIndex !== -1) usedIndices.add(amountIndex);
  if (merchantIndex !== -1) usedIndices.add(merchantIndex);
  
  // Find available indices
  const availableIndices: number[] = [];
  for (let i = 0; i < Math.max(headerRow.length, 3); i++) {
    if (!usedIndices.has(i)) {
      availableIndices.push(i);
    }
  }
  
  // Fill in missing values
  if (merchantIndex === -1 && availableIndices.length > 0) {
    merchantIndex = availableIndices.shift()!;
    usedIndices.add(merchantIndex);
  }
  if (amountIndex === -1 && availableIndices.length > 0) {
    amountIndex = availableIndices.shift()!;
    usedIndices.add(amountIndex);
  }
  if (dateIndex === -1 && availableIndices.length > 0) {
    dateIndex = availableIndices.shift()!;
  }
  
  // Final fallback if still missing
  if (merchantIndex === -1) merchantIndex = 0;
  if (amountIndex === -1) amountIndex = 1;
  if (dateIndex === -1) dateIndex = 2;
  
  console.log('[Fallback] Using partial mapping:', { dateIndex, amountIndex, merchantIndex });
  return { dateIndex, amountIndex, merchantIndex };
}

// ============================================
// PHASE 3: DATA EXTRACTION & PARSING
// ============================================

/**
 * Parse amount from various formats
 * Handles: "150.00", "₪150", "1,234.56 NIS", "-500", etc.
 */
function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  // If already a number
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  // Convert to string and clean
  const str = String(value)
    .replace(/[₪,\s]/g, '')  // Remove ₪, commas, spaces
    .replace(/NIS/gi, '')     // Remove NIS
    .replace(/ש"ח/g, '')      // Remove ש"ח
    .trim();
  
  // Handle negative in parentheses: (123.45) -> -123.45
  const parenMatch = str.match(/^\(([0-9.]+)\)$/);
  if (parenMatch) {
    const num = parseFloat(parenMatch[1]);
    return isNaN(num) ? null : -num;
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Parse date from various formats
 * Handles: Excel serial numbers, DD/MM/YYYY, MM/DD/YY, YYYY-MM-DD, etc.
 * 
 * Key insight: When XLSX reads Excel dates, it often converts them to
 * American format (MM/DD/YY) with slashes, regardless of the original format.
 * 
 * For HTML files from Israeli banks, dates are ALWAYS in DD.MM.YYYY format.
 * The isHtmlFile parameter forces DD.MM interpretation for dots.
 */
function parseDate(value: unknown, enableLogging = false, isHtmlFile = false): Date | null {
  const log = (msg: string) => {
    if (enableLogging) console.log(`[parseDate] ${msg}`);
  };
  
  log(`Input: ${JSON.stringify(value)}, type: ${typeof value}, isHtmlFile: ${isHtmlFile}`);
  
  if (value === null || value === undefined || value === '') {
    log('Empty value, returning null');
    return null;
  }
  
  // Handle Excel serial date number
  if (typeof value === 'number') {
    log(`Detected NUMBER: ${value}`);
    if (value > 30000 && value < 100000) {
      // Excel dates start from 1899-12-30
      const date = new Date((value - 25569) * 86400 * 1000);
      log(`Excel serial conversion: ${value} -> ${date.toISOString()}`);
      if (!isNaN(date.getTime())) return date;
    }
    log('Number out of Excel serial range, returning null');
    return null;
  }
  
  const str = String(value).trim();
  log(`String value: "${str}"`);
  if (!str) return null;
  
  // Detect separator type - this is KEY for format detection
  const hasSlash = str.includes('/');
  const hasDot = str.includes('.');
  const hasDash = str.includes('-') && !str.startsWith('-'); // exclude negative numbers
  
  // Handle date formats: DD/MM/YYYY, MM/DD/YY, DD-MM-YYYY, DD.MM.YYYY
  const dateMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dateMatch) {
    const first = parseInt(dateMatch[1], 10);
    const second = parseInt(dateMatch[2], 10);
    let year = parseInt(dateMatch[3], 10);
    const is2DigitYear = dateMatch[3].length === 2;
    
    // Handle 2-digit year
    if (year < 100) {
      year += year > 50 ? 1900 : 2000;
    }
    
    let day: number, month: number;
    
    // FORMAT DETECTION LOGIC:
    // Priority for HTML files (Israeli banks): ALWAYS DD.MM.YYYY
    // 1. HTML files with dots → DD.MM.YYYY (Israeli format, highest priority)
    // 2. If first > 12 → Must be DD/MM (day can't be > 12 in MM/DD)
    // 3. If second > 12 → Must be MM/DD (month can't be > 12)
    // 4. Dots without HTML context → DD.MM.YYYY (Israeli format)
    // 5. Slashes with 2-digit year → MM/DD/YY (XLSX American format)
    // 6. Default: DD/MM/YYYY (Israeli standard)
    
    if (isHtmlFile) {
      // HTML files from Israeli banks: ALWAYS DD/MM/YYYY or DD.MM.YYYY format
      // Israeli banks use DD/MM format regardless of separator (dots or slashes)
      day = first;
      month = second - 1;
      log(`HTML file Israeli format (DD/MM): day=${first}, month=${second}, year=${year}`);
    } else if (first > 12) {
      // First value > 12 means it MUST be the day (DD/MM format)
      day = first;
      month = second - 1;
      log(`DD/MM format detected (first > 12): day=${first}, month=${second}, year=${year}`);
    } else if (second > 12) {
      // Second value > 12 means it MUST be the day (MM/DD format)
      month = first - 1;
      day = second;
      log(`MM/DD format detected (second > 12): month=${first}, day=${second}, year=${year}`);
    } else if (hasDot) {
      // Dots = Israeli format (DD.MM.YYYY)
      day = first;
      month = second - 1;
      log(`DD.MM format (Israeli with dots): day=${first}, month=${second}, year=${year}`);
    } else if (hasSlash && is2DigitYear) {
      // Slashes with 2-digit year = XLSX converted American format (MM/DD/YY)
      // This is the most reliable indicator for Excel-sourced dates
      month = first - 1;
      day = second;
      log(`MM/DD/YY format (XLSX American): month=${first}, day=${second}, year=${year}`);
    } else {
      // Default: assume DD/MM/YYYY (Israeli standard for ambiguous cases)
      day = first;
      month = second - 1;
      log(`DD/MM format assumed (default): day=${first}, month=${second}, year=${year}`);
    }
    
    // Validate day and month ranges
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day);
      
      // Extra validation: ensure the date wasn't auto-corrected by JS Date
      // (e.g., Feb 30 becomes Mar 2)
      if (!isNaN(date.getTime()) && 
          date.getDate() === day && 
          date.getMonth() === month && 
          date.getFullYear() === year) {
        log(`Created date: ${date.toISOString()}`);
        return date;
      } else {
        log(`Date validation failed: expected ${day}/${month + 1}/${year}, got ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`);
      }
    }
  }
  
  // Handle YYYY-MM-DD format (ISO)
  const isoMatch = str.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    
    log(`ISO match: year=${year}, month=${month + 1}, day=${day}`);
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      
      // Extra validation for ISO format as well
      if (!isNaN(date.getTime()) && 
          date.getDate() === day && 
          date.getMonth() === month && 
          date.getFullYear() === year) {
        log(`Created date: ${date.toISOString()}`);
        return date;
      }
    }
  }
  
  // Try standard date parsing as last resort
  log('Trying fallback Date parsing');
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    log(`Fallback succeeded: ${date.toISOString()}`);
    return date;
  }
  
  log('All parsing failed, returning null');
  return null;
}

// ============================================
// AI CATEGORY CLASSIFICATION
// ============================================

const CLASSIFICATION_PROMPT = `אתה מסווג עסקאות פיננסיות ישראליות לקטגוריות.

**חשוב מאוד:** נסה לסווג את כל העסקים! החזר null רק אם זה שם פרטי של אדם או העברה כללית ללא שם עסק.

קטגוריות הוצאות זמינות:

housing (דיור, שכר דירה, משכנתא)
  דוגמאות: בנק לאומי, בנק פועלים, בנק דיסקונט, בנק מזרחי, בנק יהב, משכנתא, שכר דירה, ועד בית, ניהול נכסים, אגודת שיתופית, אגודה שיתופית
  מילות מפתח: בנק, משכנתא, שכר דירה, ועד בית, דיור

food (מזון, סופרמרקט, מסעדות, קפה)
  דוגמאות: שופרסל, ויקטורי, רמי לוי, אושר עד, מגה, סופר פארם, מקס, קופיקס, קפה נטו, ארומה, קפה ג'ו, מקס ברנר, מסעדות, דומינוס, ברגר קינג, מקדונלד'ס, פיצה, סושי, אושר עד בני ברק, רמי לוי שיווק, שופרסל דיל, מגה בע"מ
  מילות מפתח: אושר, שופרסל, רמי לוי, ויקטורי, מגה, מקס, סופר פארם, קפה, מסעדה, פיצה, בורגר, מקדונלד, סושי, ארומה, קופיקס

transport (תחבורה, דלק, חניה, רכב)
  דוגמאות: פז, דור אלון, סונול, דלק, חניה, אגד, דן, רכבת ישראל, אובר, גט, מוניות, תיקון רכב, ביטוח רכב, מיסוי רכב, פז דלק, דור אלון דלק, סונול דלק, טעינות, טעינות חבר של קבע
  מילות מפתח: פז, דור אלון, סונול, דלק, חניה, אגד, דן, רכבת, אובר, גט, מונית, רכב, טעינות, טעינה

entertainment (בילויים, סרטים, הופעות)
  דוגמאות: סינמה סיטי, רב חן, יס פלאנט, טיימס, אירועים, הופעות, קונצרטים, תיאטרון, בילוי, פארק שעשועים, סינמה, קולנוע, קולנוע רב חן
  מילות מפתח: סינמה, קולנוע, רב חן, יס פלאנט, טיימס, הופעה, קונצרט, תיאטרון, פארק שעשועים

bills (חשבונות, חשמל, מים, גז, רשויות)
  דוגמאות: חברת חשמל, מקורות, גז, בזק, הוט, yes, סלקום, פרטנר, פלאפון, אינטרנט, אינטרנט רימון, תשלום חשבון, מועצה דתית, עירייה, רשות מקומית, ארנונה, מים, חשמל, גז, מועצה דתית תל אביב
  מילות מפתח: חברת חשמל, מקורות, מועצה דתית, עירייה, רשות, ארנונה, מים, חשמל, גז

health (בריאות, רופא, תרופות)
  דוגמאות: קופת חולים, כללית, מכבי, מאוחדת, לאומית, בית מרקחת, סופר פארם, נאוטרינוס, רופא, מרפאה, מרפאת שיניים, בדיקות, כללית שירותי בריאות, מכבי שירותי בריאות
  מילות מפתח: קופת חולים, כללית, מכבי, מאוחדת, לאומית, בית מרקחת, רופא, מרפאה, בדיקה, תרופה

shopping (קניות, ביגוד, אלקטרוניקה)
  דוגמאות: זארה, H&M, קסטרו, פוקס, רנואר, רמקול, חשמל, KSP, איקאה, אייס, אלקטרוניקה, ביגוד, נעליים, זארה ישראל, קסטרו בע"מ, CURSOR, CURSOR USAGE
  מילות מפתח: זארה, קסטרו, פוקס, רנואר, רמקול, KSP, איקאה, אייס, ביגוד, נעליים, אלקטרוניקה, CURSOR, ZARA, H&M

education (חינוך, קורסים, ספרים, אוניברסיטאות)
  דוגמאות: סטימצקי, צומת ספרים, אוניברסיטה, מכללה, קורס, שיעורים פרטיים, חינוך, ספרים, אוניברסיטת רייכמן, אוניברסיטת תל אביב, מכללה אקדמית, בית ספר
  מילות מפתח: אוניברסיטה, אוניברסיטת, מכללה, קורס, שיעור, ספר, סטימצקי, צומת ספרים, חינוך, בית ספר, אקדמיה, רייכמן

subscriptions (מנויים, נטפליקס, ספוטיפיי, סטרימינג)
  דוגמאות: נטפליקס, ספוטיפיי, אפל מיוזיק, יוטיוב פרמיום, דיסני+, HBO, מנוי, מנויים, NETFLIX, SPOTIFY, NETFLIX.COM, SPOTIFY P3D62C79CD, APPLE MUSIC, YOUTUBE PREMIUM, DISNEY+
  מילות מפתח: נטפליקס, NETFLIX, ספוטיפיי, SPOTIFY, אפל מיוזיק, APPLE MUSIC, יוטיוב, YOUTUBE, דיסני, DISNEY, HBO, מנוי, subscription, streaming
  **חשוב:** גם אם יש קודים או מספרים אחרי השם (כמו SPOTIFY P3D62C79CD), זהה את השם הראשי!

pets (חיות מחמד, וטרינר)
  דוגמאות: וטרינר, חיות מחמד, מזון לכלבים, מזון לחתולים, פטס מרקט, פט שופ, וטרינריה
  מילות מפתח: וטרינר, חיות מחמד, כלב, חתול, פטס, מזון לכלבים

gifts (מתנות, תרומות)
  דוגמאות: מתנות, תרומה, צדקה, עמותה, ארגון, תרומה לעמותה
  מילות מפתח: מתנה, תרומה, צדקה, עמותה, ארגון

savings (חיסכון, השקעות)
  דוגמאות: קופת גמל, קרן השתלמות, ביטוח חיים, חיסכון, השקעה, קופת גמל להשקעה, EOD ALL WORLD, EOD-INTRADAY ALL WORLD, EOD ALL WORLD MONTHLY
  מילות מפתח: קופת גמל, קרן השתלמות, ביטוח חיים, חיסכון, השקעה, EOD, ALL WORLD, INTRADAY

personal_care (טיפוח, ספר, קוסמטיקה)
  דוגמאות: ספר, מספרה, סלון, טיפוח, קוסמטיקה, פרפומריה, סופר פארם (מוצרי טיפוח), מספרה לגברים, סלון יופי
  מילות מפתח: ספר, מספרה, סלון, טיפוח, קוסמטיקה, פרפומריה

communication (תקשורת, סלולר, אינטרנט, טלפון)
  דוגמאות: בזק, סלקום, פרטנר, פלאפון, הוט, yes, אינטרנט, תקשורת, אייפלאן, אייפלאן בע"מ, אינטרנט רימון, בזק בינלאומי
  מילות מפתח: בזק, סלקום, פרטנר, פלאפון, הוט, yes, אינטרנט, תקשורת, אייפלאן, IPLAN

other (אחר)
  דוגמאות: העברות לא מזוהות, תשלומים כלליים, עסקאות לא מזוהות

קטגוריות הכנסות זמינות:

salary (משכורת, שכר)
  דוגמאות: משכורת, שכר, תלוש משכורת, העברת משכורת, משכורת מעביד
  מילות מפתח: משכורת, שכר, תלוש

bonus (בונוס, פרס)
  דוגמאות: בונוס, פרס, מענק, בונוס שנתי
  מילות מפתח: בונוס, פרס, מענק

investment (השקעות, דיבידנד, ריבית)
  דוגמאות: דיבידנד, ריבית, רווחי השקעה, קרן נאמנות, מניות
  מילות מפתח: דיבידנד, ריבית, רווח, קרן נאמנות, מניות

rental (שכירות נכס)
  דוגמאות: שכירות, שכר דירה, הכנסה משכירות, שכר דירה מנכס
  מילות מפתח: שכירות, שכר דירה, הכנסה משכירות

freelance (פרילנס, עבודה עצמאית)
  דוגמאות: פרילנס, עבודה עצמאית, ייעוץ, שירותים, תשלום עבור שירות
  מילות מפתח: פרילנס, עבודה עצמאית, ייעוץ, שירות

pension (פנסיה, קצבה)
  דוגמאות: פנסיה, קצבה, ביטוח לאומי, קצבת זקנה
  מילות מפתח: פנסיה, קצבה, ביטוח לאומי

child_allowance (קצבת ילדים)
  דוגמאות: קצבת ילדים, ביטוח לאומי
  מילות מפתח: קצבת ילדים

other (אחר)
  דוגמאות: הכנסות אחרות

כללים חשובים לסיווג:

1. **זיהוי חלקי:** אם שם העסק מכיל מילת מפתח מהרשימה - סווג אותו! לדוגמה:
   - "אושר עד בני ברק" → food (מכיל "אושר עד")
   - "SPOTIFY P3D62C79CD" → subscriptions (מכיל "SPOTIFY")
   - "NETFLIX.COM" → subscriptions (מכיל "NETFLIX")
   - "אוניברסיטת רייכמן" → education (מכיל "אוניברסיטת")
   - "מועצה דתית תל אביב" → bills (מכיל "מועצה דתית")
   - "אייפלאן בע"מ" → communication (מכיל "אייפלאן")
   - "טעינות - חבר של קבע" → transport (מכיל "טעינות")
   - "CURSOR USAGE MID DEC" → shopping (מכיל "CURSOR")
   - "EOD ALL WORLD MONTHLY" → savings (מכיל "EOD ALL WORLD")

2. **שמות באנגלית:** זהה גם שמות באנגלית! NETFLIX, SPOTIFY, APPLE MUSIC = subscriptions

3. **קודים ומספרים:** התעלם מקודים, מספרים או תווים מיוחדים אחרי שם העסק. זהה את השם הראשי.

4. **שמות בנקאיים מקוצרים:** שמות מהבנק יכולים להיות מקוצרים - חפש מילות מפתח חלקיות.

5. **עדיפויות:**
   - אם יש כמה אפשרויות, בחר את הקטגוריה הכי ספציפית
   - subscriptions > communication (אם זה מנוי סטרימינג)
   - food > shopping (אם זה סופרמרקט)

6. **החזר null רק אם:**
   - זה שם פרטי של אדם (יוחנן כהן, דני לוי, יניב רם עמוס)
   - זה העברה כללית ללא שם עסק ("העברת ביט", "Paybox", "צ'ק", "העברה")

דוגמאות לסיווג מדויק:
"שופרסל דיל" → food
"פז דלק" → transport
"בזק" → communication
"נטפליקס" → subscriptions
"NETFLIX.COM" → subscriptions
"SPOTIFY P3D62C79CD" → subscriptions
"סינמה סיטי" → entertainment
"אושר עד בני ברק" → food
"מועצה דתית תל אביב" → bills
"אוניברסיטת רייכמן" → education
"אייפלאן בע"מ" → communication
"טעינות - חבר של קבע" → transport
"CURSOR USAGE MID DEC" → shopping
"EOD ALL WORLD MONTHLY" → savings
"EOD-INTRADAY ALL WORLD" → savings
"יניב רם עמוס ( חניון" → null (שם פרטי של אדם)
"יוחנן כהן" → null (שם פרטי)
"העברת ביט" → null (עמום מדי)

**חשוב מאוד:** החזר JSON בלבד, ללא הסברים או טקסט נוסף לפני או אחרי!

החזר JSON בפורמט הבא בלבד:
{"merchantName1 (הוצאה)": "category", "merchantName2 (הכנסה)": "category", ...}`;

/**
 * Classify merchants using AI
 * 
 * Improved logic:
 * - Better JSON extraction from text responses
 * - Recovery mechanism if JSON parsing fails
 * - Remove JSON comments before parsing
 */
async function classifyMerchantsWithAI(
  merchants: string[],
  transactionTypes: Map<string, 'income' | 'expense'>
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();

  if (merchants.length === 0) return result;

  try {
    // Build the merchant list with their types for context
    const merchantList = merchants.map(m => {
      const type = transactionTypes.get(m) || 'expense';
      return `${m} (${type === 'income' ? 'הכנסה' : 'הוצאה'})`;
    }).join('\n');

    console.log('[AI Classification] Starting classification for', merchants.length, 'merchants');

    const response = await generateText({
      model: groq('openai/gpt-oss-120b'),
      system: CLASSIFICATION_PROMPT,
      messages: [{
        role: 'user',
        content: `סווג את העסקים הבאים:\n${merchantList}`,
      }],
    });

    console.log('[AI Classification] Received response, length:', response.text.length);

    // Parse the JSON response
    let jsonStr = response.text.trim();

    // Step 1: Handle markdown code blocks FIRST
    if (jsonStr.includes('```')) {
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }
    }

    // Step 2: Extract JSON object if not starting with {
    if (!jsonStr.startsWith('{')) {
      console.warn('[AI Classification] Response does not start with {, attempting to extract JSON');
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else {
        throw new Error('No JSON found in response');
      }
    }

    // Step 3: Remove JSON comments
    jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments
    jsonStr = jsonStr.replace(/\/\/.*$/gm, ''); // Remove // comments

    // Step 4: Fix common JSON issues
    jsonStr = jsonStr.replace(/,\s*}/g, '}'); // Remove trailing commas before }
    jsonStr = jsonStr.replace(/,\s*]/g, ']'); // Remove trailing commas before ]

    // Step 5: Try to parse JSON with multiple recovery strategies
    let parsed: Record<string, string | null> = {};
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn('[AI Classification] JSON parse failed, attempting recovery strategies');
      
      // Recovery Strategy 1: Try to fix unclosed JSON
      let recovered = false;
      
      // Count braces to check if JSON is unclosed
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      
      if (openBraces > closeBraces) {
        // Try to close the JSON properly
        let fixedJson = jsonStr.trim();
        // Remove incomplete last entry (might be cut off)
        fixedJson = fixedJson.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*"?\s*$/, '');
        // Add missing closing braces
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedJson += '}';
        }
        try {
          parsed = JSON.parse(fixedJson);
          console.log('[AI Classification] Recovered by fixing unclosed JSON');
          recovered = true;
        } catch (e) {
          // Continue to next strategy
        }
      }
      
      // Recovery Strategy 2: Extract valid key-value pairs with regex
      if (!recovered) {
        console.warn('[AI Classification] Attempting regex extraction of key-value pairs');
        const kvPairs = jsonStr.matchAll(/"([^"]+)"\s*:\s*"([^"]+)"/g);
        for (const match of kvPairs) {
          const key = match[1];
          const value = match[2];
          if (value !== 'null') {
            parsed[key] = value;
          }
        }
        if (Object.keys(parsed).length > 0) {
          console.log('[AI Classification] Recovered', Object.keys(parsed).length, 'pairs via regex');
          recovered = true;
        }
      }
      
      if (!recovered) {
        console.error('[AI Classification] All recovery strategies failed');
        throw parseError;
      }
    }

    // Map the results
    // IMPORTANT: AI returns keys with type suffix like "Merchant (הוצאה)"
    // so we need to construct the full key when looking up
    // Category name normalization map (AI sometimes returns slightly different names)
    const categoryNormalize: Record<string, string> = {
      'subscription': 'subscriptions',
      'entertainment_': 'entertainment',
      'transport_': 'transport',
      'bill': 'bills',
      'saving': 'savings',
      'gift': 'gifts',
      'pet': 'pets',
    };

    for (const merchant of merchants) {
      const type = transactionTypes.get(merchant) || 'expense';
      const fullKey = `${merchant} (${type === 'income' ? 'הכנסה' : 'הוצאה'})`;
      
      // Try multiple key formats (AI sometimes omits the type suffix)
      let category = parsed[fullKey] || parsed[merchant];

      if (category === null || category === 'null') {
        result.set(merchant, null);
      } else if (typeof category === 'string') {
        // Normalize category name if needed
        const normalizedCategory = categoryNormalize[category] || category;
        
        // Validate category exists
        const validCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        if (validCategories.includes(normalizedCategory)) {
          result.set(merchant, normalizedCategory);
        } else {
          console.warn(`[AI Classification] Invalid category "${category}" (normalized: "${normalizedCategory}") for merchant "${merchant}"`);
          result.set(merchant, null);
        }
      } else {
        result.set(merchant, null);
      }
    }

    console.log('[AI Classification] Successfully classified', Array.from(result.values()).filter(v => v !== null).length, 'out of', merchants.length);
  } catch (error) {
    console.error('[AI Classification] ERROR:', error);
    console.error('[AI Classification] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
    });
    // Set all to null on error
    for (const merchant of merchants) {
      result.set(merchant, null);
    }
  }

  return result;
}

// ============================================
// MAIN API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  let userId: string | undefined;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    userId = authResult.userId;

    // Rate limiting for import endpoint (heavy operation)
    const rateLimitResult = await checkRateLimit(`import:${userId}`, RATE_LIMITS.import);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות ייבוא. אנא המתן דקה ונסה שוב.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'לא נבחר קובץ' },
        { status: 400 }
      );
    }

    // File size validation (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'הקובץ גדול מדי. גודל מקסימלי: 10MB',
          details: `גודל הקובץ: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
        },
        { status: 413 } // 413 Payload Too Large
      );
    }

    // ============================================
    // SECURE EXCEL PARSING WITH HARDENED OPTIONS
    // Using xlsx library with Defense-in-Depth security layers
    // ============================================

    console.log('[Excel Import] Reading file:', file.name, 'size:', file.size, 'type:', file.type);

    // Step 1: Get buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[Excel Import] Buffer size:', buffer.length);

    // Step 2: Validate file signature (Magic Bytes) - Security Layer #1
    const validationError = validateExcelFile(buffer, file.size, file.type);
    
    if (validationError) {
      console.error('[Excel Security] File validation failed:', validationError);
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    console.log('[Excel Import] File validation passed ✓');

    // Step 3: Parse file based on type
    
    // Detect if file is HTML-based (common from Israeli banks)
    // This is used later for date parsing to force DD.MM.YYYY format
    const firstBytes = buffer.slice(0, 100).toString('utf8').trim();
    const isHtmlBased = firstBytes.startsWith('<') || 
                        firstBytes.toLowerCase().startsWith('<!doctype') ||
                        firstBytes.toLowerCase().includes('<html') ||
                        firstBytes.toLowerCase().includes('<table');
    
    // Variable to hold the parsed data
    let rawData: unknown[][];
    
    if (isHtmlBased) {
      // ============================================
      // HTML FILE PROCESSING - Skip XLSX to preserve date format
      // ============================================
      // IMPORTANT: We do NOT use XLSX for HTML files because XLSX converts
      // dates like "12.1.2026" (DD.MM.YYYY) to American format, causing
      // dates with day <= 12 to be misparsed.
      
      console.log('[Excel Import] Detected HTML-based Excel file, parsing manually...');
      console.log('[Excel Import] Skipping XLSX to preserve Israeli date format (DD.MM.YYYY)');
      
      const htmlContent = buffer.toString('utf8');
      
      // Manual HTML table parsing for Israeli bank files
      // Extract all <tr> rows and their <td>/<th> cells
      const rows: string[][] = [];
      
      // Find all table rows
      const rowMatches = htmlContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      for (const rowMatch of rowMatches) {
        const rowHtml = rowMatch[1];
        const cells: string[] = [];
        
        // Extract all cells (td and th)
        const cellMatches = rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
        for (const cellMatch of cellMatches) {
          // Clean the cell content - remove HTML tags and decode entities
          let cellContent = cellMatch[1]
            .replace(/<[^>]+>/g, '') // Remove HTML tags
            .replace(/&nbsp;/gi, ' ')
            .replace(/&quot;/gi, '"')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&#\d+;/g, '') // Remove numeric entities
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          cells.push(cellContent);
        }
        
        if (cells.length > 0) {
          rows.push(cells);
        }
      }
      
      console.log('[Excel Import] Manually parsed', rows.length, 'rows from HTML');
      
      // Use parsed rows directly without going through XLSX
      // This preserves the original date format (DD.MM.YYYY or DD/MM/YY)
      console.log('[Excel Security] Sanitizing HTML data...');
      rawData = sanitizeExcelData(rows);
      console.log('[Excel Security] Sanitization complete ✓');
      console.log('[Excel Import] HTML processing complete, preserved', rawData.length, 'rows');
      
    } else {
      // ============================================
      // EXCEL/CSV FILE PROCESSING - Use XLSX library
      // ============================================
      
      let workbook: XLSX.WorkBook;
      try {
        console.log('[Excel Import] Parsing workbook with security options...');
        
        // Standard Excel file parsing
        workbook = XLSX.read(buffer, {
          type: 'buffer',

          // 🔒 CRITICAL SECURITY OPTIONS (Defense against CVEs):
          cellFormula: false,   // Prevent Formula Injection (CSV Injection / Excel 4.0 Macros)
          cellHTML: false,      // Prevent XSS via HTML in cells
          cellNF: false,        // Disable number formats (potential DoS vector)
          cellStyles: false,    // Disable styles (reduces memory footprint)
          sheetStubs: false,    // Don't create stubs for empty cells
          bookVBA: false,       // Ignore VBA/Macros (malware vector)

          // Additional hardening:
          WTF: false,           // Disable "What The Format" (legacy/unsafe formats)
        });

        console.log('[Excel Import] Workbook parsed successfully ✓');
        console.log('[Excel Import] Sheets found:', workbook.SheetNames.length);
      } catch (parseError) {
        console.error('[Excel Parsing] ERROR:', parseError);
        console.error('[Excel Parsing] Error details:', {
          name: parseError instanceof Error ? parseError.name : 'Unknown',
          message: parseError instanceof Error ? parseError.message : String(parseError),
        });

        // Generic error message for security (don't expose internals)
        return NextResponse.json(
          { error: 'שגיאה בקריאת קובץ Excel. ודא שהקובץ תקין ולא פגום' },
          { status: 400 }
        );
      }

      // Step 4: Get first sheet
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return NextResponse.json(
          { error: 'הקובץ לא מכיל גליונות עבודה' },
          { status: 400 }
        );
      }

      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        return NextResponse.json(
          { error: 'שגיאה בקריאת גליון העבודה' },
          { status: 400 }
        );
      }

      // Step 5: Convert to array of arrays
      console.log('[Excel Import] Converting sheet to array...');
      const unsafeData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,        // Return array of arrays (not objects)
        raw: false,       // Return formatted strings (not raw values)
        defval: '',       // Default value for empty cells
        blankrows: true,  // Keep blank rows (for header detection)
      });

      console.log('[Excel Import] Converted', unsafeData.length, 'rows');

      // Step 6: SANITIZE ALL DATA - Security Layer #3
      console.log('[Excel Security] Sanitizing all cell values...');
      rawData = sanitizeExcelData(unsafeData);
      console.log('[Excel Security] Sanitization complete ✓');
    }

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: 'הקובץ ריק' },
        { status: 400 }
      );
    }

    // ============================================
    // PHASE 1: DETECT ALL TABLES (Multi-table support)
    // ============================================
    
    const headerRows = findAllHeaderRows(rawData);

    if (headerRows.length === 0) {
      return NextResponse.json(
        { error: 'לא נמצאו כותרות בקובץ' },
        { status: 400 }
      );
    }

    // ============================================
    // PHASE 2 & 3: PROCESS EACH TABLE
    // ============================================
    const parsedTransactions: ParsedTransaction[] = [];
    const errors: string[] = [];
    let lastColumnMapping: ColumnMapping | null = null;

    // DEBUG: Counter for logging first 10 rows
    let debugRowCount = 0;
    const DEBUG_MAX_ROWS = 10;

    for (let tableIdx = 0; tableIdx < headerRows.length; tableIdx++) {
      const headerRowIndex = headerRows[tableIdx];
      const headerRow = rawData[headerRowIndex] || [];
      const firstDataRowIndex = headerRowIndex + 1;
      const firstDataRow = rawData[firstDataRowIndex] || [];
      
      // Determine where this table ends (next header or end of file)
      const nextHeaderIndex = headerRows[tableIdx + 1];
      const tableEndIndex = nextHeaderIndex !== undefined ? nextHeaderIndex : rawData.length;

      if (firstDataRow.length === 0) continue;

      // Get column mapping for this table
      let columnMapping = await mapColumnsWithAI(headerRow, firstDataRow);
      
      if (!columnMapping || 
          columnMapping.dateIndex === -1 || 
          columnMapping.amountIndex === -1 || 
          columnMapping.merchantIndex === -1) {
        columnMapping = findColumnsFallback(headerRow);
      }
      
      // DEBUG: Log column mapping
      console.log('[IMPORT DEBUG] Column mapping:', JSON.stringify(columnMapping));
      console.log('[IMPORT DEBUG] Header row:', JSON.stringify(headerRow));
      console.log('[IMPORT DEBUG] First data row:', JSON.stringify(firstDataRow));
      
      lastColumnMapping = columnMapping;

      // Process rows in this table
      for (let i = firstDataRowIndex; i < tableEndIndex; i++) {
        const row = rawData[i];
        const rowNum = i + 1; // 1-indexed for user display

        // Skip empty rows
        if (!row || row.length === 0) continue;
        
        // Skip if all relevant cells are empty
        const merchant = row[columnMapping.merchantIndex];
        const amount = row[columnMapping.amountIndex];
        const date = row[columnMapping.dateIndex];
        
        if (!merchant && !amount && !date) continue;

        // DEBUG: Log first 10 rows with detailed date parsing
        const shouldLog = debugRowCount < DEBUG_MAX_ROWS;
        if (shouldLog) {
          console.log(`\n[IMPORT DEBUG] ===== Row ${rowNum} =====`);
          console.log(`[IMPORT DEBUG] Raw date value: ${JSON.stringify(date)}, type: ${typeof date}`);
          console.log(`[IMPORT DEBUG] Merchant: ${merchant}`);
          console.log(`[IMPORT DEBUG] Amount: ${amount}`);
        }

        try {
          // Extract merchant name
          const merchantName = String(merchant || '').trim();
          if (!merchantName) {
            errors.push(`שורה ${rowNum}: שם עסק חסר`);
          continue;
        }

          // Parse amount
          const parsedAmount = parseAmount(amount);
          if (parsedAmount === null || parsedAmount === 0) {
            errors.push(`שורה ${rowNum}: סכום לא תקין`);
          continue;
        }

        // Parse date - pass isHtmlBased to force DD/MM format for Israeli bank HTML files
          const parsedDate = parseDate(date, false, isHtmlBased);
          if (!parsedDate) {
            errors.push(`שורה ${rowNum}: תאריך לא תקין - ${String(date)}`);
          continue;
        }

          // Determine type (positive = expense, negative = income)
          const type: 'income' | 'expense' = parsedAmount > 0 ? 'expense' : 'income';
          const absAmount = Math.abs(parsedAmount);

          parsedTransactions.push({
            rowNum,
            merchantName,
            amount: absAmount,
            date: parsedDate,
            type,
            category: null,
          });
        } catch {
          errors.push(`שורה ${rowNum}: שגיאה בעיבוד`);
        }
      }
    }

    // Use the last column mapping for stats (or first if only one table)
    const columnMapping = lastColumnMapping || { dateIndex: -1, amountIndex: -1, merchantIndex: -1 };
    const headerRowIndex = headerRows[0];

    if (parsedTransactions.length === 0) {
      return NextResponse.json({
        phase: 'classified',
        transactions: [],
        needsReview: [],
        stats: { 
          total: 0, 
          cached: 0, 
          aiClassified: 0, 
          needsReview: 0, 
          parseErrors: errors.length,
          headerRow: headerRowIndex,
          columnMapping,
        },
        errors,
      });
    }

    // ============================================
    // PHASE 4: CHECK CACHE
    // ============================================
    const uniqueMerchants = [...new Set(parsedTransactions.map(t => t.merchantName))];
    // Normalize merchant names for cache lookup (lowercase + trim)
    const normalizedMerchants = uniqueMerchants.map(m => m.toLowerCase().trim());
    
    // Get cached mappings using NORMALIZED names
    const cachedMappings = await prisma.merchantCategoryMap.findMany({
      where: {
            userId,
        merchantName: { in: normalizedMerchants },
          },
        });

    // Create maps for category and alwaysAsk flag
    // Note: alwaysAsk field was added in schema update
    // Cache keys are already normalized (lowercase) from database
    const cacheMap = new Map(cachedMappings.map(m => [m.merchantName, m.category]));
    const alwaysAskMap = new Map(
      cachedMappings
        .filter(m => (m as { alwaysAsk?: boolean }).alwaysAsk === true)
        .map(m => [m.merchantName, true])
    );
    
    // Separate known and unknown merchants (excluding alwaysAsk merchants)
    // Use normalized names for lookup
    const unknownMerchants = uniqueMerchants.filter(m => {
      const normalized = m.toLowerCase().trim();
      return !cacheMap.has(normalized) || alwaysAskMap.has(normalized);
    });

    // ============================================
    // PHASE 5: AI CLASSIFICATION (only unknowns)
    // ============================================
    const transactionTypes = new Map<string, 'income' | 'expense'>();
    for (const t of parsedTransactions) {
      transactionTypes.set(t.merchantName, t.type);
    }
    
    const aiClassifications = unknownMerchants.length > 0
      ? await classifyMerchantsWithAI(unknownMerchants, transactionTypes)
      : new Map<string, string | null>();

    // ============================================
    // PHASE 6: APPLY CATEGORIES
    // ============================================
    const classifiedTransactions: ParsedTransaction[] = [];
    const needsReviewTransactions: ParsedTransaction[] = [];
    let cachedCount = 0;
    let aiClassifiedCount = 0;

    for (const transaction of parsedTransactions) {
      const { merchantName } = transaction;
      const normalizedName = merchantName.toLowerCase().trim();
      
      // Check if this merchant is marked as "always ask"
      if (alwaysAskMap.has(normalizedName)) {
        // Put in review even if we have a cached category
        needsReviewTransactions.push(transaction);
        continue;
      }
      
      // Check cache first (using normalized name)
      if (cacheMap.has(normalizedName)) {
        transaction.category = cacheMap.get(normalizedName)!;
        classifiedTransactions.push(transaction);
        cachedCount++;
        continue;
      }
      
      // Check AI classification
      const aiCategory = aiClassifications.get(merchantName);
      if (aiCategory) {
        transaction.category = aiCategory;
        classifiedTransactions.push(transaction);
        aiClassifiedCount++;
      } else {
        // Needs manual review
        needsReviewTransactions.push(transaction);
      }
    }

    // Save AI classifications to cache (only confident ones)
    // Normalize merchant names for consistent storage
    const newMappings: { userId: string; merchantName: string; category: string }[] = [];
    for (const [merchant, category] of aiClassifications) {
      if (category !== null) {
        newMappings.push({ userId, merchantName: merchant.toLowerCase().trim(), category });
      }
    }
    
    if (newMappings.length > 0) {
      await prisma.merchantCategoryMap.createMany({
        data: newMappings,
        skipDuplicates: true,
      });
    }

    const response: ImportResponse = {
      phase: 'classified',
      transactions: classifiedTransactions,
      needsReview: needsReviewTransactions,
      stats: {
        total: parsedTransactions.length,
        cached: cachedCount,
        aiClassified: aiClassifiedCount,
        needsReview: needsReviewTransactions.length,
        parseErrors: errors.length,
        headerRow: headerRowIndex,
        columnMapping,
      },
      errors,
    };

    return NextResponse.json(response);
  } catch (error) {
    // 🔒 SECURITY LOGGING (Layer #5): Log error details for audit, return generic message
    console.error('[Excel Import] CRITICAL ERROR:', error);
    console.error('[Excel Import] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Specific logging for parsing failures (security audit)
    if (error instanceof Error && error.message.includes('parse')) {
      console.error('[Excel Security] PARSING FAILURE AUDIT:', {
        errorType: 'parsing',
        userId,
        timestamp: new Date().toISOString(),
      });
    }

    // Return GENERIC error message (don't expose internals)
    return NextResponse.json(
      { error: 'שגיאה בעיבוד הקובץ. נא לנסות שוב או ליצור קשר עם התמיכה' },
      { status: 500 }
    );
  }
}

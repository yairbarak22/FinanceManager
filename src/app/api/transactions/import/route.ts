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
import ExcelJS from 'exceljs';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

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
 */
function findAllHeaderRows(rows: unknown[][]): number[] {
  const MIN_MATCHES = 3; // Minimum keywords to consider a header row
  const headerRows: number[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    // Convert row to lowercase text for matching
    const rowText = row
      .map(cell => String(cell || '').toLowerCase())
      .join(' ');
    
    // Count keyword matches
    const matches = HEADER_KEYWORDS.filter(kw => 
      rowText.includes(kw.toLowerCase())
    ).length;
    
    if (matches >= MIN_MATCHES) {
      headerRows.push(i);
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
      const matches = HEADER_KEYWORDS.filter(kw => rowText.includes(kw.toLowerCase())).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestRowIndex = i;
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
- החזר JSON בלבד, ללא הסברים
- אם לא מצאת עמודה, החזר -1
- התבסס גם על תוכן שורת הדוגמה (תאריכים נראים כמו 01/12/2024, סכומים כמו 150.00)

החזר בפורמט:
{"dateIndex": X, "amountIndex": Y, "merchantIndex": Z}`;

/**
 * Use AI to identify column indices from header + sample row
 */
async function mapColumnsWithAI(
  headerRow: unknown[],
  sampleRow: unknown[]
): Promise<ColumnMapping | null> {
  try {
    const headerStr = headerRow.map((h, i) => `[${i}] ${String(h || '')}`).join(', ');
    const sampleStr = sampleRow.map((s, i) => `[${i}] ${String(s || '')}`).join(', ');
    
    const response = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: COLUMN_MAPPING_PROMPT,
      messages: [{
        role: 'user',
        content: `שורת כותרות: ${headerStr}\n\nשורת דוגמה: ${sampleStr}`,
      }],
    });
    
    // Parse JSON response
    let jsonStr = response.text.trim();
    
    // Handle markdown code blocks
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1].trim();
    }
    
    const mapping = JSON.parse(jsonStr) as ColumnMapping;
    
    // Validate the mapping
    if (
      typeof mapping.dateIndex !== 'number' ||
      typeof mapping.amountIndex !== 'number' ||
      typeof mapping.merchantIndex !== 'number'
    ) {
      console.error('Invalid AI column mapping response:', mapping);
      return null;
    }
    
    return mapping;
  } catch (error) {
    console.error('AI column mapping error:', error);
    return null;
  }
}

/**
 * Fallback: Try to find columns using simple heuristics
 * Priority for amount: "סכום חיוב" > "חיוב" > "סכום" (to handle installment transactions)
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
  
  // If still not found, use defaults
  if (merchantIndex === -1) merchantIndex = 0;
  if (amountIndex === -1) amountIndex = 1;
  if (dateIndex === -1) dateIndex = 2;
  
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
 * Handles: Excel serial numbers, DD/MM/YYYY, YYYY-MM-DD, etc.
 */
function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  
  // Handle Excel serial date number
  if (typeof value === 'number') {
    if (value > 30000 && value < 100000) {
      // Excel dates start from 1899-12-30
      const date = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) return date;
    }
    return null;
  }
  
  const str = String(value).trim();
  if (!str) return null;
  
  // Handle DD/MM/YYYY or DD-MM-YYYY format (Israeli standard)
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1; // 0-indexed
    let year = parseInt(ddmmyyyyMatch[3], 10);
    
    // Handle 2-digit year
    if (year < 100) {
      year += year > 50 ? 1900 : 2000;
    }
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Handle YYYY-MM-DD format (ISO)
  const isoMatch = str.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Try standard date parsing as last resort
  const date = new Date(str);
  if (!isNaN(date.getTime())) return date;
  
  return null;
}

// ============================================
// AI CATEGORY CLASSIFICATION
// ============================================

const CLASSIFICATION_PROMPT = `אתה מסווג עסקאות פיננסיות לקטגוריות.

קטגוריות הוצאות זמינות:
housing (דיור, שכר דירה, משכנתא)
food (מזון, סופרמרקט, מסעדות, קפה)
transport (תחבורה, דלק, חניה, רכב)
entertainment (בילויים, סרטים, הופעות)
bills (חשבונות, חשמל, מים, גז)
health (בריאות, רופא, תרופות)
shopping (קניות, ביגוד, אלקטרוניקה)
education (חינוך, קורסים, ספרים)
subscriptions (מנויים, נטפליקס, ספוטיפיי)
pets (חיות מחמד, וטרינר)
gifts (מתנות, תרומות)
savings (חיסכון)
personal_care (טיפוח, ספר)
communication (תקשורת, סלולר, אינטרנט)
other (אחר)

קטגוריות הכנסות זמינות:
salary (משכורת, שכר)
bonus (בונוס, פרס)
investment (השקעות, דיבידנד, ריבית)
rental (שכירות נכס)
freelance (פרילנס, עבודה עצמאית)
pension (פנסיה, קצבה)
child_allowance (קצבת ילדים)
other (אחר)

כללים חשובים:
1. אם אתה לא בטוח ב-90% לפחות - החזר null
2. שמות עמומים כמו "העברת ביט", "Paybox", "צ'ק", "העברה", שם פרטי של אדם - החזר null
3. אל תנחש! עדיף להחזיר null מאשר לטעות
4. התבסס רק על שם העסק, לא על הסכום

החזר JSON בפורמט הבא בלבד (ללא הסברים נוספים):
{"merchantName1": "category", "merchantName2": null, ...}`;

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
    
    const response = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: CLASSIFICATION_PROMPT,
      messages: [{
        role: 'user',
        content: `סווג את העסקים הבאים:\n${merchantList}`,
      }],
    });
    
    // Parse the JSON response
    let jsonStr = response.text.trim();
    
    // Handle markdown code blocks
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1].trim();
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Map the results
    for (const merchant of merchants) {
      const category = parsed[merchant];
      if (category === null || category === 'null') {
        result.set(merchant, null);
      } else if (typeof category === 'string') {
        // Validate category exists
        const type = transactionTypes.get(merchant) || 'expense';
        const validCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        if (validCategories.includes(category)) {
          result.set(merchant, category);
        } else {
          result.set(merchant, null);
        }
      } else {
        result.set(merchant, null);
      }
    }
  } catch (error) {
    console.error('AI classification error:', error);
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
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

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

    // Read Excel file as array of arrays using exceljs (secure alternative to xlsx)
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    // Type assertion needed due to TypeScript Buffer type mismatch
    await workbook.xlsx.load(Buffer.from(arrayBuffer) as any);

    // Get first worksheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json(
        { error: 'הקובץ לא מכיל גליונות עבודה' },
        { status: 400 }
      );
    }

    // Convert worksheet to array of arrays (similar to xlsx output)
    const rawData: unknown[][] = [];
    worksheet.eachRow((row, rowNumber) => {
      const rowData: unknown[] = [];
      // Note: ExcelJS rows are 1-indexed, values array includes index 0 as undefined
      for (let colNumber = 1; colNumber <= row.cellCount; colNumber++) {
        const cell = row.getCell(colNumber);
        // Get cell value, handling dates and formulas
        let value: unknown = cell.value;

        // Handle date cells
        if (cell.type === ExcelJS.ValueType.Date && cell.value instanceof Date) {
          value = cell.value;
        }
        // Handle formula cells - get the result
        else if (cell.type === ExcelJS.ValueType.Formula && typeof cell.value === 'object' && cell.value !== null && 'result' in cell.value) {
          value = (cell.value as { result: unknown }).result;
        }
        // Handle rich text
        else if (cell.type === ExcelJS.ValueType.RichText && typeof cell.value === 'object' && cell.value !== null && 'richText' in cell.value) {
          value = (cell.value as { richText: Array<{ text: string }> }).richText.map(t => t.text).join('');
        }

        rowData.push(value);
      }
      rawData.push(rowData);
    });
    
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

        // Parse date
          const parsedDate = parseDate(date);
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
    
    // Get cached mappings
    const cachedMappings = await prisma.merchantCategoryMap.findMany({
      where: {
            userId,
        merchantName: { in: uniqueMerchants },
          },
        });

    // Create maps for category and alwaysAsk flag
    // Note: alwaysAsk field was added in schema update
    const cacheMap = new Map(cachedMappings.map(m => [m.merchantName, m.category]));
    const alwaysAskMap = new Map(
      cachedMappings
        .filter(m => (m as { alwaysAsk?: boolean }).alwaysAsk === true)
        .map(m => [m.merchantName, true])
    );
    
    // Separate known and unknown merchants (excluding alwaysAsk merchants)
    const unknownMerchants = uniqueMerchants.filter(m => !cacheMap.has(m) || alwaysAskMap.has(m));

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
      
      // Check if this merchant is marked as "always ask"
      if (alwaysAskMap.has(merchantName)) {
        // Put in review even if we have a cached category
        needsReviewTransactions.push(transaction);
        continue;
      }
      
      // Check cache first
      if (cacheMap.has(merchantName)) {
        transaction.category = cacheMap.get(merchantName)!;
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
    const newMappings: { userId: string; merchantName: string; category: string }[] = [];
    for (const [merchant, category] of aiClassifications) {
      if (category !== null) {
        newMappings.push({ userId, merchantName: merchant, category });
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
    console.error('Error importing transactions:', error);
    return NextResponse.json(
      { error: 'שגיאה בעיבוד הקובץ' },
      { status: 500 }
    );
  }
}

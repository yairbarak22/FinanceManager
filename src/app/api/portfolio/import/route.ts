import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Maximum number of rows
const MAX_ROWS = 1000;

interface ImportRow {
  symbol: string;
  quantity: number;
  currency?: string;
  provider?: string;
  priceDisplayUnit?: string;
}

interface ImportError {
  row: number;
  symbol: string;
  error: string;
}

/**
 * Detect CSV format and extract column mappings
 */
function detectFormat(headers: string[]): Record<string, number> {
  const lowerHeaders = headers.map((h) => h.trim().toLowerCase());
  const columnMap: Record<string, number> = {};

  // Generic format: Symbol, Quantity
  // Also supports Hebrew: סמל, כמות
  const symbolAliases = ['symbol', 'סמל', 'ticker', 'קוד', 'קוד נייר'];
  const quantityAliases = ['quantity', 'כמות', 'units', 'יחידות', 'מספר יחידות'];
  const currencyAliases = ['currency', 'מטבע'];
  const providerAliases = ['provider', 'ספק'];
  const priceDisplayUnitAliases = ['price display unit', 'יחידת תצוגה', 'pricedisplayunit'];

  lowerHeaders.forEach((header, index) => {
    if (symbolAliases.includes(header)) columnMap.symbol = index;
    if (quantityAliases.includes(header)) columnMap.quantity = index;
    if (currencyAliases.includes(header)) columnMap.currency = index;
    if (providerAliases.includes(header)) columnMap.provider = index;
    if (priceDisplayUnitAliases.includes(header)) columnMap.priceDisplayUnit = index;
  });

  return columnMap;
}

/**
 * Parse CSV content into rows
 */
function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    result.push(current.trim());
    return result;
  });
}

/**
 * POST /api/portfolio/import
 * Import portfolio holdings from CSV file
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'הקובץ גדול מדי (מקסימום 5MB)' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { error: 'יש להעלות קובץ CSV בלבד' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();
    
    // Remove BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '');
    
    // Parse CSV
    const rows = parseCSV(cleanContent);
    
    if (rows.length < 2) {
      return NextResponse.json(
        { error: 'הקובץ ריק או חסרות שורות נתונים' },
        { status: 400 }
      );
    }

    // Check row count
    if (rows.length > MAX_ROWS + 1) {
      return NextResponse.json(
        { error: `הקובץ מכיל יותר מ-${MAX_ROWS} שורות` },
        { status: 400 }
      );
    }

    // Get headers and detect format
    const headers = rows[0];
    const columnMap = detectFormat(headers);

    if (columnMap.symbol === undefined || columnMap.quantity === undefined) {
      return NextResponse.json(
        { error: 'הקובץ חייב להכיל עמודות Symbol ו-Quantity' },
        { status: 400 }
      );
    }

    // Parse data rows
    const importRows: ImportRow[] = [];
    const errors: ImportError[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      // Skip empty rows
      if (row.every((cell) => !cell.trim())) continue;

      const symbol = row[columnMap.symbol]?.trim().toUpperCase();
      const quantityStr = row[columnMap.quantity]?.trim();

      // Validate symbol
      if (!symbol) {
        errors.push({ row: rowNumber, symbol: '', error: 'סמל חסר' });
        continue;
      }

      // Validate quantity
      const quantity = parseFloat(quantityStr);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push({ row: rowNumber, symbol, error: 'כמות לא תקינה' });
        continue;
      }

      // Get optional fields
      const currency = columnMap.currency !== undefined
        ? row[columnMap.currency]?.trim().toUpperCase()
        : undefined;
      const provider = columnMap.provider !== undefined
        ? row[columnMap.provider]?.trim().toUpperCase()
        : undefined;
      const priceDisplayUnit = columnMap.priceDisplayUnit !== undefined
        ? row[columnMap.priceDisplayUnit]?.trim().toUpperCase()
        : undefined;

      importRows.push({
        symbol,
        quantity,
        currency: currency === 'ILS' || currency === 'USD' ? currency : undefined,
        provider: provider === 'EOD' || provider === 'YAHOO' ? provider : undefined,
        priceDisplayUnit: priceDisplayUnit === 'ILS' || priceDisplayUnit === 'ILS_AGOROT' || priceDisplayUnit === 'USD'
          ? priceDisplayUnit
          : undefined,
      });
    }

    if (importRows.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          added: 0,
          updated: 0,
          errors,
          message: 'לא נמצאו שורות תקינות לייבוא',
        },
        { status: 400 }
      );
    }

    // Get existing holdings for this user
    const existingHoldings = await prisma.holding.findMany({
      where: {
        userId,
        symbol: { in: importRows.map((r) => r.symbol) },
      },
      select: { id: true, symbol: true },
    });

    const existingSymbolMap = new Map(
      existingHoldings.map((h) => [h.symbol, h.id])
    );

    // Prepare upsert operations
    let added = 0;
    let updated = 0;

    for (const row of importRows) {
      const existingId = existingSymbolMap.get(row.symbol);

      if (existingId) {
        // Update existing holding
        await prisma.holding.update({
          where: { id: existingId },
          data: {
            currentValue: row.quantity,
            ...(row.currency && { currency: row.currency }),
            ...(row.provider && { provider: row.provider }),
            ...(row.priceDisplayUnit && { priceDisplayUnit: row.priceDisplayUnit }),
          },
        });
        updated++;
      } else {
        // Create new holding
        await prisma.holding.create({
          data: {
            userId,
            name: row.symbol, // Will be enriched later
            symbol: row.symbol,
            type: 'stock',
            currentValue: row.quantity,
            targetAllocation: 0,
            currency: row.currency || 'USD',
            provider: row.provider || 'EOD',
            priceDisplayUnit: row.priceDisplayUnit || 'ILS',
          },
        });
        added++;
      }
    }

    return NextResponse.json({
      success: true,
      added,
      updated,
      errors,
      message: `יובאו ${added + updated} נכסים בהצלחה${errors.length > 0 ? ` (${errors.length} שגיאות)` : ''}`,
    });
  } catch (error) {
    console.error('Error importing portfolio:', error);
    return NextResponse.json(
      { error: 'שגיאה בייבוא התיק' },
      { status: 500 }
    );
  }
}


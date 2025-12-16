import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import * as XLSX from 'xlsx';

// Category mapping from Hebrew to category ID
const categoryMapping: Record<string, string> = {
  'מזון': 'food',
  'אוכל': 'food',
  'סופרמרקט': 'food',
  'מסעדה': 'food',
  'מסעדות': 'food',
  'קפה': 'food',
  'דיור': 'housing',
  'שכר דירה': 'housing',
  'בית': 'housing',
  'תחבורה': 'transport',
  'דלק': 'transport',
  'רכב': 'transport',
  'חניה': 'transport',
  'בילויים': 'entertainment',
  'בידור': 'entertainment',
  'חשבונות': 'bills',
  'חשמל': 'bills',
  'מים': 'bills',
  'גז': 'bills',
  'אינטרנט': 'bills',
  'טלפון': 'bills',
  'בריאות': 'health',
  'רפואה': 'health',
  'תרופות': 'health',
  'משכורת': 'salary',
  'שכר': 'salary',
  'בונוס': 'bonus',
  'השקעות': 'investment',
  'השקעה': 'investment',
  'ריבית': 'investment',
  'דיבידנד': 'investment',
};

function mapCategory(hebrewCategory: string): string {
  const normalized = hebrewCategory.trim().toLowerCase();
  
  // First check exact match
  for (const [key, value] of Object.entries(categoryMapping)) {
    if (key.toLowerCase() === normalized) {
      return value;
    }
  }
  
  // Then check if contains
  for (const [key, value] of Object.entries(categoryMapping)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return value;
    }
  }
  
  return 'other';
}

function parseDate(dateStr: string): Date | null {
  // Handle DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
    const year = parseInt(parts[2], 10);
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  
  // Try standard date parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON - skip header row
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    
    // Skip header row (first row)
    const dataRows = rawData.slice(1);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // +2 because we skip header and arrays are 0-indexed

      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) {
        continue;
      }

      try {
        // Expected columns: Business Name, Amount, Date, Category
        const [businessName, amount, dateStr, category] = row as [string, number | string, string, string];

        // Validate business name
        if (!businessName || typeof businessName !== 'string') {
          results.errors.push(`שורה ${rowNum}: שם עסק חסר`);
          results.failed++;
          continue;
        }

        // Parse and validate amount
        let numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^\d.-]/g, ''));
        if (isNaN(numAmount) || numAmount === 0) {
          results.errors.push(`שורה ${rowNum}: סכום לא תקין`);
          results.failed++;
          continue;
        }

        // Parse date
        const date = parseDate(String(dateStr));
        if (!date) {
          results.errors.push(`שורה ${rowNum}: תאריך לא תקין - ${dateStr}`);
          results.failed++;
          continue;
        }

        // Map category
        const mappedCategory = category ? mapCategory(String(category)) : 'other';

        // Determine type based on amount (positive = expense, negative = income)
        const type = numAmount > 0 ? 'expense' : 'income';
        const absAmount = Math.abs(numAmount);

        // Create transaction with userId
        await prisma.transaction.create({
          data: {
            userId,
            type,
            amount: absAmount,
            category: mappedCategory,
            description: businessName.trim(),
            date,
          },
        });

        results.success++;
      } catch (err) {
        console.error(`Error processing row ${rowNum}:`, err);
        results.errors.push(`שורה ${rowNum}: שגיאה בעיבוד`);
        results.failed++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error importing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to import transactions' },
      { status: 500 }
    );
  }
}

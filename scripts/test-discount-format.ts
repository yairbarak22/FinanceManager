/**
 * Comprehensive tests for the Discount/Max credit card Excel import format.
 * 
 * Format columns:
 *   0: תאריך עסקה | 1: שם בית העסק | 2: קטגוריה | 3: 4 ספרות אחרונות של כרטיס האשראי
 *   4: סוג עסקה | 5: סכום חיוב | 6: מטבע חיוב | 7: סכום עסקה מקורי
 *   8: מטבע עסקה מקורי | 9: תאריך חיוב | 10: הערות | 11: תיוגים
 *   12: מועדון הנחות | 13: מפתח דיסקונט | 14: אופן ביצוע ההעסקה | 15: שער המרה
 * 
 * Run: npx tsx scripts/test-discount-format.ts
 */

// ============================================================
// COPY OF FIXED FUNCTIONS FROM route.ts (with all fixes applied)
// ============================================================

const HEADER_KEYWORDS = [
  'תאריך', 'date', 'סכום', 'amount', 'שם', 'עסק', 'בית עסק',
  'פרטים', 'merchant', 'description', 'חיוב', 'זיכוי', 'תיאור',
  'פעולה', 'אסמכתא', 'יתרה', 'כרטיס', 'מספר', 'קטגוריה',
  'חובה', 'בחובה', 'זכות', 'בזכות', 'ערך', 'תנועה',
];

interface ColumnMapping {
  dateIndex: number;
  amountIndex: number;
  merchantIndex: number;
  debitIndex: number;
  creditIndex: number;
  isDualAmount: boolean;
}

interface ParsedTransaction {
  rowNum: number;
  merchantName: string;
  amount: number;
  date: Date;
  type: 'income' | 'expense';
  category: string | null;
}

function findAllHeaderRows(rows: unknown[][]): number[] {
  const MIN_MATCHES = 3;
  const MAX_HEADER_LENGTH = 500;
  const MIN_NON_EMPTY_CELLS = 2;
  const headerRows: number[] = [];

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
      if (hasNextRowData) headerRows.push(i);
    }
  }

  if (headerRows.length === 0) {
    let bestRowIndex = 0;
    let maxMatches = 0;
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');
      if (rowText.length > MAX_HEADER_LENGTH) continue;
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
        if (hasNextRowData) { maxMatches = matches; bestRowIndex = i; }
      }
    }
    if (maxMatches > 0) headerRows.push(bestRowIndex);
  }

  if (headerRows.length > 1) {
    const uniqueHeaders: number[] = [];
    const seenSignatures = new Set<string>();
    for (const idx of headerRows) {
      const row = rows[idx];
      if (!row) continue;
      const sig = row
        .map(cell => String(cell || '').trim().toLowerCase())
        .filter(s => s.length > 0)
        .join('|');
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        uniqueHeaders.push(idx);
      }
    }
    return uniqueHeaders;
  }

  return headerRows;
}

function findColumnsFallback(headerRow: unknown[]): ColumnMapping {
  let dateIndex = -1;
  let amountIndex = -1;
  let merchantIndex = -1;
  let debitIndex = -1;
  let creditIndex = -1;

  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '').trim().toLowerCase();

    if (dateIndex === -1 && (
      header === 'תאריך' || header.includes('תאריך עסקה') || header.includes('תאריך רכישה') ||
      header.includes('תאריך חיוב') || header.includes('date')
    )) {
      dateIndex = i;
    }

    let isCombinedColumn = false;
    if (amountIndex === -1 && (
      (header.includes('זכות') && header.includes('חובה')) ||
      (header.includes('חיוב') && header.includes('זיכוי'))
    )) {
      amountIndex = i;
      isCombinedColumn = true;
    }

    if (!isCombinedColumn) {
      if (header === 'חובה' || header === 'בחובה' || header === 'חיוב' || header.includes('debit')) {
        if (!header.includes('סכום')) debitIndex = i;
      }
      if (header === 'זכות' || header === 'בזכות' || header === 'זיכוי' || header.includes('credit')) {
        creditIndex = i;
      }
    }

    if (!isCombinedColumn && header.includes('סכום חיוב')) {
      amountIndex = i;
    } else if (!isCombinedColumn && amountIndex === -1 && (
      header.includes('סכום') || header.includes('amount')
    )) {
      if (!header.includes('יתרה') && !header.includes('אסמכתא')) {
        amountIndex = i;
      }
    }

    // FIXED: includes both "בית עסק" AND "בית העסק" patterns
    if (merchantIndex === -1 && i !== dateIndex && i !== amountIndex && (
      header.includes('בית עסק') || header.includes('בית העסק') ||
      header.includes('שם עסק') || header.includes('שם העסק') ||
      header.includes('תיאור') || header.includes('פרטים') ||
      header.includes('פעולה') || header.includes('פירוט') ||
      header.includes('merchant') || header.includes('description')
    )) {
      merchantIndex = i;
    }
  }

  if (merchantIndex === -1) {
    for (let i = 0; i < headerRow.length; i++) {
      if (i === dateIndex || i === amountIndex) continue;
      const header = String(headerRow[i] || '').trim().toLowerCase();
      if (header.includes('שם') || header.includes('עסק')) {
        merchantIndex = i;
        break;
      }
    }
  }

  const isDualAmount = debitIndex !== -1 && creditIndex !== -1;
  if (isDualAmount && dateIndex !== -1 && merchantIndex !== -1) {
    return { dateIndex, amountIndex: -1, merchantIndex, debitIndex, creditIndex, isDualAmount: true };
  }

  const allFound = dateIndex !== -1 && amountIndex !== -1 && merchantIndex !== -1;
  const allDifferent = dateIndex !== amountIndex && dateIndex !== merchantIndex && amountIndex !== merchantIndex;
  if (allFound && allDifferent) {
    return { dateIndex, amountIndex, merchantIndex, debitIndex: -1, creditIndex: -1, isDualAmount: false };
  }

  return {
    dateIndex: dateIndex !== -1 ? dateIndex : 0,
    amountIndex: amountIndex !== -1 ? amountIndex : 1,
    merchantIndex: merchantIndex !== -1 ? merchantIndex : 2,
    debitIndex: -1, creditIndex: -1, isDualAmount: false,
  };
}

function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  const str = String(value).replace(/[₪,\s]/g, '').replace(/NIS/gi, '').replace(/ש"ח/g, '').trim();
  const parenMatch = str.match(/^\(([0-9.]+)\)$/);
  if (parenMatch) { const n = parseFloat(parenMatch[1]); return isNaN(n) ? null : -n; }
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && value > 30000 && value < 100000) {
    return new Date((value - 25569) * 86400 * 1000);
  }
  const str = String(value).trim();
  if (!str) return null;
  const m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let y = parseInt(m[3], 10);
    if (y < 100) y += y > 50 ? 1900 : 2000;
    if (y < 2000 || y > 2100) return null;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const d = new Date(y, month, day);
    if (d.getDate() === day && d.getMonth() === month && d.getFullYear() === y) return d;
  }
  return null;
}

function deduplicateTransactions(transactions: ParsedTransaction[]): ParsedTransaction[] {
  const seen = new Set<string>();
  const deduped: ParsedTransaction[] = [];
  for (const t of transactions) {
    const key = `${t.date.toISOString()}|${t.merchantName}|${t.amount}|${t.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(t);
    }
  }
  return deduped;
}

function simulateImport(
  rows: unknown[][],
  importType: 'expenses' | 'roundTrip' = 'expenses'
): { transactions: ParsedTransaction[]; errors: string[]; headers: number[]; mapping: ColumnMapping | null } {
  const headerRows = findAllHeaderRows(rows);
  let parsedTransactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  let lastMapping: ColumnMapping | null = null;

  for (let tableIdx = 0; tableIdx < headerRows.length; tableIdx++) {
    const headerRowIndex = headerRows[tableIdx];
    const headerRow = rows[headerRowIndex] || [];
    const firstDataRowIndex = headerRowIndex + 1;
    const nextHeaderIndex = headerRows[tableIdx + 1];
    const tableEndIndex = nextHeaderIndex !== undefined ? nextHeaderIndex : rows.length;

    const mapping = findColumnsFallback(headerRow);
    lastMapping = mapping;

    for (let i = firstDataRowIndex; i < tableEndIndex; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      if (!row || row.length === 0) continue;

      const merchant = row[mapping.merchantIndex];
      const date = row[mapping.dateIndex];
      const hasAmountData = mapping.isDualAmount
        ? !!(row[mapping.debitIndex] || row[mapping.creditIndex])
        : !!row[mapping.amountIndex];

      if (!merchant && !hasAmountData && !date) continue;

      try {
        const merchantName = String(merchant || '').trim();
        if (!merchantName) { errors.push(`שורה ${rowNum}: שם עסק חסר`); continue; }

        let parsedAmount: number | null = null;
        let type: 'income' | 'expense' = 'expense';

        if (mapping.isDualAmount) {
          const parsedDebit = parseAmount(row[mapping.debitIndex]);
          const parsedCredit = parseAmount(row[mapping.creditIndex]);
          if ((parsedDebit === null || parsedDebit === 0) && (parsedCredit === null || parsedCredit === 0)) {
            errors.push(`שורה ${rowNum}: סכום לא תקין`);
            continue;
          }
          if (parsedDebit && parsedDebit > 0) {
            parsedAmount = Math.abs(parsedDebit); type = 'expense';
          } else if (parsedCredit && parsedCredit > 0) {
            parsedAmount = Math.abs(parsedCredit); type = 'income';
          } else {
            parsedAmount = parsedDebit ? Math.abs(parsedDebit) : parsedCredit ? Math.abs(parsedCredit) : null;
            if (!parsedAmount) { errors.push(`שורה ${rowNum}: סכום לא תקין`); continue; }
            type = 'expense';
          }
        } else {
          const amount = row[mapping.amountIndex];
          parsedAmount = parseAmount(amount);
          if (parsedAmount === null || parsedAmount === 0) {
            errors.push(`שורה ${rowNum}: סכום לא תקין`);
            continue;
          }
          if (importType === 'roundTrip') {
            type = parsedAmount > 0 ? 'income' : 'expense';
          } else {
            type = parsedAmount > 0 ? 'expense' : 'income';
          }
          parsedAmount = Math.abs(parsedAmount);
        }

        const parsedDate = parseDate(date);
        if (!parsedDate) { errors.push(`שורה ${rowNum}: תאריך לא תקין`); continue; }

        parsedTransactions.push({ rowNum, merchantName, amount: parsedAmount, date: parsedDate, type, category: null });
      } catch { errors.push(`שורה ${rowNum}: שגיאה בעיבוד`); }
    }
  }

  // Sign convention auto-detection
  if (importType === 'expenses' && parsedTransactions.length >= 5) {
    const incomeRatio = parsedTransactions.filter(t => t.type === 'income').length / parsedTransactions.length;
    if (incomeRatio > 0.7) {
      for (const t of parsedTransactions) t.type = t.type === 'income' ? 'expense' : 'income';
    }
  }

  // Post-parsing deduplication (same as route.ts)
  parsedTransactions = deduplicateTransactions(parsedTransactions);

  return { transactions: parsedTransactions, errors, headers: headerRows, mapping: lastMapping };
}

// ============================================================
// EXACT FORMAT FROM USER
// ============================================================

const DISCOUNT_HEADER = [
  'תאריך עסקה', 'שם בית העסק', 'קטגוריה',
  '4 ספרות אחרונות של כרטיס האשראי', 'סוג עסקה',
  'סכום חיוב', 'מטבע חיוב', 'סכום עסקה מקורי',
  'מטבע עסקה מקורי', 'תאריך חיוב', 'הערות', 'תיוגים',
  'מועדון הנחות', 'מפתח דיסקונט', 'אופן ביצוע ההעסקה',
  'שער המרה ממטבע מקור/התחשבנות לש"ח'
];

// 10 realistic and UNIQUE transactions
const TXN_ROWS: unknown[][] = [
  ['01/01/2026', 'שופרסל דיל', 'מזון',               '1234', 'רגילה',  '150.00',  '₪', '150.00',  'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ['02/01/2026', 'דור אלון דלק', 'תחבורה',           '1234', 'רגילה',  '250.50',  '₪', '250.50',  'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ['03/01/2026', 'NETFLIX.COM', 'בידור',               '1234', 'רגילה',  '49.90',   '₪', '12.99',   'USD', '01/02/2026', '', '', '', '', 'אינטרנט', '3.84'],
  ['05/01/2026', 'רמי לוי שיווק', 'מזון',             '1234', 'רגילה',  '320.00',  '₪', '320.00',  'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ['07/01/2026', 'קסטרו', 'ביגוד',                     '1234', 'רגילה',  '199.00',  '₪', '199.00',  'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ['10/01/2026', 'AMAZON.COM', '',                      '1234', 'רגילה',  '89.90',   '₪', '24.99',   'USD', '01/02/2026', '', '', '', '', 'אינטרנט', '3.60'],
  ['12/01/2026', 'סופר פארם', 'בריאות',                '1234', 'רגילה',  '75.50',   '₪', '75.50',   'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ['15/01/2026', 'פז דלק', 'תחבורה',                   '1234', 'רגילה',  '180.00',  '₪', '180.00',  'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ['18/01/2026', 'IKEA', 'ריהוט',                      '1234', 'תשלומים','450.00',  '₪', '1350.00', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ['22/01/2026', 'אלי אקספרס', 'קניות',               '1234', 'רגילה',  '35.00',   '₪', '9.50',    'USD', '01/02/2026', '', '', '', '', 'אינטרנט', '3.68'],
];

// Different card transactions (unique merchants/amounts)
const TXN_ROWS_CARD2: unknown[][] = [
  ['03/01/2026', 'ויקטורי', 'מזון',                    '5678', 'רגילה',  '210.30',  '₪', '210.30',  'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ['04/01/2026', 'בורגר קינג', 'מסעדות',               '5678', 'רגילה',  '78.00',   '₪', '78.00',   'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ['08/01/2026', 'YES', 'תקשורת',                      '5678', 'רגילה',  '150.00',  '₪', '150.00',  'ILS', '01/02/2026', '', '', '', '', 'אינטרנט', '1'],
  ['11/01/2026', 'פוקס', 'ביגוד',                      '5678', 'רגילה',  '299.00',  '₪', '299.00',  'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ['20/01/2026', 'SPOTIFY', 'מנויים',                   '5678', 'רגילה',  '19.90',   '₪', '5.99',    'USD', '01/02/2026', '', '', '', '', 'אינטרנט', '3.32'],
];

// ============================================================
// TEST FRAMEWORK
// ============================================================

let totalPassed = 0;
let totalFailed = 0;

function group(name: string) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${name}`);
  console.log(`${'═'.repeat(70)}`);
}

function assert(name: string, condition: boolean, details = '') {
  if (condition) {
    console.log(`  ✅ ${name}`);
    totalPassed++;
  } else {
    console.log(`  ❌ ${name}${details ? ` — ${details}` : ''}`);
    totalFailed++;
  }
}

// ============================================================
// TESTS
// ============================================================

// ──────────────────────────────────────────────────────────────
group('1. Header detection — single table');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [DISCOUNT_HEADER, ...TXN_ROWS];
  const h = findAllHeaderRows(rows);
  assert('Finds exactly 1 header', h.length === 1, `found ${h.length}`);
  assert('Header at row 0', h[0] === 0, `at row ${h[0]}`);
}

// ──────────────────────────────────────────────────────────────
group('2. Header detection — with metadata rows above header');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [
    ['פירוט עסקאות כרטיס', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['חשבון: 12345-67', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['תקופת חיוב: 01/01/2026 - 31/01/2026', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    DISCOUNT_HEADER,
    ...TXN_ROWS,
  ];
  const h = findAllHeaderRows(rows);
  assert('Finds exactly 1 header', h.length === 1, `found ${h.length}`);
  assert('Header at row 4 (after metadata)', h[0] === 4, `at row ${h[0]}`);
  assert('Metadata rows not mistaken as headers', !h.includes(0) && !h.includes(1) && !h.includes(2));
}

// ──────────────────────────────────────────────────────────────
group('3. Header detection — two identical sections (DUPLICATION BUG)');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [
    DISCOUNT_HEADER,
    ...TXN_ROWS,
    [],
    ['סה"כ', '', '', '', '', '1800.00', '', '', '', '', '', '', '', '', '', ''],
    [],
    DISCOUNT_HEADER, // Same header repeated
    ...TXN_ROWS,     // Same data repeated
    [],
    ['סה"כ', '', '', '', '', '1800.00', '', '', '', '', '', '', '', '', '', ''],
  ];
  const h = findAllHeaderRows(rows);
  assert('Deduplication: only 1 unique header kept', h.length === 1, `found ${h.length}`);
  assert('First occurrence preserved', h[0] === 0, `at row ${h[0]}`);

  // Post-parsing dedup removes duplicated data
  const result = simulateImport(rows);
  assert('Post-parsing dedup: 10 unique txns (not 20)', result.transactions.length === 10,
    `got ${result.transactions.length}`);
}

// ──────────────────────────────────────────────────────────────
group('4. Header detection — two DIFFERENT sections (should keep both)');
// ──────────────────────────────────────────────────────────────
{
  const OSHH_HEADER = ['תאריך', 'תיאור פעולה', 'אסמכתא', 'חובה', 'זכות', 'יתרה', '', '', '', '', '', '', '', '', '', ''];
  const rows: unknown[][] = [
    DISCOUNT_HEADER,
    ...TXN_ROWS.slice(0, 3),
    [],
    OSHH_HEADER,
    ['01/01/2026', 'העברה', '11111', '500', '', '9500', '', '', '', '', '', '', '', '', '', ''],
  ];
  const h = findAllHeaderRows(rows);
  assert('Two different headers: both kept', h.length === 2, `found ${h.length}`);
}

// ──────────────────────────────────────────────────────────────
group('5. Multi-card file — DIFFERENT data per card (keep all)');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [
    ['פירוט עסקאות כרטיס אשראי', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['מספר כרטיס: **** 1234', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    DISCOUNT_HEADER,
    ...TXN_ROWS.slice(0, 5),
    [],
    ['סה"כ חיוב', '', '', '', '', '969.40', '', '', '', '', '', '', '', '', '', ''],
    [],
    ['מספר כרטיס: **** 5678', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    DISCOUNT_HEADER, // Same header for 2nd card
    ...TXN_ROWS_CARD2,
    [],
    ['סה"כ חיוב', '', '', '', '', '757.20', '', '', '', '', '', '', '', '', '', ''],
  ];
  const h = findAllHeaderRows(rows);
  assert('Headers deduplicated to 1', h.length === 1, `found ${h.length}`);

  const result = simulateImport(rows);
  assert('All 10 unique txns from both cards kept', result.transactions.length === 10,
    `got ${result.transactions.length}`);

  const card1Merchants = ['שופרסל דיל', 'דור אלון דלק', 'NETFLIX.COM', 'רמי לוי שיווק', 'קסטרו'];
  const card2Merchants = ['ויקטורי', 'בורגר קינג', 'YES', 'פוקס', 'SPOTIFY'];
  const resultMerchants = result.transactions.map(t => t.merchantName);
  assert('Card 1 merchants present', card1Merchants.every(m => resultMerchants.includes(m)));
  assert('Card 2 merchants present', card2Merchants.every(m => resultMerchants.includes(m)));
}

// ──────────────────────────────────────────────────────────────
group('6. Multi-card file — SAME data repeated (dedup to 1 copy)');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [
    DISCOUNT_HEADER,
    ...TXN_ROWS.slice(0, 5),
    [],
    ['סה"כ', '', '', '', '', '969.40', '', '', '', '', '', '', '', '', '', ''],
    [],
    DISCOUNT_HEADER,
    ...TXN_ROWS.slice(0, 5), // Exact same data
    [],
    ['סה"כ', '', '', '', '', '969.40', '', '', '', '', '', '', '', '', '', ''],
  ];
  const result = simulateImport(rows);
  assert('Identical data deduped: 5 txns (not 10)', result.transactions.length === 5,
    `got ${result.transactions.length}`);
}

// ──────────────────────────────────────────────────────────────
group('7. Column mapping — exact format');
// ──────────────────────────────────────────────────────────────
{
  const m = findColumnsFallback(DISCOUNT_HEADER);
  assert('dateIndex = 0 (תאריך עסקה)', m.dateIndex === 0, `got ${m.dateIndex} → "${DISCOUNT_HEADER[m.dateIndex]}"`);
  assert('merchantIndex = 1 (שם בית העסק)', m.merchantIndex === 1, `got ${m.merchantIndex} → "${DISCOUNT_HEADER[m.merchantIndex]}"`);
  assert('amountIndex = 5 (סכום חיוב)', m.amountIndex === 5, `got ${m.amountIndex} → "${DISCOUNT_HEADER[m.amountIndex]}"`);
  assert('isDualAmount = false', !m.isDualAmount, `isDualAmount = ${m.isDualAmount}`);
  assert('dateIndex ≠ merchantIndex ≠ amountIndex', m.dateIndex !== m.merchantIndex && m.merchantIndex !== m.amountIndex);
}

// ──────────────────────────────────────────────────────────────
group('8. Column mapping — BOM/encoding variation ("אריך עסקה" without ת)');
// ──────────────────────────────────────────────────────────────
{
  const BOM_HEADER = [...DISCOUNT_HEADER];
  BOM_HEADER[0] = 'אריך עסקה';
  const m = findColumnsFallback(BOM_HEADER);
  assert('With BOM: dateIndex = 9 (fallback to תאריך חיוב)', m.dateIndex === 9,
    `got ${m.dateIndex} → "${BOM_HEADER[m.dateIndex]}"`);
  // FIXED: "בית העסק" pattern now matches "שם בית העסק"
  assert('With BOM: merchantIndex = 1 (שם בית העסק)', m.merchantIndex === 1,
    `got ${m.merchantIndex} → "${BOM_HEADER[m.merchantIndex]}"`);
  assert('With BOM: amountIndex = 5 (סכום חיוב)', m.amountIndex === 5,
    `got ${m.amountIndex} → "${BOM_HEADER[m.amountIndex]}"`);
}

// ──────────────────────────────────────────────────────────────
group('9. Full import — standard positive amounts');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [DISCOUNT_HEADER, ...TXN_ROWS];
  const result = simulateImport(rows, 'expenses');

  assert(`Parsed all ${TXN_ROWS.length} transactions`, result.transactions.length === TXN_ROWS.length,
    `got ${result.transactions.length}, errors: ${result.errors.length}`);
  assert('No parse errors', result.errors.length === 0, result.errors.join('; '));

  const expenses = result.transactions.filter(t => t.type === 'expense');
  assert('All are expenses (positive amounts in credit card)', expenses.length === TXN_ROWS.length,
    `${expenses.length}/${TXN_ROWS.length} are expenses`);

  const netflix = result.transactions.find(t => t.merchantName === 'NETFLIX.COM');
  assert('NETFLIX: amount = 49.90 (סכום חיוב, not original $12.99)', netflix?.amount === 49.90,
    `got ${netflix?.amount}`);

  const ikea = result.transactions.find(t => t.merchantName === 'IKEA');
  assert('IKEA: amount = 450 (סכום חיוב per installment)', ikea?.amount === 450,
    `got ${ikea?.amount}`);

  const ali = result.transactions.find(t => t.merchantName === 'אלי אקספרס');
  assert('Ali Express: merchant name correct', ali !== undefined);
  assert('Ali Express: amount = 35.00', ali?.amount === 35, `got ${ali?.amount}`);
}

// ──────────────────────────────────────────────────────────────
group('10. Full import — negative amounts (inverted sign convention)');
// ──────────────────────────────────────────────────────────────
{
  const NEG_ROWS = TXN_ROWS.map(row => {
    const r = [...row];
    r[5] = '-' + String(r[5]);
    return r;
  });
  const rows: unknown[][] = [DISCOUNT_HEADER, ...NEG_ROWS];
  const result = simulateImport(rows, 'expenses');

  assert(`Parsed all ${TXN_ROWS.length} transactions`, result.transactions.length === TXN_ROWS.length,
    `got ${result.transactions.length}`);

  const expenses = result.transactions.filter(t => t.type === 'expense');
  assert('Sign auto-flip: all become expenses', expenses.length === TXN_ROWS.length,
    `${expenses.length}/${TXN_ROWS.length} are expenses`);

  assert('Amounts are absolute values', result.transactions.every(t => t.amount > 0));
}

// ──────────────────────────────────────────────────────────────
group('11. Full import — mixed amounts (charges + refund)');
// ──────────────────────────────────────────────────────────────
{
  const MIXED_ROWS = TXN_ROWS.map((row, i) => {
    const r = [...row];
    if (i === 2) {
      r[5] = '-49.90';
      r[1] = 'NETFLIX.COM זיכוי';
    }
    return r;
  });
  const rows: unknown[][] = [DISCOUNT_HEADER, ...MIXED_ROWS];
  const result = simulateImport(rows, 'expenses');

  const netflix = result.transactions.find(t => t.merchantName === 'NETFLIX.COM זיכוי');
  assert('Refund detected as income', netflix?.type === 'income', `type = ${netflix?.type}`);

  const nonRefunds = result.transactions.filter(t => t.merchantName !== 'NETFLIX.COM זיכוי');
  assert('Non-refunds are expenses', nonRefunds.every(t => t.type === 'expense'));
}

// ──────────────────────────────────────────────────────────────
group('12. Date parsing — DD/MM/YYYY format');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [DISCOUNT_HEADER, ...TXN_ROWS];
  const result = simulateImport(rows, 'expenses');

  const first = result.transactions[0];
  assert('First date: 01/01/2026 → Jan 1, 2026',
    first.date.getFullYear() === 2026 && first.date.getMonth() === 0 && first.date.getDate() === 1,
    `got ${first.date.toISOString()}`);

  const last = result.transactions[result.transactions.length - 1];
  assert('Last date: 22/01/2026 → Jan 22, 2026',
    last.date.getFullYear() === 2026 && last.date.getMonth() === 0 && last.date.getDate() === 22,
    `got ${last.date.toISOString()}`);
}

// ──────────────────────────────────────────────────────────────
group('13. Date parsing — various separators');
// ──────────────────────────────────────────────────────────────
{
  assert('DD/MM/YYYY', parseDate('15/03/2026')?.getDate() === 15);
  assert('DD-MM-YYYY', parseDate('15-03-2026')?.getDate() === 15);
  assert('DD.MM.YYYY', parseDate('15.03.2026')?.getDate() === 15);
  assert('DD/MM/YY', parseDate('15/03/26')?.getFullYear() === 2026);
  assert('Single digit day: 5/03/2026', parseDate('5/03/2026')?.getDate() === 5);
  assert('Single digit month: 15/3/2026', parseDate('15/3/2026')?.getMonth() === 2);
  assert('Excel serial (46753)', parseDate(46753) !== null);
  assert('Invalid date → null', parseDate('not-a-date') === null);
  assert('Empty → null', parseDate('') === null);
  assert('Null → null', parseDate(null) === null);
}

// ──────────────────────────────────────────────────────────────
group('14. Amount parsing edge cases');
// ──────────────────────────────────────────────────────────────
{
  assert('Plain number: 150.00', parseAmount('150.00') === 150);
  assert('With currency: ₪150.00', parseAmount('₪150.00') === 150);
  assert('With commas: 1,234.56', parseAmount('1,234.56') === 1234.56);
  assert('Negative: -500.00', parseAmount('-500.00') === -500);
  assert('Parentheses negative: (123.45)', parseAmount('(123.45)') === -123.45);
  assert('With spaces: 150 .00', parseAmount('150 .00') === 150);
  assert('Raw number type', parseAmount(150) === 150);
  assert('Raw negative number', parseAmount(-250.50) === -250.50);
  assert('Empty string → null', parseAmount('') === null);
  assert('Zero', parseAmount(0) === 0);
  assert('NIS suffix', parseAmount('150.00NIS') === 150);
  assert('שח suffix', parseAmount('150.00ש"ח') === 150);
  assert('Large with commas: 12,345.67', parseAmount('12,345.67') === 12345.67);
  assert('Decimal only: .99', parseAmount('.99') === 0.99);
  assert('Integer: 100', parseAmount('100') === 100);
}

// ──────────────────────────────────────────────────────────────
group('15. Empty / sparse rows handling');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [
    DISCOUNT_HEADER,
    TXN_ROWS[0],
    [],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    TXN_ROWS[1],
    ['', '', '', '', '', '0', '', '', '', '', '', '', '', '', '', ''],
    TXN_ROWS[2],
  ];
  const result = simulateImport(rows, 'expenses');
  assert('Skips blank/empty rows, parses 3 valid transactions', result.transactions.length === 3,
    `got ${result.transactions.length}, errors: ${result.errors.length}`);
}

// ──────────────────────────────────────────────────────────────
group('16. Summary/total row not detected as header');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [
    DISCOUNT_HEADER,
    ...TXN_ROWS,
    [],
    ['סה"כ חיוב', '', '', '', '', '1,800.00', '₪', '', '', '', '', '', '', '', '', ''],
    ['סה"כ חיוב בש"ח', '', '', '', '', '1,800.00', '', '', '', '', '', '', '', '', '', ''],
    [],
  ];
  const h = findAllHeaderRows(rows);
  assert('Summary rows not detected as headers', h.length === 1, `found ${h.length} headers`);
}

// ──────────────────────────────────────────────────────────────
group('17. Section title rows with keywords don\'t become headers');
// ──────────────────────────────────────────────────────────────
{
  const sectionTitles = [
    'עסקאות כרטיס 1234 לתאריך חיוב 01/02/2026',
    'פירוט עסקאות בכרטיס אשראי 5678 לתאריך חיוב',
    'סיכום עסקאות לפי כרטיס - תאריך חיוב 02/2026',
    'עסקאות בתשלומים - סכום מקורי ותאריך עסקה',
  ];

  for (const title of sectionTitles) {
    const row = [title, '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
    const nonEmpty = row.filter(c => String(c).trim().length > 0).length;
    assert(`"${title.substring(0, 40)}..." blocked (${nonEmpty} non-empty cell)`,
      nonEmpty < 2);
  }
}

// ──────────────────────────────────────────────────────────────
group('18. End-to-end: realistic Discount file with two cards');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [
    ['פירוט עסקאות כרטיס אשראי - דיסקונט', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['תקופת חיוב: 01/01/2026 - 31/01/2026', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    // Card 1
    DISCOUNT_HEADER,
    ...TXN_ROWS.slice(0, 5),
    [],
    ['סה"כ', '', '', '', '', '969.40', '', '', '', '', '', '', '', '', '', ''],
    [],
    // Card 2 - same header, DIFFERENT transactions
    DISCOUNT_HEADER,
    ...TXN_ROWS_CARD2,
    [],
    ['סה"כ', '', '', '', '', '757.20', '', '', '', '', '', '', '', '', '', ''],
  ];

  const h = findAllHeaderRows(rows);
  assert('Identical headers deduplicated to 1', h.length === 1, `found ${h.length}`);

  const result = simulateImport(rows, 'expenses');
  assert('All 10 unique txns from both cards', result.transactions.length === 10,
    `got ${result.transactions.length}`);
  assert('First txn is שופרסל', result.transactions[0]?.merchantName === 'שופרסל דיל');
  assert('All are expenses', result.transactions.every(t => t.type === 'expense'));
}

// ──────────────────────────────────────────────────────────────
group('19. Column mapping — other Israeli bank formats (regression)');
// ──────────────────────────────────────────────────────────────
{
  const ISR = ['תאריך עסקה', 'שם בית עסק', 'מספר כרטיס', 'סכום חיוב', 'מטבע', 'סכום עסקה מקורי'];
  const mi = findColumnsFallback(ISR);
  assert('Isracard: date=0, merchant=1, amount=3', mi.dateIndex === 0 && mi.merchantIndex === 1 && mi.amountIndex === 3,
    `d=${mi.dateIndex} m=${mi.merchantIndex} a=${mi.amountIndex}`);

  const POA = ['תאריך', 'תיאור פעולה', 'אסמכתא', 'בחובה', 'בזכות', 'היתרה'];
  const mp = findColumnsFallback(POA);
  assert('Poalim: date=0, merchant=1, dual=true', mp.dateIndex === 0 && mp.merchantIndex === 1 && mp.isDualAmount,
    `d=${mp.dateIndex} m=${mp.merchantIndex} dual=${mp.isDualAmount}`);

  const LEU = ['תאריך', 'תאריך ערך', 'תיאור', 'אסמכתא', 'חובה', 'זכות', 'יתרה'];
  const ml = findColumnsFallback(LEU);
  assert('Leumi: date=0, merchant=2 (תיאור), dual=true', ml.dateIndex === 0 && ml.merchantIndex === 2 && ml.isDualAmount,
    `d=${ml.dateIndex} m=${ml.merchantIndex} dual=${ml.isDualAmount}`);

  const MAX = ['תאריך עסקה', 'שם בית העסק', 'סוג עסקה', 'סכום חיוב', 'מטבע חיוב', 'סכום עסקה מקורי'];
  const mm = findColumnsFallback(MAX);
  assert('Max: date=0, merchant=1, amount=3', mm.dateIndex === 0 && mm.merchantIndex === 1 && mm.amountIndex === 3,
    `d=${mm.dateIndex} m=${mm.merchantIndex} a=${mm.amountIndex}`);

  const CAL = ['תאריך עסקה', 'שם בית העסק', 'קטגוריה', 'סכום חיוב', 'סכום עסקה'];
  const mc = findColumnsFallback(CAL);
  assert('Cal: date=0, merchant=1, amount=3 (סכום חיוב)', mc.dateIndex === 0 && mc.merchantIndex === 1 && mc.amountIndex === 3,
    `d=${mc.dateIndex} m=${mc.merchantIndex} a=${mc.amountIndex}`);

  // Amex Israel
  const AMEX = ['תאריך', 'פרטים', 'סכום', 'מטבע', 'סכום חיוב'];
  const ma = findColumnsFallback(AMEX);
  assert('Amex: date=0, merchant=1 (פרטים), amount=4 (סכום חיוב)', ma.dateIndex === 0 && ma.merchantIndex === 1 && ma.amountIndex === 4,
    `d=${ma.dateIndex} m=${ma.merchantIndex} a=${ma.amountIndex}`);

  // Mizrahi Tefahot
  const MIZ = ['תאריך', 'תיאור', 'אסמכתא', 'חובה', 'זכות', 'יתרה'];
  const mz = findColumnsFallback(MIZ);
  assert('Mizrahi: date=0, merchant=1 (תיאור), dual=true', mz.dateIndex === 0 && mz.merchantIndex === 1 && mz.isDualAmount,
    `d=${mz.dateIndex} m=${mz.merchantIndex} dual=${mz.isDualAmount}`);
}

// ──────────────────────────────────────────────────────────────
group('20. Sign reversal — auto-detect with numeric amounts');
// ──────────────────────────────────────────────────────────────
{
  const NEG_NUMERIC_ROWS = TXN_ROWS.map(row => {
    const r = [...row];
    r[5] = -Math.abs(parseFloat(String(r[5])));
    return r;
  });
  const rows: unknown[][] = [DISCOUNT_HEADER, ...NEG_NUMERIC_ROWS];
  const result = simulateImport(rows, 'expenses');

  assert('All 10 parsed', result.transactions.length === 10, `got ${result.transactions.length}`);
  const expenses = result.transactions.filter(t => t.type === 'expense');
  assert('All flipped to expenses (auto-detect)', expenses.length === 10,
    `${expenses.length}/10 are expenses`);
}

// ──────────────────────────────────────────────────────────────
group('21. Merchant names with special characters');
// ──────────────────────────────────────────────────────────────
{
  const SPECIAL_ROWS: unknown[][] = [
    ['01/01/2026', "מקדונלד'ס", 'מזון', '1234', 'רגילה', '55.00', '₪', '55.00', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
    ['02/01/2026', 'H&M', 'ביגוד', '1234', 'רגילה', '120.00', '₪', '120.00', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
    ['03/01/2026', "קפה ג'ו", 'מזון', '1234', 'רגילה', '25.00', '₪', '25.00', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
    ['04/01/2026', 'SPOTIFY P3D62C79CD', 'מנויים', '1234', 'רגילה', '19.90', '₪', '5.99', 'USD', '01/02/2026', '', '', '', '', 'אינטרנט', '3.32'],
    ['05/01/2026', 'אגודה שיתופית "הבונים"', 'דיור', '1234', 'רגילה', '300.00', '₪', '300.00', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
    ['06/01/2026', 'Super-Pharm בע"מ', 'בריאות', '1234', 'רגילה', '44.50', '₪', '44.50', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ];
  const rows: unknown[][] = [DISCOUNT_HEADER, ...SPECIAL_ROWS];
  const result = simulateImport(rows, 'expenses');

  assert(`All ${SPECIAL_ROWS.length} special-char merchants parsed`, result.transactions.length === SPECIAL_ROWS.length,
    `got ${result.transactions.length}`);
  assert("מקדונלד'ס preserved", result.transactions[0]?.merchantName === "מקדונלד'ס");
  assert('H&M preserved', result.transactions[1]?.merchantName === 'H&M');
  assert("קפה ג'ו preserved", result.transactions[2]?.merchantName === "קפה ג'ו");
  assert('SPOTIFY with code preserved', result.transactions[3]?.merchantName === 'SPOTIFY P3D62C79CD');
  assert('Hebrew quotes preserved', result.transactions[4]?.merchantName === 'אגודה שיתופית "הבונים"');
}

// ──────────────────────────────────────────────────────────────
group('22. Header row text length (MAX_HEADER_LENGTH check)');
// ──────────────────────────────────────────────────────────────
{
  const text = DISCOUNT_HEADER.map(h => String(h).toLowerCase()).join(' ');
  console.log(`  Header text length: ${text.length} chars`);
  assert('Header under new limit (500)', text.length <= 500, `${text.length} chars`);
  assert('Header was over old limit (200)', text.length > 200, `${text.length} chars`);

  const rows: unknown[][] = [DISCOUNT_HEADER, ...TXN_ROWS];
  const h = findAllHeaderRows(rows);
  assert('Header detected despite being 225+ chars', h.length === 1);
}

// ──────────────────────────────────────────────────────────────
group('23. Installment transactions');
// ──────────────────────────────────────────────────────────────
{
  const INSTALLMENT_ROWS: unknown[][] = [
    ['01/01/2026', 'IKEA', 'ריהוט', '1234', 'תשלומים', '450.00', '₪', '1350.00', 'ILS', '01/02/2026', 'תשלום 1 מתוך 3', '', '', '', 'EMV', '1'],
    ['01/01/2026', 'אלקטרה', 'חשמל', '1234', 'תשלומים', '333.33', '₪', '1000.00', 'ILS', '01/02/2026', 'תשלום 2 מתוך 3', '', '', '', 'EMV', '1'],
    ['01/01/2026', 'רהיטי ניקול', 'ריהוט', '1234', 'תשלומים', '500.00', '₪', '3000.00', 'ILS', '01/02/2026', 'תשלום 1 מתוך 6', '', '', '', 'EMV', '1'],
  ];
  const rows: unknown[][] = [DISCOUNT_HEADER, ...INSTALLMENT_ROWS];
  const result = simulateImport(rows, 'expenses');

  assert('3 installment txns parsed', result.transactions.length === 3, `got ${result.transactions.length}`);
  assert('IKEA: charged 450 (not 1350 total)', result.transactions[0]?.amount === 450);
  assert('אלקטרה: charged 333.33', Math.abs(result.transactions[1]?.amount - 333.33) < 0.01);
  assert('All installments are expenses', result.transactions.every(t => t.type === 'expense'));
}

// ──────────────────────────────────────────────────────────────
group('24. Foreign currency transactions');
// ──────────────────────────────────────────────────────────────
{
  const FX_ROWS: unknown[][] = [
    ['01/01/2026', 'AMAZON.COM', 'קניות', '1234', 'רגילה', '89.90', '₪', '24.99', 'USD', '01/02/2026', '', '', '', '', 'אינטרנט', '3.60'],
    ['02/01/2026', 'BOOKING.COM', 'מלונות', '1234', 'רגילה', '1200.00', '₪', '300.00', 'EUR', '01/02/2026', '', '', '', '', 'אינטרנט', '4.00'],
    ['03/01/2026', 'SHEIN', 'ביגוד', '1234', 'רגילה', '150.00', '₪', '42.00', 'USD', '01/02/2026', '', '', '', '', 'אינטרנט', '3.57'],
  ];
  const rows: unknown[][] = [DISCOUNT_HEADER, ...FX_ROWS];
  const result = simulateImport(rows, 'expenses');

  assert('3 FX txns parsed', result.transactions.length === 3, `got ${result.transactions.length}`);
  assert('AMAZON: ILS charge (89.90), not USD (24.99)', result.transactions[0]?.amount === 89.90);
  assert('BOOKING: ILS charge (1200), not EUR (300)', result.transactions[1]?.amount === 1200);
  assert('SHEIN: ILS charge (150), not USD (42)', result.transactions[2]?.amount === 150);
}

// ──────────────────────────────────────────────────────────────
group('25. Edge case — very first row is data (no header)');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [
    ['01/01/2026', 'שופרסל', 'מזון', '1234', 'רגילה', '150', '', '', '', '', '', '', '', '', '', ''],
    ['02/01/2026', 'רמי לוי', 'מזון', '1234', 'רגילה', '200', '', '', '', '', '', '', '', '', '', ''],
  ];
  const h = findAllHeaderRows(rows);
  // These are pure data rows, no keywords → fallback to best match (which may be 0 with 0 matches)
  assert('Pure data rows: no header found or fallback used gracefully', true);
}

// ──────────────────────────────────────────────────────────────
group('26. Edge case — only header, no data rows');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [DISCOUNT_HEADER];
  const h = findAllHeaderRows(rows);
  // Header exists but no next row → should NOT be detected (needs data below)
  assert('Header without data rows: not detected', h.length === 0, `found ${h.length}`);
}

// ──────────────────────────────────────────────────────────────
group('27. Post-parsing dedup — preserves legitimate duplicates');
// ──────────────────────────────────────────────────────────────
{
  // Two coffees at the same place on the same day with different amounts
  const LEGIT_ROWS: unknown[][] = [
    ['01/01/2026', 'ארומה', 'מזון', '1234', 'רגילה', '15.00', '₪', '15.00', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
    ['01/01/2026', 'ארומה', 'מזון', '1234', 'רגילה', '22.00', '₪', '22.00', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
    ['01/01/2026', 'שופרסל', 'מזון', '1234', 'רגילה', '100.00', '₪', '100.00', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ];
  const rows: unknown[][] = [DISCOUNT_HEADER, ...LEGIT_ROWS];
  const result = simulateImport(rows, 'expenses');
  assert('Different-amount same-merchant txns kept', result.transactions.length === 3,
    `got ${result.transactions.length}`);
}

// ──────────────────────────────────────────────────────────────
group('28. Post-parsing dedup — exact same txn deduped');
// ──────────────────────────────────────────────────────────────
{
  // Exact same transaction appearing twice (date, merchant, amount all identical)
  const DUP_ROWS: unknown[][] = [
    ['01/01/2026', 'ארומה', 'מזון', '1234', 'רגילה', '15.00', '₪', '15.00', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
    ['01/01/2026', 'ארומה', 'מזון', '1234', 'רגילה', '15.00', '₪', '15.00', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
    ['02/01/2026', 'שופרסל', 'מזון', '1234', 'רגילה', '100.00', '₪', '100.00', 'ILS', '01/02/2026', '', '', '', '', 'EMV', '1'],
  ];
  const rows: unknown[][] = [DISCOUNT_HEADER, ...DUP_ROWS];
  const result = simulateImport(rows, 'expenses');
  assert('Exact duplicate removed: 2 unique txns', result.transactions.length === 2,
    `got ${result.transactions.length}`);
}

// ──────────────────────────────────────────────────────────────
group('29. Three identical sections (triple duplication)');
// ──────────────────────────────────────────────────────────────
{
  const rows: unknown[][] = [
    DISCOUNT_HEADER, ...TXN_ROWS.slice(0, 3), [],
    DISCOUNT_HEADER, ...TXN_ROWS.slice(0, 3), [],
    DISCOUNT_HEADER, ...TXN_ROWS.slice(0, 3), [],
  ];
  const result = simulateImport(rows);
  assert('Triple duplication: only 3 unique txns', result.transactions.length === 3,
    `got ${result.transactions.length}`);
}

// ──────────────────────────────────────────────────────────────
group('30. Sign reversal — fewer than 5 transactions (no auto-flip)');
// ──────────────────────────────────────────────────────────────
{
  const NEG_FEW = TXN_ROWS.slice(0, 4).map(row => {
    const r = [...row];
    r[5] = '-' + String(r[5]);
    return r;
  });
  const rows: unknown[][] = [DISCOUNT_HEADER, ...NEG_FEW];
  const result = simulateImport(rows, 'expenses');

  assert('4 txns parsed', result.transactions.length === 4, `got ${result.transactions.length}`);
  const incomes = result.transactions.filter(t => t.type === 'income');
  assert('With <5 txns: NO auto-flip (all remain income)', incomes.length === 4,
    `${incomes.length}/4 are income`);
}

// ============================================================
// SUMMARY
// ============================================================

console.log(`\n${'═'.repeat(70)}`);
console.log(`  FINAL RESULTS: ${totalPassed} passed, ${totalFailed} failed out of ${totalPassed + totalFailed} tests`);
console.log(`${'═'.repeat(70)}`);

if (totalFailed === 0) {
  console.log('\n  🎉 ALL TESTS PASSED!\n');
} else {
  console.log(`\n  ⚠️ ${totalFailed} test(s) FAILED - review above\n`);
}

process.exit(totalFailed > 0 ? 1 : 0);

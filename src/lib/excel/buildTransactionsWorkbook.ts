import ExcelJS from 'exceljs';
import {
  getCategoryInfo,
  customCategoryToInfo,
  type CategoryInfo,
} from '@/lib/categories';

interface TransactionRow {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string | Date;
}

interface RecurringRow {
  id: string;
  type: string;
  amount: number;
  category: string;
  name: string;
  isActive: boolean;
  activeMonths: string[] | null;
}

interface CustomCategoryDB {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  color?: string | null;
}

interface BuildWorkbookParams {
  transactions: TransactionRow[];
  recurringTransactions: RecurringRow[];
  customCategories: CustomCategoryDB[];
  startDate: Date;
  endDate: Date;
}

// ── Color Palette ──────────────────────────────────────────────
const COLORS = {
  indigo: '4F46E5',
  indigoLight: 'EEF2FF',
  white: 'FFFFFF',
  green: '16A34A',
  greenLight: 'DCFCE7',
  red: 'E11D48',
  redLight: 'FFE4E6',
  grayDark: '1E293B',
  grayMid: '475569',
  grayLight: 'F1F5F9',
  grayStripe: 'F8FAFC',
  borderLight: 'E2E8F0',
  statusInactive: '94A3B8',
};

const FONT_NAME = 'Arial';

// ── Reusable Style Factories ───────────────────────────────────
function headerFont(size = 12): Partial<ExcelJS.Font> {
  return { name: FONT_NAME, size, bold: true, color: { argb: `FF${COLORS.white}` } };
}

function headerFill(): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.indigo}` } };
}

function stripeFill(): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.grayStripe}` } };
}

function totalFill(): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.grayLight}` } };
}

function sectionFill(): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLORS.indigoLight}` } };
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: `FF${COLORS.borderLight}` } };
  return { top: side, bottom: side, left: side, right: side };
}

function coloredFont(color: string, bold = false, size = 11): Partial<ExcelJS.Font> {
  return { name: FONT_NAME, size, bold, color: { argb: `FF${color}` } };
}

const CURRENCY_FORMAT = '#,##0.00 ₪';

// ── Helpers ────────────────────────────────────────────────────
function getCategoryHebrew(categoryId: string, type: string, customCats: CategoryInfo[]): string {
  const catType = type === 'income' ? 'income' : 'expense';
  const info = getCategoryInfo(categoryId, catType, customCats);
  return info?.nameHe ?? categoryId;
}

function formatDateHebrew(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function formatDateRange(start: Date, end: Date): string {
  return `${formatDateHebrew(start)} - ${formatDateHebrew(end)}`;
}

function setupRtlSheet(ws: ExcelJS.Worksheet) {
  ws.views = [{ rightToLeft: true, state: 'normal' }];
}

// ── Main Builder ───────────────────────────────────────────────
export function buildTransactionsWorkbook({
  transactions,
  recurringTransactions,
  customCategories,
  startDate,
  endDate,
}: BuildWorkbookParams): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MyNeto';
  wb.created = new Date();

  const customCats = customCategories.map(customCategoryToInfo);

  buildSummarySheet(wb, transactions, recurringTransactions, customCats, startDate, endDate);
  buildTransactionsSheet(wb, transactions, customCats);
  if (recurringTransactions.length > 0) {
    buildRecurringSheet(wb, recurringTransactions, customCats);
  }

  return wb;
}

// ── Sheet 1: Summary ───────────────────────────────────────────
function buildSummarySheet(
  wb: ExcelJS.Workbook,
  transactions: TransactionRow[],
  recurring: RecurringRow[],
  customCats: CategoryInfo[],
  startDate: Date,
  endDate: Date
) {
  const ws = wb.addWorksheet('סיכום');
  setupRtlSheet(ws);

  ws.columns = [{ width: 32 }, { width: 18 }];

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netRegular = totalIncome - totalExpense;

  const recurringIncome = recurring.filter((r) => r.type === 'income' && r.isActive).reduce((s, r) => s + r.amount, 0);
  const recurringExpense = recurring.filter((r) => r.type === 'expense' && r.isActive).reduce((s, r) => s + r.amount, 0);
  const netRecurring = recurringIncome - recurringExpense;

  // Title
  const titleRow = ws.addRow(['דוח תנועות פיננסיות']);
  titleRow.font = { name: FONT_NAME, size: 18, bold: true, color: { argb: `FF${COLORS.indigo}` } };
  titleRow.height = 30;

  ws.addRow([`תקופה: ${formatDateRange(startDate, endDate)}`]).font =
    { name: FONT_NAME, size: 11, color: { argb: `FF${COLORS.grayMid}` } };
  ws.addRow([`תאריך הפקה: ${formatDateHebrew(new Date())}`]).font =
    { name: FONT_NAME, size: 11, color: { argb: `FF${COLORS.grayMid}` } };

  ws.addRow([]);

  // Regular transactions summary
  addSectionHeader(ws, 'סיכום תנועות שוטפות');
  addSummaryRow(ws, 'סה"כ הכנסות', totalIncome, COLORS.green);
  addSummaryRow(ws, 'סה"כ הוצאות', totalExpense, COLORS.red);
  addSummaryRow(ws, 'נטו (הכנסות - הוצאות)', netRegular, netRegular >= 0 ? COLORS.green : COLORS.red, true);

  ws.addRow([]);

  // Recurring summary
  if (recurring.length > 0) {
    addSectionHeader(ws, 'סיכום תנועות קבועות (חודשי)');
    addSummaryRow(ws, 'סה"כ הכנסות קבועות', recurringIncome, COLORS.green);
    addSummaryRow(ws, 'סה"כ הוצאות קבועות', recurringExpense, COLORS.red);
    addSummaryRow(ws, 'נטו קבוע', netRecurring, netRecurring >= 0 ? COLORS.green : COLORS.red, true);

    ws.addRow([]);

    const totalCombinedIncome = totalIncome + recurringIncome;
    const totalCombinedExpense = totalExpense + recurringExpense;
    const netCombined = totalCombinedIncome - totalCombinedExpense;

    addSectionHeader(ws, 'סיכום כולל (שוטפות + קבועות)');
    addSummaryRow(ws, 'סה"כ הכנסות', totalCombinedIncome, COLORS.green);
    addSummaryRow(ws, 'סה"כ הוצאות', totalCombinedExpense, COLORS.red);
    addSummaryRow(ws, 'נטו כולל', netCombined, netCombined >= 0 ? COLORS.green : COLORS.red, true);

    ws.addRow([]);
  }

  // Category breakdowns
  const incomeByCategory = new Map<string, number>();
  const expenseByCategory = new Map<string, number>();

  for (const t of transactions) {
    const catName = getCategoryHebrew(t.category, t.type, customCats);
    const map = t.type === 'income' ? incomeByCategory : expenseByCategory;
    map.set(catName, (map.get(catName) ?? 0) + t.amount);
  }

  if (incomeByCategory.size > 0) {
    addSectionHeader(ws, 'פירוט הכנסות לפי קטגוריה');
    for (const [cat, amount] of [...incomeByCategory.entries()].sort((a, b) => b[1] - a[1])) {
      addSummaryRow(ws, cat, amount, COLORS.green);
    }
    ws.addRow([]);
  }

  if (expenseByCategory.size > 0) {
    addSectionHeader(ws, 'פירוט הוצאות לפי קטגוריה');
    for (const [cat, amount] of [...expenseByCategory.entries()].sort((a, b) => b[1] - a[1])) {
      addSummaryRow(ws, cat, amount, COLORS.red);
    }
  }
}

function addSectionHeader(ws: ExcelJS.Worksheet, text: string) {
  const row = ws.addRow([text]);
  row.font = { name: FONT_NAME, size: 13, bold: true, color: { argb: `FF${COLORS.grayDark}` } };
  row.getCell(1).fill = sectionFill();
  row.getCell(2).fill = sectionFill();
  row.getCell(1).border = thinBorder();
  row.getCell(2).border = thinBorder();
  row.height = 24;
}

function addSummaryRow(ws: ExcelJS.Worksheet, label: string, value: number, valueColor: string, isBold = false) {
  const row = ws.addRow([label, value]);
  row.getCell(1).font = { name: FONT_NAME, size: 11, bold: isBold, color: { argb: `FF${COLORS.grayMid}` } };
  row.getCell(1).border = thinBorder();

  const valCell = row.getCell(2);
  valCell.font = coloredFont(valueColor, isBold, 12);
  valCell.numFmt = CURRENCY_FORMAT;
  valCell.border = thinBorder();
  valCell.alignment = { horizontal: 'left' };

  if (isBold) {
    row.getCell(1).fill = totalFill();
    valCell.fill = totalFill();
  }
}

// ── Sheet 2: Regular Transactions ──────────────────────────────
function buildTransactionsSheet(
  wb: ExcelJS.Workbook,
  transactions: TransactionRow[],
  customCats: CategoryInfo[]
) {
  const ws = wb.addWorksheet('תנועות שוטפות');
  setupRtlSheet(ws);

  const headers = ['תאריך', 'סוג', 'קטגוריה', 'תיאור', 'סכום (₪)'];
  ws.columns = [
    { width: 14 },
    { width: 10 },
    { width: 18 },
    { width: 35 },
    { width: 16 },
  ];

  // Header row
  const headerRow = ws.addRow(headers);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = headerFont();
    cell.fill = headerFill();
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder();
  });

  // Data rows
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sorted.forEach((t, idx) => {
    const isIncome = t.type === 'income';
    const row = ws.addRow([
      formatDateHebrew(new Date(t.date)),
      isIncome ? 'הכנסה' : 'הוצאה',
      getCategoryHebrew(t.category, t.type, customCats),
      t.description,
      t.amount,
    ]);

    const typeColor = isIncome ? COLORS.green : COLORS.red;
    const isStripe = idx % 2 === 1;

    row.eachCell((cell, colNumber) => {
      cell.font = { name: FONT_NAME, size: 11 };
      cell.border = thinBorder();
      cell.alignment = { vertical: 'middle' };
      if (isStripe) cell.fill = stripeFill();

      if (colNumber === 2) {
        cell.font = coloredFont(typeColor, true);
      }
      if (colNumber === 5) {
        cell.font = coloredFont(typeColor, false, 11);
        cell.numFmt = CURRENCY_FORMAT;
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  // Empty separator row
  ws.addRow([]);

  // Totals
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  addTotalRow(ws, 'סה"כ הכנסות', totalIncome, COLORS.green, 4);
  addTotalRow(ws, 'סה"כ הוצאות', totalExpense, COLORS.red, 4);
  addTotalRow(ws, 'נטו', net, net >= 0 ? COLORS.green : COLORS.red, 4);
}

// ── Sheet 3: Recurring Transactions ────────────────────────────
function buildRecurringSheet(
  wb: ExcelJS.Workbook,
  recurring: RecurringRow[],
  customCats: CategoryInfo[]
) {
  const ws = wb.addWorksheet('תנועות קבועות');
  setupRtlSheet(ws);

  const headers = ['שם', 'סוג', 'קטגוריה', 'סכום חודשי (₪)', 'סטטוס', 'חודשים פעילים'];
  ws.columns = [
    { width: 25 },
    { width: 10 },
    { width: 20 },
    { width: 18 },
    { width: 12 },
    { width: 28 },
  ];

  // Header row
  const headerRow = ws.addRow(headers);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = headerFont();
    cell.fill = headerFill();
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder();
  });

  // Data rows
  recurring.forEach((r, idx) => {
    const isIncome = r.type === 'income';
    const row = ws.addRow([
      r.name,
      isIncome ? 'הכנסה' : 'הוצאה',
      getCategoryHebrew(r.category, r.type, customCats),
      r.amount,
      r.isActive ? 'פעיל' : 'לא פעיל',
      r.activeMonths ? r.activeMonths.join(', ') : 'כל החודשים',
    ]);

    const typeColor = isIncome ? COLORS.green : COLORS.red;
    const isStripe = idx % 2 === 1;

    row.eachCell((cell, colNumber) => {
      cell.font = { name: FONT_NAME, size: 11 };
      cell.border = thinBorder();
      cell.alignment = { vertical: 'middle' };
      if (isStripe) cell.fill = stripeFill();

      if (colNumber === 2) {
        cell.font = coloredFont(typeColor, true);
      }
      if (colNumber === 4) {
        cell.font = coloredFont(typeColor, false, 11);
        cell.numFmt = CURRENCY_FORMAT;
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      if (colNumber === 5) {
        cell.font = coloredFont(r.isActive ? COLORS.green : COLORS.statusInactive, true);
      }
    });
  });

  ws.addRow([]);

  // Totals
  const totalIncome = recurring.filter((r) => r.type === 'income' && r.isActive).reduce((s, r) => s + r.amount, 0);
  const totalExpense = recurring.filter((r) => r.type === 'expense' && r.isActive).reduce((s, r) => s + r.amount, 0);
  const net = totalIncome - totalExpense;

  addTotalRow(ws, 'סה"כ הכנסות קבועות', totalIncome, COLORS.green, 3);
  addTotalRow(ws, 'סה"כ הוצאות קבועות', totalExpense, COLORS.red, 3);
  addTotalRow(ws, 'נטו קבוע', net, net >= 0 ? COLORS.green : COLORS.red, 3);
}

// ── Shared: Total Row ──────────────────────────────────────────
function addTotalRow(
  ws: ExcelJS.Worksheet,
  label: string,
  value: number,
  color: string,
  labelCol: number
) {
  const row = ws.addRow([]);

  const labelCell = row.getCell(labelCol);
  labelCell.value = label;
  labelCell.font = { name: FONT_NAME, size: 12, bold: true, color: { argb: `FF${COLORS.grayDark}` } };
  labelCell.fill = totalFill();
  labelCell.border = thinBorder();
  labelCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const valCell = row.getCell(labelCol + 1);
  valCell.value = value;
  valCell.font = coloredFont(color, true, 12);
  valCell.fill = totalFill();
  valCell.border = thinBorder();
  valCell.numFmt = CURRENCY_FORMAT;
  valCell.alignment = { horizontal: 'left', vertical: 'middle' };
}

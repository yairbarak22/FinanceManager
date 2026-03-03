/**
 * Dummy File Generator
 *
 * Creates in-memory Excel (XLSX) and HTML buffers that mimic Israeli bank
 * export formats. Used by integration tests for the import API.
 */

import * as XLSX from 'xlsx';

export interface DummyTransaction {
  date: string;       // e.g. "15/01/2025"
  merchant: string;   // e.g. "שופרסל"
  amount: number;     // positive = expense, negative = income (bank convention)
}

/**
 * Generate a valid .xlsx buffer with the standard Israeli bank column layout.
 * Headers: תאריך | תיאור | סכום
 *
 * The resulting buffer has real PK magic bytes so it passes file signature
 * validation without any mocking.
 */
export function generateDummyExcel(transactions: DummyTransaction[]): Buffer {
  const rows: unknown[][] = [
    ['תאריך', 'תיאור', 'סכום'],
    ...transactions.map(t => [t.date, t.merchant, t.amount]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(xlsxBuffer);
}

/**
 * Generate an HTML buffer that mimics an Israeli bank's .xls export.
 * These files are served as application/vnd.ms-excel but are really HTML
 * tables under the hood.
 */
export function generateDummyBankHtml(transactions: DummyTransaction[]): Buffer {
  const rows = transactions
    .map(
      t => `    <tr><td>${t.date}</td><td>${t.merchant}</td><td>${t.amount}</td></tr>`
    )
    .join('\n');

  const html = `<html>
<head><meta charset="utf-8"></head>
<body>
<table>
  <tr><td>תאריך</td><td>תיאור</td><td>סכום</td></tr>
${rows}
</table>
</body>
</html>`;

  return Buffer.from(html, 'utf8');
}

/**
 * Create a File-like object from a buffer for use in FormData.
 * Next.js route handlers receive standard File objects via FormData.
 */
export function bufferToFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): File {
  const blob = new Blob([buffer], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Build a complete FormData payload ready to submit to the import route.
 */
export function buildImportFormData(
  transactions: DummyTransaction[],
  options: {
    format?: 'xlsx' | 'html';
    dateFormat?: string;
    importType?: string;
  } = {}
): FormData {
  const { format = 'xlsx', dateFormat = 'DD/MM/YYYY', importType = 'expenses' } = options;

  const buffer =
    format === 'xlsx'
      ? generateDummyExcel(transactions)
      : generateDummyBankHtml(transactions);

  const mimeType =
    format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/vnd.ms-excel';

  const filename = format === 'xlsx' ? 'test.xlsx' : 'test.xls';
  const file = bufferToFile(buffer, filename, mimeType);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('dateFormat', dateFormat);
  formData.append('importType', importType);

  return formData;
}

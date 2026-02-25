/**
 * Monthly summary PDF generation placeholder.
 * Puppeteer-based PDF generation is not supported in serverless environments (Vercel).
 * Use the periodic report PDF generator (@react-pdf/renderer) instead.
 */
export async function generateMonthlyReportPDF(
  _baseUrl: string,
  _monthKey: string,
  _cookies: string
): Promise<Buffer> {
  throw new Error(
    'PDF generation via Puppeteer is not available in this environment. Use the periodic report generator instead.'
  );
}

import puppeteer from 'puppeteer';

/**
 * Generate a PDF of the monthly summary report page
 */
export async function generateMonthlyReportPDF(
  baseUrl: string,
  monthKey: string,
  cookies: string
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    // Set cookies for authentication
    const cookieEntries = cookies.split(';').map((c) => {
      const [name, ...rest] = c.trim().split('=');
      return {
        name: name.trim(),
        value: rest.join('=').trim(),
        domain: new URL(baseUrl).hostname,
        path: '/',
      };
    });

    await page.setCookie(...cookieEntries);

    // Navigate to the export mode page
    const url = `${baseUrl}/monthly-summary?monthKey=${monthKey}&export=true`;
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for content to render
    await page.waitForSelector('[data-report-loaded]', { timeout: 15000 }).catch(() => {
      // If selector not found, still proceed
    });

    // Additional wait for animations to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

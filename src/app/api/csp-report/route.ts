import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP violation report endpoint.
 * Browsers send POST requests here when a CSP directive is violated.
 * No auth required — the browser sends these automatically.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const report = body['csp-report'] || body;

    console.warn(
      JSON.stringify({
        level: 'csp-violation',
        blockedUri: report['blocked-uri'],
        violatedDirective: report['violated-directive'],
        documentUri: report['document-uri'],
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
        ts: new Date().toISOString(),
      }),
    );

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}

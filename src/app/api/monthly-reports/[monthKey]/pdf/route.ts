import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { aggregatePeriodicReportData } from '@/lib/periodicReport/aggregateData';
import { renderToBuffer } from '@react-pdf/renderer';
import ReportDocument from '@/lib/periodicReport/ReportDocument';
import type { PeriodInfo } from '@/lib/periodicReport/types';

const MONTH_NAMES: Record<string, string> = {
  '01': 'ינואר', '02': 'פברואר', '03': 'מרץ', '04': 'אפריל',
  '05': 'מאי', '06': 'יוני', '07': 'יולי', '08': 'אוגוסט',
  '09': 'ספטמבר', '10': 'אוקטובר', '11': 'נובמבר', '12': 'דצמבר',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ monthKey: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(
      `monthly-report-pdf:${userId}`,
      RATE_LIMITS.api
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב מאוחר יותר.' },
        { status: 429 }
      );
    }

    const { monthKey } = await params;

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return NextResponse.json(
        { error: 'Invalid monthKey format (expected YYYY-MM)' },
        { status: 400 }
      );
    }

    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const now = new Date();
    if (startDate > now) {
      return NextResponse.json(
        { error: 'לא ניתן ליצור דוח לתקופה עתידית' },
        { status: 400 }
      );
    }

    const monthName = MONTH_NAMES[monthStr] || monthStr;
    const periodLabel = `${monthName} ${year}`;
    const periodInfo: PeriodInfo = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      label: periodLabel,
      calendarType: 'gregorian',
    };

    const reportData = await aggregatePeriodicReportData(
      userId,
      { startDate, endDate },
      periodInfo
    );

    const pdfBuffer: Buffer = Buffer.from(
      await renderToBuffer(
        React.createElement(ReportDocument, { data: reportData }) as any
      )
    );

    const safeFilename = `myNETO_${monthKey}.pdf`;
    const encodedFilename = encodeURIComponent(`myNETO_${monthName}_${year}.pdf`);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (err) {
    console.error('Error generating monthly report PDF:', err);
    return NextResponse.json(
      { error: 'שגיאה ביצירת הדוח' },
      { status: 500 }
    );
  }
}

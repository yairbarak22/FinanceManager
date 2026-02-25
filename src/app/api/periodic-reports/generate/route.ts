import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAuthSession } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { periodicReportRequestSchema } from '@/lib/periodicReport/types';
import { aggregatePeriodicReportData } from '@/lib/periodicReport/aggregateData';
import { renderToBuffer } from '@react-pdf/renderer';
import ReportDocument from '@/lib/periodicReport/ReportDocument';
import { sendReportEmail } from '@/lib/periodicReport/resendClient';
import { generateReportEmailHTML } from '@/lib/periodicReport/emailTemplate';
import {
  hebrewMonthToGregorianRange,
  gregorianMonthToDateRange,
  buildPeriodLabel,
} from '@/lib/date/hebrewCalendar';
import type { DateRange, PeriodInfo } from '@/lib/periodicReport/types';

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(
      `periodic-report:${userId}`,
      RATE_LIMITS.api
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב מאוחר יותר.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = periodicReportRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || 'נתונים לא תקינים' },
        { status: 400 }
      );
    }

    const { calendarType, month, year, deliveryMethod } = parsed.data;

    // Resolve date range based on calendar type
    let dateRange: DateRange;
    try {
      dateRange =
        calendarType === 'hebrew'
          ? hebrewMonthToGregorianRange(year, month)
          : gregorianMonthToDateRange(year, month);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'שגיאה בחישוב תאריכים';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Prevent generating reports for future dates
    const now = new Date();
    if (dateRange.startDate > now) {
      return NextResponse.json(
        { error: 'לא ניתן ליצור דוח לתקופה עתידית' },
        { status: 400 }
      );
    }

    const periodLabel = buildPeriodLabel(calendarType, month, year);
    const periodInfo: PeriodInfo = {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      label: periodLabel,
      calendarType,
    };

    const reportData = await aggregatePeriodicReportData(
      userId,
      dateRange,
      periodInfo
    );

    // Check if there's any meaningful data
    const hasData =
      reportData.cashFlow.totalIncome > 0 ||
      reportData.cashFlow.totalExpenses > 0 ||
      reportData.totalAssets > 0 ||
      reportData.totalLiabilities > 0;

    if (!hasData) {
      return NextResponse.json(
        {
          error: `לא נמצאו נתונים פיננסיים עבור ${periodLabel}`,
          code: 'NO_DATA',
        },
        { status: 404 }
      );
    }

    // Generate PDF with @react-pdf/renderer
    const pdfPassword = parsed.data.password;

    let pdfBuffer: Buffer = Buffer.from(
      await renderToBuffer(
        React.createElement(ReportDocument, { data: reportData }) as any
      )
    );

    // Encrypt if password provided
    if (pdfPassword) {
      const { encryptPdfBuffer } = await import(
        '@/lib/periodicReport/pdfEncrypt'
      );
      pdfBuffer = await encryptPdfBuffer(pdfBuffer, pdfPassword);
    }

    if (deliveryMethod === 'download') {
      const monthName = periodLabel.split(' ')[0];
      const safeFilename = `myNETO_${month}-${year}.pdf`;
      const encodedFilename = encodeURIComponent(`myNETO_${monthName}.pdf`);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
        },
      });
    }

    // deliveryMethod === 'email'
    const session = await getAuthSession();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'לא נמצאה כתובת אימייל עבור המשתמש' },
        { status: 400 }
      );
    }

    const userName = session?.user?.name || '';
    const emailHtml = generateReportEmailHTML(userName, periodLabel);

    const emailResult = await sendReportEmail({
      to: userEmail,
      subject: `סיכום פיננסי - ${periodLabel}`,
      html: emailHtml,
      pdfBuffer,
      filename: `myNETO_${periodLabel.split(' ')[0]}.pdf`,
    });

    if ('error' in emailResult) {
      console.error('[PeriodicReport] Email delivery failed:', emailResult.error);
      return NextResponse.json(
        { error: 'שליחת הדוח למייל נכשלה. נסה שוב מאוחר יותר.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'הדוח נשלח למייל שלך בצורה מאובטחת.',
    });
  } catch (err) {
    console.error('Error generating periodic report:', err);
    return NextResponse.json(
      { error: 'שגיאה ביצירת הדוח. נסה שוב מאוחר יותר.' },
      { status: 500 }
    );
  }
}

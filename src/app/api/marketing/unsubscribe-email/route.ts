import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Sanitize string for safe HTML insertion (prevent XSS)
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * GET - Show unsubscribe confirmation page (does NOT unsubscribe yet)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'כתובת אימייל נדרשת' },
        { status: 400 }
      );
    }

    const safeEmail = escapeHtml(email);

    // Show confirmation page with POST form (don't unsubscribe on GET)
    return new NextResponse(
      `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ביטול מנוי - myneto</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(180deg, #F5F9FE 0%, #F0F6FD 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 24px;
      padding: 48px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    h1 { font-size: 24px; font-weight: bold; color: #303150; margin-bottom: 12px; }
    p { font-size: 16px; color: #7E7F90; line-height: 1.6; }
    .email { font-weight: 600; color: #303150; }
    button {
      background: #69ADFF;
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-top: 24px;
    }
    button:hover { background: #5A9EE6; }
    .note { font-size: 13px; color: #BDBDCB; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>ביטול מנוי לדיוור שיווקי</h1>
    <p>האם אתה בטוח שברצונך לבטל את המנוי עבור:</p>
    <p class="email">${safeEmail}</p>
    <p class="note">לא תקבל עוד מיילים שיווקיים, אך תמשיך לקבל הודעות מערכת חשובות.</p>
    <form method="POST" action="/api/marketing/unsubscribe-email">
      <input type="hidden" name="email" value="${safeEmail}">
      <button type="submit">ביטול מנוי</button>
    </form>
  </div>
</body>
</html>`,
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('Error showing unsubscribe page:', error);
    return NextResponse.json(
      { error: 'שגיאה' },
      { status: 500 }
    );
  }
}

/**
 * POST - Process unsubscribe (actual action)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;

    if (!email) {
      return NextResponse.json(
        { error: 'כתובת אימייל נדרשת' },
        { status: 400 }
      );
    }

    const safeEmail = escapeHtml(email);

    // Find user by email and unsubscribe them
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // User exists in system - unsubscribe them
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isMarketingSubscribed: false,
          marketingUnsubscribedAt: new Date(),
        },
      });
    }
    // For external emails (not in system) - they won't receive future emails anyway

    // Return success page
    return new NextResponse(
      `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ביטול מנוי - myneto</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(180deg, #F5F9FE 0%, #F0F6FD 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 24px;
      padding: 48px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .icon {
      width: 64px; height: 64px;
      background: #0DBACC; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px; color: white; font-size: 28px;
    }
    h1 { font-size: 24px; font-weight: bold; color: #303150; margin-bottom: 12px; }
    p { font-size: 16px; color: #7E7F90; line-height: 1.6; }
    .note { font-size: 14px; color: #BDBDCB; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✓</div>
    <h1>ביטול מנוי הושלם</h1>
    <p>כתובת האימייל ${safeEmail} הוסרה מרשימת הדיוור שלנו.</p>
    <p class="note">לא תקבל עוד מיילים שיווקיים מאיתנו.</p>
  </div>
</body>
</html>`,
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('Error unsubscribing email:', error);
    return NextResponse.json(
      { error: 'שגיאה בביטול המנוי' },
      { status: 500 }
    );
  }
}

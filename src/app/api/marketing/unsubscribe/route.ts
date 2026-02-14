/**
 * Unsubscribe from marketing emails
 * Public endpoint (no auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET - Unsubscribe page (redirects to confirmation)
 * POST - Process unsubscribe
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing user ID' },
      { status: 400 }
    );
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Return HTML page for unsubscribe confirmation
  return new NextResponse(
    `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ביטול מנוי - NETO</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #F5F5F7;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 24px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      text-align: center;
    }
    h1 {
      color: #303150;
      font-size: 24px;
      margin: 0 0 16px 0;
    }
    p {
      color: #7E7F90;
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    form {
      margin-top: 24px;
    }
    button {
      background: #69ADFF;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
    }
    button:hover {
      background: #5A9EE6;
    }
    .success {
      color: #0DBACC;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>ביטול מנוי לדיוור שיווקי</h1>
    <p>האם אתה בטוח שברצונך לבטל את המנוי לדיוור שיווקי מ-NETO?</p>
    <p style="font-size: 13px; color: #BDBDCB;">לא תקבל עוד מיילים שיווקיים, אך תמשיך לקבל הודעות מערכת חשובות.</p>
    <form method="POST" action="/api/marketing/unsubscribe">
      <input type="hidden" name="userId" value="${userId}">
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
}

/**
 * POST - Process unsubscribe
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isMarketingSubscribed: false,
        marketingUnsubscribedAt: new Date(),
      },
    });

    // Return success page
    return new NextResponse(
      `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ביטול מנוי - NETO</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #F5F5F7;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 24px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      text-align: center;
    }
    h1 {
      color: #303150;
      font-size: 24px;
      margin: 0 0 16px 0;
    }
    p {
      color: #7E7F90;
      font-size: 15px;
      line-height: 1.6;
      margin: 0;
    }
    .success {
      color: #0DBACC;
      font-weight: 600;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>ביטול מנוי הושלם</h1>
    <p class="success">✓ ביטלת בהצלחה את המנוי לדיוור שיווקי</p>
    <p>לא תקבל עוד מיילים שיווקיים מ-NETO. תוכל תמיד לחזור ולהרשם מחדש מהגדרות החשבון.</p>
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
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe' },
      { status: 500 }
    );
  }
}


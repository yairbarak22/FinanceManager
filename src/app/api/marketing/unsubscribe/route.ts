/**
 * Unsubscribe from marketing emails
 * Public endpoint — requires a valid HMAC token in the URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { moveUnsubscribedToInactive } from '@/lib/marketingGroups';
import { verifyUnsubscribeToken } from '@/lib/marketing/unsubscribeToken';

const HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8' };

const PAGE_STYLE = `
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
  form { margin-top: 24px; }
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
  button:hover { background: #5A9EE6; }
  .success {
    color: #0DBACC;
    font-weight: 600;
    margin-bottom: 16px;
  }
`;

function htmlPage(body: string, status = 200): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ביטול מנוי - NETO</title>
  <style>${PAGE_STYLE}</style>
</head>
<body>
  <div class="container">${body}</div>
</body>
</html>`,
    { status, headers: HTML_HEADERS },
  );
}

function expiredLinkPage(): NextResponse {
  return htmlPage(
    `<h1>הקישור אינו תקין</h1>
     <p>קישור ההסרה פג תוקף או שאינו תקף.</p>
     <p style="font-size: 13px; color: #BDBDCB;">
       כדי להסיר את עצמך מרשימת התפוצה, היכנס לאזור האישי באתר
       או השב למייל זה עם המילה <strong>״הסר״</strong>.
     </p>`,
    403,
  );
}

function confirmPage(userId: string, token: string): NextResponse {
  return htmlPage(
    `<h1>ביטול מנוי לדיוור שיווקי</h1>
     <p>האם אתה בטוח שברצונך לבטל את המנוי לדיוור שיווקי מ-NETO?</p>
     <p style="font-size: 13px; color: #BDBDCB;">לא תקבל עוד מיילים שיווקיים, אך תמשיך לקבל הודעות מערכת חשובות.</p>
     <form method="POST" action="/api/marketing/unsubscribe">
       <input type="hidden" name="userId" value="${userId}">
       <input type="hidden" name="token" value="${token}">
       <button type="submit">ביטול מנוי</button>
     </form>`,
  );
}

function successPage(): NextResponse {
  return htmlPage(
    `<h1>ביטול מנוי הושלם</h1>
     <p class="success">✓ ביטלת בהצלחה את המנוי לדיוור שיווקי</p>
     <p>לא תקבל עוד מיילים שיווקיים מ-NETO. תוכל תמיד לחזור ולהרשם מחדש מהגדרות החשבון.</p>`,
  );
}

/**
 * GET — show unsubscribe confirmation form.
 * Returns the same page regardless of whether the user exists (no enumeration).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    return expiredLinkPage();
  }

  return confirmPage(userId, token);
}

/**
 * POST — process unsubscribe.
 * Always returns the success page for a valid token (no enumeration).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const token = formData.get('token') as string;

    if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
      return expiredLinkPage();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (user) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isMarketingSubscribed: false,
          marketingUnsubscribedAt: new Date(),
        },
      });
      await moveUnsubscribedToInactive(userId);
    }

    return successPage();
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return successPage();
  }
}

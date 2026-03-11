/**
 * IVR Webhook Endpoint for "Yemot HaMashiach" IVR Provider
 *
 * Receives phone call parameters and responds with plain text IVR commands.
 * Uses a stateless State Machine: the state is determined by which parameters
 * are present in each request.
 *
 * Auth: phone number + 4-digit PIN (not NextAuth session-based).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { findUserByPhone, validatePin } from '@/lib/ivr/helpers';
import { processExpenseBackground } from '@/lib/ivr/processExpense';
import type { IvrWebhookParams } from '@/lib/ivr/types';

function textResponse(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

function extractParams(request: NextRequest): IvrWebhookParams {
  const url = request.nextUrl;
  return {
    ApiPhone: url.searchParams.get('ApiPhone') ?? undefined,
    PIN: url.searchParams.get('PIN') ?? undefined,
    CategoryAudio: url.searchParams.get('CategoryAudio') ?? undefined,
    Amount: url.searchParams.get('Amount') ?? undefined,
    NameAudio: url.searchParams.get('NameAudio') ?? undefined,
  };
}

async function extractParamsFromBody(request: NextRequest): Promise<IvrWebhookParams> {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const form = new URLSearchParams(text);
      return {
        ApiPhone: form.get('ApiPhone') ?? undefined,
        PIN: form.get('PIN') ?? undefined,
        CategoryAudio: form.get('CategoryAudio') ?? undefined,
        Amount: form.get('Amount') ?? undefined,
        NameAudio: form.get('NameAudio') ?? undefined,
      };
    }

    if (contentType.includes('application/json')) {
      const json = await request.json();
      return {
        ApiPhone: json.ApiPhone ?? undefined,
        PIN: json.PIN ?? undefined,
        CategoryAudio: json.CategoryAudio ?? undefined,
        Amount: json.Amount ?? undefined,
        NameAudio: json.NameAudio ?? undefined,
      };
    }

    // Fallback: try reading as form data
    const text = await request.text();
    if (text) {
      const form = new URLSearchParams(text);
      return {
        ApiPhone: form.get('ApiPhone') ?? undefined,
        PIN: form.get('PIN') ?? undefined,
        CategoryAudio: form.get('CategoryAudio') ?? undefined,
        Amount: form.get('Amount') ?? undefined,
        NameAudio: form.get('NameAudio') ?? undefined,
      };
    }
  } catch {
    // Ignore parse errors, return empty
  }
  return {};
}

function mergeParams(query: IvrWebhookParams, body: IvrWebhookParams): IvrWebhookParams {
  return {
    ApiPhone: query.ApiPhone || body.ApiPhone,
    PIN: query.PIN || body.PIN,
    CategoryAudio: query.CategoryAudio || body.CategoryAudio,
    Amount: query.Amount || body.Amount,
    NameAudio: query.NameAudio || body.NameAudio,
  };
}

async function handleIvrRequest(params: IvrWebhookParams): Promise<Response> {
  const { ApiPhone, PIN, CategoryAudio, Amount, NameAudio } = params;

  // Must have a phone number
  if (!ApiPhone) {
    return textResponse('id_list_message=t-שגיאה. אין מספר טלפון&hangup');
  }

  // Rate limiting by phone number
  const rl = await checkRateLimit(`ivr:${ApiPhone}`, RATE_LIMITS.ivr);
  if (!rl.success) {
    return textResponse('id_list_message=t-יותר מדי שיחות. אנא נסה שוב מאוחר יותר&hangup');
  }

  // ── State 0: Ask for PIN ──────────────────────────────────────────────
  if (!PIN) {
    return textResponse(
      'read=t-ברוך הבא למיי נטו. אנא הקש את הקוד הסודי שלך וסולמית=PIN,no,4,4,7,Any'
    );
  }

  // ── State 1: Validate PIN & Ask for Category ──────────────────────────
  if (!CategoryAudio) {
    // Validate PIN format
    if (!/^\d{4}$/.test(PIN)) {
      return textResponse('id_list_message=t-קוד שגוי. נסה שנית&hangup');
    }

    const ivrRecord = await findUserByPhone(ApiPhone);
    if (!ivrRecord) {
      return textResponse('id_list_message=t-מספר טלפון לא מזוהה במערכת&hangup');
    }

    const pinValid = await validatePin(ivrRecord.userId, PIN);
    if (!pinValid) {
      return textResponse('id_list_message=t-קוד שגוי. נסה שנית&hangup');
    }

    return textResponse(
      'id_list_message=t-קוד התקבל. אנא אמור את שם הקטגוריה ולאחר מכן הקש סולמית&record=CategoryAudio,no,5,1'
    );
  }

  // ── State 2: Ask for Amount ───────────────────────────────────────────
  if (!Amount) {
    return textResponse(
      'read=t-אנא הקש את סכום ההוצאה וסולמית=Amount,no,1,1,7,Any'
    );
  }

  // ── State 3: Ask for Transaction Name ─────────────────────────────────
  if (!NameAudio) {
    return textResponse(
      'id_list_message=t-אנא אמור את פרטי ההוצאה ולאחר מכן הקש סולמית&record=NameAudio,no,10,1'
    );
  }

  // ── State 4: All data collected — finish & process in background ──────
  const parsedAmount = parseInt(Amount, 10);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return textResponse('id_list_message=t-סכום לא תקין&hangup');
  }

  const ivrRecord = await findUserByPhone(ApiPhone);
  if (!ivrRecord) {
    return textResponse('id_list_message=t-שגיאה פנימית&hangup');
  }

  const pinValid = await validatePin(ivrRecord.userId, PIN);
  if (!pinValid) {
    return textResponse('id_list_message=t-קוד שגוי&hangup');
  }

  // Create a session record for tracking
  const session = await prisma.ivrCallSession.create({
    data: {
      userId: ivrRecord.userId,
      phoneNumber: ApiPhone,
      status: 'pending',
    },
  });

  const isHaredi = ivrRecord.user.signupSource === 'prog';

  // Fire-and-forget background processing
  void processExpenseBackground({
    sessionId: session.id,
    userId: ivrRecord.userId,
    phoneNumber: ApiPhone,
    amount: parsedAmount,
    categoryAudioUrl: CategoryAudio,
    nameAudioUrl: NameAudio,
    isHaredi,
  });

  return textResponse('id_list_message=t-ההוצאה נקלטה ותעודכן במערכת. להתראות&hangup');
}

export async function GET(request: NextRequest) {
  const params = extractParams(request);
  return handleIvrRequest(params);
}

export async function POST(request: NextRequest) {
  const queryParams = extractParams(request);
  const bodyParams = await extractParamsFromBody(request);
  const params = mergeParams(queryParams, bodyParams);
  return handleIvrRequest(params);
}

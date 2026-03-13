import { NextRequest, NextResponse } from "next/server";

const HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
};

function respond(body: string): NextResponse {
  return new NextResponse(body, { status: 200, headers: HEADERS });
}

function getParams(request: NextRequest): Record<string, string> {
  return Object.fromEntries(request.nextUrl.searchParams.entries());
}

async function getPostParams(
  request: NextRequest
): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    return Object.fromEntries(new URLSearchParams(text).entries());
  }
  return getParams(request);
}

async function handleIvr(request: NextRequest): Promise<NextResponse> {
  const reqStart = Date.now();
  const params =
    request.method === "POST"
      ? await getPostParams(request)
      : getParams(request);

  const apiPhone = params.ApiPhone || null;
  const pin = params.PIN || null;
  const categoryAudio = params.CategoryAudio || null;
  const txType = params.TxType || null;
  const amount = params.Amount || null;
  const nameAudio = params.NameAudio || null;
  const hangup = params.hangup || null;

  if (hangup === "yes") {
    console.log(`[IVR] Call hangup from ${apiPhone}`);
    return respond("ok");
  }

  try {
    // State 0: Ask for PIN (DTMF, instant, no DB)
    if (apiPhone && !pin) {
      console.log(`[IVR] State 0: Asking PIN from ${apiPhone} (${Date.now() - reqStart}ms)`);
      return respond("read=f-M1798=PIN,no,4,4,7,No,no,no,,,,,,");
    }

    // State 1: Validate PIN + Ask expense/income (DB work, then DTMF)
    if (apiPhone && pin && !txType) {
      console.log(`[IVR] State 1: Validating PIN + asking expense/income for ${apiPhone}`);
      const dbStart = Date.now();

      const { findUserByPhone, validatePin } = await import("@/lib/ivr/helpers");

      const ivrPinRecord = await findUserByPhone(apiPhone);
      if (!ivrPinRecord || ivrPinRecord.phoneNumber !== apiPhone) {
        console.log(`[IVR] Phone ${apiPhone} not found or mismatch (${Date.now() - dbStart}ms)`);
        return respond("id_list_message=t-מספר הטלפון אינו מזוהה במערכת&hangup");
      }

      const isValidPin = await validatePin(ivrPinRecord.user.id, pin);
      if (!isValidPin) {
        console.log(`[IVR] Invalid PIN for user ${ivrPinRecord.user.id} (${Date.now() - dbStart}ms)`);
        return respond("id_list_message=t-קוד שגוי&hangup");
      }

      console.log(`[IVR] State 1: PIN valid, asking expense/income type (${Date.now() - dbStart}ms)`);
      return respond("read=f-034=TxType,no,1,1,7,No,no,no,,1.2,,,,");
    }

    // State 2: Play M1799 + Record category (instant, no DB)
    if (apiPhone && pin && txType && !categoryAudio) {
      console.log(`[IVR] State 2: Playing M1799 + recording category for ${apiPhone} (${Date.now() - reqStart}ms)`);
      return respond("id_list_message=f-M1799&read=f-M1799=CategoryAudio,no,record,,,no,,,,");
    }

    // State 3: Ask for Amount (DTMF, instant, no DB)
    if (apiPhone && pin && txType && categoryAudio && !amount) {
      console.log(`[IVR] State 3: Asking amount (${Date.now() - reqStart}ms)`);
      return respond("read=f-M1802=Amount,no,7,1,7,No,no,no,,,,,,");
    }

    // State 4: Play M1803 + Record description (instant, no DB)
    if (apiPhone && pin && txType && categoryAudio && amount && !nameAudio) {
      console.log(`[IVR] State 4: Playing M1803 + recording description, amount=${amount} (${Date.now() - reqStart}ms)`);
      return respond("id_list_message=f-M1803&read=f-M1803=NameAudio,no,record,,,no,,,,");
    }

    // State 5: Validate, Process & Finish (DB work)
    if (apiPhone && pin && categoryAudio && txType && amount && nameAudio) {
      const transactionType = txType === "2" ? "income" : "expense";
      console.log(`[IVR] State 5: All data collected, type=${transactionType} (${Date.now() - reqStart}ms)`);

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        console.log(`[IVR] Invalid amount: "${amount}"`);
        return respond("id_list_message=t-סכום לא תקין&hangup");
      }

      const { findUserByPhone } = await import("@/lib/ivr/helpers");
      const { prisma } = await import("@/lib/prisma");
      const { processExpenseBackground } = await import("@/lib/ivr/processExpense");

      const ivrPinRecord = await findUserByPhone(apiPhone);
      if (!ivrPinRecord) {
        console.error(`[IVR] State 5: User not found for phone ${apiPhone}`);
        return respond("id_list_message=f-M1805&hangup");
      }

      const userId = ivrPinRecord.user.id;
      const isHaredi = ivrPinRecord.user.signupSource === "prog";

      console.log(
        `[IVR] Processing: userId=${userId}, type=${transactionType}, amount=${amountNum}, ` +
          `category=${categoryAudio}, name=${nameAudio}`
      );

      try {
        const session = await prisma.ivrCallSession.create({
          data: {
            userId,
            phoneNumber: apiPhone,
            amount: amountNum,
            status: "pending",
          },
        });

        processExpenseBackground({
          sessionId: session.id,
          userId,
          phoneNumber: apiPhone,
          amount: amountNum,
          categoryAudioUrl: categoryAudio,
          nameAudioUrl: nameAudio,
          isHaredi,
          transactionType,
        }).catch((error) => {
          console.error("[IVR] Background processing failed:", error);
        });
      } catch (error) {
        console.error("[IVR] Failed to create session:", error);
      }

      return respond("id_list_message=f-M1805&hangup");
    }

    console.log("[IVR] Fallback: unhandled state", params);
    return respond("id_list_message=f-M1804&hangup");
  } catch (error) {
    console.error("[IVR] Webhook error:", error);
    return respond("id_list_message=f-M1804&hangup");
  }
}

export async function GET(request: NextRequest) {
  return handleIvr(request);
}

export async function POST(request: NextRequest) {
  return handleIvr(request);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findUserByPhone, validatePin } from "@/lib/ivr/helpers";
import { processExpenseBackground } from "@/lib/ivr/processExpense";

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
  const amount = params.Amount || null;
  const nameAudio = params.NameAudio || null;
  const hangup = params.hangup || null;

  if (hangup === "yes") {
    console.log(`[IVR] Call hangup from ${apiPhone}`);
    return respond("ok");
  }

  try {
    // State 0: Ask for PIN
    if (apiPhone && !pin) {
      console.log(`[IVR] State 0: Asking PIN from ${apiPhone} (${Date.now() - reqStart}ms)`);
      return respond("read=f-M1798=PIN,no,4,4,7,No,no,no,,,,,,");
    }

    // State 1: Ask for Category (instant -- no DB work here!)
    if (apiPhone && pin && !categoryAudio) {
      console.log(`[IVR] State 1: Asking category from ${apiPhone} (${Date.now() - reqStart}ms)`);
      return respond("read=f-M1799=CategoryAudio,no,record,,,no,,,,");
    }

    // State 2: Validate PIN (deferred from State 1) & Ask for Amount
    if (apiPhone && pin && categoryAudio && !amount) {
      console.log(`[IVR] State 2: Validating PIN for ${apiPhone}`);
      const dbStart = Date.now();

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

      console.log(`[IVR] State 2: PIN valid, asking amount (${Date.now() - dbStart}ms)`);
      return respond("read=f-M1802=Amount,no,7,1,7,No,no,no,,,,,,");
    }

    // State 3: Ask for Transaction Description
    if (apiPhone && pin && categoryAudio && amount && !nameAudio) {
      console.log(`[IVR] State 3: Asking description, amount=${amount} (${Date.now() - reqStart}ms)`);
      return respond("read=f-M1803=NameAudio,no,record,,,no,,,,");
    }

    // State 4: Validate, Process & Finish
    if (apiPhone && pin && categoryAudio && amount && nameAudio) {
      console.log(`[IVR] State 4: All data collected (${Date.now() - reqStart}ms)`);

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        console.log(`[IVR] Invalid amount: "${amount}"`);
        return respond("id_list_message=t-סכום לא תקין&hangup");
      }

      const ivrPinRecord = await findUserByPhone(apiPhone);
      if (!ivrPinRecord) {
        console.error(`[IVR] State 4: User not found for phone ${apiPhone}`);
        return respond("id_list_message=f-M1805&hangup");
      }

      const userId = ivrPinRecord.user.id;
      const isHaredi = ivrPinRecord.user.signupSource === "prog";

      console.log(
        `[IVR] Processing: userId=${userId}, amount=${amountNum}, ` +
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

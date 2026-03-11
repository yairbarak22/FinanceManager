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

async function getPostParams(request: NextRequest): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    return Object.fromEntries(new URLSearchParams(text).entries());
  }
  return getParams(request);
}

async function handleIvr(request: NextRequest): Promise<NextResponse> {
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
      console.log(`[IVR] State 0: Asking PIN from ${apiPhone}`);
      return respond("read=f-M1798=PIN,no,4,4,7,No,no,no,,,,,,");
    }

    // State 1: Validate PIN & Ask for Category
    if (apiPhone && pin && !categoryAudio) {
      console.log(`[IVR] State 1: Validating PIN for ${apiPhone}`);

      const ivrPinRecord = await findUserByPhone(apiPhone);
      if (!ivrPinRecord) {
        console.log(`[IVR] Phone ${apiPhone} not found in DB`);
        return respond("id_list_message=t-מספר הטלפון אינו מזוהה במערכת&hangup");
      }

      if (ivrPinRecord.phoneNumber !== apiPhone) {
        console.log(`[IVR] Phone mismatch: caller=${apiPhone}, registered=${ivrPinRecord.phoneNumber}`);
        return respond("id_list_message=t-מספר טלפון לא תואם&hangup");
      }

      const userId = ivrPinRecord.user.id;
      const isValidPin = await validatePin(userId, pin);
      if (!isValidPin) {
        console.log(`[IVR] Invalid PIN for user ${userId}`);
        return respond("id_list_message=t-קוד שגוי&hangup");
      }

      console.log(`[IVR] PIN valid for user ${userId}, asking for category`);
      return respond("read=f-M1799=CategoryAudio,no,record,,,no,,,,");
    }

    // State 2: Ask for Amount
    if (apiPhone && pin && categoryAudio && !amount) {
      console.log(`[IVR] State 2: Asking amount, categoryAudio=${categoryAudio}`);
      return respond("read=f-M1802=Amount,no,7,1,7,No,no,no,,,,,,");
    }

    // State 3: Ask for Transaction Description
    if (apiPhone && pin && categoryAudio && amount && !nameAudio) {
      console.log(`[IVR] State 3: Asking description, amount=${amount}`);
      return respond("read=f-M1803=NameAudio,no,record,,,no,,,,");
    }

    // State 4: Finish & Process Background Job
    if (apiPhone && pin && categoryAudio && amount && nameAudio) {
      console.log(`[IVR] State 4: All data collected, triggering background processing`);

      const ivrPinRecord = await findUserByPhone(apiPhone);
      if (ivrPinRecord) {
        const userId = ivrPinRecord.user.id;
        const isHaredi = ivrPinRecord.user.signupSource === "prog";
        const amountNum = parseFloat(amount);

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
      } else {
        console.error(`[IVR] State 4: User not found for phone ${apiPhone}`);
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

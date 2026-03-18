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
  const txType = params.TxType || null;
  const categoryKey = params.CategoryKey || null;
  const amount = params.Amount || null;
  const hangup = params.hangup || null;

  if (hangup === "yes") {
    console.log(`[IVR] Call hangup from ${apiPhone}`);
    return respond("ok");
  }

  try {
    // State 0: Ask for PIN
    if (apiPhone && !pin) {
      console.log(
        `[IVR] State 0: Asking PIN from ${apiPhone} (${Date.now() - reqStart}ms)`
      );
      return respond("read=f-M1000=PIN,no,4,4,7,No,no,no,,,,,,");
    }

    // State 1: Validate PIN, create session, ask TxType
    if (apiPhone && pin && !txType) {
      console.log(
        `[IVR] State 1: Validating PIN for ${apiPhone}`
      );
      const dbStart = Date.now();

      const { findUserByPhone, validatePin } = await import(
        "@/lib/ivr/helpers"
      );

      const ivrPinRecord = await findUserByPhone(apiPhone);
      if (!ivrPinRecord || ivrPinRecord.phoneNumber !== apiPhone) {
        console.log(
          `[IVR] Phone ${apiPhone} not found (${Date.now() - dbStart}ms)`
        );
        return respond("id_list_message=f-052&hangup");
      }

      const isValidPin = await validatePin(ivrPinRecord.user.id, pin);
      if (!isValidPin) {
        console.log(
          `[IVR] Invalid PIN for user ${ivrPinRecord.user.id} (${Date.now() - dbStart}ms)`
        );
        return respond("id_list_message=f-052&hangup");
      }

      // Create or reuse an active IVR session
      const { prisma } = await import("@/lib/prisma");
      await prisma.ivrCallSession.upsert({
        where: {
          id:
            (
              await prisma.ivrCallSession.findFirst({
                where: {
                  phoneNumber: apiPhone,
                  status: "started",
                },
                orderBy: { createdAt: "desc" },
                select: { id: true },
              })
            )?.id ?? "",
        },
        update: { updatedAt: new Date() },
        create: {
          userId: ivrPinRecord.user.id,
          phoneNumber: apiPhone,
          status: "started",
        },
      });

      console.log(
        `[IVR] State 1: PIN valid, asking TxType (${Date.now() - dbStart}ms)`
      );
      return respond('read=f-M1799=TxType,no,1,1,7,No,no,no,,1.2,,,,');
    }

    // State 2: Got TxType, update session, ask CategoryKey
    if (apiPhone && pin && txType && !categoryKey) {
      console.log(
        `[IVR] State 2: TxType=${txType}, asking CategoryKey (${Date.now() - reqStart}ms)`
      );

      const { prisma } = await import("@/lib/prisma");
      const session = await prisma.ivrCallSession.findFirst({
        where: { phoneNumber: apiPhone, status: "started" },
        orderBy: { createdAt: "desc" },
      });
      if (session) {
        await prisma.ivrCallSession.update({
          where: { id: session.id },
          data: { type: parseInt(txType, 10) },
        });
      }

      const categoryFile = txType === "2" ? "M1803" : "M1802";
      return respond(
        `read=f-${categoryFile}=CategoryKey,no,1,1,7,No,no,no,,0.9,,,,`
      );
    }

    // State 3: Got CategoryKey, update session, ask Amount
    if (apiPhone && pin && txType && categoryKey && !amount) {
      console.log(
        `[IVR] State 3: CategoryKey=${categoryKey}, asking Amount (${Date.now() - reqStart}ms)`
      );

      const { prisma } = await import("@/lib/prisma");
      const session = await prisma.ivrCallSession.findFirst({
        where: { phoneNumber: apiPhone, status: "started" },
        orderBy: { createdAt: "desc" },
      });
      if (session) {
        await prisma.ivrCallSession.update({
          where: { id: session.id },
          data: { selectedCategoryKey: parseInt(categoryKey, 10) },
        });
      }

      return respond("read=f-M1804=Amount,no,1,7,7,No,no,no,,,,,,");
    }

    // State 4: Got Amount — validate, create transaction, complete session
    if (apiPhone && pin && txType && categoryKey && amount) {
      const transactionType = txType === "2" ? "income" : "expense";
      console.log(
        `[IVR] State 4: Creating transaction, type=${transactionType}, amount=${amount} (${Date.now() - reqStart}ms)`
      );

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        console.log(`[IVR] Invalid amount: "${amount}"`);
        return respond("id_list_message=t-סכום לא תקין&hangup");
      }

      const { prisma } = await import("@/lib/prisma");
      const { getCategoryIdForIvr } = await import(
        "@/lib/ivr/categoriesMap"
      );

      const session = await prisma.ivrCallSession.findFirst({
        where: { phoneNumber: apiPhone, status: "started" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true } } },
      });

      if (!session) {
        console.error(
          `[IVR] State 4: No active session for phone ${apiPhone}`
        );
        return respond("id_list_message=f-M1804&hangup");
      }

      const categoryKeyNum = parseInt(categoryKey, 10);
      const categoryId = getCategoryIdForIvr(transactionType, categoryKeyNum);

      await prisma.transaction.create({
        data: {
          userId: session.userId,
          type: transactionType,
          amount: amountNum,
          currency: "ILS",
          category: categoryId,
          description: "",
          date: new Date(new Date().setHours(0, 0, 0, 0)),
          source: "ivr",
          needsDetailsReview: true,
        },
      });

      await prisma.ivrCallSession.update({
        where: { id: session.id },
        data: {
          amount: amountNum,
          selectedCategoryKey: categoryKeyNum,
          type: parseInt(txType, 10),
          status: "completed",
        },
      });

      console.log(
        `[IVR] Session ${session.id} completed — category=${categoryId}, amount=${amountNum}`
      );
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

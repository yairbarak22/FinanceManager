import { NextRequest, NextResponse } from "next/server";
import {
  buildReadTap,
  buildFileAndHangup,
  buildTtsAndHangup,
} from "@/lib/ivr/yemotFormat";
import type { IvrWebhookParams } from "@/lib/ivr/types";

const HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
};

function respond(body: string): NextResponse {
  return new NextResponse(body, { status: 200, headers: HEADERS });
}

/**
 * Parse Yemot parameters from both GET and POST requests.
 * Handles duplicate keys by keeping the last value
 * (mirrors yemot-router2 `shiftDuplicatedValues` behaviour).
 */
function parseParams(request: NextRequest): IvrWebhookParams {
  return Object.fromEntries(
    request.nextUrl.searchParams.entries()
  ) as IvrWebhookParams;
}

async function parsePostParams(
  request: NextRequest
): Promise<IvrWebhookParams> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    return Object.fromEntries(
      new URLSearchParams(text).entries()
    ) as IvrWebhookParams;
  }
  return parseParams(request);
}

async function handleIvr(request: NextRequest): Promise<NextResponse> {
  const reqStart = Date.now();
  const params =
    request.method === "POST"
      ? await parsePostParams(request)
      : parseParams(request);

  const apiPhone = params.ApiPhone || null;
  const pin = params.PIN || null;
  const txType = params.TxType || null;
  const categoryKey = params.CategoryKey || null;
  const amount = params.Amount || null;
  const hangup = params.hangup || null;

  if (!apiPhone) {
    console.log("[IVR] Missing ApiPhone, returning error");
    return respond(buildTtsAndHangup("שגיאה במערכת"));
  }

  if (hangup === "yes") {
    console.log(`[IVR] Call hangup from ${apiPhone}`);
    return respond("ok");
  }

  try {
    // ── State 0: Ask for PIN ──────────────────────────────────────
    if (!pin) {
      console.log(
        `[IVR] State 0: Asking PIN from ${apiPhone} (${Date.now() - reqStart}ms)`
      );
      return respond(
        buildReadTap({
          message: "f-M1000",
          valName: "PIN",
          maxDigits: 4,
          minDigits: 4,
          secWait: 7,
        })
      );
    }

    // ── State 1: Validate PIN, create session, ask TxType ─────────
    if (pin && !txType) {
      console.log(`[IVR] State 1: Validating PIN for ${apiPhone}`);
      const dbStart = Date.now();

      const { findUserByPhone, validatePin } = await import(
        "@/lib/ivr/helpers"
      );

      const ivrPinRecord = await findUserByPhone(apiPhone);
      if (!ivrPinRecord || ivrPinRecord.phoneNumber !== apiPhone) {
        console.log(
          `[IVR] Phone ${apiPhone} not found (${Date.now() - dbStart}ms)`
        );
        return respond(buildFileAndHangup("052"));
      }

      const isValidPin = await validatePin(ivrPinRecord.user.id, pin);
      if (!isValidPin) {
        console.log(
          `[IVR] Invalid PIN for user ${ivrPinRecord.user.id} (${Date.now() - dbStart}ms)`
        );
        return respond(buildFileAndHangup("052"));
      }

      const { prisma } = await import("@/lib/prisma");
      await prisma.ivrCallSession.upsert({
        where: {
          id:
            (
              await prisma.ivrCallSession.findFirst({
                where: { phoneNumber: apiPhone, status: "started" },
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
      return respond(
        buildReadTap({
          message: "f-M1799",
          valName: "TxType",
          maxDigits: 1,
          minDigits: 1,
          secWait: 7,
          digitsAllowed: "1.2",
        })
      );
    }

    // ── State 2: Got TxType, update session, ask CategoryKey ──────
    if (pin && txType && !categoryKey) {
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
        buildReadTap({
          message: `f-${categoryFile}`,
          valName: "CategoryKey",
          maxDigits: 1,
          minDigits: 1,
          secWait: 7,
        })
      );
    }

    // ── State 3: Got CategoryKey, update session, ask Amount ──────
    if (pin && txType && categoryKey && !amount) {
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

      return respond(
        buildReadTap({
          message: "f-M1804",
          valName: "Amount",
          maxDigits: 7,
          minDigits: 1,
          secWait: 7,
        })
      );
    }

    // ── State 4: Got Amount — create transaction, complete session ─
    if (pin && txType && categoryKey && amount) {
      const transactionType = txType === "2" ? "income" : "expense";
      console.log(
        `[IVR] State 4: Creating transaction, type=${transactionType}, amount=${amount} (${Date.now() - reqStart}ms)`
      );

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        console.log(`[IVR] Invalid amount: "${amount}"`);
        return respond(buildTtsAndHangup("סכום לא תקין"));
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
        return respond(buildFileAndHangup("M1804"));
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
      return respond(buildFileAndHangup("M1805"));
    }

    console.log("[IVR] Fallback: unhandled state", params);
    return respond(buildFileAndHangup("M1804"));
  } catch (error) {
    console.error("[IVR] Webhook error:", error);
    return respond(buildFileAndHangup("M1804"));
  }
}

export async function GET(request: NextRequest) {
  return handleIvr(request);
}

export async function POST(request: NextRequest) {
  return handleIvr(request);
}

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { findUserByPhone, normalizePhone } from "@/lib/ivr/helpers";
import { matchCategory } from "@/lib/ivr/helpers";
import {
  expenseCategories,
  incomeCategories,
} from "@/lib/categories";
import bcrypt from "bcryptjs";
import { checkRateLimit, getRateLimitRemaining, RATE_LIMITS } from "@/lib/rateLimit";

const MONTHLY_WHATSAPP_LIMIT = 30;

// ─── Helpers ──────────────────────────────────────────────────────

const { MessagingResponse } = twilio.twiml;

function respondTwiml(text: string): NextResponse {
  const twiml = new MessagingResponse();
  twiml.message(text);
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function respondEmpty(): NextResponse {
  return new NextResponse("", { status: 200 });
}

function parseWhatsappPhone(from: string): string {
  return normalizePhone(from);
}

// ─── Twilio signature validation ──────────────────────────────────

function validateTwilioSignature(
  request: NextRequest,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return true;

  const signature = request.headers.get("x-twilio-signature") || "";
  const url = request.url;

  return twilio.validateRequest(authToken, signature, url, params);
}

// ─── Monthly quota check ─────────────────────────────────────────

async function checkAndHandleMonthlyLimit(userId: string): Promise<{
  allowed: boolean;
  shouldRespond: boolean;
  message?: string;
}> {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const usage = await prisma.whatsappMonthlyUsage.upsert({
    where: { userId_monthKey: { userId, monthKey } },
    create: { userId, monthKey, count: 0 },
    update: {},
  });

  if (usage.count < MONTHLY_WHATSAPP_LIMIT) {
    return { allowed: true, shouldRespond: false };
  }

  if (usage.limitNotifiedAt) {
    return { allowed: false, shouldRespond: false };
  }

  await prisma.whatsappMonthlyUsage.update({
    where: { userId_monthKey: { userId, monthKey } },
    data: { limitNotifiedAt: now },
  });

  return {
    allowed: false,
    shouldRespond: true,
    message:
      `⚠️ הגעת למגבלה של ${MONTHLY_WHATSAPP_LIMIT} עדכונים בחודש זה.\n` +
      "ניתן לעדכן את התקציב דרך האפליקציה ללא הגבלה.",
  };
}

// ─── Webhook handler ──────────────────────────────────────────────

async function handleWhatsapp(request: NextRequest): Promise<NextResponse> {
  const text = await request.text();
  const params = Object.fromEntries(
    new URLSearchParams(text).entries()
  );

  // Layer 1: Twilio signature validation
  if (!validateTwilioSignature(request, params)) {
    // #region agent log
    console.error("[DEBUG:H4] Twilio signature REJECTED", { url: request.url });
    // #endregion
    console.error("[WhatsApp] Invalid Twilio signature");
    return new NextResponse("Forbidden", { status: 403 });
  }

  const from = params.From || "";
  const body = (params.Body || "").trim();
  const phoneNumber = parseWhatsappPhone(from);

  // #region agent log
  console.error("[DEBUG:ENTRY] Webhook hit", { phoneNumber, bodyLen: body.length, body: body.slice(0, 60) });
  // #endregion

  if (!phoneNumber || !body) {
    return respondEmpty();
  }

  // Layer 2: Global rate limit (all WhatsApp messages combined)
  const globalResult = await checkRateLimit(
    "whatsapp:global",
    RATE_LIMITS.whatsappGlobal
  );
  if (!globalResult.success) {
    // #region agent log
    console.error("[DEBUG:H5] Global rate limit BLOCKED");
    // #endregion
    return respondEmpty();
  }

  // Layer 3: Per-phone rate limit
  const phoneResult = await checkRateLimit(
    `whatsapp:${phoneNumber}`,
    RATE_LIMITS.whatsapp
  );
  if (!phoneResult.success) {
    // #region agent log
    console.error("[DEBUG:H5] Per-phone rate limit BLOCKED", { phoneNumber });
    // #endregion
    return respondTwiml("⚠️ יותר מדי הודעות. אנא נסה שוב בעוד דקה.");
  }

  // Layer 4: Circuit breaker — blocked after 5 invalid messages in 24h
  // Read-only check; only consumeInvalidAttempt() increments this counter.
  const invalidRemaining = await getRateLimitRemaining(
    `wa_invalid:${phoneNumber}`,
    RATE_LIMITS.whatsappInvalid
  );
  // #region agent log
  console.error("[DEBUG:H1] Circuit breaker check", { phoneNumber, invalidRemaining });
  // #endregion
  if (invalidRemaining <= 0) {
    // #region agent log
    console.error("[DEBUG:H1] Circuit breaker BLOCKED — counter saturated", { phoneNumber, invalidRemaining });
    // #endregion
    return respondEmpty();
  }

  try {
    const existingSession = await prisma.whatsappSession.findUnique({
      where: { phoneNumber },
    });

    // #region agent log
    console.error("[DEBUG:H2] Session lookup", { phoneNumber, hasSession: !!existingSession, sessionId: existingSession?.id });
    // #endregion

    if (existingSession) {
      return await handlePinConfirmation(phoneNumber, body, existingSession);
    } else {
      return await handleNewReport(phoneNumber, body);
    }
  } catch (error) {
    // #region agent log
    console.error("[DEBUG:H3] Webhook CAUGHT ERROR", { error: String(error) });
    // #endregion
    console.error("[WhatsApp] Webhook error:", error);
    return respondEmpty();
  }
}

// ─── Flow 1: Parse new transaction report ─────────────────────────

async function handleNewReport(
  phoneNumber: string,
  body: string
): Promise<NextResponse> {
  const parts = body.split(",").map((p) => p.trim());

  if (parts.length !== 4) {
    await consumeInvalidAttempt(phoneNumber);
    return respondTwiml(
      "⚠️ פורמט לא תקין.\n\n" +
        "יש לשלוח בפורמט:\n" +
        "הוצאה/הכנסה, קטגוריה, שם עסק, סכום\n\n" +
        'לדוגמה:\nהוצאה, מזון, שופרסל, 150'
    );
  }

  const [typeText, category, business, amountText] = parts;

  const typeNormalized = typeText.trim();
  let txType: number;
  if (typeNormalized === "הוצאה") {
    txType = 1;
  } else if (typeNormalized === "הכנסה") {
    txType = 2;
  } else {
    await consumeInvalidAttempt(phoneNumber);
    return respondTwiml(
      '⚠️ יש לציין "הוצאה" או "הכנסה" בתחילת ההודעה.'
    );
  }

  const amount = parseFloat(amountText.replace(/[^\d.]/g, ""));
  if (isNaN(amount) || amount <= 0) {
    await consumeInvalidAttempt(phoneNumber);
    return respondTwiml("⚠️ הסכום אינו תקין. אנא הזן מספר חיובי.");
  }

  // Check monthly quota before creating a session
  const ivrPinRecord = await findUserByPhone(phoneNumber);
  if (ivrPinRecord) {
    const limitCheck = await checkAndHandleMonthlyLimit(ivrPinRecord.user.id);
    if (!limitCheck.allowed) {
      return limitCheck.shouldRespond
        ? respondTwiml(limitCheck.message!)
        : respondEmpty();
    }
  }

  await prisma.whatsappSession.upsert({
    where: { phoneNumber },
    update: {
      type: txType,
      category: category.trim(),
      business: business.trim(),
      amount,
    },
    create: {
      phoneNumber,
      type: txType,
      category: category.trim(),
      business: business.trim(),
      amount,
    },
  });

  const typeLabel = txType === 1 ? "הוצאה" : "הכנסה";
  console.log(
    `[WhatsApp] Session created: phone=${phoneNumber}, type=${typeLabel}, business=${business}, amount=${amount}`
  );

  return respondTwiml(
    `היי! זיהיתי דיווח ${typeLabel} עבור ${business.trim()} על סך ${amount} ₪.\n\n` +
      "כדי לשמור את העדכון, הקלד את קוד האימות שלך (4 ספרות) 🔒"
  );
}

// ─── Flow 2: Validate PIN and create transaction ──────────────────

async function handlePinConfirmation(
  phoneNumber: string,
  pin: string,
  session: { id: string; type: number; category: string; business: string; amount: number }
): Promise<NextResponse> {
  const ivrPinRecord = await findUserByPhone(phoneNumber);
  if (!ivrPinRecord) {
    await prisma.whatsappSession.delete({ where: { phoneNumber } });
    return respondTwiml(
      "⚠️ מספר הטלפון לא מקושר לאפליקציה. יש להירשם ולהגדיר קוד אימות דרך האפליקציה."
    );
  }

  const isValid = await bcrypt.compare(pin.trim(), ivrPinRecord.hashedPin);
  if (!isValid) {
    await consumeInvalidAttempt(phoneNumber);
    return respondTwiml("❌ קוד האימות שגוי, נסה שוב.");
  }

  const userId = ivrPinRecord.user.id;
  const transactionType = session.type === 2 ? "income" : "expense";

  // Layer 5: Monthly quota check
  const limitCheck = await checkAndHandleMonthlyLimit(userId);
  if (!limitCheck.allowed) {
    await prisma.whatsappSession.delete({ where: { phoneNumber } });
    return limitCheck.shouldRespond
      ? respondTwiml(limitCheck.message!)
      : respondEmpty();
  }

  const categoryList = (
    transactionType === "income" ? incomeCategories : expenseCategories
  ).map((c) => ({ id: c.id, nameHe: c.nameHe }));
  const categoryId = matchCategory(session.category, categoryList);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  await prisma.transaction.create({
    data: {
      userId,
      type: transactionType,
      amount: session.amount,
      currency: "ILS",
      category: categoryId,
      description: session.business,
      date: new Date(new Date().setHours(0, 0, 0, 0)),
      source: "whatsapp",
      needsDetailsReview: categoryId === "other",
    },
  });

  await prisma.whatsappMonthlyUsage.update({
    where: { userId_monthKey: { userId, monthKey } },
    data: { count: { increment: 1 } },
  });

  await prisma.whatsappSession.delete({ where: { phoneNumber } });

  console.log(
    `[WhatsApp] Transaction created: userId=${userId}, type=${transactionType}, ` +
      `category=${categoryId}, amount=${session.amount}, business=${session.business}`
  );

  const typeLabel = session.type === 1 ? "ההוצאה" : "ההכנסה";
  return respondTwiml(
    `מעולה ✅ ${typeLabel} עבור ${session.business} (${session.amount} ₪) עודכנה בהצלחה בטבלת התקציב שלך.`
  );
}

// ─── Circuit breaker helper ──────────────────────────────────────

async function consumeInvalidAttempt(phoneNumber: string): Promise<void> {
  await checkRateLimit(
    `wa_invalid:${phoneNumber}`,
    RATE_LIMITS.whatsappInvalid
  );
}

// ─── Route exports ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  return handleWhatsapp(request);
}

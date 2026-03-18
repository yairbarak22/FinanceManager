import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { findUserByPhone } from "@/lib/ivr/helpers";
import { matchCategory } from "@/lib/ivr/helpers";
import {
  expenseCategories,
  incomeCategories,
} from "@/lib/categories";
import bcrypt from "bcryptjs";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";

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

/**
 * Convert Twilio whatsapp phone format to local Israeli format.
 * `whatsapp:+972501234567` → `0501234567`
 */
function parseWhatsappPhone(from: string): string {
  const phone = from.replace("whatsapp:", "");
  if (phone.startsWith("+972")) {
    return "0" + phone.slice(4);
  }
  return phone;
}

// ─── Twilio signature validation ──────────────────────────────────

function validateTwilioSignature(
  request: NextRequest,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return true; // Skip validation if token not configured

  const signature = request.headers.get("x-twilio-signature") || "";
  const url = request.url;

  return twilio.validateRequest(authToken, signature, url, params);
}

// ─── Webhook handler ──────────────────────────────────────────────

async function handleWhatsapp(request: NextRequest): Promise<NextResponse> {
  const text = await request.text();
  const params = Object.fromEntries(
    new URLSearchParams(text).entries()
  );

  // Validate Twilio signature
  if (!validateTwilioSignature(request, params)) {
    console.error("[WhatsApp] Invalid Twilio signature");
    return new NextResponse("Forbidden", { status: 403 });
  }

  const from = params.From || "";
  const body = (params.Body || "").trim();
  const phoneNumber = parseWhatsappPhone(from);

  if (!phoneNumber || !body) {
    return respondTwiml("⚠️ הודעה ריקה, אנא נסה שנית.");
  }

  // Rate limiting per phone number
  const rateResult = await checkRateLimit(
    `whatsapp:${phoneNumber}`,
    RATE_LIMITS.whatsapp
  );
  if (!rateResult.success) {
    return respondTwiml("⚠️ יותר מדי הודעות. אנא נסה שוב בעוד דקה.");
  }

  try {
    // Check for existing pending session
    const existingSession = await prisma.whatsappSession.findUnique({
      where: { phoneNumber },
    });

    if (existingSession) {
      // ── Flow 2: PIN confirmation ────────────────────────────────
      return await handlePinConfirmation(phoneNumber, body, existingSession);
    } else {
      // ── Flow 1: New transaction report ──────────────────────────
      return await handleNewReport(phoneNumber, body);
    }
  } catch (error) {
    console.error("[WhatsApp] Webhook error:", error);
    return respondTwiml("⚠️ שגיאה במערכת, אנא נסה שוב מאוחר יותר.");
  }
}

// ─── Flow 1: Parse new transaction report ─────────────────────────

async function handleNewReport(
  phoneNumber: string,
  body: string
): Promise<NextResponse> {
  const parts = body.split(",").map((p) => p.trim());

  if (parts.length !== 4) {
    return respondTwiml(
      "⚠️ פורמט לא תקין.\n\n" +
        "יש לשלוח בפורמט:\n" +
        "הוצאה/הכנסה, קטגוריה, שם עסק, סכום\n\n" +
        'לדוגמה:\nהוצאה, מזון, שופרסל, 150'
    );
  }

  const [typeText, category, business, amountText] = parts;

  // Parse type
  const typeNormalized = typeText.trim();
  let txType: number;
  if (typeNormalized === "הוצאה") {
    txType = 1;
  } else if (typeNormalized === "הכנסה") {
    txType = 2;
  } else {
    return respondTwiml(
      '⚠️ סוג הפעולה חייב להיות "הוצאה" או "הכנסה".'
    );
  }

  // Parse amount
  const amount = parseFloat(amountText.replace(/[^\d.]/g, ""));
  if (isNaN(amount) || amount <= 0) {
    return respondTwiml("⚠️ הסכום אינו תקין. אנא הזן מספר חיובי.");
  }

  // Create pending session (upsert in case of stale session)
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
    `🔒 היי! זיהיתי דיווח ${typeLabel} עבור ${business.trim()} על סך ${amount} ₪.\n\n` +
      "לאישור, אנא הקלד את קוד ה-PIN שלך (4 ספרות):"
  );
}

// ─── Flow 2: Validate PIN and create transaction ──────────────────

async function handlePinConfirmation(
  phoneNumber: string,
  pin: string,
  session: { id: string; type: number; category: string; business: string; amount: number }
): Promise<NextResponse> {
  // Look up user by phone
  const ivrPinRecord = await findUserByPhone(phoneNumber);
  if (!ivrPinRecord) {
    // Clean up the session since there's no registered user
    await prisma.whatsappSession.delete({ where: { phoneNumber } });
    return respondTwiml(
      "⚠️ מספר הטלפון אינו רשום במערכת. יש להירשם דרך האפליקציה ולהגדיר PIN."
    );
  }

  // Validate PIN
  const isValid = await bcrypt.compare(pin.trim(), ivrPinRecord.hashedPin);
  if (!isValid) {
    return respondTwiml("❌ הקוד שגוי, אנא נסה שוב.");
  }

  const userId = ivrPinRecord.user.id;
  const transactionType = session.type === 2 ? "income" : "expense";

  // Map category text to category ID
  const categoryList = (
    transactionType === "income" ? incomeCategories : expenseCategories
  ).map((c) => ({ id: c.id, nameHe: c.nameHe }));
  const categoryId = matchCategory(session.category, categoryList);

  // Create transaction
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

  // Delete the pending session
  await prisma.whatsappSession.delete({ where: { phoneNumber } });

  console.log(
    `[WhatsApp] Transaction created: userId=${userId}, type=${transactionType}, ` +
      `category=${categoryId}, amount=${session.amount}, business=${session.business}`
  );

  return respondTwiml(
    `✅ מעולה! הפעולה ${session.business} על סך ${session.amount} ₪ נרשמה בהצלחה במערכת.`
  );
}

// ─── Route exports ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  return handleWhatsapp(request);
}

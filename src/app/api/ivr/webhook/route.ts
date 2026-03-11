import { NextRequest, NextResponse } from "next/server";
import express from "express";
import { YemotRouter, ExitError } from "yemot-router2";
import type { Call } from "yemot-router2";
import { prisma } from '@/lib/prisma';
import { findUserByPhone, validatePin } from '@/lib/ivr/helpers';
import { processExpenseBackground } from '@/lib/ivr/processExpense';

const app = express();
app.use(express.urlencoded({ extended: true }));

/**
 * Process IVR expense: Create session record and trigger background processing
 */
async function processIvrExpense(params: {
  userId: string;
  phoneNumber: string;
  amount: number;
  categoryAudioPath: string;
  nameAudioPath: string;
  isHaredi: boolean;
}): Promise<void> {
  console.log(`[IVR] Starting background processing for user ${params.userId}...`);

  try {
    // Create IvrCallSession record with status 'pending'
    const session = await prisma.ivrCallSession.create({
      data: {
        userId: params.userId,
        phoneNumber: params.phoneNumber,
        amount: params.amount,
        status: 'pending',
      },
    });

    // Fire-and-forget: don't await
    processExpenseBackground({
      sessionId: session.id,
      userId: params.userId,
      phoneNumber: params.phoneNumber,
      amount: params.amount,
      categoryAudioUrl: params.categoryAudioPath, // Yemot provides full URL
      nameAudioUrl: params.nameAudioPath, // Yemot provides full URL
      isHaredi: params.isHaredi,
    }).catch((error) => {
      console.error('[IVR] Background processing failed:', error);
    });
  } catch (error) {
    console.error('[IVR] Failed to create session or start background processing:', error);
  }
}

const router = YemotRouter({
  printLog: true,
  uncaughtErrorHandler: (error: Error, call: Call) => {
    console.error(`[IVR] Uncaught error from ${call.phone}: ${error.message}`);
    return call.id_list_message([
      { type: "file", data: "M1804" },
    ]);
  },
});

router.all("/", async (call: Call) => {
  // Step 1: Ask for PIN
  const pin = await call.read(
    [{ type: "file", data: "M1798" }],
    "tap",
    { max_digits: 4, min_digits: 4, sec_wait: 7 }
  );

  // Find user by phone number
  const ivrPinRecord = await findUserByPhone(call.phone);
  if (!ivrPinRecord) {
    return call.id_list_message([
      { type: "text", data: "מספר טלפון לא רשום במערכת" },
    ]);
  }

  if (ivrPinRecord.phoneNumber !== call.phone) {
    return call.id_list_message([
      { type: "text", data: "מספר טלפון לא תואם למשתמש הרשום" },
    ]);
  }

  const userId = ivrPinRecord.user.id;

  // Validate PIN against database
  const isValidPin = await validatePin(userId, pin);
  if (!isValidPin) {
    return call.id_list_message([
      { type: "text", data: "קוד שגוי" },
    ]);
  }

  // Step 2: Record category
  const categoryFile = await call.read(
    [{ type: "file", data: "M1799" }],
    "record",
    { no_confirm_menu: true }
  );
  console.log("[IVR] Category audio:", categoryFile);

  // Step 3: Enter amount
  const amount = await call.read(
    [{ type: "file", data: "M1802" }],
    "tap",
    { max_digits: 7, min_digits: 1, sec_wait: 7 }
  );
  console.log("[IVR] Amount:", amount);

  // Step 4: Record transaction description
  const descFile = await call.read(
    [{ type: "file", data: "M1803" }],
    "record",
    { no_confirm_menu: true }
  );
  console.log("[IVR] Description audio:", descFile);

  // Step 5: Confirm and finish
  const isHaredi = ivrPinRecord.user.signupSource === 'prog';
  const amountNum = parseFloat(amount);

  console.log(`[IVR] Preparing to process expense: userId=${userId}, amount=${amountNum}, categoryFile=${categoryFile}, descFile=${descFile}`);

  // Trigger background processing BEFORE sending final message
  processIvrExpense({
    userId,
    phoneNumber: call.phone,
    amount: amountNum,
    categoryAudioPath: categoryFile,
    nameAudioPath: descFile,
    isHaredi,
  }).catch((error) => {
    console.error('[IVR] Failed to start background processing:', error);
  });

  // Then send success message and hangup
  try {
    call.id_list_message([
      { type: "file", data: "M1805" },
    ]);
  } catch (err) {
    if (err instanceof ExitError) return;
    throw err;
  }
});

app.use("/api/ivr/webhook", router as unknown as express.Router);

function nextReqToExpressReq(request: NextRequest): {
  req: express.Request;
  res: express.Response;
  getResponseBody: () => Promise<string>;
} {
  const url = request.nextUrl;

  let capturedBody = "";
  let headersSent = false;
  let resolveResponse: ((value: string) => void) | null = null;
  const responsePromise = new Promise<string>((resolve) => {
    resolveResponse = resolve;
  });

  const req = {
    method: request.method,
    url: url.pathname + url.search,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    body: {},
    headers: Object.fromEntries(request.headers.entries()),
    get: (name: string) => request.headers.get(name),
  } as unknown as express.Request;

  const res = {
    _headerSent: false,
    statusCode: 200,
    setHeader: () => res,
    getHeader: () => undefined,
    send: (data: string) => {
      if (headersSent) return res;
      headersSent = true;
      (res as any)._headerSent = true;
      capturedBody = data;
      resolveResponse?.(data);
      return res;
    },
    json: (data: unknown) => {
      if (headersSent) return res;
      headersSent = true;
      (res as any)._headerSent = true;
      capturedBody = JSON.stringify(data);
      resolveResponse?.(capturedBody);
      return res;
    },
    end: () => {
      if (!headersSent) {
        headersSent = true;
        (res as any)._headerSent = true;
        resolveResponse?.(capturedBody);
      }
      return res;
    },
    status: (code: number) => {
      (res as any).statusCode = code;
      return res;
    },
    writeHead: () => res,
  } as unknown as express.Response;

  return {
    req,
    res,
    getResponseBody: () => responsePromise,
  };
}

async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const { req, res, getResponseBody } = nextReqToExpressReq(request);

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      (req as any).body = Object.fromEntries(params.entries());
    } else if (contentType.includes("application/json")) {
      (req as any).body = await request.json();
    }
  }

  return new Promise<NextResponse>((resolve) => {
    const timeout = setTimeout(() => {
      resolve(
        new NextResponse("id_list_message=f-M1804&hangup", {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    }, 5000);

    getResponseBody().then((body) => {
      clearTimeout(timeout);
      resolve(
        new NextResponse(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store, max-age=0",
          },
        })
      );
    });

    (app as any).handle(req, res);
  });
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

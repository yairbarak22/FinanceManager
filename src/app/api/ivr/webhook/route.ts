import { NextRequest, NextResponse } from "next/server";
import express from "express";
import { YemotRouter, ExitError } from "yemot-router2";
import type { Call } from "yemot-router2";

const app = express();
app.use(express.urlencoded({ extended: true }));

const router = YemotRouter({
  printLog: true,
  uncaughtErrorHandler: (error: Error, call: Call) => {
    console.error(`[IVR] Uncaught error from ${call.phone}: ${error.message}`);
    return call.id_list_message([
      { type: "text", data: "אירעה שגיאה במערכת" },
    ]);
  },
});

router.all("/", async (call: Call) => {
  // Step 1: Ask for PIN
  const pin = await call.read(
    [{ type: "text", data: "ברוך הבא למיי נטו אנא הקש קוד סודי וסולמית" }],
    "tap",
    { max_digits: 4, min_digits: 4, sec_wait: 7 }
  );

  // Validate PIN (mock - will be replaced with real DB validation)
  if (pin !== "1234") {
    return call.id_list_message([
      { type: "text", data: "קוד שגוי" },
    ]);
  }

  // Step 2: Record category
  call.id_list_message(
    [{ type: "text", data: "קוד התקבל" }],
    { prependToNextAction: true }
  );
  const categoryFile = await call.read(
    [{ type: "text", data: "אנא אמור את שם הקטגוריה ולאחר מכן הקש סולמית" }],
    "record",
    { no_confirm_menu: true }
  );
  console.log("[IVR] Category audio:", categoryFile);

  // Step 3: Enter amount
  const amount = await call.read(
    [{ type: "text", data: "אנא הקש את סכום ההוצאה וסולמית" }],
    "tap",
    { max_digits: 7, min_digits: 1, sec_wait: 7 }
  );
  console.log("[IVR] Amount:", amount);

  // Step 4: Record transaction description
  const descFile = await call.read(
    [{ type: "text", data: "אנא אמור את פרטי ההוצאה ולאחר מכן הקש סולמית" }],
    "record",
    { no_confirm_menu: true }
  );
  console.log("[IVR] Description audio:", descFile);

  // Step 5: Confirm and finish
  // Fire-and-forget background processing will go here
  try {
    call.id_list_message([
      { type: "text", data: "ההוצאה נקלטה בהצלחה להתראות" },
    ]);
  } catch (err) {
    if (err instanceof ExitError) return;
    throw err;
  }

  // Background job will be triggered here in the future
  console.log("[IVR] Call completed:", {
    phone: call.phone,
    amount,
    categoryFile,
    descFile,
  });
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
        new NextResponse("id_list_message=t-שגיאה במערכת", {
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

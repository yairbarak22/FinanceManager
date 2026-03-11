import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const apiPhone = searchParams.get("ApiPhone");
  const pin = searchParams.get("PIN");

  // State 0: We have ApiPhone, but no PIN yet. Ask for PIN.
  if (apiPhone && !pin) {
    // Official Yemot format: exactly 7 parameters - Variable,PlayBack,Max,Min,Timeout,StarBack,HashEnd
    const responseText = "read=t-ברוך הבא למיי נטו. אנא הקש את הקוד הסודי שלך וסולמית=PIN,no,4,4,7,No,yes";

    return new NextResponse(responseText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  // Fallback for unhandled states or errors
  return new NextResponse("id_list_message=t-שגיאה במערכת&hangup", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}

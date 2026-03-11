import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const apiPhone = searchParams.get("ApiPhone");
  const pin = searchParams.get("PIN");
  const categoryAudio = searchParams.get("CategoryAudio");
  const amount = searchParams.get("Amount");
  const nameAudio = searchParams.get("NameAudio");

  // Using text/html as it's the safest format for Yemot's old PHP parsers
  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
  };

  try {
    // State 0: Ask for PIN (Using existing system file M0000)
    // Format: read=[file]=[var],[play_ok],[max],[min],[timeout],[type],[star_back],[hash_end]
    if (apiPhone && !pin) {
      return new NextResponse("read=f-M0000=PIN,no,4,4,7,No,yes,yes", { status: 200, headers });
    }

    // State 1: Validate PIN & Ask Category
    if (apiPhone && pin && !categoryAudio) {
      if (pin !== "1234") { // Mock PIN validation
        return new NextResponse("id_list_message=f-M0004&hangup", { status: 200, headers });
      }
      // Use record parameter to record audio. File M0001 to be recorded by user later.
      return new NextResponse("read=f-M0001=CategoryAudio,no,record", { status: 200, headers });
    }

    // State 2: Ask Amount
    if (apiPhone && pin && categoryAudio && !amount) {
      // File M0002 to be recorded by user later.
      return new NextResponse("read=f-M0002=Amount,no,1,1,7,No,yes,yes", { status: 200, headers });
    }

    // State 3: Ask Transaction Name
    if (apiPhone && pin && categoryAudio && amount && !nameAudio) {
      // File M0003 to be recorded by user later.
      return new NextResponse("read=f-M0003=NameAudio,no,record", { status: 200, headers });
    }

    // State 4: Finish (Using existing system file M0004)
    if (apiPhone && pin && categoryAudio && amount && nameAudio) {
      // Trigger background job here in the future
      return new NextResponse("id_list_message=f-M0004&hangup", { status: 200, headers });
    }

    // Fallback
    return new NextResponse("id_list_message=f-M0000&hangup", { status: 200, headers });
    
  } catch (error) {
    return new NextResponse("id_list_message=f-M0000&hangup", { status: 200, headers });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

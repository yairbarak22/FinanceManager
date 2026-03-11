import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return new NextResponse("id_list_message=M0000&hangup", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request: Request) {
  return GET(request);
}

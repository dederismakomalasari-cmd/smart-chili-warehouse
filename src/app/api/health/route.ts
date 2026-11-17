import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ ok: true, service: "smart-chili-warehouse-api", timestamp: new Date().toISOString() });
}

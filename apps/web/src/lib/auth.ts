import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export function requireSyncSecret(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Sync is not configured" }, { status: 500 });
  }

  const provided = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

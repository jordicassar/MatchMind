// auth — shared guard for admin-only API routes (/api/sync and the
// /api/predictions/tune backtests).
// Callers must send "Authorization: Bearer <CRON_SECRET>". The comparison is
// constant-time so the secret can't be guessed from response timing. If
// CRON_SECRET isn't set, the route stays locked (it fails closed instead of open).
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

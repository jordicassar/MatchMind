import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { predictionAccuracy } from "@/lib/predictions";
import { BACKTEST_SEASON, CURRENT_SEASON, seasonLabel } from "@/lib/season";

export async function GET() {
  try {
    const played = await prisma.match.findMany({
      where: { homeScore: { not: null }, awayScore: { not: null } },
      orderBy: { date: "desc" },
    });
    const current = played.filter((m) => m.season === CURRENT_SEASON);
    const backtest = played.filter((m) => m.season === BACKTEST_SEASON);
    return NextResponse.json({
      season: seasonLabel(CURRENT_SEASON),
      ...predictionAccuracy(current, played),
      backtest: { season: seasonLabel(BACKTEST_SEASON), ...predictionAccuracy(backtest, played) },
    });
  } catch {
    return NextResponse.json({ message: "Failed to fetch accuracy" }, { status: 500 });
  }
}

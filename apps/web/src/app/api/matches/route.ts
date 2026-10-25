// Match collection route — returns the current season's matches. Matches are
// created and updated only by the protected sync routes.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CURRENT_SEASON } from "@/lib/season";

// GET /api/matches
// Returns the current season's matches with team details, most recent first. Predictions are not
// included — the home page shows a "Get Prediction" button per card and fetches
// a prediction on demand via POST /api/predictions.
export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      where: { season: CURRENT_SEASON },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error("GET /api/matches failed:", error);
    return NextResponse.json({ message: "Failed to fetch matches" }, { status: 500 });
  }
}
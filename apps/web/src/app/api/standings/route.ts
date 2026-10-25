// Standings route — returns the league table computed from played matches.
// The table logic lives in lib/standings.ts so it can be unit-tested.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStandings } from "@/lib/standings";
import { CURRENT_SEASON } from "@/lib/season";

export async function GET() {
  const matches = await prisma.match.findMany({
    where: { season: CURRENT_SEASON, homeScore: { not: null } },
    include: { homeTeam: true, awayTeam: true },
  });
  return NextResponse.json(computeStandings(matches));
}

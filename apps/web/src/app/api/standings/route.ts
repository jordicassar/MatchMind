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

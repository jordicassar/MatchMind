// Team collection routes — operations on the full set of teams.
// GET returns the current season's teams alphabetically. Teams are created by
// the sync routes and the live_season_data migration.
// For a single team's full profile and stats, see teams/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CURRENT_SEASON } from "@/lib/season";

export async function GET() {
  try {
    // Only clubs with a match in the current season. Relegated clubs stay in
    // the database as model history but aren't shown.
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { homeMatches: { some: { season: CURRENT_SEASON } } },
          { awayMatches: { some: { season: CURRENT_SEASON } } },
        ],
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error("GET /api/teams failed:", error);
    return NextResponse.json({ message: "Failed to fetch teams" }, { status: 500 });
  }
}

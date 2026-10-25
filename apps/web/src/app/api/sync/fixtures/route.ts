// Fixtures sync — imports the current La Liga season from football-data.org.
// Upserts every match on its football-data id (fdId), so it's safe to re-run:
// new fixtures are created, and dates and final scores are updated as the
// season goes on. Teams are matched on Team.fdId (linked in the
// live_season_data migration). Cancelled matches are skipped. One API request
// per run.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSyncSecret } from "@/lib/auth";
import { fetchSeasonMatches, finalScore } from "@/lib/footballDataApi";
import { CURRENT_SEASON } from "@/lib/season";

export async function POST(request: Request) {
  const denied = requireSyncSecret(request);
  if (denied) return denied;

  try {
    const matches = await fetchSeasonMatches(CURRENT_SEASON);

    const teams = await prisma.team.findMany({
      where: { fdId: { not: null } },
      select: { id: true, fdId: true },
    });
    const teamIdByFdId = new Map(teams.map((t) => [t.fdId!, t.id]));

    let synced = 0;
    const unmatched: string[] = [];

    for (const m of matches) {
      if (m.status === "CANCELLED") continue;

      const homeTeamId = teamIdByFdId.get(m.homeTeam.id);
      const awayTeamId = teamIdByFdId.get(m.awayTeam.id);
      if (!homeTeamId || !awayTeamId) {
        // A club with no fdId link — reported so it can be added, not guessed
        unmatched.push(`${m.homeTeam.name} vs ${m.awayTeam.name}`);
        continue;
      }

      const { homeScore, awayScore } = finalScore(m);
      await prisma.match.upsert({
        where: { fdId: m.id },
        update: { date: new Date(m.utcDate), homeScore, awayScore },
        create: {
          fdId: m.id,
          season: CURRENT_SEASON,
          homeTeamId,
          awayTeamId,
          date: new Date(m.utcDate),
          homeScore,
          awayScore,
        },
      });
      synced++;
    }

    return NextResponse.json({ message: "Fixtures sync complete", synced, unmatched });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to sync fixtures" }, { status: 500 });
  }
}

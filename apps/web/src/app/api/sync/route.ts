// Match sync route — seeds the database from the API-Sports fixtures feed.
// For each fixture it upserts both teams (by name) and then the match (by
// externalId), so the route is safe to re-run: existing records are updated
// with the latest crests and scores rather than duplicated.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMatches } from "@/lib/footballApi";

// Minimal shape of the API-Sports fixtures response — only the fields used here.
interface ApiSquadTeam {
  id: number;
  name: string;
  logo: string;
}
interface ApiFixture {
  fixture: { id: number; date: string };
  teams: { home: ApiSquadTeam; away: ApiSquadTeam };
  goals: { home: number | null; away: number | null };
}
interface FixturesResponse {
  response: ApiFixture[];
}

export async function POST() {
  try {
    const matchData = (await fetchMatches()) as FixturesResponse;

    for (const match of matchData.response) {
      const homeTeam = await prisma.team.upsert({
        where: { name: match.teams.home.name },
        update: { crest: match.teams.home.logo, externalId: match.teams.home.id },
        create: { name: match.teams.home.name, crest: match.teams.home.logo, externalId: match.teams.home.id },
      });
      const awayTeam = await prisma.team.upsert({
        where: { name: match.teams.away.name },
        update: { crest: match.teams.away.logo, externalId: match.teams.away.id },
        create: { name: match.teams.away.name, crest: match.teams.away.logo, externalId: match.teams.away.id },
      });
      await prisma.match.upsert({
        where: { externalId: match.fixture.id},
        update: { homeScore: match.goals.home, awayScore: match.goals.away},
        create: {
          externalId: match.fixture.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          date: new Date(match.fixture.date),
          homeScore: match.goals.home,
          awayScore: match.goals.away,
        },
      });
    }

    return NextResponse.json({ message: "Sync complete" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to sync matches" }, { status: 500 });
  }
}

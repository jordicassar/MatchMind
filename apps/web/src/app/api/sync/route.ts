import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMatches } from "@/lib/footballApi";

export async function POST() {
  try {
    const matchData = (await fetchMatches()) as any;

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
      await prisma.match.create({
        data: {
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

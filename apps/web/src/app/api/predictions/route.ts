// Predictions route — the source of truth for stored predictions.
// GET returns all saved predictions with their match and team details.
// POST generates a prediction for a single match using the tuned model
// (attack/defense expected goals + home advantage + team strength), computed
// leak-free from each team's matches played before the fixture, then upserts it.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { predictScore } from "@/lib/predictions";

export async function GET() {
  try {
    const predictions = await prisma.prediction.findMany({
      include: { match: { include: { homeTeam: true, awayTeam: true } } },
    });
    return NextResponse.json(predictions);
  } catch {
    return NextResponse.json({ message: "Failed to fetch predictions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { matchId } = await req.json();

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return NextResponse.json({ message: "Match not found" }, { status: 404 });

    // Only matches played BEFORE this fixture — keeps predictions leak-free.
    const prior = {
      homeScore: { not: null },
      awayScore: { not: null },
      date: { lt: match.date },
    };

    const [homeHomeGames, awayAwayGames, homeAllGames, awayAllGames] = await Promise.all([
      // Home team's prior home games / away team's prior away games (attack & defense).
      prisma.match.findMany({ where: { ...prior, homeTeamId: match.homeTeamId }, orderBy: { date: "desc" } }),
      prisma.match.findMany({ where: { ...prior, awayTeamId: match.awayTeamId }, orderBy: { date: "desc" } }),
      // Each team's prior games at any venue (for points-per-game strength).
      prisma.match.findMany({
        where: { ...prior, OR: [{ homeTeamId: match.homeTeamId }, { awayTeamId: match.homeTeamId }] },
        orderBy: { date: "desc" },
      }),
      prisma.match.findMany({
        where: { ...prior, OR: [{ homeTeamId: match.awayTeamId }, { awayTeamId: match.awayTeamId }] },
        orderBy: { date: "desc" },
      }),
    ]);

    const { predictedHome, predictedAway } = predictScore({
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeHomeGames,
      awayAwayGames,
      homeAllGames,
      awayAllGames,
    });

    const prediction = await prisma.prediction.upsert({
      where: { matchId },
      create: { predictedHome, predictedAway, matchId },
      update: { predictedHome, predictedAway },
    });

    return NextResponse.json(prediction, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to create prediction" }, { status: 500 });
  }
}

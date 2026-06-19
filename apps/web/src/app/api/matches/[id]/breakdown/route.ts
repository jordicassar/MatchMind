// Prediction breakdown route — explains a single match's prediction.
// Recomputes the tuned model's inputs (leak-free) and returns the signals
// behind the predicted score: attack/defense expected goals, home advantage,
// and each team's points-per-game (strength). Also returns head-to-head
// history for context only — the model no longer uses H2H.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { predictScore } from "@/lib/predictions";

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await prisma.match.findUnique({ where: { id: parseInt(id) } });
    if (!match) return NextResponse.json({ message: "Match not found" }, { status: 404 });

    // Only matches played before this fixture — leak-free, same as the model.
    const prior = { homeScore: { not: null }, awayScore: { not: null }, date: { lt: match.date } };

    const [homeHomeGames, awayAwayGames, homeAllGames, awayAllGames, h2hMatches] = await Promise.all([
      prisma.match.findMany({ where: { ...prior, homeTeamId: match.homeTeamId }, orderBy: { date: "desc" } }),
      prisma.match.findMany({ where: { ...prior, awayTeamId: match.awayTeamId }, orderBy: { date: "desc" } }),
      prisma.match.findMany({
        where: { ...prior, OR: [{ homeTeamId: match.homeTeamId }, { awayTeamId: match.homeTeamId }] },
        orderBy: { date: "desc" },
      }),
      prisma.match.findMany({
        where: { ...prior, OR: [{ homeTeamId: match.awayTeamId }, { awayTeamId: match.awayTeamId }] },
        orderBy: { date: "desc" },
      }),
      // Past meetings between the two teams (context only).
      prisma.match.findMany({
        where: {
          homeScore: { not: null },
          OR: [
            { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
            { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId },
          ],
        },
        include: { homeTeam: true, awayTeam: true },
        orderBy: { date: "desc" },
      }),
    ]);

    const p = predictScore({
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeHomeGames,
      awayAwayGames,
      homeAllGames,
      awayAllGames,
    });

    // H2H record from the home team's perspective (context only).
    const h2hRecord = h2hMatches.reduce(
      (acc, m) => {
        const homeWon =
          m.homeTeamId === match.homeTeamId
            ? (m.homeScore ?? 0) > (m.awayScore ?? 0)
            : (m.awayScore ?? 0) > (m.homeScore ?? 0);
        const draw = m.homeScore === m.awayScore;
        if (draw) acc.draws++;
        else if (homeWon) acc.homeWins++;
        else acc.awayWins++;
        return acc;
      },
      { homeWins: 0, draws: 0, awayWins: 0 }
    );

    return NextResponse.json({
      predictedHome: p.predictedHome,
      predictedAway: p.predictedAway,
      homeAttack: round1(p.homeAttack),
      homeDefense: round1(p.homeDefense),
      awayAttack: round1(p.awayAttack),
      awayDefense: round1(p.awayDefense),
      expHome: round1((p.homeAttack + p.awayDefense) / 2),
      expAway: round1((p.awayAttack + p.homeDefense) / 2),
      homeAdvantage: p.homeAdvantage,
      homePPG: round1(p.homePPG),
      awayPPG: round1(p.awayPPG),
      h2hCount: h2hMatches.length,
      h2hRecord,
      h2hMatches: h2hMatches.map((m) => ({
        id: m.id,
        date: m.date,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
      })),
    });
  } catch {
    return NextResponse.json({ message: "Failed to compute breakdown" }, { status: 500 });
  }
}

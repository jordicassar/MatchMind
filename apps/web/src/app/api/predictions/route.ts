import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function weightedAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const n = values.length;
  const total = values.reduce((sum, v, i) => sum + v * (n - i), 0);
  return Math.round(total / ((n * (n + 1)) / 2));
}

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

    const [homeMatches, awayMatches, h2hMatches] = await Promise.all([
      prisma.match.findMany({
        where: { homeTeamId: match.homeTeamId, homeScore: { not: null } },
        orderBy: { date: "desc" },
      }),
      prisma.match.findMany({
        where: { awayTeamId: match.awayTeamId, awayScore: { not: null } },
        orderBy: { date: "desc" },
      }),
      prisma.match.findMany({
        where: {
          homeScore: { not: null },
          OR: [
            { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
            { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId },
          ],
        },
        orderBy: { date: "desc" },
      }),
    ]);

    const formHome = weightedAverage(homeMatches.map((m) => m.homeScore ?? 0));
    const formAway = weightedAverage(awayMatches.map((m) => m.awayScore ?? 0));

    if (h2hMatches.length === 0) {
      const prediction = await prisma.prediction.upsert({
        where: { matchId },
        create: { predictedHome: formHome, predictedAway: formAway, matchId },
        update: { predictedHome: formHome, predictedAway: formAway },
      });
      return NextResponse.json(prediction, { status: 201 });
    }

    // Normalise h2h scores from the home team's perspective
    const h2hHomeScores = h2hMatches.map((m) =>
      m.homeTeamId === match.homeTeamId ? (m.homeScore ?? 0) : (m.awayScore ?? 0)
    );
    const h2hAwayScores = h2hMatches.map((m) =>
      m.awayTeamId === match.awayTeamId ? (m.awayScore ?? 0) : (m.homeScore ?? 0)
    );

    const h2hHome = weightedAverage(h2hHomeScores);
    const h2hAway = weightedAverage(h2hAwayScores);

    // 70% form, 30% head-to-head
    const predictedHome = Math.round(formHome * 0.7 + h2hHome * 0.3);
    const predictedAway = Math.round(formAway * 0.7 + h2hAway * 0.3);

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

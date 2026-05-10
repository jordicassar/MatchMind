import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const [homeMatches, awayMatches] = await Promise.all([
      prisma.match.findMany({
        where: { homeTeamId: match.homeTeamId, homeScore: { not: null } },
        orderBy: { date: "desc" },
      }),
      prisma.match.findMany({
        where: { awayTeamId: match.awayTeamId, awayScore: { not: null } },
        orderBy: { date: "desc" },
      }),
    ]);

    const homeTotal = homeMatches.reduce((sum, m, i) => sum + (m.homeScore ?? 0) * (homeMatches.length - i), 0);
    const awayTotal = awayMatches.reduce((sum, m, i) => sum + (m.awayScore ?? 0) * (awayMatches.length - i), 0);
    const homeWeight = (homeMatches.length * (homeMatches.length + 1)) / 2;
    const awayWeight = (awayMatches.length * (awayMatches.length + 1)) / 2;

    const predictedHome = homeMatches.length > 0 ? Math.round(homeTotal / homeWeight) : 0;
    const predictedAway = awayMatches.length > 0 ? Math.round(awayTotal / awayWeight) : 0;

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

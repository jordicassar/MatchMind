import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const playedMatches = await prisma.prediction.findMany({
      where: { match: { homeScore: { not: null }, awayScore: { not: null } } },
      include: { match: true },
    });

    const correctPredictions = playedMatches.reduce((sum, p) => {
      const predicted = p.predictedHome > p.predictedAway ? "home" : p.predictedHome < p.predictedAway ? "away" : "draw";
      const actual =
        (p.match.homeScore ?? 0) > (p.match.awayScore ?? 0)
          ? "home"
          : (p.match.homeScore ?? 0) < (p.match.awayScore ?? 0)
          ? "away"
          : "draw";
      return predicted === actual ? sum + 1 : sum;
    }, 0);

    const accuracy = playedMatches.length > 0 ? (correctPredictions / playedMatches.length) * 100 : 0;

    return NextResponse.json({
      totalPredictions: playedMatches.length,
      correctPredictions,
      accuracy,
    });
  } catch {
    return NextResponse.json({ message: "Failed to fetch accuracy" }, { status: 500 });
  }
}

// Prediction accuracy route — measures how well the model has performed.
// Looks at every prediction on a played match, compares the predicted
// outcome (home win / draw / away win) against the actual result, and
// returns the total, the number correct, and the accuracy percentage.
// Powers the /accuracy page.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPredictionCorrect } from "@/lib/predictions";

export async function GET() {
  try {
    const playedMatches = await prisma.prediction.findMany({
      where: { match: { homeScore: { not: null }, awayScore: { not: null } } },
      include: { match: true },
    });

    const correctPredictions = playedMatches.reduce((sum, p) => {
      const correct = isPredictionCorrect(
        p.predictedHome,
        p.predictedAway,
        p.match.homeScore ?? 0,
        p.match.awayScore ?? 0
      );
      return correct ? sum + 1 : sum;
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

// Prediction accuracy route — measures how well the model performs.
// Recomputes every played match's prediction from the current model (leak-free)
// and compares it to the actual result, so the number always reflects the live
// model — no stored predictions to regenerate. Powers the /accuracy page.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { predictFromHistory, isPredictionCorrect } from "@/lib/predictions";

export async function GET() {
  try {
    const played = await prisma.match.findMany({
      where: { homeScore: { not: null }, awayScore: { not: null } },
      orderBy: { date: "desc" },
    });

    const correctPredictions = played.reduce((sum, m) => {
      const { predictedHome, predictedAway } = predictFromHistory(m, played);
      return isPredictionCorrect(predictedHome, predictedAway, m.homeScore ?? 0, m.awayScore ?? 0)
        ? sum + 1
        : sum;
    }, 0);

    const accuracy = played.length > 0 ? (correctPredictions / played.length) * 100 : 0;

    return NextResponse.json({
      totalPredictions: played.length,
      correctPredictions,
      accuracy,
    });
  } catch {
    return NextResponse.json({ message: "Failed to fetch accuracy" }, { status: 500 });
  }
}
